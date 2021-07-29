var _ = require('lodash'),
  progress = require('cli-progress'),
  chalk = require('chalk')

let log
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
  'curl',

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
  var body
  var checkParams = 0
  var checkAuth = 0

  var collName = newman.summary.collection.name
  var envName = newman.summary.environment.name
  var folderName

  const folderStorage = newman.summary.collection.items.members
  var folderCount = Object.keys(newman.summary.collection.items.members).length
  var caseCount
  var x = 0
  var y = 0

  var executedTime
  var stopTime

  var bar = new progress.Bar({
    format: '== Newman Run Progress |' + chalk.green('{bar}') + '| {percentage}% || Requests: {value}/{total} || ETA: {eta}s ==',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  })

  newman.on('start', function (err, e) {
    if (err) return

    bar.start(e.cursor.length * e.cursor.cycles, 0);
  })

  newman.on('beforeItem', (err, e) => {
    if (err) return

    body = ""
    executedTime
 = Date.now();

    log = {}
  })

  newman.on('beforeRequest', (err, e) => {
    if (err || !e.item.name) return

    // parsing folder name
    if (x < folderCount) {
      caseCount = Object.keys(folderStorage[x].items.members).length
      folderName = newman.summary.collection.items.members[x].name

      if ((++y) == caseCount) {
        ++x
        y = 0
      }
    }

    const { cursor, item, request } = e

    // parsing info and request
    Object.assign(log, {
      collectionName: collName,
      environmentName: envName,
      folderName: folderName,
      iteration: cursor.iteration + 1,
      caseName: item.name,
      requestMethod: request.method,
      requestUrl: request.url.toString()
    })

    // parsing request body
    try {
      if (request.hasOwnProperty('body')) {
        var bodyType = request.body.mode
        const tempBody = request.body[bodyType]

        if (request.hasOwnProperty('body') && JSON.stringify(tempBody).length > 2) {
          if (bodyType === "urlencoded" || bodyType === "file" || bodyType === "graphql" || bodyType === "formdata") {
            body = JSON.stringify(tempBody)
            Object.assign(log, { requestBody: body })
          } else {
            body = tempBody.replace(/ |\r\n|\r|\n/gi, "")
            Object.assign(log, { requestBody: body })
          }
        }
      } else
        Object.assign(log, { requestBody: "" })
    } catch (error) { console.log("\nerror parsing Body Type: " + item.name + "\n" + JSON.stringify(request)) }

    // make curl
    try {
      var curl = "",
        curlUrl,
        curlHeader = "",
        curlBody

      curlUrl = "curl --location --request " + e.request.method + " \"" + e.request.url.toString() + "\" \\"

      var pointer
      var keyStorage = []
      var valueStorage = []

      var requestTemp = JSON.stringify(e.request)

      if (JSON.parse(requestTemp.toString()).hasOwnProperty('header') != false) {
        pointer = JSON.parse(requestTemp.toString()).header

        for (var i = 0; i < pointer.length; i++) {
          if (pointer.hasOwnProperty('system') !== true) {
            keyStorage.push(JSON.stringify(pointer[i].key))
            valueStorage.push(JSON.stringify(pointer[i].value))
          }
        }

        for (var i = 0; i < keyStorage.length; i++)
          curlHeader += " --header \"" + keyStorage[i].toString("").replace(/\"/gi, "") + ": " + valueStorage[i].toString().replace(/\"/gi, "") + "\" \\"
      }

      if (request.hasOwnProperty('body')) {
        curlBody = " --data \"" + body.replace(/\"/gi, "\\\"") + "\""
        curl += curlUrl + curlHeader + curlBody
      } else
        curl += curlUrl + curlHeader

      Object.assign(log, { curl })
    } catch (error) { console.log("\nerror parsing cURL : " + item.name + "\n" + JSON.stringify(request)) }
  })

  // pre-script collection, folder, case
  newman.on('prerequest', (err, e) => {
    if (err || !e.item) return

    const { executions } = e

    // parsing case pre-request
    try {
      if (JSON.stringify(executions[2]) !== undefined)
        Object.assign(log, { casePrerequest: JSON.stringify(executions[2].script.exec) })
      else
        Object.assign(log, { casePrerequest: null })
    } catch (err) { console.log("\nerror parsing preRequest") }

  })

  newman.on('request', (err, e) => {

    if (err || !e.item.name) return

    const request = JSON.parse(JSON.stringify(e.request))

    // parsing params query
    try {
      const tempParams = request.url.query
      const paramStorage = []

      if (tempParams.length > 0) {
        if (checkParams === 0) {
          columns.push('requestParams')
          checkParams = 1
        }

        for (var i = 0; i < tempParams.length; i++)
          paramStorage.push(tempParams[i])

        Object.assign(log, { requestParams: JSON.stringify(paramStorage) })
      }
    } catch (err) { console.log("\nerror parsing params") }

    // parsing auth
    try {
      if (request.hasOwnProperty('auth')) {
        const tempAuth = request.auth
        const authStorage = []

        var authType = tempAuth.type
        const typeAuth = tempAuth[authType]

        if (checkAuth === 0) {
          columns.push('requestAuth')
          checkAuth = 1
        }

        for (var i = 0; i < typeAuth.length; i++)
          authStorage.push(typeAuth[i])

        Object.assign(log, { 'requestAuth': JSON.stringify(authStorage) })
      }
    } catch (err) { console.log("\nerror parsing auth") }

    const { status, code, responseTime, responseSize, stream } = e.response

    // parsing response
    Object.assign(log, {
      responseStatus: status,
      responseCode: code,
      responseTime,
      responseSize,
      responseBody: stream.toString()
    })

    // parsing header
    try {
      const headerPointer = JSON.parse(JSON.stringify(e.request)).header
      var headerStorage = []

      for (var i = 0; i < headerPointer.length; i++) {
        if (headerPointer[i].hasOwnProperty('system') !== true)
          headerStorage.push(headerPointer[i])
      }
      Object.assign(log, { requestHeader: JSON.stringify(headerStorage) })
    } catch (err) { console.log("\nerror parsing header") }
  })

  newman.on('assertion', (err, e) => {
    const { assertion } = e

    const key = err
      ? 'failedTest'
      : e.skipped
        ? 'skippedTest'
        : 'executedTest'

    log[key] = log[key] || []
    log[key].push(assertion)

    // parsing assertion
    try {
      if (e.hasOwnProperty('error') && e.error !== null) {
        const message = e.error.message

        log['assertionMessage'] = log['assertionMessage'] || []
        log['assertionMessage'].push(message.toString().replace(/\'/gi, ""))
      }
    } catch (err) { console.log("\nerror parsing assertion") }
  })

  newman.on('item', (err, e) => {
    if (err) return

    stopTime = Date.now();

    try {
      Object.assign(log, {
        executedTime
    : executedTime
    ,
        stopTime: stopTime
      })
    } catch (err) { }

    bar.increment();
    logs.push(log)
  })

  newman.on('beforeDone', (err, e) => {
    if (err) return

    // parsing timings && stats
    try {
      var timings = e.summary.run.timings
      var stats = e.summary.run.stats
    } catch (err) { console.log("\nerror parsing timings") }

    newman.exports.push({
      name: 'newman-csvallinone-reporter',
      default: collName + '(' + envName + ').csv',
      path: options.export,
      content: "\uFEFF" + getResults()
    })
    bar.stop();
    console.log('CSV write complete.')
    // console.log(JSON.stringify(timings) + "\n" + JSON.stringify(stats))
  })
}

function getResults() {
  const results = logs.map((log) => {
    const row = []

    Object.keys(log)
      .forEach((key) => {
        const val = log[key]
        const index = columns.indexOf(key)
        const rowValue = Array.isArray(val)
          ? val.join('||')
          : String(val)

        row[index] = CSV.stringify(rowValue)
      })

    return row.join(',')
  })

  results.unshift(columns.join(','))

  return results.join('\n')
}