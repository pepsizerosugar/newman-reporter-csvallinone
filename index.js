var _         = require('lodash'),
    progress  = require('cli-progress'),
    chalk     = require('chalk')

let log
const logs = []
const columns = [
  // collection info
  'collectionName',
  'caseName',

  // request value
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

let collName = ""

const CSV = {
  stringify: (str) => {
    return `"${str.replace(/"/g, '""')}"`
  }
}

/**
 * Reporter that outputs basic logs to CSV (default: newman-run-report.csv).
 *
 * @param {Object} newman - The collection run object, with event hooks for reporting run details.
 * @param {Object} options - A set of collection run options.
 * @param {String} options.export - The path to which the summary object must be written.
 * @returns {*}
 */
module.exports = function newmanCSVaioReporter (newman, options) {

  var bar = new progress.Bar({
    format: '== Newman Run Progress |' + chalk.green('{bar}') + '| {percentage}% || Requests: {value}/{total} || ETA: {eta}s ==',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  })

  newman.on('start', function (err, e) {
    if (err) { return; }
    bar.start(e.cursor.length * e.cursor.cycles, 0);
  })

  newman.on('beforeItem', (err, e) => {
    if (err) return

    try{
      // console.log(JSON.stringify(e))
    } catch(err){console.log("error parsing case time : " + e.item.name)}

    log = {}
  })

  newman.on('beforeRequest', (err, e) => {
    if (err || !e.item.name) return
    const { cursor, item, request } = e

    collName = newman.summary.collection.name

    Object.assign(log, {
      collectionName: newman.summary.collection.name,
      iteration: cursor.iteration + 1,
      caseName: item.name,
      requestMethod: request.method,
      requestUrl: request.url.toString()
    })

    // bodyType check
    try {
      if(request.hasOwnProperty('body') && JSON.stringify(request.body[request.body.mode]).length > 2){
        if(request.body.mode === "urlencoded")
          Object.assign(log, { requestBody: JSON.stringify(request.body[request.body.mode]) })
        else
          Object.assign(log, { requestBody: request.body[request.body.mode].toString().replace(/ |\r\n|\r|\n/gi, "") })
      }
    } catch (error) {console.log("error : " + item.name + "\n" + JSON.stringify(request))}    

    // make curl
    try{
      var curlUrl, curlHeader, curlBody
      curlHeader = ""
      curl = ""
      curlUrl = "curl --location --request " + e.request.method + " \"" + e.request.url.toString() + "\" \\"
      
      var pointer = JSON.parse(JSON.stringify(e.request).toString()).header
      var keyStorage = []
      var valueStorage = []

      for(var i=0; i < Object.keys(pointer).length; i++){
        if(pointer.hasOwnProperty('system') !== true){
          keyStorage.push(JSON.stringify(pointer[i].key))
          valueStorage.push(JSON.stringify(pointer[i].value))
        }
      }
      
      for(var i=0; i < Object.keys(keyStorage).length; i++)
        curlHeader += " --header " + "\"" + keyStorage[i].toString("").replace(/\"/gi, "") + ": " + valueStorage[i].toString().replace(/\"/gi, "") + "\" \\"

      if(request.hasOwnProperty('body')){
        curlBody = " --data \"" + request.body[request.body.mode].toString().replace(/ |\r\n|\r|\n/gi, "").replace(/\"/gi, "\\\"") + "\""
        if(request.body.mode === "raw")
          curlHeader += " --header " + "\"Content-Type: application/json\" \\"
        curl += curlUrl + curlHeader + curlBody
      }
      else
        curl += curlUrl + curlHeader

      Object.assign(log, { curl })
    } catch (error) {console.log("error parsing curl : " + item.name + "\n" + JSON.stringify(request))}
  })

  // pre-script collection, folder, case
  newman.on('prerequest', (err, e) => {
    if (err || !e.item) return

    const { executions } = e

    if (JSON.stringify(executions[2]) !== undefined){
      Object.assign(log, {
        casePrerequest: JSON.stringify(executions[2].script.exec)
      })
    }
    else{
      Object.assign(log, {
        casePrerequest: null
      })
    }
  })

  newman.on('request', (err, e) => {

    if (err || !e.item.name) return

    const { status, code, responseTime, responseSize, stream } = e.response
    Object.assign(log, { responseStatus: status, responseCode: code, responseTime, responseSize })
    Object.assign(log, { responseBody: stream.toString() }) 
    
    try {
      const headerPointer = JSON.parse(JSON.stringify(e.request)).header
      var headerStorage = []

      for(var i=0; i < headerPointer.length; i++){
        if(headerPointer[i].hasOwnProperty('system') !== true)
          headerStorage.push(headerPointer[i])
      }
      Object.assign(log, { requestHeader: JSON.stringify(headerStorage) })
    } catch(err) {console.log("error parsing header") }
  })

  newman.on('assertion', (err, e) => {
    const { assertion } = e

    const key = err ? 'failedTest' : e.skipped ? 'skippedTest' : 'executedTest'

    log[key] = log[key] || []
    log[key].push(assertion)

    try {
      if(e.hasOwnProperty('error') && e.error !== null){
        const message = e.error.message
        const key2 = 'assertionMessage'

        log[key2] = log[key2] || []
        log[key2].push(message.toString().replace(/\'/gi, ""))
      }
    } catch(err) {console.log("error parsing assertion")}
  })

  newman.on('item', (err, e) => {
    if (err) return
    bar.increment();
    logs.push(log)
  })
 
  newman.on('beforeDone', (err, e) => {
    if (err) return

    // timings stats
    try{
      var timings = e.summary.run.timings
      var stats = e.summary.run.stats
    } catch(err){console.log("error parsing timings")}

    console.log(timings + "\n" + timings)

    newman.exports.push({
      name: 'newman-csvallinone-reporter',
      default: (collName + '.csv'),
      path: options.export,
      content: "\uFEFF" + getResults()
    })
    bar.stop();
    console.log('CSV write complete.')
  })
}

function getResults () {
  const results = logs.map((log) => {
    const row = []

    Object.keys(log).forEach((key) => {
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