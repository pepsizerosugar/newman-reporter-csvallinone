let inputLog = {}
var x = 0
var y = 0
var caseCount

module.exports = {
    module: function (newman, e, log) {
        inputLog = log

        parsingFoldername(newman)
        parsingBody(e)
        parsingEntities(newman, e)
        generateCurlurl(e)

        return inputLog
    }
}

function parsingFoldername(newman) {
    try {
        const folderStorage = newman.summary.collection.items.members
        const folderCount = Object.keys(newman.summary.collection.items.members).length

        if (x < folderCount) {
            caseCount = Object.keys(folderStorage[x].items.members).length
            Object.assign(inputLog, {
                folderName: folderStorage[x].name
            })
            if ((++y) == caseCount) {
                ++x
                y = 0
            }
        }
    } catch (error) {
        console.log('\n[ERROR] Error when parsing folder name\n' + error)
    }
}

function parsingBody(e) {
    try {
        const {
            request
        } = e

        if (request.hasOwnProperty('body')) {
            const tempBody = request.body
            const bodyType = request.body.mode
            const tempModebody = tempBody[bodyType]
            const parseTempbody = JSON.parse(JSON.stringify(tempBody))
            const parseTempModebody = JSON.parse(JSON.stringify(tempModebody))
            switch (bodyType) {
                case "graphql":
                    var temp = parseTempbody.graphql
                    Object.assign(inputLog, {
                        requestBody: JSON.stringify(temp).replace(/(^"|"$)|\\r\\n|\\r|\\n|\\t/gi, "")
                    })
                    break;
                case "file":
                    var temp = parseTempbody.file.src
                    Object.assign(inputLog, {
                        requestBody: temp
                    })
                    break;
                case "urlencoded":
                case "formdata":
                    var temp = parseTempModebody
                    if (temp.length > 0) {
                        var jsonObject = new Object
                        for (const entities of temp) {
                            if (entities.hasOwnProperty('disabled') !== true){
                                switch(bodyType){
                                    case "urlencoded":
                                        jsonObject[entities.key] = entities.value
                                        break;
                                    case "formdata":
                                        jsonObject[entities.key] = entities.src
                                        break;
                                }
                            } 
                        }
                        if (Object.keys(jsonObject).length > 0) {
                            Object.assign(inputLog, {
                                requestBody: JSON.stringify(jsonObject).replace(/(^"|"$)|\\r\\n|\\r|\\n|\\t/gi, "")
                            })
                        }
                    }
                    break;
                default:
                    Object.assign(inputLog, {
                        requestBody: parseTempModebody.replace(/(^"|"$)|\\r\\n|\\r|\\n|\\t/gi, "")
                    })
                    break;
            }
        }
    } catch (error) {
        console.log('\n[ERROR] Error when parsing reqeust body\n' + error)
    }
}

function parsingEntities(newman, e) {
    try {
        const {
            cursor,
            item
        } = e
        const {
            method,
            url,
        } = e.request

        Object.assign(inputLog, {
            collectionName: newman.summary.collection.name,
            environmentName: newman.summary.environment.name,
            caseName: item.name,
            requestMethod: method,
            requestUrl: url,
            iteration: cursor.iteration + 1,
        })
    } catch (error) {
        console.log("\n[ERROR] Error when parsing entities\n" + error)
    }
}

function generateCurlurl(e) {
    try {
        const {
            method,
            url,
        } = e.request

        var curl = "curl --location --request " + method + " \"" + url + "\""
        Object.assign(inputLog, {
            curl
        })
    } catch (error) {
        console.log('\n[ERROR] Error when generate curl url\n' + error)
    }
}