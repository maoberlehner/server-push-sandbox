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
  const filename = path.join(publicDirectory, request.url).split(`.no-push`).join(``);
  const acceptEncoding = request.headers['accept-encoding'] || ``;
  const push = request.url.split(`.no-push`).length > 1 ? false : true;

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
