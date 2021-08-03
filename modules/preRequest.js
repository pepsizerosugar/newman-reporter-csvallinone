module.exports = {
    module: function (e, log) {
        const {
            executions
        } = e

        // parsing case pre-request
        try {
            if (JSON.stringify(executions[2]) !== undefined)
                Object.assign(log, {
                    casePrerequest: JSON.stringify(executions[2].script.exec)
                })
            else
                Object.assign(log, {
                    casePrerequest: null
                })
        } catch (error) {
            console.log("\nerror parsing preRequest\n" + error)
        }

        return log;
    }
}