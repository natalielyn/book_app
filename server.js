'use strict';

// APPLICATION DEPENDENCIES --------------------------
const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');
const methodOverride = require('method-override');
const PORT = process.env.PORT || 3000;
const app = express();
require('dotenv').config();
app.use(cors());

//CONFIGURE DATABASE ----------------------------------
const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => console.error(err));


// MIDDLEWARE -----------------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// METHOD OVERRIDE ------------------------------------- 
app.use(methodOverride((request, response) => {
  if (request.body && typeof request.body === 'object' && '_method' in request.body) {
    let method = request.body._method;
    delete request.body._method;
    return method;
  }
}));

// ENGINE VIEW ------------------------------------------
app.set('view engine', 'ejs');

// API ROUTES --------------------------------------------
app.get('/', getBooks)
app.get('/searches/new', searchForm);
app.post('/searches', searchResults);
app.post('/books', saveBook)
app.get('/books/:id', getDetails);
app.put('/books/:id', updateBook);
app.delete('/books/:id', deleteBook);


app.get('*', (request, response) => response.status(404).send('This route does not exist'));

// HELPER FUNCTIONS -------------------------------------
function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  let httpRegex = /^(http:\/\/)/g

  this.title = info.title ? info.title : 'No title available';
  this.author = info.authors ? info.authors[0] : 'No author available';
  this.isbn = info.industryIdentifiers ? `ISBN_13 ${info.industryIdentifiers[0].identifier}` : 'No ISBN available';
  this.image_url = info.imageLinks ? info.imageLinks.thumbnail.replace(httpRegex, 'https://') : placeholderImage;
  this.description = info.description ? info.description : 'No description available';
  this.id = info.industryIdentifiers ? `${info.industryIdentifiers[0].identifier}` : '';
}

// GETS BOOKS IN THE DATABASE ------------------------------
function getBooks(request, response) {
  let SQL = 'SELECT * FROM books;';
  return client.query(SQL)
    .then (results => response.render('pages/index', {result: results.rows, count: results.rows.length}))
    .catch(err => handleError(err, response));
};

function searchForm(request, response) {
  response.render('pages/searches/new');
};

function searchResults(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }
  superagent.get(url)
    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results => response.render('pages/searches/show', { searchResults: results }))
    .catch(err => handleError(err, response));
};

function saveBook(request, response) {
  let lcBookshelf = request.body.bookshelf.toLowerCase();
  let {title, author, isbn, image_url, description} = request.body;
  let SQL = 'INSERT INTO books (title, author, isbn, image_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;';
  let values = [title, author, isbn, image_url, description, lcBookshelf];
  client.query(SQL, values)
    .then(result => response.redirect(`/books/${result.rows[0].id}`))
    .catch(handleError);
};

function getDetails(request, response){
  getBookshelves()
    .then( shelves => {
      let SQL = 'SELECT * FROM books WHERE id=$1;';
      let values = [request.params.id];
      client.query(SQL, values)
        .then(result => {
          response.render('pages/books/show', {book: result.rows[0], bookshelves: shelves.rows})
        })
    })
    .catch(handleError);
};

function getBookshelves() {
  let SQL = 'SELECT DISTINCT bookshelf FROM books ORDER BY bookshelf;';
  return client.query(SQL);
};

// UPDATE / DELETE FROM DATABASE FUNCTIONS -----------------
function updateBook(request, response) {
  let {title, author, isbn, image_url, description, bookshelf} = request.body;
  let SQL = 'UPDATE books SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5, bookshelf=$6 WHERE id=$7';
  let values = [title, author, isbn, image_url, description, bookshelf, request.params.id];
  client.query(SQL, values)
    .then(response.redirect(`/books/${request.params.id}`))
    .catch(handleError);
};

function deleteBook(request, response) {
  let SQL = 'DELETE FROM books WHERE id=$1;';
  let values = [request.params.id];
  return client.query(SQL, values)
    .then(response.redirect('/'))
    .catch(handleError);
}

//ERROR HANDLER -----------------------------------------
function handleError(error, response) {
  response.render('pages/error', { error: error });
}

// CONNECTS TO CLIENT -----------------------------------
client.connect()
  .then( ()=> {
    app.listen(PORT, ()=> {
      console.log('server and db are up, listening on port ', PORT);
    });
  });