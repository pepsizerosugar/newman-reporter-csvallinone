const progress = require('cli-progress')
const chalk = require('chalk')

var beforeRequest = require(__dirname + '/modules/beforeRequest.js')
var request = require(__dirname + '/modules/request.js')
var assertion = require(__dirname + '/modules/assertion.js')

let log = {}
const logs = []
var columns = [
  // collection info
  'collectionName',
  'environmentName',
  'folderName',
  'caseName',

  // request value
  'executedTime',
  'stopTime',
  'requestMethod',
  'requestHeader',
  'requestUrl',
  'requestBody',

  // response value
  'responseTime',
  'responseStatus',
  'responseCode',
  'responseBody',

  // test info
  'iteration',
  'executedTest',
  'failedTest',
  'skippedTest',
  'assertionMessage',

  // case curl
  'curl'
]

const CSV = { stringify: (str) => { return `"${str.replace(/"/g, '""')}"` } }

/**
 * Reporter that outputs basic logs to CSV (default: $CollectionName($EnvironmentName)-$Date.csv).
 *
 * @param {Object} newman - The collection run object, with event hooks for reporting run details.
 * @param {Object} options - A set of collection run options.
 * @param {String} options.export - The path to which the summary object must be written.
 * @returns {*}
 */
module.exports = function newmanCSVaioReporter(newman, options) {
  var bar = new progress.Bar({

    format: '[INFO] newman run progress |' + chalk.green('{bar}') + '| {percentage}% || Requests: {value}/{total} || ETA: {eta}s',

    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  })

  newman.on('start', function (err, e) {
    if (err) return

    bar.start(e.cursor.length * e.cursor.cycles, 0)
  })

  newman.on('beforeItem', (err) => {
    if (err) return

    log = {}

    Object.assign(log, {
      executedTime: Date.now()
    })
  })

  newman.on('beforeRequest', (err, e) => {
    if (err || !e.item.name) return
    log = beforeRequest.module(newman, e, log)
  })

  newman.on('request', (err, e) => {
    if (err || !e.item.name) return
    var output = request.module(e, log, columns)
    log = output.outputLog
    columns = output.outputColumns
  })

  newman.on('assertion', (err, e) => {
    log = assertion.module(err, e, log)
  })

  newman.on('item', (err) => {
    if (err) return

    Object.assign(log, {
      stopTime: Date.now()
    })

    bar.increment()
    logs.push(log)
  })

  newman.on('beforeDone', (err, e) => {
    if (err) return

    var collName = e.summary.collection.name
    var envName = e.summary.environment.name

    newman.exports.push({
      name: 'newman-csvallinone-reporter',
      default: collName + '(' + envName + ').csv',
      path: options.export,
      content: '\uFEFF' + getResults()
    })

    bar.stop()
    console.log('[INFO] CSV write complete.')
  })
}

function getResults() {
  const results = logs.map((log) => {
    const row = []

    Object.keys(log)
      .forEach((key) => {
        const val = log[key]
        const index = columns.indexOf(key)
        const rowValue = Array.isArray(val) ? val.join('||') : String(val)
        row[index] = CSV.stringify(rowValue)
      })

    return row.join(',')
  })

  results.unshift(columns.join(','))

  return results.join('\n')
}