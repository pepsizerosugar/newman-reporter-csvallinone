# CSV ALL-in-one newman Reporter
<img src="https://blog.kakaocdn.net/dn/79CWs/btqFoP5voGA/joxJDVcORakigFAOhrLwCK/img.png">

* CSV Result File generator module for newman.
* 하나의 CSV 파일에 모든 정보를 담은 newman Reporter입니다.
* !!---This module is based on REST API Automation Test---!!
* !!---This module has a dependency on 'newman' module---!!
<br><br>

## 1. Getting Started
### 1-1. Installation
```
1. This module is not support npm install now.
2. Get this repo and move folder to ./node_module/newman-reporter-csvallinone
```
### 1-2. How to use
```
1. You can use this module like any other newman reporter.
2. Open cmd or bash
3. type newman cli script and add line down below.
4. '-r csvallinone'
5. ex) newman run collection.com -e env.com -r csvallinone
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
| no | Category   | Desc | example
|-|-----------------|-----------------------|-|
|1| collectionName  | Running Collection name | Market_Billing_API |
|2| caseName   | Running TestCase name | API_googleplay_001 |
|3| requestMethod  | Request method of TestCase | PUT |
|4| requestHeader  | Request header of TestCase | {"key":"marketKey","value":"sf92mtkfnalsk28jsdw"}
|5| requestUrl  | Request URL of TestCase | market.com/v1/subscribe
|6| requestBody  | Request Body of TestCase | {"UDID":"ASFJ082LFN29F8SDFMW0FKDF"}
|7| responseTime  | Request Time of TestCase(millsec) | 12
|8| responseStatus  | Response Status of excuted TestCase | OK
|9| responseCode  | Response Status of excuted TestCase | 200
|10| responseBody  | Response body of excuted TestCase | {"errorCode":0, "subStatus":1}
|11| iteration  | Iteration of TestCase | 1
|12| executedTest  | Pass Assertion that you set at test script | subStatus must be '1'
|13| failedTest  | Fail Assertion that you set at test script | errorCode must be '1'
|14| skippedTest  | Skiped Assertion that you set at test script | errorMessage must be 'Ok'
|15| assertionMessage  | Assertion message for fail TestCase | Expect errorCode '1' but get '0'
|16| curl  | cURL of each TestCase (can immediately run at terminal  | curl --location --request PUT "market.com/v1/subscribe"...
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
]
```
### 2-3. Extra Info
* Each Assertion is separated with '||'.
* cURL is made by combining each column.
