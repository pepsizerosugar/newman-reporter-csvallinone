let caseIndex = 0
let folderIndex = 0

function parseFolderName (newman) {
  const folder = newman.summary.collection.items.members[folderIndex]
  const caseCount = Object.keys(folder.items.members).length
  const folderName = folder.name
  caseIndex = (++caseIndex) % caseCount
  if (caseIndex === 0) folderIndex++
  return folderName
}

function parseRequestBody (request) {
  if (!request.hasOwnProperty('body')) return ''
  const { mode, graphql, file } = request.body
  switch (mode) {
    case 'graphql':
      return JSON.stringify(graphql).replace(/(^"|"$)|\\r\\n|\\r|\\n|\\t/gi, '')
    case 'file':
      return file.src
    case 'urlencoded':
    case 'formdata':
      const params = request.body[mode]
      const parsedParams = params.filter(param => !param.disabled).map(param => ({
        [param.key]: param.src || param.value
      }))
      return JSON.stringify(Object.assign({}, ...parsedParams)).replace(/(^"|"$)|\\r\\n|\\r|\\n|\\t/gi, '')
    default:
      return JSON.stringify(mode).replace(/(^"|"$)|\\r\\n|\\r|\\n|\\t/gi, '')
  }
}

function generateCurlUrl (request) {
  const { method, url } = request
  return `curl --location --request ${method} "${url}"`
}

module.exports = function beforeRequest (newman, e, log) {
  const { cursor, item, request } = e
  const { method, url } = request
  const folderName = parseFolderName(newman)
  const requestBody = parseRequestBody(request)
  const curl = generateCurlUrl(request)

  return Object.assign({}, log, {
    folderName,
    caseName: item.name,
    collectionName: newman.summary.collection.name,
    environmentName: newman.summary.environment.name,
    requestMethod: method,
    requestUrl: url,
    iteration: cursor.iteration + 1,
    requestBody,
    curl
  })
}
