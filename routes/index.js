var express = require('express');
var router = express.Router();
var Book = require('../models').Book;
const { Op } = require('sequelize'); //SQL operators

/* Async handler from Treehouse. */
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
      // Forward error to the global error handler
      next(error);
    }
  }
}

/* GET home page. */
router.get('/', asyncHandler(async (req, res, next) => {
  // res.render('index', { title: 'Express' });
  res.redirect('/books');
  let books;
  if (books) {
    books = await Book.findAll();
    res.json(books);
  } else {
    let error = new Error();
    error.status = 404;
    error.message = 'Sorry! We couldn`t find the page you were looking for';
    res.render('page-not-found', { error });
  }
}));

/* Shows the create new book form */
router.get('/books/new', asyncHandler(async (req, res, next) => {
  res.render('new-book');
}));

/* Posts a new book to the database */
router.post('/books/new', asyncHandler(async (req, res, next) => {
  let book;
  try {
    book = await Book.create(req.body);
    res.redirect("/books/" + book.id);
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      book = await Book.build(req.body);
      res.render("new-book", {book: book.dataValues, errors: error.errors })
    } else {
      throw error;
    }
  }
}));

/* Shows book detail form */
router.get('/books/:id', asyncHandler(async (req, res, next) => {
  const book = await Book.findByPk(req.params.id);
  if (book) {
    res.render("update-book", { book });
  } else {
    let error = new Error();
    error.status = 404;
    error.message = 'Sorry! We couldn`t find the page you were looking for';
    res.render('page-not-found', { error });
  }
}));

/* Updates book info in the database */
router.post('/books/:id', asyncHandler(async (req, res, next) => {
  let book;
  try {
    book = await Book.findByPk(req.params.id);
    if (book) {
      await book.update(req.body);
      res.redirect("/books/" + book.id);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      book = await Book.build(req.body);
      book.id = req.params.id;
      res.render("update-book", { book, errors: error.errors })
    } else {
      throw error;
    }
  }
}));

/* Deletes a book. Careful, this can’t be undone. It can be helpful */
router.post('/books/:id/delete', asyncHandler(async (req, res, next) => {
  const book = await Book.findByPk(req.params.id);
  if (book) {
    await book.destroy();
    res.redirect("/books");
  } else {
    let error = new Error();
    error.status = 500;
    error.message = 'Could not delete the selected book.';
    throw error;
  }
}));

/* Shows the full list of books */
router.get('/books/:offset?/:page?', asyncHandler(async (req, res, next) => {
  const offset = (req.params.offset) ? req.params.offset : 0;
  const books = await Book.findAndCountAll({
    limit: 5,
    offset: offset
  });
  if (books) {
    books.pages = Math.ceil(books.count / 5);
    books.activePage = (req.params.page) ? req.params.page : 1;
    res.render('books', { books });
  } else {
    let error = new Error();
    error.status = 404;
    error.message = 'Sorry! We couldn`t find the page you were looking for';
    res.render('page-not-found', { error });
  }
}));

/* Search for a book. */
router.post('/books', asyncHandler(async (req, res, next) => {
  const books = await Book.findAndCountAll({
    where: {
      [Op.or]: [
        {
          title: {
            [Op.like]: '%' + req.body.search + '%'
          }
        },
        {
          author: {
            [Op.like]: '%' + req.body.search + '%'
          }
        },
        {
          genre: {
            [Op.like]: '%' + req.body.search + '%'
          }
        },
        {
          year: {
            [Op.like]: '%' + req.body.search + '%'
          }
        }
      ]
    }
  });
  if (books) {
    res.render('books', { books });
  } else {
    let error = new Error();
    error.status = 404;
    error.message = 'Sorry! We couldn`t find the page you were looking for';
    res.render('page-not-found', { error });
  }
}));

module.exports = router;
