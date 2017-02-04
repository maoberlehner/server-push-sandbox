#!/usr/bin/env node

const args = require(`args`);
const exec = require(`child_process`).exec;
const opn = require(`opn`);
const path = require(`path`);

args.option(
  `connectivity`,
  `The connectivity profile. Possible values: "3g", "3gfast", "3gslow", "3gem", "2g", "cable", "native", "custom".`,
  `3gfast`
);
const flags = args.parse(process.argv);

const sitespeedPath = path.resolve(
  __dirname,
  `../node_modules/sitespeed.io/bin/sitespeed.js`
);
const sitespeedCommand = [
  sitespeedPath,
  `-b chrome`,
  `-n 3`,
  `-c ${flags.connectivity}`,
];
const pushUrl = `https://127.0.0.1:8080/index.html`;
const noPushUrl = `https://127.0.0.1:8080/index.no-push.html`;
const data = { push: [], noPush: [] };

function executeSitespeed(url, name) {
  return new Promise((resolve) => {
    const outputFolder = path.resolve(__dirname, `../sitespeed-result/${name}`);
    exec(`${sitespeedCommand.join(` `)} ${url} --outputFolder ${outputFolder}`, (error) => {
      if (error) throw error;
      resolve(outputFolder);
    });
  });
}

executeSitespeed(pushUrl, `push`)
  .then((outputFolder) => {
    data.push = outputFolder;
    return executeSitespeed(noPushUrl, `no-push`);
  })
  .then((outputFolder) => {
    data.noPush = outputFolder;
    opn(path.resolve(data.push, `index.html`));
    opn(path.resolve(data.noPush, `index.html`));
  });
