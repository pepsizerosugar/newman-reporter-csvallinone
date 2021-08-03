const _ = require('lodash')
const progress = require('cli-progress')
const chalk = require('chalk')

var preRequest = require(__dirname + '/modules/preRequest.js')
var assertion = require(__dirname + '/modules/assertion.js')
var beforeRequest = require(__dirname + '/modules/beforeRequest.js')
var request = require(__dirname + '/modules/request.js')

let log = {}
const logs = []
const columns = [
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

  // optional column
  // 'casePrerequest'
]

const CSV = {
  stringify: (str) => {
    return `"${str.replace(/"/g, '""')}"`
  }
}

/**
 * Reporter that outputs basic logs to CSV (default: $CollectionName-$Date.csv).
 *
 * @param {Object} newman - The collection run object, with event hooks for reporting run details.
 * @param {Object} options - A set of collection run options.
 * @param {String} options.export - The path to which the summary object must be written.
 * @returns {*}
 */
module.exports = function newmanCSVaioReporter(newman, options) {
  const folderStorage = newman.summary.collection.items.members
  var folderCount = Object.keys(newman.summary.collection.items.members).length
  var collName = newman.summary.collection.name
  var envName = newman.summary.environment.name

  var bar = new progress.Bar({
    format: '== Newman Run Progress |' + chalk.green('{bar}') + '| {percentage}% || Requests: {value}/{total} || ETA: {eta}s ==',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  })

  newman.on('start', function (err, e) {
    if (err) return

    bar.start(e.cursor.length * e.cursor.cycles, 0)
  })

  newman.on('beforeItem', (err, e) => {
    if (err) return

    Object.assign(log, {
      executedTime: Date.now()
    })

    log = {}
  })

  newman.on('beforeRequest', (err, e) => {
    if (err || !e.item.name) return
    beforeRequest.folderName(newman, folderCount, folderStorage)
    log = beforeRequest.module(newman, e, log)
  })

  newman.on('prerequest', (err, e) => {
    if (err || !e.item.name) return
    log = preRequest.module(e, log)
  })

  newman.on('request', (err, e) => {
    if (err || !e.item.name) return
    log = request.module(e, log)
  })

  newman.on('assertion', (err, e) => {
    log = assertion.module(err, e, log)
  })

  newman.on('item', (err, e) => {
    if (err) return

    Object.assign(log, {
      stopTime: Date.now()
    })

    bar.increment()
    logs.push(log)
  })

  newman.on('beforeDone', (err, e) => {
    if (err) return

    newman.exports.push({
      name: 'newman-csvallinone-reporter',
      default: collName + '(' + envName + ').csv',
      path: options.export,
      content: '\uFEFF' + getResults()
    })

    bar.stop()
    console.log('CSV write complete.')
  })
}

function getResults() {
  const results = logs.map((log) => {
    const row = []

    Object.keys(log)
      .forEach((key) => {
        const val = log[key]
        const index = columns.indexOf(key)
        const rowValue = Array.isArray(val) ?
          val.join('||') :
          String(val)

        row[index] = CSV.stringify(rowValue)
      })

    return row.join(',')
  })

  results.unshift(columns.join(','))

  return results.join('\n')
}
