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

function parsingFoldername(newman){
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

    try {
        var curl = ''
        var curlHeader = ''
        var curlBody = ''

        var keyStorage = []
        var valueStorage = []

        curl += "curl --location --request " + e.request.method + " \"" + e.request.url.toString() + "\" \\"

        var tempRequest = JSON.parse(JSON.stringify(e.request))

        if (tempRequest.hasOwnProperty('header')) {
            for (var rowHeader of tempRequest.header) {
                if (rowHeader.hasOwnProperty('system') !== true) {
                    keyStorage.push(rowHeader.key)
                    valueStorage.push(rowHeader.value)
                }
            }

            for (var i = 0; i < keyStorage.length; i++)
                curlHeader += " --header \"" + keyStorage[i].toString("").replace(/\"/gi, "") + ": " + valueStorage[i].toString().replace(/\"/gi, "") + "\" \\"
        
            curl += curlHeader
        }

        if (body && body !== '{}') {
            curlBody = " --data \"" + body.replace(/\"/gi, "\\\"") + "\""
            curl += curlBody
        }

        Object.assign(inputLog, {
            curl
        })
    } catch (error) {
        console.log('\n[ERROR]  Error when parsing cURL\n' + error)
    }

    Object.assign(inputLog, {
        collectionName: newman.summary.collection.name,
        environmentName: newman.summary.environment.name,
        caseName: item.name,
        requestMethod: request.method,
        requestUrl: request.url.toString(),
        iteration: cursor.iteration + 1,
    })
}