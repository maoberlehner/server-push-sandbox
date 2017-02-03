#!/usr/bin/env node

const args = require(`args`);
const fs = require(`fs`);
const path = require(`path`);
const scrape = require(`website-scraper`);

args.option(`url`, `The URL which should be scrapped.`);
const flags = args.parse(process.argv);
const directory = path.resolve(__dirname, `../sites/${flags.url.split(`://`)[1]}`);
const manifestPath = path.resolve(directory, `manifest.json`);

scrape({
  urls: [flags.url],
  directory,
}).then(() => {
  fs.writeFileSync(manifestPath, `{}`);
  // eslint-disable-next-line no-console
  console.log(`Successfully scraped: ${flags.url}`);
});
