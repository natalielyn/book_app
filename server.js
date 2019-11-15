'use strict';

// APPLICATION DEPENDENCIES --------------------
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const path = require('path');
require('dotenv').config();
const app = express();
const methodOverride = require('method-override');
const PORT = process.env.PORT || 3000;

// MIDDLEWARE -----------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


//CLIENT -----------------------------------------
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

// VIEW ENGINE -----------------------------------
app.use('/public', express.static('public'));
app.set('views', path.join(__dirname, 'views/pages'));
app.set('view engine', 'ejs');

//METHOD OVERRIDE --------------------------------- 
app.use(methodOverride((request, response) => {
  if(request.body && typeof request.body === 'object' && '_method' in request.body) {
    let method = request.body._method;
    delete request.body._method;
    return method;
  };
}));

// API ROUTES --------------------------------------
app.get('/', getBooks); 
app.get('/searches/new', newSearch);
app.post('/searches', createSearch);
app.post('/books', createBook)
app.get('/books/:id', getOneBook);
app.put('/books/:id', updateBook);
app.delete('/books/:id', deleteBook)


// BOOK CONSTRUCTOR FUNCTION ------------------------
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

// CREATE SEARCHES -----------------------------------
function newSearch(request, response) {
  response.render('searches/new');
};
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

  superagent.get(url)
    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results => response.render('searches/show', { results: results }))
    .catch(err => handleError(err, response));
};


// HELPER FUNCTIONS ---------------------------------
function getBooks(request, response) {
  let SQL = 'SELECT * FROM books;';
   return client.query(SQL)
   .then (results => response.render('index', {results: results.rows}))
    .catch(err => handleError(err, response));
 };

 //CREATES A NEW BOOK
function createBook(request, response){
  let normalize = request.body.bookshelf.toLowerCase();
  let {title, description, author, isbn, image_url} = request.body;
  let SQL = 'INSERT INTO books (title, author, description, isbn, image_url, bookshelf) VALUES($1, $2, $3, $4, $5, $6);';
  let values = [title, author, description, isbn, image_url, normalize];

  return client.query(SQL, values)
  .then( () => {
    SQL = 'SELECT * FROM books WHERE isbn =$1';
    values = [request.body.isbn];
    return client.query(SQL, values)
    .then(result => response.redirect(`/books/${result.rows[0].id}`))
  })
  .catch (err => errorPage(err, response));
}
// SELECTS ONE BOOK
function getOneBook(request,response){
  getBookShelves()
    .then(shelves => {
      let SQL = 'SELECT * FROM books WHERE id=$1';
      let values = [request.params.id];
      return client.query(SQL, values)
        .then(result => response.render('books/show', {result: result.rows[0], bookshelves: shelves.rows}))
    })
    .catch(handleError);
}

function getBookShelves() {
  let SQL = 'SELECT DISTINCT bookshelf FROM books ORDER BY bookshelf';
  return client.query(SQL)
};


// UPDATE AND DELETE BOOKS ------------------------------------
function updateBook(request, response) {
  let {title, author, isbn, image_url, description, bookshelf} = request.body;
  let SQL = 'UPDATE books SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5, bookshelf=$6, WHERE id=$7';
  let values = [title, author, isbn, image_url, description, bookshelf, request.params.id];
  client.query(SQL, values)
    .then(response.redirect(`/books/${request.params.id}`))
    .catch(handleError);
}

function deleteBook(request, respone) {
  let SQL = 'DELETE FROM books WHERE id=$1';
  let values = [request.params.id];

  return client.query(SQL, values)
  .then(response.redirect('/'))
  .catch(handleError);
}


//OTHER STUFF -----------------------------------

app.get('*', (request, response) => response.status(404).send('This route does not exist'));
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

function handleError(error, response) {
  response.render('pages/error', { error: error });
}
