const progress = require('cli-progress')
const chalk = require('chalk')
const beforeRequest = require(__dirname + '/modules/beforeRequest.js')
const request = require(__dirname + '/modules/request.js')
const assertion = require(__dirname + '/modules/assertion.js')

let log = {}
const logs = []
let columns = [
  'collectionName',
  'environmentName',
  'folderName',
  'caseName',
  'executedTime',
  'stopTime',
  'requestMethod',
  'requestHeader',
  'requestUrl',
  'requestBody',
  'responseTime',
  'responseStatus',
  'responseCode',
  'responseBody',
  'iteration',
  'executedTest',
  'failedTest',
  'skippedTest',
  'assertionMessage',
  'curl'
]

const CSV = { stringify: (str) => `"${str.replace(/"/g, '""')}"` }

module.exports = function newmanCSVaioReporter (newman, options) {
  const bar = new progress.Bar({
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
    log = { executedTime: Date.now() }
  })

  newman.on('beforeRequest', (err, e) => {
    if (err || !e.item.name) return
    log = beforeRequest(newman, e, log)
  })

  newman.on('request', (err, e) => {
    if (err || !e.item.name) return
    const output = request(e, log, columns)
    log = output.outputLog
    columns = output.outputColumns
  })

  newman.on('assertion', (err, e) => {
    log = assertion(err, e, log)
  })

  newman.on('item', (err) => {
    if (err) return
    log.stopTime = Date.now()
    bar.increment()
    logs.push(log)
  })

  newman.on('beforeDone', (err, e) => {
    if (err) return
    const collName = e.summary.collection.name
    const envName = e.summary.environment.name
    newman.exports.push({
      name: 'newman-csvallinone-reporter',
      default: `${collName}(${envName}).csv`,
      path: options.export,
      content: '\uFEFF' + getResults()
    })
    bar.stop()
    console.log('[INFO] CSV write complete.')
  })
}

function getResults () {
  const results = logs.map((log) => {
    const row = []
    Object.keys(log).forEach((key) => {
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
