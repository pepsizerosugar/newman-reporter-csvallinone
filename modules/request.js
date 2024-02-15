function parseParams(query) {
    return JSON.stringify(query.reference)
}

function parseAuth(request) {
    const {type, members} = request.auth
    const authItems = members.map(member => member[type])
    return JSON.stringify(authItems.filter(item => item))
}

function parseHeaders(headers) {
    return JSON.stringify(headers.filter(header => !header.disabled && !header.system && header.key !== 'Content-Type'));
}


function parseRequestBody(request) {
    if (!request.body || Object.keys(request.body).length === 0) return '';
    const {mode, graphql, file} = request.body;
    switch (mode) {
        case 'graphql':
            return JSON.stringify(graphql);
        case 'file':
            return file.src;
        case 'urlencoded':
        case 'formdata':
            const params = request.body[mode].filter(param => !param.disabled).map(param => `${param.key}=${param.value || param.src}`);
            return params.length === 0 ? '' : JSON.stringify(params);
        default:
            return '';
    }
}


function generateCurlData(headers, requestBody, bodyMode) {
    let curlData = headers.map(header => ` --header "${header.key}: ${header.value}"`).join("");
    if (requestBody && bodyMode) {
        switch (bodyMode) {
            case "urlencoded":
            case "formdata":
                const params = JSON.parse(requestBody);
                params.forEach(param => {
                    curlData += ` --data-urlencode "${param}"`;
                });
                break;
            case "file":
                curlData += ` --data-binary "${requestBody}"`;
                break;
            default:
                curlData += ` --data-raw "${requestBody}"`;
                break;
        }
    }
    return curlData;
}


module.exports = function requestModule(e, log, columns) {
    const {request, response} = e
    const requestParams = request.url.query ? parseParams(request.url.query) : ''
    const requestAuth = request.auth ? parseAuth(request) : ''
    const requestHeader = parseHeaders(request.headers.members)
    const requestBody = parseRequestBody(request)
    const curlData = generateCurlData(request.headers.members, requestBody, request.body && request.body.mode)

    const updatedLog = Object.assign({}, log, {
        requestParams,
        requestAuth,
        requestHeader,
        responseBody: response.stream.toString(),
        responseTime: response.responseTime,
        responseStatus: response.status,
        responseCode: response.code,
        requestMethod: request.method,
        requestUrl: request.url.toString(),
        requestBody,
        curl: `curl --location --request ${request.method} "${request.url.toString()}"${curlData}`
    })

    return {
        outputLog: updatedLog,
        outputColumns: Array.from(new Set(columns.concat(['requestParams', 'requestAuth'])))
    }
}
