const { Bar } = require('./lib/progressBar')
const logger = require('./lib/logger')

const { parseBeforeRequest } = require(__dirname + '/modules/beforeRequest.js')
const { parseRequest } = require(__dirname + '/modules/request.js')
const { parseAssertion } = require(__dirname + '/modules/assertion.js')

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

const CSV = {
  stringify: (str) => {
    return `"${String(str).replace(/"/g, '""')}"`
  }
}

/**
 * Safely merges array fields.
 * @param {Object} target
 * @param {Object} patch
 * @param {string[]} keys
 */
function mergeArrayFields(target, patch, keys) {
  keys.forEach((k) => {
    if (patch && Array.isArray(patch[k])) {
      const prev = Array.isArray(target[k]) ? target[k] : []
      target[k] = prev.concat(patch[k])
    }
  })

  // Merge non-array keys as normal
  Object.keys(patch || {}).forEach((k) => {
    if (!keys.includes(k)) {
      target[k] = patch[k]
    }
  })
}

/**
 * Reporter entry module.
 * - Subscribes to Newman events, accumulates per-item rows, and exports CSV.
 *
 * @param {Object} newman  - Newman run object (provides event hooks).
 * @param {Object} options - Reporter options (`--reporter-csvallinone-*`).
 * @param {string} options.export - CSV file output path.
 * @param {('last'|'full')} [options.folderPath] - Folder path parsing mode.
 * @param {boolean|string} [options.progress=true] - Progress toggle (true/false).
 * @returns {*}
 */
module.exports = function newmanCSVallinoneReporter(newman, options) {
  // Progress toggle (default true)
  const progressFlag = options ? options.progress : undefined
  const noProgressFlag = options ? (options['no-progress'] || options.noProgress) : false
  const progressEnabled =
    (progressFlag === undefined ? true : !(progressFlag === false || progressFlag === 'false')) &&
    !noProgressFlag

  // Progress color/interval options and CI defaults
  const noColor = !!(options && (options.noColor || options['no-color'])) || !!process.env.CI
  const minUpdateMsOpt =
    options && (options.progressInterval || options.progressMinUpdate || options['progress-interval'])
  const minUpdateMs = Math.max(0, Number(minUpdateMsOpt || 80) || 80)

  // curl multiline option
  const curlMultiline = !!(options && (options.curlMultiline || options['curl-multiline']))

  var bar = null
  if (progressEnabled) {
    bar = new Bar({
      // Use local lightweight progress bar (no chalk/cli-progress)
      format: '[INFO] newman run progress {bar} {percentage}% || Requests: {value}/{total} || ETA: {eta}s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      noColor,
      minUpdateMs
    })
  }

  newman.on('start', function (err, e) {
    if (err) return
    if (bar) bar.start(e.cursor.length * e.cursor.cycles, 0)
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
    // Pass reporter options (e.g., folder path parsing mode)
    const patch = parseBeforeRequest(newman, e, options)
    log = Object.assign(log, patch)
  })

  newman.on('request', (err, e) => {
    if (err || !e.item.name) return
    const out = parseRequest(e, columns, log, { curlMultiline })
    log = Object.assign(log, out.rowPatch)
    columns = out.columns
  })

  newman.on('assertion', (err, e) => {
    const apatch = parseAssertion(err, e)
    // Accumulate array fields
    mergeArrayFields(log, apatch, ['executedTest', 'failedTest', 'skippedTest', 'assertionMessage'])
  })

  newman.on('item', (err) => {
    if (err) return

    Object.assign(log, {
      stopTime: Date.now()
    })

    if (bar) bar.increment()
    logs.push(log)
  })

  newman.on('beforeDone', (err, e) => {
    if (err) return

    var colName = e.summary.collection.name
    var envName = e.summary.environment.name

    newman.exports.push({
      name: 'newman-csvallinone-reporter',
      default: colName + '(' + envName + ').csv',
      path: options.export,
      content: '\uFEFF' + getResults()
    })

    if (bar) bar.stop()
    logger.info('CSV write complete.')
  })

  function getResults() {
    // Build each row in column order; fill missing columns with empty string
    const results = logs.map((log) => {
      const row = columns.map((col) => {
        const val = log[col]
        const rowValue = Array.isArray(val) ? val.join('||') : (val == null ? '' : String(val))
        return CSV.stringify(rowValue)
      })
      return row.join(',')
    })

    results.unshift(columns.join(','))

    return results.join('\n')
  }
}
