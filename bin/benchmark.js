#!/usr/bin/env node

const args = require(`args`);
const exec = require(`child_process`).exec;
const fs = require(`fs`);
const path = require(`path`);

args.option(
  `connection`,
  `The speed by simulating connection types, one of [mobile3g,
  mobile3gfast, mobile3gslow, mobile2g, cable, native], default is mobile3g.`,
  `mobile3g`
);
const flags = args.parse(process.argv);

const browsertimePath = path.resolve(
  __dirname,
  `../node_modules/browsertime/bin/browsertime.js`
);
const browsertimeCommand = [
  browsertimePath,
  `-f ./log/result.json`,
  `--harFile ./log/result.har`,
  `--connection ${flags.connection}`,
  `--logDir ./log`,
];
const pushUrl = `-u https://127.0.0.1:8080/index.html`;
const noPushUrl = `-u https://127.0.0.1:8080/index.no-push.html`;

exec(`${browsertimeCommand.join(` `)} ${pushUrl}`,
  (error) => {
    if (error) throw error;

    const benchmarkFile = fs.readFileSync(path.resolve(
      __dirname,
      `../log/result.json`
    ));
    console.log(`PUSH: `, JSON.parse(benchmarkFile).default.statistics.domContentLoadedTime.median);

    exec(`${browsertimeCommand.join(` `)} ${noPushUrl}`,
      (error) => {
        if (error) throw error;

        const benchmarkFile = fs.readFileSync(path.resolve(
          __dirname,
          `../log/result.json`
        ));
        console.log(`NO-PUSH: `, JSON.parse(benchmarkFile).default.statistics.domContentLoadedTime.median);
      });
  });
