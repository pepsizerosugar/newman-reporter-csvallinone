const logger = require('../lib/logger')

/**
 * Assertion parser (pure function).
 * - Returns partial row for executed/failed/skipped tests and messages.
 *
 * @param {Error|null} err - Assertion error (null if none).
 * @param {Object} e - Event payload containing `{ assertion, skipped, error }`.
 * @returns {Object} - Partial row (keys contain array values)
 */
function parseAssertion(err, e) {
  const patch = {}
  try {
    const { assertion, error } = e
    let key
    if (err) key = 'failedTest'
    else if (e.skipped) key = 'skippedTest'
    else key = 'executedTest'

    patch[key] = [assertion]

    if (Object.prototype.hasOwnProperty.call(e, 'error') && error !== null) {
      const message = error.message
      patch['assertionMessage'] = [
        message.toString().replace(/\r/gi, '')
      ]
    }
  } catch (ex) {
    logger.error('Error when parsing assertion')
  }
  return patch
}

module.exports = { parseAssertion }
