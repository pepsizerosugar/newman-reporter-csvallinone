const logger = require('../lib/logger')
const { listify, isEmpty, escapeSingleQuotes } = require('../lib/utils')

const dataType = {
  urlencoded: '--data-urlencode',
  formdata: '--form',
  file: '--data-binary',
  raw: '--data-raw',
  graphql: '--data'
}

/**
 * Request/response parser.
 * - Parses headers/auth, appends body to cURL, and captures response meta.
 *
 * @param {Object} e            - Event payload containing `{ request, response }`.
 * @param {string[]} columns    - Current CSV columns array.
 * @param {Object} currentRow   - Current accumulated row (uses curl/requestBody).
 * @param {{curlMultiline?: boolean}} [options]
 * @returns {{rowPatch: Object, columns: string[]}}
 */
function parseRequest(e, columns, currentRow, options) {
  const cols = Array.isArray(columns) ? columns.slice() : []
  const rowPatch = {}

  let request
  try {
    request = e.request
  } catch (err) {
    logger.error(err)
  }

  // Params
  try {
    const url = request.url
    const query = url && url.query
    let value

    const arr = listify(query)
    if (arr.length) {
      value = arr
        .filter((m) => m && m.disabled !== true)
        .map((m) => ({ key: m.key, value: m.value }))
    }

    if (value && value.length) {
      if (!cols.includes('requestParams')) cols.push('requestParams')
      rowPatch.requestParams = JSON.stringify(value)
    }
  } catch (err) {
    logger.error(err)
  }

  // Auth
  try {
    if (request.hasOwnProperty('auth') && request.auth && request.auth.type && request.auth[request.auth.type]) {
      const authArr = listify(request.auth[request.auth.type]).filter((m) => m && m.disabled !== true)
      if (!isEmpty(authArr)) {
        if (!cols.includes('requestAuth')) cols.push('requestAuth')
        rowPatch.requestAuth = JSON.stringify(authArr)
      }
    }
  } catch (err) {
    logger.error(err)
  }

  // Headers
  try {
    let headers = []
    const members = listify(request.headers)
    for (const h of members) {
      const disabled = (h && h.disabled === true)
      if (disabled) continue

      const keyLower = String(h.key || '').toLowerCase()
      const isContentType = keyLower === 'content-type'
      const isSystem = Object.prototype.hasOwnProperty.call(h, 'system') && h.system === true
      if (isSystem && isContentType) continue

      headers.push({ key: h.key, value: h.value })
    }

    if (!isEmpty(headers)) {
      rowPatch.requestHeader = JSON.stringify(headers)
    }

    // cURL build (append headers/body)
    try {
      const body = request.body
      const mode = body && body.mode
      const seed = (currentRow && currentRow.curl) ? currentRow.curl : ''
      const tempBody = currentRow && currentRow.requestBody
      const newCurl = buildCurl(seed, headers, mode, body, tempBody, { multiline: !!(options && options.curlMultiline) })
      if (newCurl) rowPatch.curl = newCurl
    } catch (err) {
      logger.error(err)
    }
  } catch (err) {
    logger.error(err)
  }

  // Response
  try {
    const { status, code, responseTime, stream } = e.response
    rowPatch.responseTime = responseTime
    rowPatch.responseStatus = status
    rowPatch.responseCode = code
    rowPatch.responseBody = stream.toString()
  } catch (err) {
    logger.error(err)
  }

  return { rowPatch, columns: cols }
}

module.exports = { parseRequest, buildCurl }

/**
 * cURL data builder (pure).
 *
 * @param {string} seed            - Existing cURL seed
 * @param {Array} headers          - Array of `{key,value}`
 * @param {string} type            - SDK body mode
 * @param {Object} body            - SDK RequestBody
 * @param {string|undefined} tempBody - row.requestBody (fallback for urlencoded/formdata)
 * @param {{multiline?: boolean}} [opts]
 * @returns {string}
 */
function buildCurl(seed, headers, type, body, tempBody, opts) {
  try {
    let curl = String(seed || '')
    const multiline = !!(opts && opts.multiline)
    const addSegment = (seg) => {
      if (!seg) return
      if (multiline) {
        curl += ' \\\n  ' + seg
      } else {
        curl += ' ' + seg
      }
    }

    // Append headers
    headers = Array.isArray(headers) ? headers : []
    for (const header of headers) {
      const key = String(header.key || '')
      const value = String(header.value || '')
      const hv = escapeSingleQuotes(key + ': ' + value)
      addSegment(`--header '${hv}'`)
    }

    // Append body
    if (type && dataType[type]) {
      if (type === 'urlencoded') {
        let arr = listify(body && (body.urlencoded ?? body[type]))
        if (!arr.length && tempBody) {
          try {
            const obj = JSON.parse(tempBody)
            arr = Object.keys(obj).map((k) => ({ key: k, value: obj[k] }))
          } catch (_) { /* ignore */ }
        }

        for (const ent of arr) {
          if (ent && ent.disabled === true) continue
          const kv = escapeSingleQuotes(String(ent.key) + '=' + String(ent.value ?? ''))
          addSegment(`${dataType[type]} '${kv}'`)
        }
      } else if (type === 'formdata') {
        let arr = listify(body && (body.formdata ?? body[type]))
        if (!arr.length && tempBody) {
          try {
            const obj = JSON.parse(tempBody)
            arr = Object.keys(obj).map((k) => ({ key: k, value: obj[k], type: 'text' }))
          } catch (_) { /* ignore */ }
        }

        for (const ent of arr) {
          if (ent && ent.disabled === true) continue

          if (ent.type === 'file') {
            const src = ent.src
            if (Array.isArray(src)) {
              for (const p of src) {
                const formVal = escapeSingleQuotes(String(ent.key) + '=@' + String(p))
                addSegment(`${dataType[type]} '${formVal}'`)
              }
            } else if (typeof src === 'string') {
              const formVal = escapeSingleQuotes(String(ent.key) + '=@' + src)
              addSegment(`${dataType[type]} '${formVal}'`)
            } else {
              const formVal = escapeSingleQuotes(String(ent.key) + '=' + String(ent.value ?? ''))
              addSegment(`${dataType[type]} '${formVal}'`)
            }
          } else {
            const formVal = escapeSingleQuotes(String(ent.key) + '=' + String(ent.value ?? ''))
            addSegment(`${dataType[type]} '${formVal}'`)
          }
        }
      } else if (tempBody && tempBody !== '{}') {
        const safeBody = escapeSingleQuotes(String(tempBody))
        addSegment(`${dataType[type]} '${safeBody}'`)
      }
    }

    return curl
  } catch (error) {
    logger.error('Error when generate curl data')
    return seed
  }
}
