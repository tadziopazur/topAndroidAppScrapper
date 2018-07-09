var https = require('https'),
    jsdom = require('jsdom').JSDOM,
    fs = require('fs');

function scrapper(pageData) {
  //console.log('Data is ', pageData);
  var document = (new jsdom(pageData)).window.document;
  console.log('Document is ', document);
  var    ranklist = document.getElementById('ranklist');
  console.log('ranklist is ', ranklist);
  var elementList = ranklist.querySelectorAll('tr.odd, tr.even');

  //console.log("elementList is a ", typeof(elementList.forEach));
  var first = true;
  elementList.forEach((item, index) => {
    if (first) {
      console.log('item is of type ', item, ', at index ', index);
      console.log('item is ', item.innerHTML);
      first = false;
      var childNodes = item.childNodes,
        noNode = childNodes[1],
        nameNode = childNodes[2],
        linkNode = childNodes[3].childNodes[1],
        imageNode = childNodes[5],
        ratingCountNode = childNodes[7],
        installNode = childNodes[9],
        ratingNode = childNodes[11].childNodes[0],
        priceNode = childNodes[17].childNodes[0];
//      console.log('Name node is of type ', typeof(ratingNode), ' -> ', ratingNode, ', children ', ratingNode.childNodes);

      console.log('> ', noNode.innerHTML, '|', 
                        linkNode.innerHTML, '->', linkNode.href, '|', 
                        ratingCountNode.innerHTML, '|', 
                        installNode.innerHTML, '|',
                        ratingNode.innerHTML, '|',
                        priceNode.innerHTML);
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
  scrapper(dataBuffer);
  req.end();
  pageDataHandler(dataBuffer);
}

// Pushes the contents of the desired page into the callback
function getPage(price, start, live, callback) {
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
      var req = https.request(requestOptions, responseHandler.bind(null, callback));
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
        callback(data);
      });
  }
}

var path = '/listcategory?category=&sort=0&hl=en';
var price= "free";
for (start = 1; start < 20; start += 20) {
  getPage(price, start, false, scrapper);
}

