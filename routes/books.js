const express = require("express");
const Book = require("../models/book");
const ExpressError = require("../expressError");
const jsonschema = require("jsonschema");
const bookSchema = require("../schemas/bookSchema.json")

const router = new express.Router();


/** GET / => {books: [book, ...]}  */

router.get("/", async function (req, res, next) {
  try {
    const books = await Book.findAll(req.query);
    return res.json({ books });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  => {book: book} */

router.get("/:id", async function (req, res, next) {
  try {
    const book = await Book.findOne(req.params.id);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** POST /   bookData => {book: newBook}  */

// router.post("/", async function (req, res, next) {
//   try {
//     const book = await Book.create(req.body);
//     return res.status(201).json({ book });
//   } catch (err) {
//     return next(err);
//   }
// });

router.post("/", async function(req, res, next) {
  const result = jsonschema.validate(req.body, bookSchema);
  if(!result.valid){
    const errorList = result.errors.map(e => e.stack);
    const err = new ExpressError(errorList, 400);
    return next(err);
  }
  const book = await Book.create(req.body);
  return res.status(201).json({ book });
});

/** PUT /[isbn]   bookData => {book: updatedBook}  */

// router.put("/:isbn", async function (req, res, next) {
//   try {
//     const book = await Book.update(req.params.isbn, req.body);
//     return res.json({ book });
//   } catch (err) {
//     return next(err);
//   }
// });

router.put("/:isbn", async function (req, res, next) {
  try {
    // if i remove req.params.isbn then the edit test fails and the fails with invalid data passes 
    const result = jsonschema.validate(req.params.isbn, req.body, bookSchema);
    if(!result.valid){
      const errorList = result.errors.map(e => e.stack);
      const err = new ExpressError(errorList, 400);
    return next(err);
    }
    const book = await Book.update(req.params.isbn, req.body);
    return res.json({ book })  
  } catch(e) {
      return next(err);
  }
})

/** DELETE /[isbn]   => {message: "Book deleted"} */

router.delete("/:isbn", async function (req, res, next) {
  try {
    await Book.remove(req.params.isbn);
    return res.json({ message: "Book deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
