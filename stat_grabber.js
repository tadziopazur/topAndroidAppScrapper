var https = require('https'),
    jsdom = require('jsdom').JSDOM,
    fs = require('fs');

function storeRecord(writeStream, record) {

  console.log('> ', record.no, record.name,
              record.link, record.ratingCount,
              record.installRange, record.rating,
              record.price);
  var recordString = "" + record.no + "," + record.name + "," +
                    record.link + "," + record.ratingCount + "," +
                    record.installRange + "," + record.rating + "," +
                    record.price + "\n";
  writeStream.write(recordString, 'utf8');
}

function scrapper(dataSink, url, pageData) {
  //console.log('Data is ', pageData);
  var document = (new jsdom(pageData)).window.document;
  //console.log('Document is ', document);
  var    ranklist = document.getElementById('ranklist');
  //console.log('ranklist is ', ranklist);
  var elementList = ranklist.querySelectorAll('tr.odd, tr.even');

  //console.log("elementList is a ", typeof(elementList.forEach));
  var first = true;
  elementList.forEach((item, index) => {
    if (first) {
      //console.log('item is of type ', item, ', at index ', index);
      //console.log('item is ', item.innerHTML);
      //first = false;
      var childNodes = item.childNodes,
        noNode = childNodes[1],
        nameNode = childNodes[2],
        linkNode = childNodes[3].childNodes[1],
        imageNode = childNodes[5],
        ratingCountNode = childNodes[7],
        installNode = childNodes[9],
        ratingNode = childNodes[11].childNodes[0],
        priceNode = childNodes[17].childNodes[0];
      var record = {
        url: url,
        no: parseInt(noNode.innerHTML),
        name: linkNode.innerHTML,
        link: linkNode.href,
        ratingCount: parseInt(ratingCountNode.innerHTML.replace(/,/g, "")),
        installRange: installNode.innerHTML,
        rating: ratingNode.innerHTML,
        price: priceNode.innerHTML
      };

      dataSink(record);
    }
  });
}

function responseHandler(pageDataHandler, response) {
  console.log("Response: ", response.statusCode);
  console.log("Resp headers: ", response.headers);

  var dataBuffer = "";
  try {
      req.on('data', (data) => {
        dataBuffer += data;
        console.log(data.length, " bytes of data\n");
      });
  } catch (e) {
    console.log("Response error: " + e.message);
  }
  req.on('error', (error) => {
    console.log('Rquest error: ', error);
  });
  req.end();
  pageDataHandler(dataBuffer);
}

// Pushes the contents of the desired page into the callback
function getPage(price, start, live, callback, finisher) {
  if (live) {
    var startPage = "https://www.androidrank.org/listcategory?category=&sort=0&hl=en";
    var requestOptions = {
      protocol: 'https:',
      hostname: 'www.androidrank.org',
      path: '/',
      port: 443,
      method: 'GET'
    };
    requestOptions.path = path + "&start=" + start + "&price=" + price;
    console.log("Requesting " + requestOptions.protocol + requestOptions.hostname + requestOptions.path);
    try {
      var req = https.request(requestOptions, 
                              responseHandler.bind(null, callback.bind(null, requestOptions.hostname)));
    } catch (e) {
      console.log("Request error: " + e.message);
    }
    req.end();
  } else {
    var fileName = "files/app_stats_" + price + "_" + start;
    fs.readFile(fileName,
      (err, data) => {
        if (err) {
          console.error("Cannot read file ", fileName);
          throw(err);
        }
        console.log(data.length, "of file data read from ", fileName);
        callback(null, data);
      });
  }
  console.log("Calling a finisher");
  //finisher();
}

var path = '/listcategory?category=&sort=0&hl=en';
var price= "free";
for (start = 1; start < 20; start += 20) {
  if (!fs.existsSync("output")) fs.mkdirSync("output", 0666);
  var writeStream = fs.createWriteStream("output/top_apps.csv"),
      boundWriteStreamCloser = writeStream.close.bind(null, writeStream),
      boundStoreRecorder = storeRecord.bind(null, writeStream),
      boundScrapper = scrapper.bind(null, boundStoreRecorder);

  getPage(price, start, false, boundScrapper, boundWriteStreamCloser);
}
