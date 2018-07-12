var https = require('https'),
    http = require('http'),
    jsdom = require('jsdom').JSDOM,
    fs = require('fs');

function computeAppType(category, publisher, app) {
  var identityMap = [
    "Auto & Vehicles",
    "Books and Reference",
    "Communication",
    "Education",
    "Entertainment",
    "Finance",
    "Health and fitness",
    "Lifestyle",
    "Maps & Navigation",
    "Music and Audio",
    "News and Magazines",
    "Parenting",
    "Personalization",
    "Photography",
    "Productivity",
    "Shopping",
    "Social",
    "Tools",
    "Travel and Local",
    "Weather"
  ];
  var mapping = {
    "Action"    : "Games",
    "Adventure" : "Games",
    "Arcade"    : "Games",
    "Board"     : "Games",
    "Business"  : "Tools",
    "Card"      : "Games",
    "Casino"    : "Games",
    "Casual"    : "Games",
    "Game Role Playing"
                : "Games",
    "Puzzle"    : "Games",
    "Racing"    : "Games",
    "Simulation": "Games",
    "Sports"    : "Games",
    "Strategy"  : "Games",
    "Trivia"    : "Entertainment",
    "Video Players"
                : "Multimediamedia",
    "Word"      : "Games"
  };
  if (identityMap.includes(category)) return null;
  if (mapping.hasOwnProperty(category) && typeof(mapping[category]) === 'string') {
    return mapping[category];
  }
  return "Unknown";
}

function storeRecord(writeStream, record) {
  record.name = record.name.replace(/,/g, " &");
  record.name = record.name.replace(/&amp;/g, "&");
  record.developer = record.developer.replace(/,/g, "");
  record.developer = record.developer.replace(/&amp;/g, "&");
  record.category = record.category.replace(/&amp;/g, "&");
  var baseCat = computeAppType(record.category, record.developer, record.name);
  if (baseCat) {
    record.baseCategory = baseCat;
  } else {
    record.baseCategory = record.category;
    record.category = "";
  }

  console.log('> ', record.no, record.name,
              record.developer,
              record.baseCategory, record.category,
              record.ratingCount,
              record.installRange, record.rating,
              record.price, record.link);
  var recordString = "" + record.no + "," + record.name + "," +
                    record.developer + "," +
                    record.baseCategory + "," + record.category + "," +
                    record.ratingCount + "," +
                    record.installRange + "," + record.rating + "," +
                    record.price + "," + record.link + "\n";
  recordString = recordString.replace(/&amp;/g, "&");
  writeStream.write(recordString, 'utf8');
}

function appPageDataHandler(record, pageData) {
  var DOM = new jsdom(pageData),
      document = DOM.window.document;
  //console.log('record is', record);
  //console.log("document of type ", typeof(document), document);
  //console.log(DOM.serialize());

  var      contentDiv = document.getElementById("content");
  //console.log("contentDiv of type ", typeof(contentDiv), contentDiv);
  var    appSummaryTable = contentDiv.querySelectorAll('table.appstat')[0];
  //console.log("appSummaryTable of type ", typeof(appSummaryTable));
  var    tableCells = appSummaryTable.querySelectorAll('td');
  //console.log("tableCells of type ", typeof(tableCells));

  var developer = tableCells[1].childNodes[0].innerHTML,
      category = tableCells[2].childNodes[0].innerHTML;

  record.developer = developer;
  record.category = category;

  storeRecord(writeStream, record);
}

function readAppPage(callback, pageData) {
  var fileName = "files/minecraft.html";
  fs.readFile(fileName,
    (err, data) => {
      if (err) {
        console.error("Cannot read file ", fileName);
        throw(err);
      }
      //console.log(data.length, "of file data read from ", fileName);
      callback(data);
    });
}

function scrapAppPage(record) {
  var options = {
    protocol: 'https:',
    hostname: 'www.androidrank.org',
    path: record.link,
    port: 443,
    method: 'GET'
  };
  var pageData = "";

  try {
    console.log("Requesting " + options.protocol + '//' + options.hostname + options.path);
    var request = https.request(options, (response) => {
      console.log("Response: ", response.statusCode);
      //console.log("Resp headers: ", response.headers);

      response.on('end', () => {
        //console.log("Page data length async", pageData.length);
        appPageDataHandler(record, pageData);
      });

      response.on('error', (error) => { console.log('Rquest error: ', error); });

      try {
        response.on('data', (data) => {
          pageData += data;
        });
      } catch (e) {
        console.log("Response error: " + e.message);
      }
    });
  } catch (e) {
    console.log("Request error: " + e.message);
  }
  request.end();
}

function summaryPageScrapper(url, pageData) {
  var document = (new jsdom(pageData)).window.document,
      ranklist = document.getElementById('ranklist'),
      elementList = ranklist.querySelectorAll('tr.odd, tr.even');

  //console.log('Grabbing @url', url, ',', elementList.length, "elements");

  elementList.forEach((item, index) => {
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
    var interval = Math.floor(1 + Math.random() * (BATCH_DURATION - 2));
    console.log('Scheduling page scrapper to run for #', record.no, ",", record.name, 'in', interval, 'seconds');
    setTimeout(scrapAppPage, 1000 * interval, record);
  });
}

function responseHandler(url, response) {
  console.log("Response: ", response.statusCode);
  //console.log("Resp headers: ", response.headers);

  var pageData = "";
  try {
    response.on('end', () => { summaryPageScrapper(url, pageData); });
    response.on('error', (error) => { console.log('Rquest error: ', error); });
    response.on('data', (data) => {
      pageData += data;
      //console.log(data.length, " bytes of data\n");
    });
  } catch (e) {
    console.log("Response error: " + e.message);
  }
}

function getPage(price, start, live) {
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
      var request = https.request(requestOptions, responseHandler.bind(null, requestOptions.hostname));
    } catch (e) {
      console.log("Request error: " + e.message);
    }
    request.end();
  } else {
    var fileName = "files/app_stats_" + price + "_" + start;
    console.log('Reading file ', fileName);
    fs.readFile(fileName,
      (err, data) => {
        if (err) {
          console.error("Cannot read file ", fileName);
          throw(err);
        }
        console.log(data.length, "of file data read from ", fileName);
        summaryPageScrapper(fileName, data);
      });
  }
}

// The duration of a single summary page (it contains 20 links) processing, in seconds
var BATCH_DURATION = 120;
var path = '/listcategory?category=&sort=0&hl=en';

if (!fs.existsSync("output")) fs.mkdirSync("output", 0666);
var writeStream = fs.createWriteStream("output/top_apps.csv");
var searchSets = { 'free': 400, 'paid': 200 };

var lastEnd = 0;
Object.keys(searchSets).forEach((price, index) => {
  var limit = searchSets[price];
  for (start = 1; start < limit; start += 20) {
    var timeout = Math.floor(1000 * lastEnd);
    lastEnd += BATCH_DURATION;
    console.log("Crawling ", price, start, timeout);
    setTimeout(getPage, timeout, price, start, true);
  }
});

