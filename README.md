# server-push-sandbox
HTTP2 server push playground.

## Getting started
- `yarn` or `npm install`
- `yarn start` or `npm start`

The start script serves the contents of `./public`. Open the test document `https://0.0.0.0:8080/test.html` in the browser. By default every `.html` file in the public directory is served at `/FILENAME.html` and `/FILENAME.no-push.html`. Push is disabled if you open the `.no-push.html` version: `https://0.0.0.0:8080/test.no-push.html` that way you can easily compare loading performance with and without HTTP2 server push.

To enable pushing for specific files, you must add them to the `./public/manifest.json` file.

## About
### Author
Markus Oberlehner  
Website: https://markus.oberlehner.net  
Twitter: https://twitter.com/MaOberlehner  
PayPal.me: https://paypal.me/maoberlehner

### License
MIT
