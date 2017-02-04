#!/usr/bin/env node

const args = require(`args`);
const chalk = require(`chalk`);
const exec = require(`child_process`).exec;
const fs = require(`fs`);
const path = require(`path`);
const Table = require(`cli-table`);

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
const data = { push: [], noPush: [] };

function executeBrosertime(url) {
  return new Promise((resolve) => {
    exec(`${browsertimeCommand.join(` `)} ${url}`, (error) => {
      if (error) throw error;

      const benchmarkFile = fs.readFileSync(path.resolve(
        __dirname,
        `../log/result.json`
      ));
      resolve(JSON.parse(benchmarkFile).default.statistics);
    });
  });
}

function formatValue(mainValue, compareValue) {
  if (!compareValue) return mainValue;
  if (mainValue < compareValue) return chalk.green.bold(mainValue);
  return mainValue;
}

function logResult(statisticData) {
  const pushData = statisticData.push;
  const noPushData = statisticData.noPush;
  const resultTable = new Table({
    head: [
      ``,
      chalk.reset.bold(`push`),
      chalk.reset.bold(`no-push`),
    ],
  });

  const firstPaint = {};
  firstPaint[chalk.reset.bold(`firstPaint`)] = [
    formatValue(pushData.firstPaint.median, noPushData.firstPaint.median),
    formatValue(noPushData.firstPaint.median, pushData.firstPaint.median),
  ];
  resultTable.push(firstPaint);

  const domContentLoadedTime = {};
  domContentLoadedTime[chalk.reset.bold(`domContentLoadedTime`)] = [
    formatValue(pushData.domContentLoadedTime.median, noPushData.domContentLoadedTime.median),
    formatValue(noPushData.domContentLoadedTime.median, pushData.domContentLoadedTime.median),
  ];
  resultTable.push(domContentLoadedTime);

  const domInteractiveTime = {};
  domInteractiveTime[chalk.reset.bold(`domInteractiveTime`)] = [
    formatValue(pushData.domInteractiveTime.median, noPushData.domInteractiveTime.median),
    formatValue(noPushData.domInteractiveTime.median, pushData.domInteractiveTime.median),
  ];
  resultTable.push(domInteractiveTime);

  const pageLoadTime = {};
  pageLoadTime[chalk.reset.bold(`pageLoadTime`)] = [
    formatValue(pushData.pageLoadTime.median, noPushData.pageLoadTime.median),
    formatValue(noPushData.pageLoadTime.median, pushData.pageLoadTime.median),
  ];
  resultTable.push(pageLoadTime);

  const speedIndex = {};
  speedIndex[chalk.reset.bold(`speedIndex`)] = [
    formatValue(pushData.speedIndex.median, noPushData.speedIndex.median),
    formatValue(noPushData.speedIndex.median, pushData.speedIndex.median),
  ];
  resultTable.push(speedIndex);
  console.log(resultTable.toString());
}

executeBrosertime(pushUrl)
  .then((statisticData) => {
    data.push = statisticData;
    return executeBrosertime(noPushUrl);
  })
  .then((statisticData) => {
    data.noPush = statisticData;
    logResult(data);
  });
