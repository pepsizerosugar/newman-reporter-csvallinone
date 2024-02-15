module.exports = function parseAssertion (err, e, log) {
  const { assertion, error, skipped } = e
  const key = err ? 'failedTest' : skipped ? 'skippedTest' : 'executedTest'
  const assertionMessage = error ? error.message.replace(/\'/gi, '') : ''

  return Object.assign({}, log, {
    [key]: (log[key] || []).concat(assertion),
    assertionMessage: assertionMessage ? (log.assertionMessage || []).concat(assertionMessage) : log.assertionMessage
  })
}
