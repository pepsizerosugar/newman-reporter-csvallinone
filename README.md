# CSV ALL-in-one newman Reporter

<img src="./resources/logo.png" alt="">

![GitHub package.json version](https://img.shields.io/github/package-json/v/pepsizerosugar/newman-reporter-csvallinone?color=g)
![Version](https://img.shields.io/badge/Update-2025.09.01-blue)
[![CodeFactor](https://www.codefactor.io/repository/github/pepsizerosugar/newman-reporter-csvallinone/badge)](https://www.codefactor.io/repository/github/pepsizerosugar/newman-reporter-csvallinone)

* CSV Result File generator module for newman.
* This module is based on REST API Automation Test. (JSON request, respone)
* If you have a problem with using separted version or want more information of running test, please leave a issue at
  github or email.
  <br><br>

## 0. Change Log

### version 0.7.0 (2025.09.01)

```
1. Added progress tracking with ETA for test execution
2. Improved handling of different request types (urlencoded, formdata, raw, file, graphql)
3. Enhanced error handling and logging
4. Added TypeScript type definitions for better code maintainability
5. Improved cURL command generation
6. Better handling of request parameters and headers
7. Added support for nested folder structures
```

### version 0.6.0 (2024.02.15)

```
1. Fixed parsing empty urlencoded body
2. Improved error handling for malformed requests
```

<br>

## 1. Getting Started

### 1-1. Installation

```bash
# Install globally
npm install -g newman-reporter-csvallinone

# Or install as devDependency in your project
npm install --save-dev newman-reporter-csvallinone
```

### 1-2. Features

- Real-time progress tracking with ETA
- Support for all request types (JSON, form-data, URL-encoded, raw, file uploads, GraphQL)
- Detailed test execution reports
- cURL command generation for easy request reproduction
- Support for nested folder structures
- Configurable output columns
- Lightweight and fast

### 1-3. How to use

Basic usage:
```bash
newman run collection.json -e environment.json -r csvallinone
```

With options:
```bash
newman run collection.json \
  -e environment.json \
  -r csvallinone \
  --reporter-csvallinone-export ./results/report.csv \
  --reporter-csvallinone-progress true \
  --reporter-csvallinone-folderPath full
```

### 1-4. Options

- `--reporter-csvallinone-export <path>`: Specify custom output path for CSV file
- `--reporter-csvallinone-progress <true|false>`: Enable/disable progress bar (default: true)
- `--reporter-csvallinone-folderPath <last|full>`: Control folder path display (default: 'last')
  - `last`: Show only the immediate parent folder
  - `full`: Show full folder path

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

| no | Category         | Desc                                                   | example                                                         |
|----|------------------|--------------------------------------------------------|-----------------------------------------------------------------|
| 1  | collectionName   | Running Collection name                                | Market_Billing_API                                              |
| 2  | environmentName  | Running Environment name                               | Billing_googleplay_test                                         |
| 3  | folderName       | Running Folder name (parsing 2 depth untill now)       | API_googleplay_payment                                          |
| 4  | caseName         | Running TestCase name                                  | API_googleplay_payment_001                                      |
| 5  | executedTime     | Running TestCase executed time                         | 1627552163138                                                   |
| 6  | stopTime         | Running TestCase stop time                             | 1627552163298                                                   |
| 7  | requestMethod    | Request method of TestCase                             | PUT                                                             |
| 8  | requestHeader    | Request header of TestCase                             | {"key":"marketKey","value":"sf92mtkfnalsk28jsdw"}               |
| 9  | requestUrl       | Request URL of TestCase                                | market.com/v1/subscribe                                         |
| 10 | requestBody      | Request Body of TestCase                               | {"UDID":"ASFJ082LFN29F8SDFMW0FKDF"}                             |
| 11 | responseTime     | Request Time of TestCase(millsec)                      | 12                                                              |
| 12 | responseStatus   | Response Status of excuted TestCase                    | OK                                                              |
| 13 | responseCode     | Response Status of excuted TestCase                    | 200                                                             |
| 14 | responseBody     | Response body of excuted TestCase                      | {"errorCode":0, "subStatus":1}                                  |
| 15 | iteration        | Iteration of TestCase                                  | 1                                                               |
| 16 | executedTest     | Pass Assertion that you set at test script             | subStatus must be '1'                                           |
| 17 | failedTest       | Fail Assertion that you set at test script             | errorCode must be '1'                                           |
| 18 | skippedTest      | Skiped Assertion that you set at test script           | errorMessage must be 'Ok'                                       |
| 19 | assertionMessage | Assertion message for fail TestCase                    | Expected errorCode '1' but got '0'                              |
| 20 | curl             | cURL of each TestCase (can immediately run at terminal | curl --location --request PUT --data "market.com/v1/subs...     |
| 21 | requestParams    | Request params. (parsing when request params exist)    | [{"key1":"key1","value":"123"},{"key2":"key2","value":"321"}... |
| 22 | requestAuth      | Request Auth. (parsing when request auth exist)        | [{"type":"string","value":"header","key":"addTokenTo"}...       |

* requestParams & requestAuth is automatically add to columns when request have that items.
* Default output file name is --> $Collection-Name($Environenment-Name)-$Date.csv
* ex) Market_Billing_API(Billing_googleplay_test)-2021-06-12-14-55-42-723-0.csv

### 2-2. Remove unwanted columns

* You can edit 'columns' variable in 'index.js' for remove unwanted colums.

```javascript
let columns = [
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
  'curl'
]
```

### 2-3. Extra Info

* Each Assertion is separated with '||'.
* cURL is made by combining each column.
