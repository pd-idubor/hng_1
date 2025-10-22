# String Analyzer Service
A RESTful API service that analyzes string inputs, computes their properties, and stores them. The service allows for creation, retrieval, deletion, and advanced filtering of string data, including a natural language query endpoint.

### Features
* Analyzes and stores strings with the following computed properties:
    * length: Number of characters
    * is_palindrome: Boolean (case-insensitive)
    * unique_characters: Count of distinct characters
    * word_count: Number of words separated by whitespace
    * sha256_hash: SHA-256 hash for unique identification
    * character_frequency_map: A JSON object mapping each character to its count

* Full CRUD (Create, Retrieve, Delete) operations for string entries.

* Advanced filtering endpoint to query strings by their properties.

* Natural language processing (NLP) endpoint to interpret and filter based on human-like queries.

* Data Persistence: Data is stored in-memory and will be reset every time the application restarts.

### Technology Stack
* Backend: Node.js / Express.js

* Database: In-Memory Storage (via a JavaScript object/Map). No external database is required.

### Setup
Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

#### Prerequisites
* Node.js (v18 or newer recommended)
* npm
* git

#### Installation
1. Clone the repository
`git clone https://github.com/your-username/your-repo-name.git`
`cd your-repo-name`
2. Install dependencies
`npm install`

#### Running Locally
To start the development server
`node index.js`

The API will be available at http://localhost:3000

#### API Documentation
##### 1. Create / Analyze String
Analyzes a new string, computes its properties, and stores it in memory. The sha256_hash is used as the primary ID. If a string with the same value (and thus same hash) already exists, it returns a conflict error.
* Endpoint: POST /strings
* Content-Type: application/json
###### Request Body:    
`{
  "value": "A new string to analyze"
}`
###### Success Response (201 Created):
`{
  "id": "sha256_hash_value",
  "value": "A new string to analyze",
  "properties": {
    "length": 23,
    "is_palindrome": false,
    "unique_characters": 13,
    "word_count": 5,
    "sha256_hash": "sha256_hash_value",
    "character_frequency_map": {
      "a": 3,
      "n": 2,
      "e": 2,
      "w": 1,
      "s": 1,
      "t": 2,
      "r": 1,
      "i": 1,
      "g": 1,
      "o": 1,
      "l": 1,
      "y": 1,
      "z": 1
    }
  },
  "created_at": "2025-10-22T10:00:00Z"
}`

###### Error Responses:
* 409 Conflict: String already exists in the system.
* 400 Bad Request: Invalid request body or missing "value" field.
* 422 Unprocessable Entity: Invalid data type for "value" (must be a string).

##### 2. Get Specific String
Retrieves the properties of a single, specific string by its value
* Endpoint: GET /strings/{string_value}
    * Example: GET /strings/hello%20world
    ###### Success Response (200 OK):JSON{
  `"id": "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
  "value": "hello world",
  "properties": {
    "length": 11,
    "is_palindrome": false,
    "unique_characters": 7,
    "word_count": 2,
    "sha256_hash": "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    "character_frequency_map": {
      "h": 1,
      "e": 1,
      "l": 3,
      "o": 2,
      "w": 1,
      "r": 1,
      "d": 1
    }
  },
  "created_at": "2025-10-21T12:00:00Z"
}`
###### Error Responses:
* 404 Not Found: String does not exist in the system.

##### 3. Get All Strings with Filtering
Retrieves a list of all analyzed strings, with optional filtering based on their computed properties.
* Endpoint: GET /strings
###### Query Parameters:
| Parameter | Type | Description |
|---|---|---|
| is_palindrome | boolean | Filter by palindrome status (e.g., true or false). |
| min_length | integer | Filter for strings with a length $\geq$ this value. |
| max_length | integer | Filter for strings with a length $\leq$ this value. |
| word_count | integer | Filter for strings with this exact word count. |
| contains_character | string | Filter for strings that contain this (single) character. |

###### Example Request: `GET /strings?is_palindrome=true&min_length=3`
###### Success Response (200 OK):
`{
  "data": [
    {
      "id": "hash_for_madam",
      "value": "madam",
      "properties": { /* ... */ },
      "created_at": "2025-10-22T08:00:00Z"
    },
    {
      "id": "hash_for_racecar",
      "value": "racecar",
      "properties": { /* ... */ },
      "created_at": "2025-10-22T09:00:00Z"
    }
  ],
  "count": 2,
  "filters_applied": {
    "is_palindrome": true,
    "min_length": 3
  }
}`
###### Error Responses:
* 400 Bad Request: Invalid query parameter values or types (e.g., min_length=abc).

##### 4. Natural Language Filtering
Retrieves a list of strings by parsing a natural language query.
* Endpoint: GET /strings/filter-by-natural-language
###### Example Request:GET /strings/filter-by-natural-language?query=all%20single%20word%20palindromic%20strings
###### Success Response (200 OK):
`JSON{
  "data": [
    {
      "id": "hash_for_madam",
      "value": "madam",
      "properties": { /* ... */ },
      "created_at": "2025-10-22T08:00:00Z"
    },
    {
      "id": "hash_for_level",
      "value": "level",
      "properties": { /* ... */ },
      "created_at": "2025-10-22T08:15:00Z"
    }
  ],
  "count": 2,
  "interpreted_query": {
    "original": "all single word palindromic strings",
    "parsed_filters": {
      "word_count": 1,
      "is_palindrome": true
    }
  }
}`
###### Supported Query Examples:
* "all single word palindromic strings" $\rightarrow$ word_count=1, is_palindrome=true
* "strings longer than 10 characters" $\rightarrow$ min_length=11
* "palindromic strings that contain the first vowel" $\rightarrow$ is_palindrome=true, contains_character=a
* "strings containing the letter z" $\rightarrow$ contains_character=z

###### Error Responses:
* 400 Bad Request: Unable to parse the natural language query
* 422 Unprocessable Entity: Query parsed but resulted in conflicting or invalid filters.

##### 5. Delete String
Deletes a string entry from memory by its value.
* Endpoint: DELETE /strings/{string_value}
    * Example: DELETE /strings/hello%20world

###### Success Response (204 No Content):
* (Empty response body)
###### Error Responses:
* 404 Not Found: String does not exist in the system.