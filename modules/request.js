let inputLog = {}
let inputColumns = []
var checkParams = 0
var checkAuth = 0
var dataType = {
    urlencoded: "--data-urlencode",
    formdata: "--form",
    file: "--data-binary",
    raw: "--data-raw",
    graphql: "--data"
}

module.exports = {
    module: function (e, log, columns) {
        inputLog = log
        inputColumns = columns
        const {
            request
        } = e
        const {
            query
        } = request.url

        if (request.hasOwnProperty('auth')) {
            parsingAuth(request)
        }
        else if (query.toString().length > 0) {
            parsingParams(query)
        }

        parsingHeader(e)
        parsingEntities(e)

        return {
            outputLog: inputLog,
            outputColumns: inputColumns
        }
    }
}

function parsingParams(query) {
    try {
        if (checkParams === 0) {
            inputColumns.push('requestParams')
            checkParams = 1
        }
        const params = query.reference
        const keys = Object.keys(params)
        var constParams = []

        for (var key of keys) {
            constParams.push(params[key])
        }
        Object.assign(inputLog, {
            requestParams: JSON.stringify(constParams)
        })
    } catch (error) {
        console.log("\n[ERROR]  Error when parsing params\n" + error)
    }
}

function parsingAuth(request) {
    try {
        const {
            type
        } = request.auth
        const typeAuth = request.auth[type].members
        const keys = Object.keys(typeAuth)
        const authStorage = []

        if (checkAuth === 0) {
            inputColumns.push('requestAuth')
            checkAuth = 1
        }
        for (var rowAuth of keys)
            if (rowAuth.hasOwnProperty("disabled") == false)
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
    try {
        const {
            members
        } = e.request.headers
        var headers = []

        for (var rowHeader of members) {
            switch (rowHeader.key === 'Content-Type') {
                case true:
                    delete rowHeader.system
                    headers.push(rowHeader)
                    break;
                case false:
                    if (rowHeader.hasOwnProperty('system') == false && rowHeader.hasOwnProperty('disabled') == false) {
                        headers.push(rowHeader)
                    }
                    break;
            }
        }
        if (isEmpty(headers) === false) {
            Object.assign(inputLog, {
                requestHeader: JSON.stringify(headers)
            })
        }
    } catch (error) {
        console.log("\n[ERROR]  Error when parsing header\n" + error)
    } finally {
        if (e.request.hasOwnProperty('body'))
            generateCurldata(headers, e.request.body.mode)
        else
            generateCurldata(headers)
    }
}

function generateCurldata(headers, type) {
    try {
        var tempBody = inputLog.requestBody

        if (headers.length > 0) {
            for (var header of headers) {
                inputLog.curl += " \\ --header \"" + header.key + ": " + header.value + "\""
            }
        }
        if (type && (tempBody && tempBody !== '{}')) {
            if (type === "urlencoded" || type === "formdata") {
                var temp = JSON.parse(tempBody)
                for (const [key, value] of Object.entries(temp)) {
                    inputLog.curl += " \\ " + dataType[type] + " \"" + key + "=" + value + "\""
                }
            } else {
                inputLog.curl += " \\ " + dataType[type] + " \"" + tempBody + "\""
            }
        }
    }
    catch (error) {
        console.log("\n[ERROR]  Error when generate curl data\n" + error)
    } finally {
        tempBody = ""
    }
}

function parsingEntities(e) {
    try {
        const {
            status,
            code,
            responseTime,
            stream
        } = e.response

        Object.assign(inputLog, {
            responseTime,
            responseStatus: status,
            responseCode: code,
            responseBody: stream.toString(),
        })
    }
    catch (error) {
        console.log("\n[ERROR]  Error when parsing entities\n" + error)
    }
}

var isEmpty = function (val) {
    if (val === "" || val === null || val === undefined || (val !== null && typeof val === "object" && !Object.keys(val).length)) {
        return true
    } else {
        return false
    }
}