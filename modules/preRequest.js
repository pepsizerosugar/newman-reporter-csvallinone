let inputLog = {}

module.exports = {
    module: function (e, log) {
        inputLog = log
        const { executions } = e

        parsingPrerequest(executions)

        return inputLog;
    }
}

function parsingPrerequest(executions){
    try {
        if (JSON.stringify(executions[2]) !== undefined)
            Object.assign(log, {
                casePrerequest: JSON.stringify(executions[2].script.exec)
            })
        else
            Object.assign(inputLog, {
                casePrerequest: null
            })
    } catch (error) {
        console.log("\n[ERROR]  Error when parsing preRequest\n" + error)
    }
}