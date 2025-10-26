const express = require('express');
const crypto = require('crypto');


const app = express();
const PORT = 3000;
const str_data = {};

app.use(express.json());

// Create/Analyze String
app.post('/strings', (req, res) => {

  const str = req.body.value; 
  if(str === undefined){
    return res.status(400).json({ error: 'Invalid request body or missing "value" field' });
  }
  if (typeof str !== 'string') {
    return res.status(422).json({ error: 'Invalid data type for "value" (must be a string)' });
  }
  if (str in str_data) {
    return res.status(409).json({ error: 'String already exists in the system' });
  }
  
  
  const sha256_hash = crypto.createHash('sha256').update(str).digest('hex');
  function isPalindrome(str) {
    const cleanedStr = str.replace(/[\W_]/g, '').toLowerCase();
    const reversedStr = cleanedStr.split('').reverse().join('');
    return cleanedStr === reversedStr;
  }
  function uniqueChars(str) {
    const chars = new Set(str);
    return chars.size;
  }
  function characterFrequencyMap(str) {
    const freqMap = {};
    for (const char of str) {
      freqMap[char] = (freqMap[char] || 0) + 1;
    }
    return freqMap;
  } 
  const wordCount = str.trim() === '' ? 0 : str.trim().split(/\s+/).length;

  const response = {
    'id': sha256_hash,
    'value': str,
    'properties': {
      'length': str.length,
      'is_palindrome': isPalindrome(str),
      'unique_characters': uniqueChars(str),
      'word_count': wordCount,
      'sha256_hash': sha256_hash,
      'character_frequency_map': characterFrequencyMap(str),
    },
    'created_at': new Date().toISOString(),
  }
  str_data[str] = response;
  res.status(201).json(response);
});


// Natural Language Filering
app.get('/strings/filter-by-natural-language', (req, res) => {
  const { query } = req.query;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Unable to parse natural language query' });
  }
  if (Object.keys(str_data).length === 0) {
    return res.status(404).json({ error: 'No strings available in the system' });
  }
  
  if (Object.keys(req.query).length > 1) {
    return res.status(400).json({ error: 'Query parsed but resulted in conflicting filters' });
  }
  
  let allStrings = Object.values(str_data);

  function parseQuery(query) {

    const filters = {};
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('palindromic')) {
    const isPalindrome = lowerQuery.includes('not') ? false : true;
    filters.is_palindrome = isPalindrome;
    }
    
    if (lowerQuery.includes("single word")) {
      filters.word_count = 1;
    }

    const lengthMatch = lowerQuery.match(/longer than (\d+) characters/);
    if (lengthMatch && lengthMatch[1]) {
      filters.min_length = parseInt(lengthMatch[1]) + 1;
    }
    const lengthMatch2 = lowerQuery.match(/shorter than (\d+) characters/);
    if (lengthMatch2 && lengthMatch2[1]) {
      filters.max_length = parseInt(lengthMatch2[1]) - 1;
    }
    

    // const containsCharMatch = lowerQuery.match(/containing the letter (\w)/);
    // if (containsCharMatch) {
    //   filters.contains_character = containsCharMatch[1];
    // }

    // const wordCountMatch = lowerQuery.match(/word count of (\d+)/);
    // if (wordCountMatch) {
    //   filters.word_count = parseInt(wordCountMatch[1], 10);
    //   match = lowerQuery.match(/containing (?:the letter |')([a-z0-9])(?:'|)/);
    // }

    const charMatch = lowerQuery.match(/containing (?:the letter |')([a-z0-9])(?:'|)/);
    if (charMatch && charMatch[1]) {
        filters.contains_character = charMatch[1];
    }

    if (lowerQuery.includes("first vowel")) {
        filters.contains_character = "a";
    }
    return filters;
  }

  function applyFilters(allStrings, filters) {
    let filteredList = [...allStrings];

    if (filters.is_palindrome) {
      filteredList = filteredList.filter(item => item.properties.is_palindrome === filters.is_palindrome);
    }
    if (filters.min_length) {
      filteredList = filteredList.filter(item => item.properties.length >= filters.min_length);
    }
    if (filters.max_length) {
      filteredList = filteredList.filter(item => item.properties.length <= filters.max_length);
    }
    if (filters.word_count) {
      filteredList = filteredList.filter(item => item.properties.word_count === filters.word_count);
    }
    if (filters.contains_character) {
      const char = filters.contains_charactertoLowerCase();
      filteredList = filteredList.filter(item => item.value.toLowerCase.includes(char));
    }

    return filteredList;
  }

  const filters = parseQuery(query);
  const results = applyFilters(allStrings, filters);

  res.status(200).json({
    'data': [...results],
    'count': results.length,
    'interpreted_query': {
      'original': query,
      'parsed_filters': parseQuery(query),
    }
  });
});


// Get Specific String
app.get('/strings/:value', (req, res) => {
  const str = req.params.value;
  if (typeof str !== 'string') {
    return res.status(422).json({ error: 'Invalid data type for "value" (must be a string)' });
  }
  if (!str_data[str]) {
    return res.status(404).json({ error: 'String does not exist in the system' });
  }
  const response = {
    'id': str_data[str].id,
    'value': str,
    'properties': str_data[str],
    'created_at': str_data[str].created_at,
  }
  res.status(200).json(response);
  });


  // Get All Strings with Filtering
app.get('/strings', (req, res) => {
  if (Object.keys(str_data).length === 0) {
    return res.status(404).json({ error: 'No strings available in the system' });
  }
  
  if (!['is_palindrome', 'min_length', 'max_length', 'word_count', 'contains_characters'].some(param => param in req.query)) {
    return res.status(400).json({ error: 'Invalid query parameter values or types' });
  }
  let results = Object.values(str_data);

  // Filtering based on query parameters
  const { is_palindrome,  min_length, max_length, word_count, contains_character } = req.query;
  
  if (is_palindrome) {
    const isPalindrome = is_palindrome.toLowerCase() === 'true';
    results = results.filter(item => item.properties.is_palindrome === isPalindrome);
  }
  if (min_length) {
    const minLen = parseInt(min_length, 10);
    results = results.filter(item => item.properties.length >= minLen);
  }
  if (max_length) {
    const maxLen = parseInt(max_length, 10);
    results = results.filter(item => item.properties.length <= maxLen);
  }
  if (word_count) {
    const wCount = parseInt(word_count, 10);
    results = results.filter(item => item.properties.word_count === wCount);
  }
  
  if(contains_character) {
    const char = contains_character.toLowerCase();
    results = results.filter(item => item.value.toLowerCase().includes(char));
  }

  res.status(200).json({
    'data': [...results],
    'count': results.length,
    'filters_applied': req.query,
  });
});


// Delete String
app.delete('/strings/:value', (req, res) => {
  const str = req.params.value;
  if (typeof str !== 'string') {
    return res.status(422).json({ error: 'Invalid data type for "value" (must be a string)' });
  }
  if (!str_data[str]) {
    return res.status(404).json({ error: 'String does not exist in the system' });
  }
  delete str_data[str];
  res.status(204).send();
});


app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
