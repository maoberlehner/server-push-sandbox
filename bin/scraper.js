#!/usr/bin/env node

const args = require(`args`);
const fs = require(`fs`);
const glob = require(`glob`);
const path = require(`path`);
const scrape = require(`website-scraper`);

args.option(`url`, `The URL which should be scrapped.`);
const flags = args.parse(process.argv);
const directory = path.resolve(__dirname, `../sites/${flags.url.split(`://`)[1]}`);
const manifestPath = path.resolve(directory, `manifest.json`);
const manifest = {
  '/index.html': {},
};

scrape({
  urls: [flags.url],
  directory,
}).then(() => {
  const cssFiles = glob.sync(path.resolve(directory, `**/*.css`));
  const jsFiles = glob.sync(path.resolve(directory, `**/*.js`));

  cssFiles.forEach((cssFile) => {
    const relativePath = path.resolve(`/`, path.relative(directory, cssFile));
    manifest[`/index.html`][relativePath] = {
      type: `style`,
      weight: `1`,
    };
  });

  jsFiles.forEach((jsFile) => {
    const relativePath = path.resolve(`/`, path.relative(directory, jsFile));
    manifest[`/index.html`][relativePath] = {
      type: `script`,
      weight: `1`,
    };
  });

  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  // eslint-disable-next-line no-console
  console.log(`Successfully scraped: ${flags.url}`);
});
