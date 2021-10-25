let inputLog = {}

module.exports = {
    module: function (err, e, log) {
        inputLog = log
        const {
            assertion,
            error
        } = e

        parsingAssertion(err, e, assertion)
        parsingAssertionmessage(e, error)

        return inputLog
    }
}

function parsingAssertion(err, e, assertion) {
    try {
        let key

        if (err)
            key = 'failedTest'
        else if (e.skipped)
            key = 'skippedTest'
        else
            key = 'executedTest'
        inputLog[key] = inputLog[key] || []
        inputLog[key].push(assertion)
    } catch (error) {
        console.log('\n[ERROR]  Error when parsing assertion\n' + error)
    }
}

function parsingAssertionmessage(e, error) {
    try {
        if (e.hasOwnProperty('error') && error !== null) {
            const message = error.message

            inputLog['assertionMessage'] = inputLog['assertionMessage'] || []
            inputLog['assertionMessage'].push(message.toString().replace(/\'/gi, ""))
        }
    } catch (err) {
        console.log("\n[ERROR]  Error when parsing assertionMessage\n" + err)
    }
}