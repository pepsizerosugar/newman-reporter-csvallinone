let inputLog = {}
let inputColumns = []
var checkParams = 0
var checkAuth = 0

module.exports = {
    module: function (e, log, columns) {
        inputLog = log
        inputColumns = columns
        const { request } = e
        if (request.url.query.toString().length > 0) {
            parsingParams(request)
        }
        if (request.hasOwnProperty('auth')) {
            parsingAuth(request)
        }
        parsingHeader(e)
        return {
            outputLog: inputLog,
            outputColumns: inputColumns
        }
    }
}

function parsingParams(request) {
    try {
        if (checkParams === 0) {
            inputColumns.push('requestParams')
            checkParams = 1
        }
        Object.assign(inputLog, {
            requestParams: JSON.stringify(request.url.query.reference)
        })
    } catch (error) {
        console.log("\n[ERROR]  Error when parsing params\n" + error)
    }
}

function parsingAuth(request) {
    try {
        const { type } = request.auth
        const typeAuth = request.auth[type].members
        const keys = Object.keys(typeAuth)
        const authStorage = []
        if (checkAuth === 0) {
            inputColumns.push('requestAuth')
            checkAuth = 1
        }
        for (var rowAuth of keys)
            authStorage.push(typeAuth[rowAuth])
        if (!isEmpty(authStorage)) {
            Object.assign(inputLog, {
                requestAuth: JSON.stringify(authStorage)
            })
        }
    } catch (error) {
        console.log("\n[ERROR]  Error when parsing auth\n" + error)
    }
}

function parsingHeader(e) {
    const {
        status,
        code,
        responseTime,
        stream
    } = e.response
    const { members } = e.request.headers
    // parsing header
    try {
        var headerStorage = []
        for (var rowHeader of members) {
            if (rowHeader.hasOwnProperty('system') !== true && rowHeader.hasOwnProperty('disabled') !== true) {
                if (rowHeader.hasOwnProperty('name'))
                    delete rowHeader.name
                headerStorage.push(rowHeader)
            }
        }
        if (!isEmpty(headerStorage)) {
            Object.assign(inputLog, {
                requestHeader: JSON.stringify(headerStorage)
            })
        }
    } catch (error) {
        console.log("\n[ERROR]  Error when parsing header\n" + error)
    }

    Object.assign(inputLog, {
        responseTime,
        responseStatus: status,
        responseCode: code,
        responseBody: stream.toString(),
    })
}

var isEmpty = function (val) {
    if (val === "" || val === null || val === undefined || (val !== null && typeof val === "object" && !Object.keys(val).length)) {
        return true
    } else {
        return false
    }
}