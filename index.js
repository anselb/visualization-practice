// Need to install express if using this code
// const express = require('express');
//
// const app = express();
// app.use(express.static('public'));
//
// const PORT = process.env.PORT = 4000;
//
// app.listen(PORT, () => {
//   console.log('Server is running at:', PORT);
// });

// Vanilla static server from https://gist.github.com/amejiarosario/53afae82e18db30dadc9bc39035778e5
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 3000;

// maps file extention to MIME types
const mimeType = {
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.eot': 'appliaction/vnd.ms-fontobject',
  '.ttf': 'aplication/font-sfnt'
};

// Set of accessible files
let fileSet = new Set()
fileSet.add("/")
fileSet.add("/titanic-passengers.json")
fileSet.add("/iris.json")

http.createServer(function (req, res) {
  console.log(`${req.method} ${req.url}`);

  let parsedUrl = url.parse("/")
  // allows access to files that are only defined in the set and in the public folder
  if (fileSet.has(req.url)) {
    parsedUrl = url.parse(req.url)
  } else {
    // how to redirect in vanilla node: https://stackoverflow.com/questions/4062260/nodejs-redirect-url
    // how to get index url of app in vanilla node: https://stackoverflow.com/questions/10183291/how-to-get-the-full-url-in-express
    res.writeHead(302, {'Location': req.protocol + '://' + req.host + "/"});
    res.end();
    return
  }

  // extract URL path
  // Avoid https://en.wikipedia.org/wiki/Directory_traversal_attack
  // e.g curl --path-as-is http://localhost:9000/../fileInDanger.txt
  // by limiting the path to current directory only
  const sanitizePath = path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
  let pathname = path.join(`${__dirname}/public`, sanitizePath);

  fs.exists(pathname, function (exist) {
    if(!exist) {
      // if the file is not found, return 404
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return;
    }

    // if is a directory, then look for index.html
    if (fs.statSync(pathname).isDirectory()) {
      pathname += '/index.html';
    }

    // read file from file system
    fs.readFile(pathname, function(err, data){
      if(err){
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        // based on the URL path, extract the file extention. e.g. .js, .doc, ...
        const ext = path.parse(pathname).ext;
        // if the file is found, set Content-type and send data
        res.setHeader('Content-type', mimeType[ext] || 'text/plain' );
        res.end(data);
      }
    });
  });

}).listen(PORT);

console.log(`Server listening on port ${PORT}`);
