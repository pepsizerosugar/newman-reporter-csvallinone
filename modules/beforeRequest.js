const logger = require('../lib/logger')
const { listify } = require('../lib/utils')

/**
 * Pre-request parser module.
 * - Builds folder path, request body, base meta, and cURL seed values.
 *
 * @param {Object} newman   - Newman emitter (contains collection/environment info in summary).
 * @param {Object} e        - Event payload including `{ item, request, cursor }`.
 * @param {Object} log      - Accumulated log object.
 * @param {Object} [options]- Reporter options. Supports 'folderPath' ('last'|'full').
 * @returns {Object}        - Updated log object.
 */

/**
 * Pre-request parser (pure function).
 * - Returns partial row including folder path, request body, base meta, and cURL seed.
 */
function parseBeforeRequest(newman, e, options) {
  const meta = parsingEntities(newman, e)
  const folderName = parsingFoldername(newman, e, options)
  const requestBody = parsingBody(e)
  const curl = generateCurlUrl(e)

  const patch = Object.assign({}, meta, { folderName, curl })
  if (typeof requestBody === 'string') {
    patch.requestBody = requestBody
  }

  return patch
}

module.exports = { parseBeforeRequest }

/**
 * Parse folder path.
 */
function parsingFoldername(newman, e, options) {
  try {
    const item = e && e.item
    if (!item || typeof item.parent !== 'function') {
      return ''
    }

    /** Collect folder chain in leaf -> root order */
    let parent = item.parent()
    const names = []
    while (parent && typeof parent.parent === 'function') {
      names.push(parent.name)
      const next = parent.parent()
      parent = next
      if (!parent || typeof parent.parent !== 'function') break
    }

    const modeRaw = (options && (options.folderPath || options['folder-path'])) || 'last'
    const mode = String(modeRaw).toLowerCase()

    let folderName = ''
    if (names.length > 0) {
      if (mode === 'full' || mode === 'fullpath' || mode === 'path') {
        // Join in root -> leaf order
        folderName = names.slice().reverse().join(' > ')
      } else {
        // Deepest (leaf) folder name
        folderName = names[0]
      }
    }

    return folderName
  } catch (error) {
    logger.error('Error when parsing folder name')
    return ''
  }
}

/**
 * Parse request body and set `requestBody`.
 * For each mode, keep raw content or normalized JSON string.
 */
function parsingBody(e) {
  try {
    const { request } = e
    if (request.hasOwnProperty('body')) {
      const tempBody = request.body
      const bodyType = tempBody.mode
      const tempModeBody = tempBody[bodyType]

      switch (bodyType) {
        case 'graphql': {
          // Preserve GraphQL {query, variables}
          const temp = tempBody.graphql
          return JSON.stringify(temp)
        }
        case 'file': {
          // For file mode, keep path(s) only
          const temp = tempBody.file && tempBody.file.src
          return (typeof temp === 'string') ? JSON.stringify(temp || '') : ''
        }
        case 'urlencoded':
        case 'formdata': {
          // urlencoded/formdata: exclude disabled entries; differentiate text/file
          const arr = listify(tempModeBody)
          const jsonObject = {}
          for (const ent of arr) {
            if (ent && ent.disabled !== true) {
              if (bodyType === 'urlencoded') {
                jsonObject[ent.key] = ent.value
              } else {
                // formdata: file/text differentiation
                if (ent.type === 'file') {
                  jsonObject[ent.key] = ent.src
                } else {
                  jsonObject[ent.key] = ent.value
                }
              }
            }
          }
          if (Object.keys(jsonObject).length > 0) {
            return JSON.stringify(jsonObject)
          }
          return undefined
        }
        default: {
          // For raw-like modes, keep original content
          const raw = (typeof tempModeBody === 'string') ? tempModeBody : JSON.stringify(tempModeBody)
          return raw
        }
      }
    }
  } catch (error) {
    logger.error('Error when parsing request body')
  }

  return undefined
}

/**
 * Parse base metadata and accumulate into log.
 */
function parsingEntities(newman, e) {
  try {
    const {
      cursor,
      item
    } = e
    const {
      method,
      url
    } = e.request

    return {
      collectionName: newman.summary.collection.name,
      environmentName: newman.summary.environment.name,
      caseName: item.name,
      requestMethod: method,
      requestUrl: url,
      iteration: cursor.iteration + 1
    }
  } catch (error) {
    logger.error('Error when parsing entities')
    return {}
  }
}

/**
 * Generate cURL seed string.
 * - Escape single quotes inside URL.
 */
function generateCurlUrl(e) {
  try {
    const { method, url } = e.request
    // URL is an SDK object; convert to string
    const urlStr = (url && typeof url.toString === 'function') ? url.toString() : String(url)
    const curl = 'curl --location --request ' + method + " '" + urlStr.replace(/'/g, "\\'") + "'"
    return curl
  } catch (error) {
    logger.error('Error when generate curl url')
    return ''
  }
}
