var checkParams = 0
var checkAuth = 0

module.exports = {
    module: function (e, log) {
        const {
            request
        } = e

        // parsing params query
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

                Object.assign(log, {
                    requestParams: JSON.stringify(paramStorage)
                })
            }
        } catch (error) {
            console.log("\nerror parsing params\n" + error)
        }

        // parsing auth
        try {
            if (request.hasOwnProperty('auth')) {
                const {
                    tempAuth
                } = request
                const authStorage = []

                var authType = tempAuth.type
                const typeAuth = tempAuth[authType]

                if (checkAuth === 0) {
                    columns.push('requestAuth')
                    checkAuth = 1
                }

                for (var rowAuth of typeAuth)
                    authStorage.push(rowAuth)

                Object.assign(log, {
                    requestAuth: JSON.stringify(authStorage)
                })
            }
        } catch (error) {
            console.log("\nerror parsing auth\n" + error)
        }

        const {
            status,
            code,
            responseTime,
            responseSize,
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
            console.log("\nerror parsing header\n" + error)
        }

        Object.assign(log, {
            requestHeader: JSON.stringify(headerStorage),
            responseTime,
            responseStatus: status,
            responseCode: code,
            responseBody: stream.toString(),
            responseSize,
        })

        return log
    }
}