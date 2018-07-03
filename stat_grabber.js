var https = require('https'),
    jsdom = require('jsdom').JSDOM;

var startPage = "https://www.androidrank.org/listcategory?category=&sort=0&hl=en";
//start=1, 21, 41, ...
//price=free | paid

var requestOptions = {
  protocol: 'https:',
  hostname: 'www.androidrank.org',
  path: '/',
  port: 443,
  method: 'GET'
};

function scrapper(pageData) {
  console.log('Data is ', pageData);
  var document = (new jsdom(pageData)).window.document;
  console.log('Document is ', document);
  var    ranklist = document.getElementById('ranklist');
  console.log('ranklist is ', ranklist);
  var elementList = ranklist.querySelectorAll('tr.odd, tr.even');

  elementList.foreach((item, index) => {
    var childNodes = item.childNodes(),
      noNode = childNodes[0],
      nameNode = childNodes[1],
      ratingNode = childNodes[3],
      installNode = childNodes[4],
      ratingNode = childNodes[5],
      priceNode = childNodes[8];

    console.log('> ', noNode.innerHTML, nameNode.innerHTML, ratingNode.innerHTML, 
                installNode.innerHTML, ratingNode.innerHTML, priceNode.innerHTML);
  });
}

//function responseHandler(pageDataHandler, response) {
function responseHandler(response) {
  console.log("Response: ", response.statusCode);
  console.log("Resp headers: ", response.headers);

  var dataBuffer = "";
  try {
      req.on('data', (data) => {
        dataBuffer += data;
        console.log("" + data.length + " bytes of data\n");
      });
  } catch (e) {
    console.log("Response error: " + e.message);
  }
  req.on('error', (error) => {
    console.log('Rquest error: ', error);
  });
  scrapper(dataBuffer);
  req.end();
  //pageDataHandler(dataBuffer);
}

var path = '/listcategory?category=&sort=0&hl=en';
var price= "free";
for (start = 1; start < 20; start += 20) {
  requestOptions.path = path + "&start=" + start + "&price=" + price;
  console.log("Requesting " + requestOptions.protocol + requestOptions.hostname + requestOptions.path);
  try {
    var req = https.request(requestOptions, responseHandler);//.bind(null, scrapper));
    console.log("Request made");
  } catch (e) {
    console.log("Request error: " + e.message);
  }
  req.end();
}
