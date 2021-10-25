let inputLog = {}
var x = 0
var y = 0
var folderCount
var caseCount

module.exports = {
    module: function (newman, e, log) {
        inputLog = log
        folderCount = Object.keys(newman.summary.collection.items.members).length

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
        console.log('\n[ERROR]  Error when parsing folder name\n' + error)
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

            switch (bodyType) {
                case "graphql":
                    var temp = JSON.parse(JSON.stringify(tempBody)).graphql
                    Object.assign(inputLog, {
                        requestBody: JSON.stringify(temp).replace(/(^"|"$)|\\r\\n|\\r|\\n/gi, "")
                    })
                    break;
                case "file":
                    var temp = JSON.parse(JSON.stringify(tempBody)).file.src
                    Object.assign(inputLog, {
                        requestBody: temp
                    })
                    break;
                case "urlencoded":
                case "formdata":
                    var temp = JSON.parse(JSON.stringify(tempModebody))
                    var jsonObject = new Object
                    for (const entities of temp) {
                        if (entities.hasOwnProperty("disabled") == false)
                            jsonObject[entities.key] = entities.value
                    }
                    Object.assign(inputLog, {
                        requestBody: JSON.stringify(jsonObject).replace(/(^"|"$)|\\r\\n|\\r|\\n/gi, "")
                    })
                    break;
                default:
                    Object.assign(inputLog, {
                        requestBody: JSON.stringify(tempModebody).replace(/(^"|"$)|\\r\\n|\\r|\\n/gi, "")
                    })
                    break;
            }
        }
    }
    catch (error) {
        console.log('\n[ERROR]  Error when parsing reqeust body\n' + error)
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
    }
    catch (error) {
        console.log("\n[ERROR]  Error when parsing entities\n" + error)
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
        console.log('\n[ERROR]  Error when generate curl url\n' + error)
    }
}