let inputLog = {}
var x = 0
var y = 0
var folderCount
var caseCount
var body = ''

module.exports = {
    module: function (newman, e, log) {
        inputLog = log
        folderCount = Object.keys(newman.summary.collection.items.members).length
        parsingFoldername(newman)
        parsingBody(e)
        parsingCurl(newman, e)
        return inputLog
    }
}

function parsingFoldername(newman) {
    try {
        const folderStorage = newman.summary.collection.items.members
        if (x < folderCount) {
            caseCount = Object.keys(folderStorage[x].items.members).length
            Object.assign(inputLog, {
                folderName: newman.summary.collection.items.members[x].name
            })
            if ((++y) == caseCount) {
                ++x
                y = 0
            }
        }
    } catch (error) {
        console.log('\n[ERROR]  Error when parsing folder name\n' + error)
    }
}

function parsingBody(e) {
    const { request } = e
    body = ''
    try {
        if (request.hasOwnProperty('body')) {
            const bodyType = request.body.mode
            const tempBody = request.body[bodyType]
            if (JSON.stringify(tempBody).length > 2) {
                if (bodyType === "urlencoded" || bodyType === "file" || bodyType === "graphql" || bodyType === "formdata") {
                    body = JSON.stringify(tempBody)
                } else {
                    body = tempBody.replace(/ |\r\n|\r|\n/gi, "")
                }
            }
        }
        Object.assign(inputLog, {
            requestBody: body
        })
    } catch (error) {
        console.log('\n[ERROR]  Error when parsing Body Type\n' + error)
    }
}

function parsingCurl(newman, e) {
    const {
        request,
        cursor,
        item
    } = e
    const {
        method,
        url,
    } = request
    try {
        var curl = "curl --location --request " + method + " \"" + url.toString() + "\""
        var curlHeader = ''
        var curlBody = ''
        var keyStorage = []
        var valueStorage = []
        const header = parsingHeader(e)
        if (header != null) {
            for (var rowHeader of header) {
                keyStorage.push(rowHeader.key)
                valueStorage.push(rowHeader.value)
            }
            for (var i = 0; i < keyStorage.length; i++) {
                curlHeader += " \\ --header \"" + keyStorage[i] + ": " + valueStorage[i] + "\""
            }
            curl += curlHeader
        }
        if (body && body !== '{}') {
            curlBody = " \\ --data \"" + body + "\""
            curl += curlBody
        }
        Object.assign(inputLog, {
            curl
        })
    } catch (error) {
        console.log('\n[ERROR]  Error when parsing cURL\n' + error + "\n" + item.name)
    }
    Object.assign(inputLog, {
        collectionName: newman.summary.collection.name,
        environmentName: newman.summary.environment.name,
        caseName: item.name,
        requestMethod: method,
        requestUrl: request.url.toString(),
        iteration: cursor.iteration + 1,
    })
}

function parsingHeader(e) {
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
            return headerStorage
        } else {
            return null
        }
    } catch (error) {
        console.log("\n[ERROR]  Error when parsing header\n" + error)
    }
}

var isEmpty = function (val) {
    if (val === "" || val === null || val === undefined || (val !== null && typeof val === "object" && !Object.keys(val).length)) {
        return true
    } else {
        return false
    }
}