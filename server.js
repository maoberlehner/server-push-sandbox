const fs = require(`fs`);
const http2 = require(`http2`);
const path = require(`path`);
const zlib = require(`zlib`);

const publicDirectory = path.join(__dirname, `public`);
const manifest = require(`${publicDirectory}/manifest.json`);

const contentTypes = {
  script: `application/javascript`,
  style: `text/css`,
};

const onRequest = (request, response) => {
  const filename = path.join(publicDirectory, request.url).split(`.push`).join(``);
  const acceptEncoding = request.headers['accept-encoding'] || ``;
  const push = request.url.split(`.push`).length > 1;

  if (request.url.includes(`.html`)) {
    const pushFiles = manifest[request.url] ? Object.keys(manifest[request.url]) : [];
    if (push && response.push && pushFiles.length) {
      pushFiles.forEach((file) => {
        const contentType = contentTypes[manifest[request.url][file].type] || `text/html`;
        const push = response.push(file);
        push.writeHead(200, { 'Content-Encoding': 'deflate', 'Content-Type': contentType });
        fs.createReadStream(path.join(publicDirectory, file)).pipe(zlib.createDeflate()).pipe(push);
      });
    }
    const fileStream = fs.createReadStream(filename);
    response.writeHead(200, { 'Content-Encoding': 'deflate' });
    fileStream.pipe(zlib.createDeflate()).pipe(response);
    fileStream.on('finish', response.end);
  } else if ((filename.indexOf(__dirname) === 0) && fs.existsSync(filename) && fs.statSync(filename).isFile()) {
    // Serve static files.
    const fileStream = fs.createReadStream(filename);
    response.writeHead(200, { 'Content-Encoding': 'deflate' });
    fileStream.pipe(zlib.createDeflate()).pipe(response);
    fileStream.on('finish', response.end);
  } else {
    response.writeHead(404);
    response.end(request.url);
  }
};

http2.createServer({
  key: fs.readFileSync(path.join(__dirname, '/certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '/certs/cert.pem'))
}, onRequest).listen(8080);

// // The callback to handle requests
// function onRequest(request, response) {
//     var filename = path.join(__dirname, request.url);
//     var acceptEncoding = request.headers['accept-encoding'];
//     if (!acceptEncoding) {
//         acceptEncoding = '';
//     }

//     // Serving server.js from cache. Useful for microbenchmarks.
//     if (request.url === '/') {
//         // if (response.push) {
//         //     var push = response.push('/css/base.css');
//         //     push.writeHead(200, { 'Accept': '**/*', 'Content-Encoding': 'deflate', 'Content-Type': 'text/css' });
//         //     fs.createReadStream(path.join(__dirname, '/css/base.css')).pipe(zlib.createDeflate()).pipe(push);
//         // }
//         var fileStream = fs.createReadStream('home.html');
//         response.writeHead(200, { 'Content-Encoding': 'deflate' });
//         fileStream.pipe(zlib.createDeflate()).pipe(response);
//         fileStream.on('finish', response.end);
//     } else if ((filename.indexOf(__dirname) === 0) && fs.existsSync(filename) && fs.statSync(filename).isFile()) {
//         var fileStream = fs.createReadStream(filename);
//         response.writeHead(200, { 'Content-Encoding': 'deflate' });
//         fileStream.pipe(zlib.createDeflate()).pipe(response);
//         fileStream.on('finish', response.end);
//     } else {
//         response.writeHead(404);
//         response.end(request.url);
//     }
// }

// // Creating the server in plain or TLS mode (TLS mode is the default)
// var server;
// if (process.env.HTTP2_PLAIN) {
//   server = http2.raw.createServer(onRequest);
// } else {
//   server = http2.createServer({
//     key: fs.readFileSync(path.join(__dirname, '/certs/key.pem')),
//     cert: fs.readFileSync(path.join(__dirname, '/certs/cert.pem'))
//   }, onRequest);
// }
// server.listen(process.env.HTTP2_PORT || 8080);
