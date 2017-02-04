#!/usr/bin/env node

const args = require(`args`);
const fs = require(`fs`);
const http2 = require(`http2`);
const mime = require(`mime`);
const path = require(`path`);
const zlib = require(`zlib`);

args.option(`hostname`, `The hostname of the site (e.g. www.google.com).`);
const flags = args.parse(process.argv);

const siteDirectory = path.resolve(__dirname, `../sites/${flags.hostname}`);
// eslint-disable-next-line import/no-dynamic-require
const manifest = require(`${siteDirectory}/manifest.json`);

const onRequest = (request, response) => {
  const filename = path.join(siteDirectory, request.url).split(`.no-push`).join(``);
  const pushEnabled = !request.url.includes(`.no-push`);

  if (
    path.extname(request.url) === `.html` &&
    fs.existsSync(filename) &&
    fs.statSync(filename).isFile()
  ) {
    const pushFiles = manifest[request.url] ? Object.keys(manifest[request.url]) : [];
    if (pushEnabled && response.push) {
      pushFiles.forEach((file) => {
        const push = response.push(file);
        push.writeHead(200, { 'Content-Encoding': `deflate`, 'Content-Type': mime.lookup(file) });
        fs.createReadStream(path.join(siteDirectory, file)).pipe(zlib.createDeflate()).pipe(push);
      });
    }
    const fileStream = fs.createReadStream(filename);
    response.writeHead(200, { 'Content-Encoding': `deflate` });
    fileStream.pipe(zlib.createDeflate()).pipe(response);
    fileStream.on(`finish`, response.end);
  } else if (
    (filename.indexOf(path.resolve(__dirname, `../`)) === 0) &&
    fs.existsSync(filename) &&
    fs.statSync(filename).isFile()
  ) {
    // Serve static files.
    const fileStream = fs.createReadStream(filename);
    response.writeHead(200, { 'Content-Encoding': `deflate`, 'Content-Type': mime.lookup(filename) });
    fileStream.pipe(zlib.createDeflate()).pipe(response);
    fileStream.on(`finish`, response.end);
  } else {
    response.writeHead(404);
    response.end(request.url);
  }
};

http2.createServer({
  key: fs.readFileSync(path.join(__dirname, `../certs/key.pem`)),
  cert: fs.readFileSync(path.join(__dirname, `../certs/cert.pem`)),
}, onRequest).listen(8080);
