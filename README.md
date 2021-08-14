# CSV ALL-in-one newman Reporter
<img src="https://blog.kakaocdn.net/dn/79CWs/btqFoP5voGA/joxJDVcORakigFAOhrLwCK/img.png">

* CSV Result File generator module for newman.
* This module is based on REST API Automation Test.
<br><br>

## 0. Change Log
### version 0.2.2 (2021.08.15)
```
1. Code cleanup
```
<br>

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
3. Type newman cli and add line down below.
4. '-r csvallinone'
	ex) newman run collection -e environment -r csvallinone
5. Default CSV save location. (./$User/newman)
```
### 1-3. Export Option
* --reporter-csvallinone-export
```
Specify a path where the CSV file will be written to disk.
ex) --reporter-csvallinone-export ./APITest/TestResult/CSV/******.csv
ex) newman run collection -e environment -r csvallinone --reporter-csvallinone-export ./APITest/TestResult/CSV/******.csv
```
<br>

## 2. CSV Output
### 2-1. Columns
| no | Category           | Desc                                                    | example                                                     				|
|----|--------------------|---------------------------------------------------------|---------------------------------------------------------------------------|
| 1  | collectionName     | Running Collection name                                 | Market_Billing_API                                          				|
| 2  | environmentName    | Running Environment name                                | Billing_googleplay_test													|
| 3  | folderName	 	  | Running Folder name					    				| API_googleplay_payment													|
| 4  | caseName           | Running TestCase name                                   | API_googleplay_payment_001                                  				|
| 5  | executedTime		  | Running TestCase executed time							| 1627552163138				                                  				|
| 6  | stopTime           | Running TestCase stop time								| 1627552163298				                                  				|
| 7  | requestMethod      | Request method of TestCase                              | PUT                                                         				|
| 8  | requestHeader      | Request header of TestCase                              | {"key":"marketKey","value":"sf92mtkfnalsk28jsdw"}           				|
| 9  | requestUrl         | Request URL of TestCase                                 | market.com/v1/subscribe                                     				|
| 10 | requestBody        | Request Body of TestCase                                | {"UDID":"ASFJ082LFN29F8SDFMW0FKDF"}                        				|
| 11 | responseTime       | Request Time of TestCase(millsec)                       | 12																		|
| 12 | responseStatus     | Response Status of excuted TestCase                     | OK																		|
| 13 | responseCode       | Response Status of excuted TestCase                     | 200                                                  				       	|
| 14 | responseBody       | Response body of excuted TestCase                       | {"errorCode":0, "subStatus":1}                       				       	|
| 15 | iteration          | Iteration of TestCase                                   | 1																			|
| 16 | executedTest       | Pass Assertion that you set at test script              | subStatus must be '1'                               				        |
| 17 | failedTest         | Fail Assertion that you set at test script              | errorCode must be '1'                               				        |
| 18 | skippedTest        | Skiped Assertion that you set at test script            | errorMessage must be 'Ok'													|
| 19 | assertionMessage   | Assertion message for fail TestCase                     | Expected errorCode '1' but got '0'                          				|
| 20 | curl               | cURL of each TestCase (can immediately run at terminal  | curl --location --request PUT --data "market.com/v1/subs... 				|
| 21 | requestParams	  | Request params. (parsing when request params exist)	    | [{"key1":"key1","value":"123"},{"key2":"key2","value":"321"}...			|
| 22 | requestAuth		  | Request Auth. (parsing when request auth exist)	  		| [{"type":"string","value":"header","key":"addTokenTo"}...					|
* requestParams & requestAuth is automatically add to columns when request have that items.
* Default output file name is --> $Collection-Name($Environenment-Name)-$Date.csv
* ex) Market_Billing_API(Billing_googleplay_test)-2021-06-12-14-55-42-723-0.csv
### 2-2. Remove unwanted columns
* You can edit 'columns' variable in 'index.js' for remove unwanted colums.
```js
const columns = [
    // collection info
    'collectionName',
    'environmentName',
    'folderName',
    'caseName',

    // request value
    'executedTime',
    'stopTime',
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
    'curl',

    // optional column
    // 'casePrerequest'
]
```
### 2-3. Extra Info
* Each Assertion is separated with '||'.
* cURL is made by combining each column.
* If you want get pre-Request Script(each TestCase, not folder), just erase comment at columns array. ('casePrerequest')
* You can check your test detail result for remove comment at some code down below.
```js
  newman.on('beforeDone', (err, e) => {
    if (err) return

    // parsing timings && stats
    try {
      var timings = e.summary.run.timings
      var stats = e.summary.run.stats
    } catch (err) { console.log("\nerror parsing timings") }

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
