#!/usr/bin/env node

const args = require(`args`);
const chalk = require(`chalk`);
const exec = require(`child_process`).exec;
const fs = require(`fs`);
const path = require(`path`);
const Table = require(`cli-table`);

args.option(
  `connectivity`,
  `The connectivity profile. Possible values: "3g", "3gfast", "3gslow", "3gem", "2g", "cable", "native", "custom".`,
  `3gfast`
);
const flags = args.parse(process.argv);

const browsertimePath = path.resolve(
  __dirname,
  `../node_modules/browsertime/bin/browsertime.js`
);
const browsertimeCommand = [
  browsertimePath,
  `-b chrome`,
  `-n 3`,
  `-c ${flags.connectivity}`,
  `-o result`,
  `--skipHar`,
  `--resultDir ./log`,
];
const pushUrl = `https://127.0.0.1:8080/index.html`;
const noPushUrl = `https://127.0.0.1:8080/index.no-push.html`;
const data = { push: [], noPush: [] };

function executeBrosertime(url) {
  return new Promise((resolve) => {
    exec(`${browsertimeCommand.join(` `)} ${url}`, (error) => {
      if (error) throw error;

      const benchmarkFile = fs.readFileSync(path.resolve(
        __dirname,
        `../log/result.json`
      ));
      resolve(JSON.parse(benchmarkFile).statistics.timings);
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
    colAligns: [`right`, `right`, `right`],
  });

  const firstPaint = {};
  firstPaint[chalk.reset.bold(`firstPaint`)] = [
    formatValue(pushData.firstPaint.median, noPushData.firstPaint.median),
    formatValue(noPushData.firstPaint.median, pushData.firstPaint.median),
  ];
  resultTable.push(firstPaint);

  const domContentLoadedTime = {};
  domContentLoadedTime[chalk.reset.bold(`domContentLoadedTime`)] = [
    formatValue(
      pushData.pageTimings.domContentLoadedTime.median,
      noPushData.pageTimings.domContentLoadedTime.median
    ),
    formatValue(
      noPushData.pageTimings.domContentLoadedTime.median,
      pushData.pageTimings.domContentLoadedTime.median
    ),
  ];
  resultTable.push(domContentLoadedTime);

  const domInteractiveTime = {};
  domInteractiveTime[chalk.reset.bold(`domInteractiveTime`)] = [
    formatValue(
      pushData.pageTimings.domInteractiveTime.median,
      noPushData.pageTimings.domInteractiveTime.median
    ),
    formatValue(
      noPushData.pageTimings.domInteractiveTime.median,
      pushData.pageTimings.domInteractiveTime.median
    ),
  ];
  resultTable.push(domInteractiveTime);

  const fullyLoaded = {};
  fullyLoaded[chalk.reset.bold(`fullyLoaded`)] = [
    formatValue(pushData.fullyLoaded.median, noPushData.fullyLoaded.median),
    formatValue(noPushData.fullyLoaded.median, pushData.fullyLoaded.median),
  ];
  resultTable.push(fullyLoaded);

  const rumSpeedIndex = {};
  rumSpeedIndex[chalk.reset.bold(`rumSpeedIndex`)] = [
    formatValue(pushData.rumSpeedIndex.median, noPushData.rumSpeedIndex.median),
    formatValue(noPushData.rumSpeedIndex.median, pushData.rumSpeedIndex.median),
  ];
  resultTable.push(rumSpeedIndex);
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
