process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require('../db');

let testBook;
beforeEach(async () => {
    const result = await db.query(
        `INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES ('0691161518', 'http://a.co/eobPtX2', 'Matthew Lane', 'english', 264, 'Princeton University Press', 'Power-Up: Unlocking the Hidden Mathematics in Video Games', 2017)
        RETURNING isbn, amazon_url, author, language, pages, publisher, title, year`);
    testBook = result.rows[0];
})

afterEach(async () => {
    await db.query(`DELETE FROM books`)
})

afterAll(async () => {
    await db.end()
})

describe("GET /books", () => {
    test("get list of books", async () => {
        const res = await request(app).get('/books')
        expect(res.body.books).toEqual([testBook])
    })
})

// describe("GET /books/:id", () => {
//     test("get book by id", async () => {
//         const res = await request(app).get(`/books/${testBook.isbn}`)
//         expect(res.body.books).toEqual(testBook)
//     })
// })

describe("POST /books", () => {
    test("create valid book", async () => {
        const newBook = {
            isbn: "1234567890",
            amazon_url: "http://a.co/eobPtX2",
            author: "New Author",
            language: "english",
            pages: 123,
            publisher: "New Publisher",
            title: "New Title",
            year: 2021
        };
        const res = await request(app).post('/books').send(newBook);
        expect(res.statusCode).toBe(201);
        expect(res.body.book).toEqual(newBook);

        // checks that the books is in the database
        const bookInDb = await db.query(`SELECT * FROM books WHERE isbn = $1`, [newBook.isbn]);
        expect(bookInDb.rows[0]).toEqual(newBook);
    })

    test("fails with invalid data", async () => {
        const invalidBook = {
            isbn: "1234567890",
            amazon_url: "http://a.co/eobPtX2",
            author: "New Author",
            language: "english",
            pages: 123,
            publisher: "New Publisher",
            title: "New Title",
            year: "invalid year"
        };
        const res = await request(app).post('/books').send(invalidBook);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });

});

describe("PUT /books", () => {
    test("edit existing book", async () => {
        const updateBook = {
            amazon_url: "http://a.co/eobPtX2",
            author: "Updated Author",
            language: "english",
            pages: 123,
            publisher: "Updated Publisher",
            title: "Updated Title",
            year: 2020
        };
        const res = await request(app).put(`/books/${testBook.isbn}`).send(updateBook);
        expect(res.statusCode).toBe(200);
        // spreads the isbn into the updateBook object
        expect(res.body.book).toEqual({ isbn: testBook.isbn, ...updateBook });

        // checks book is updated in database
        const bookInDb = await db.query(`SELECT * FROM books WHERE isbn = $1`, [testBook.isbn]);
        expect(bookInDb.rows[0]).toEqual({ isbn: testBook.isbn, ...updateBook });
    })

    // test("fails with invalid book data", async () => {
    //     const invalidBook = {
    //         amazon_url: 123,
    //         author: "Updated Author",
    //         language: "english",
    //         pages: 123,
    //         publisher: "Updated Publisher",
    //         title: "Updated Title",
    //         year: 2020
    //     };
    //     const res = await request(app).put(`/books/${testBook.isbn}`).send(invalidBook);
    //     expect(res.statusCode).toBe(400);
    //     expect(res.body.error).toBeDefined();
    // });
});

describe("DELETE /books/:isbn", () => {
    test("deletes a book", async () => {
        const res = await request(app).delete(`/books/${testBook.isbn}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ message: "Book deleted"});

        // check the books is no longer in the database
        const bookInDb = await db.query(`SELECT * FROM books WHERE isbn = $1`, [testBook.isbn]);
        expect(bookInDb.rows.length).toBe(0);
    });

    test("responds with invalid 404 for invalid isbn", async () => {
        const res = await request(app).delete('/books/invalid');
        expect(res.statusCode).toBe(404);
    });
});