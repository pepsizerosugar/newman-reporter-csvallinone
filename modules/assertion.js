module.exports = {
    module: function (err, e, log) {
        const {
            assertion,
            error
        } = e

        // parsing assertion
        try {
            let key

            if (err)
                key = 'failedTest'
            else if (e.skipped)
                key = 'skippedTest'
            else
                key = 'executedTest'

            log[key] = log[key] || []
            log[key].push(assertion)
        } catch (errors) {
            console.log('\nerror parsing assertion\n' + errors)
        }

        // parsing assertionMessage
        try {
            if (e.hasOwnProperty('error') && error !== null) {
                const message = error.message

                log['assertionMessage'] = log['assertionMessage'] || []
                log['assertionMessage'].push(message.toString().replace(/\'/gi, ""))
            }
        } catch (errors) {
            console.log("\nerror parsing assertionMessage\n" + errors)
        }

        return log
    }
}