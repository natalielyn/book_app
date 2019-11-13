'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config();
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

//API ROUTES
app.get('/', getBooks) //define route to get all books
app.get('/searches/new', newSearch);
app.post('/searches', createSearch);
app.post('/books', createBook)
app.get('/books/:id', getOneBook);

// BOOK CONSTRUCTOR FUNCTION
function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  let httpRegex = /^(http:\/\/)/g
  this.title = info.title ? info.title : 'No title available';
  this.author = info.authors ? info.authors[0] : 'No author available';
  this.isbn = info.industryIdentifiers ? `ISBN_13 ${info.industryIdentifiers[0].identifier}` : 'No ISBN available';
  this.image_url = info.imageLinks ? info.imageLinks.smallThumbnail.replace(httpRegex, 'https://') : placeholderImage;
  this.description = info.description ? info.description : 'No description available';
  this.id = info.industryIdentifiers ? `${info.industryIdentifiers[0].identifier}` : '';
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


// Console.log request.body and request.body.search
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';


  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

  superagent.get(url)
    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results => response.render('pages/searches/show', {searchResults: results}))
    .catch (err => console.error(err));
    // .then(results => console.log(results));

    function getBooks() {
      let SQL = `SELECT * FROM books WHERE id=$1;`;
      let values = [request.query.id];

      return clientInformation.query(SQL, values)
      .then(result => {
        response.render('pages/searches/show', {result: result.row[0]}
        )
      })
      .catch (err => errorPage(err, response));
    };
    
    function createBook(){
      //create a SQL statement to insert book
      //return id of book back to calling function
    
    }
    
    function getOneBook(){
      //use the id passed in from the front-end (ejs form) 
    
    }

//   // how will we handle errors?
}

function handleError(error, response) {
  response.render('pages/error', {error: error})
}

