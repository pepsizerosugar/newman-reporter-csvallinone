var x = 0
var y = 0

var caseCount
var folderName

module.exports = {
    folderName: function (newman, folderCount, folderStorage) {
        // parsing folder name
        try {
            if (x < folderCount) {
                caseCount = Object.keys(folderStorage[x].items.members).length
                folderName = newman.summary.collection.items.members[x].name

                if ((++y) == caseCount) {
                    ++x
                    y = 0
                }
            }
        } catch (error) {
            console.log('\nerror parsing folder name\n' + error)
        }
    },

    module: function (newman, e, log) {
        const {
            cursor,
            item,
            request
        } = e

        var body = ''

        // parsing request body
        try {
            if (request.hasOwnProperty('body')) {
                var bodyType = request.body.mode
                const tempBody = request.body[bodyType]

                if (JSON.stringify(tempBody).length > 2) {
                    if (bodyType === "urlencoded" || bodyType === "file" || bodyType === "graphql" || bodyType === "formdata") {
                        body = JSON.stringify(tempBody)
                        Object.assign(log, {
                            requestBody: body
                        })
                    } else {
                        body = tempBody.replace(/ |\r\n|\r|\n/gi, "")
                        Object.assign(log, {
                            requestBody: body
                        })
                    }
                }
            } else
                Object.assign(log, {
                    requestBody: ''
                })
        } catch (error) {
            console.log('\nerror parsing Body Type\n' + error)
        }

        // make curl
        try {
            var curl = "",
                curlUrl,
                curlHeader = "",
                curlBody

            curlUrl = "curl --location --request " + e.request.method + " \"" + e.request.url.toString() + "\" \\"

            var pointer
            var keyStorage = []
            var valueStorage = []

            var requestTemp = JSON.stringify(e.request)

            if (JSON.parse(requestTemp.toString()).hasOwnProperty('header')) {
                pointer = JSON.parse(requestTemp.toString()).header

                for (var rowHeader of pointer) {
                    if (pointer.hasOwnProperty('system') !== true) {
                        keyStorage.push(JSON.stringify(rowHeader.key))
                        valueStorage.push(JSON.stringify(rowHeader.value))
                    }
                }

                for (var i = 0; i < keyStorage.length; i++)
                    curlHeader += " --header \"" + keyStorage[i].toString("").replace(/\"/gi, "") + ": " + valueStorage[i].toString().replace(/\"/gi, "") + "\" \\"
            }

            if (request.hasOwnProperty('body')) {
                curlBody = " --data \"" + body.replace(/\"/gi, "\\\"") + "\""
                curl += curlUrl + curlHeader + curlBody
            } else
                curl += curlUrl + curlHeader

            Object.assign(log, {
                curl
            })
        } catch (error) {
            console.log('\nerror parsing cURL\n' + error)
        }

        Object.assign(log, {
            collectionName: newman.summary.collection.name,
            environmentName: newman.summary.environment.name,
            iteration: cursor.iteration + 1,
            folderName,
            caseName: item.name,
            requestMethod: request.method,
            requestUrl: request.url.toString()
        })

        return log
    }
}