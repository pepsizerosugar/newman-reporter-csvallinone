let inputLog = {}

var checkParams = 0
var checkAuth = 0

module.exports = {
    module: function (e, log) {
        inputLog = log
        const { request } = e

        parsingParams(request)
        parsingAuth(request)
        parsingHeader(e)

        return inputLog
    }
}

function parsingParams(request){
    try {
        const tempParams = request.url.query
        const paramStorage = []

        if (tempParams.length > 0) {
            if (checkParams === 0) {
                columns.push('requestParams')
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

function parsingAuth(request){
    try {
        if (request.hasOwnProperty('auth')) {
            const authStorage = []

            var authType = request.type
            const typeAuth = request[authType]

            if (checkAuth === 0) {
                columns.push('requestAuth')
                checkAuth = 1
            }

            for (var rowAuth of typeAuth)
                authStorage.push(rowAuth)

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

    // parsing header
    try {
        const headerPointer = JSON.parse(JSON.stringify(e.request)).header
        var headerStorage = []

        for (var rowHeader of headerPointer) {
            if (rowHeader.hasOwnProperty('system') !== true)
                headerStorage.push(rowHeader)
        }
    } catch (error) {
        console.log("\n[ERROR]  Error when parsing header\n" + error)
    }

    Object.assign(inputLog, {
        requestHeader: JSON.stringify(headerStorage),
        responseTime,
        responseStatus: status,
        responseCode: code,
        responseBody: stream.toString(),
    })
}