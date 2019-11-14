'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const path = require('path');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;

// Application Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set the view engine for server-side templating
app.set('view engine', 'ejs');

//CLIENT
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

// View Engine
app.use('/public', express.static('public'));
app.set('views', path.join(__dirname, 'views/pages'));
app.set('view engine', 'ejs');

// API Routes
app.get('/', getBooks) //define route to get all books
app.get('/searches/new', newSearch);
app.post('/searches', createSearch);
app.post('/books', createBook)
app.get('/books/:id', getOneBook);



app.get('*', (request, response) => response.status(404).send('This route does not exist'));

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

// HELPER FUNCTIONS
function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  let httpRegex = /^(http:\/\/)/g

  this.title = info.title ? info.title : 'No title available';
  this.author = info.authors ? info.authors[0] : 'No author available';
  this.isbn = info.industryIdentifiers ? `ISBN_13 ${info.industryIdentifiers[0].identifier}` : 'No ISBN available';
  this.image_url = info.imageLinks ? info.imageLinks.smallThumbnail.replace(httpRegex, 'https://') : placeholderImage;
  this.description = info.description ? info.description : 'No description available';
  this.id = info.industryIdentifiers ? `${info.industryIdentifiers[0].identifier}` : '';
}

function newSearch(request, response) {
  response.render('pages/index');
}

function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

  superagent.get(url)
    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results => response.render('pages/searches/show', { searchResults: results }))
    .catch(err => handleError(err, response));
}

function getBooks(request, response) {
  let SQL = `SELECT * FROM books`;
  client.query(SQL).then(results => {
    const bookCount = results.rowCount;
    const books = results.rows.map(book => new Book(book));
    response.render('pages/index', { savedBooks: books, bookCount: bookCount });
  });
 }

function createBook(request, response){
  let normailze = request.body.bookshelf.toLowerCase()
  let {title, description, author, isbn, image_url} = request.body;
  let SQL = `INSERT INTO books (title, author, description, isbn, image_url, bookshelf) VALUES($1, $2, $3, $4, $5, $6);`;
  let values = [title, description, author, isbn, image_url, normailze];

  return client.query(SQL, values)
  .then( () => {
    SQL = 'SELECT * FROM books WHERE isbn =$1';
    values = [request.body.isbn];
    return client.query(SQL, values)
    .then(result => response.redirect(`/books/${result.rows[0].id}`))
  })
  .catch (err => errorPage(err, response));
}

function getOneBook(){
  let SQL = `SELECT * FROM books WHERE id=$1`;
  let values = [request.params.id];
  client.query(SQL, values)
  .then(result => response.render('pages/books/show' {books: result.row[0], bookshelves: SVGPathSegLinetoVerticalAbs.rows}))
  .catch
}

function getBookShelves()

function handleError(error, response) {
  response.render('pages/error', { error: error });
}































// 'use strict';

// // Application Dependencies
// const express = require('express');
// const superagent = require('superagent');
// const pg = require('pg');
// require('dotenv').config();
// const app = express();
// const PORT = process.env.PORT || 5000;

// // Application Middleware
// app.use(express.urlencoded({extended:true}));
// app.use(express.static('public'));

// //CLIENT
// const client = new pg.Client(process.env.DATABASE_URL);
// client.connect();
// client.on('error', err => console.error(err));

// // Set the view engine for server-side templating
// app.set('view engine', 'ejs');

// // API Routes
// // Renders the search form
// app.get('/', newSearch);

// // Creates a new search to the Google Books API
// app.post('/searches', createSearch);

// // Catch-all
// app.get('*', (request, response) => response.status(404).send('This route does not exist'));

// app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

// //API ROUTES
// app.get('/', getBooks); 
// // app.get('/searches/new', newSearch);
// // app.post('/searches', createSearch);
// app.post('/books', createBook)
// // app.get('/books/:id', getOneBook);

// // BOOK CONSTRUCTOR FUNCTION
// function Book(info) {
//   const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
//   let httpRegex = /^(http:\/\/)/g
//   this.title = info.title ? info.title : 'No title available';
//   this.author = info.authors ? info.authors[0] : 'No author available';
//   this.isbn = info.industryIdentifiers ? `ISBN_13 ${info.industryIdentifiers[0].identifier}` : 'No ISBN available';
//   this.image_url = info.imageLinks ? info.imageLinks.smallThumbnail.replace(httpRegex, 'https://') : placeholderImage;
//   this.description = info.description ? info.description : 'No description available';
//   this.id = info.industryIdentifiers ? `${info.industryIdentifiers[0].identifier}` : '';
// };


// // Note that .ejs file extension is not required
// function newSearch(request, response) {
//   response.render('pages/index');
// };


// // Console.log request.body and request.body.search
// function createSearch(request, response) {
//   let url = 'https://www.googleapis.com/books/v1/volumes?q=';

//   if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
//   if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

//   superagent.get(url)
//     .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
//     .then(results => response.render('pages/searches/show', {searchResults: results}))
//     .catch (err => console.error(err));
//     // .then(results => console.log(results));
// };

// function getBooks(request, response){
//   let SQL = `SELECT * FROM books`;
//   // let values = [request.query.id];
//   return client.query(SQL)
//     .then(result => {
//       response.render('pages/index', {DBresult: result.rows})
//       .catch (err => errorPage(err, response));
//     });  
//  };

// function createBook(request, response){
//   let {title, description, author, isbn, image_url} = request.body;
//   let SQL = `INSERT INTO books (title, author, description, isbn, image_url,) VALUES($1, $2, $3, $4,);`;
//   let values = [title, description, author, isbn, image_url];
//   return client.query(SQL, values)
//   .then(response.redirect('/'))
//   .catch (err => errorPage(err, response));
// };
   
//     // function getOneBook(request, response){
//     //   let 
//     //   //use the id passed in from the front-end (ejs form) 
    
//     // }
  

// function handleError(error, response) {
//   response.render('pages/error', {error: error})
// }

