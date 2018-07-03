var https = require('https');
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

function responseHandler(response) {
  console.log("Response: ", response.statusCode);
  console.log("Resp headers: ", response.headers);
  try {
      req.on('data', (data) => {
        console.log("" + data.length + " bytes of data\n");
      });
  } catch (e) {
    console.log("Response error: " + e.message);
  }
  req.on('error', (error) => {
    console.log('Rquest error: ', error);
  });
  req.end();
}

var path = '/listcategory?category=&sort=0&hl=en';
var price= "free";
for (start = 1; start < 20; start += 20) {
  requestOptions.path = path + "&start=" + start + "&price=" + price;
  console.log("Requesting " + requestOptions.protocol + requestOptions.hostname + requestOptions.path);
  try {
    var req = https.request(requestOptions, responseHandler);
    console.log("Request made");
  } catch (e) {
    console.log("Request error: " + e.message);
  }
  req.end();
}

