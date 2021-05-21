# CSV ALL-in-one newman Reporter
<img src="https://blog.kakaocdn.net/dn/79CWs/btqFoP5voGA/joxJDVcORakigFAOhrLwCK/img.png">

* CSV Result File generator module for newman.
* 하나의 CSV 파일에 모든 정보를 담은 newman Reporter입니다.
* This module is based on REST API Automation Test and has a dependency on 'newman' module.
<br><br>

## 1. Getting Started
### 1-1. Installation
```
1. npm i -g newman-reporter-csvallinone
2. https://www.npmjs.com/package/newman-reporter-csvallinone
```
### 1-2. How to use
```
1. You can use this module like any other newman reporter.
2. Open cmd or bash.
3. Type newman cli and add some line down below.
4. '-r csvallinone'
5. ex) newman run collection -e environment -r csvallinone
6. Default CSV save location ./User/newman
```
### 1-3. Option
* --reporter-csvallinone-export
```
Specify a path where the CSV file will be written to disk.
ex) --reporter-csvallinone-export ./APITest/TestResult/CSV/******.csv
```
<br>

## 2. CSV Output
### 2-1. Columns
| no | Category           | Desc                                                    | example                                                     |
|----|--------------------|---------------------------------------------------------|-------------------------------------------------------------|
| 1  | collectionName     | Running Collection name                                 | Market_Billing_API                                          |
| 2  | caseName           | Running TestCase name                                   | API_googleplay_001                                          |
| 3  | requestMethod      | Request method of TestCase                              | PUT                                                         |
| 4  | requestHeader      | Request header of TestCase                              | {"key":"marketKey","value":"sf92mtkfnalsk28jsdw"}           |
| 5  | requestUrl         | Request URL of TestCase                                 | market.com/v1/subscribe                                     |
| 6  | requestBody        | Request Body of TestCase                                | {"UDID":"ASFJ082LFN29F8SDFMW0FKDF"}                         |
| 7  | responseTime       | Request Time of TestCase(millsec)                       | 12                                                          |
| 8  | responseStatus     | Response Status of excuted TestCase                     | OK                                                          |
| 9  | responseCode       | Response Status of excuted TestCase                     | 200                                                         |
| 10 | responseBody       | Response body of excuted TestCase                       | {"errorCode":0, "subStatus":1}                              |
| 11 | iteration          | Iteration of TestCase                                   | 1                                                           |
| 12 | executedTest       | Pass Assertion that you set at test script              | subStatus must be '1'                                       |
| 13 | failedTest         | Fail Assertion that you set at test script              | errorCode must be '1'                                       |
| 14 | skippedTest        | Skiped Assertion that you set at test script            | errorMessage must be 'Ok'                                   |
| 15 | assertionMessage   | Assertion message for fail TestCase                     | Expected errorCode '1' but got '0'                          |
| 16 | curl               | cURL of each TestCase (can immediately run at terminal  | curl --location --request PUT "market.com/v1/subscribe"...  |
### 2-2. Remove unwanted columns
* You can edit 'columns' variable in 'index.js' for remove unwanted colums
```js
const columns = [
  // collection info
  'collectionName',
  'caseName',

  // request value
  'requestMethod',
  'requestHeader',
  'requestUrl',
  'requestBody',

  // response value
  'responseTime',
  'responseStatus',
  'responseCode',
  'responseBody',

  // test info
  'iteration',
  'executedTest',
  'failedTest',
  'skippedTest',
  'assertionMessage',

  // case curl
  'curl'
  
  // optional column
  // 'casePrerequest'
]
```
### 2-3. Extra Info
* Each Assertion is separated with '||'.
* cURL is made by combining each column.
* If you want get pre-RequestScript(each TestCase not folder), just erase comment at columns array.
* You can check your test detail result for remove comment at some code down below.
```js
  newman.on('beforeDone', (err, e) => {
    if (err) return

    // timings stats
    try{
      var timings = e.summary.run.timings
      var stats = e.summary.run.stats
    } catch(err){console.log("error parsing timings")}

    newman.exports.push({
      name: 'newman-csvallinone-reporter',
      default: (collName + '.csv'),
      path: options.export,
      content: "\uFEFF" + getResults()
    })
    bar.stop();
    console.log('CSV write complete.')
--> // console.log(JSON.stringify(timings) + "\n" + JSON.stringify(stats))
  })
```
* Then, you can see this result at terminal.
```json
{
	"responseAverage":13.364372469635628,
	"responseMin":8,
	"responseMax":65,
	"responseSd":5.6580015633813625,
	"dnsAverage":0,
	"dnsMin":0,
	"dnsMax":0,
	"dnsSd":0,
	"firstByteAverage":0,
	"firstByteMin":0,
	"firstByteMax":0,
	"firstByteSd":0,
	"started":1621570258472,
	"completed":1621570279290
},
{
	"iterations":{
		"total":1,
		"pending":0,
		"failed":0
	},
	"items":{
		"total":164,
		"pending":0,
		"failed":0
	},
	"scripts":{
		"total":951,
		"pending":0,
		"failed":0
	},
	"prerequests":{
		"total":164,
		"pending":0,
		"failed":0
	},
	"requests":{
		"total":247,
		"pending":0,
		"failed":0
	},
	"tests":{
		"total":164,
		"pending":0,
		"failed":0
	},
	"assertions":{
		"total":323,
		"pending":0,
		"failed":10
	},
	"testScripts":{
		"total":481,
		"pending":0,
		"failed":0
	},
	"prerequestScripts":{
		"total":470,
		"pending":0,
		"failed":0
	}
}
```
