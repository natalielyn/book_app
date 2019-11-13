'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');

// Environment Variable
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Application Middleware
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));

// Set the view engine for server-side templating
app.set('view engine', 'ejs');

// API Routes
// Renders the search form
app.get('/', newSearch);

// Creates a new search to the Google Books API
app.post('/searches', createSearch);

// Catch-all
app.get('*', (request, response) => response.status(404).send('This route does not exist'));

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

// HELPER FUNCTIONS
// Only show part of this to get students started
function Book(info) {
  const placeHolderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  let httpRegex = /^(http:\/\/)/g;
  this.title = info.title || 'No title available';
  this.author = info.authors? info.authors[0]: 'No author available';
  this.description = info.description? info.description: 'No description';
  this.image_url = info.imageLinks? info.imageLinks.smallThumbnail.replace(httpRegex, 'https://'):
  // this.image_url = info.imageLinks? urlCheck(info.imageLinks.smallthumbnail) : 'https://i.imgur.com/J5LVHEL.jpg';
  this.isbn = info.industryIdentifiers? info.industryIdentifiers[0].identifier: 'No ISBN Number';
  this.id = info.industryIdentifiers;
};

// Mixed Content Warning Filter
// const urlCheck = (data) => {
//   if (data.indexOf('https') === -1) {
//     let newData = data.replace('http', 'https');
//     return newData;
//   } else {
//     return data;
//   };
// };

// Note that .ejs file extension is not required
function newSearch(request, response) {
  response.render('pages/index');
};

// No API key required
// Console.log request.body and request.body.search
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  // console.log(request.body);
  // console.log(request.body.search);

  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

  superagent.get(url)
    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results => response.render('pages/searches/show', {searchResults: results}))
    .catch (err => console.error(err));
    // .then(results => console.log(results));

  // how will we handle errors?
}

function handleError(error, response) {
  response.render('pages/error', {error: error})
}

