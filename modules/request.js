let inputLog = {}
let inputColumns = []

var checkParams = 0
var checkAuth = 0

module.exports = {
    module: function (e, log, columns) {
        inputLog = log
        inputColumns = columns
        const { request } = e

        parsingParams(request)
        parsingAuth(request)
        parsingHeader(e)

        return {
            outputLog: inputLog,
            outputColumns: inputColumns
        }
    }
}

function parsingParams(request) {
    try {
        const tempParams = request.url.query
        const paramStorage = []

        if (isEmpty(tempParams)) {
            if (checkParams === 0) {
                inputColumns.push('requestParams')
                checkParams = 1
            }

            for (var rowParams of tempParams)
                paramStorage.push(rowParams)

            Object.assign(inputLog, {
                requestParams: JSON.stringify(paramStorage)
            })
        }
    } catch (error) {
        console.log("\n[ERROR]  Error when parsing params\n" + error)
    }
}

function parsingAuth(request) {
    try {
        if (request.hasOwnProperty('auth')) {
            const authStorage = []

            var authType = request.auth.type
            const typeAuth = request.auth[authType]

            if (isEmpty(typeAuth)) {
                console.log("typeAuth: " + typeAuth)
                if (checkAuth === 0) {
                    inputColumns.push('requestAuth')
                    checkAuth = 1
                }
                for (var rowAuth of typeAuth)
                    authStorage.push(rowAuth)
                Object.assign(inputLog, {
                    requestAuth: JSON.stringify(authStorage)
                })
            }
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

    // parsing header
    try {
        const headerPointer = JSON.parse(JSON.stringify(e.request)).header
        var headerStorage = []
        for (var rowHeader of headerPointer) {
            if (rowHeader.hasOwnProperty('system') !== true)
                headerStorage.push(rowHeader)
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