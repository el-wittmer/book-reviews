import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.set('trust proxy', true);
app.set("view engine", "ejs");
const port = 3000;

const db = new pg.Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});
db.connect();

let sort = "newest";

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

async function getReadBooks(){
    let result;
    if (sort === "newest") {
        result = await db.query("SELECT * FROM book_reviews ORDER BY id DESC;");
    } else if (sort === "highest"){
        result = await db.query("SELECT * FROM book_reviews ORDER BY rating DESC, id DESC");
    }
    return result;
};

app.get("/", async (req, res) => {
    try {
        const books = await getReadBooks();
        res.render("index.ejs", {data: books.rows});
    }
    catch (err){
        console.error(err); 
        res.status(500).send("Template error");
    }
}); 

app.get("/newest", async (req, res) => {
    try {
        sort = "newest";
        res.redirect("/");
    }
    catch (err){
        console.error(err); 
        res.status(500).send("Template error");
    }
}); 

app.get("/highest", async (req, res) => {
    try {
        sort = "highest";
        res.redirect("/");
    }
    catch (err){
        console.error(err); 
        res.status(500).send("Template error");
    }
}); 

app.get("/view", async (req, res) => {
    try {
        const searchId = req.query.id;
        const idResults = await db.query("SELECT * FROM book_reviews WHERE id = "+ searchId + ";");
        res.render("view.ejs", {data: idResults.rows[0]});
    }
    catch (err){
        console.error(err); 
        res.status(500).send("Template error");
    }
}); 

app.get("/edit", async (req, res) => {
    try {
        const searchId = req.query.id;
        const idResults = await db.query("SELECT * FROM book_reviews WHERE id = " + searchId + ";");
        res.render("edit.ejs", {data: idResults.rows[0]});
    }
    catch (err){
        console.error(err); 
        res.status(500).send("Template error");
    }
});

app.get("/add", async (req, res) => {
    res.render("add.ejs");
});

app.post("/submit/:id", async (req, res) => {
    console.log("Editing...");
    const title = req.body.title;
    const author = req.body.author;
    const isbn = req.body.isbn;
    const notes = req.body.notes;
    const rating = req.body.rating;
    const month = req.body.month;
    const year = req.body.year;
    try {
        await db.query("UPDATE book_reviews SET title = $1, author = $2, rating = $3, isbn = $4, notes = $5, month = $6, year = $7 WHERE id = $8", 
            [title, author, rating, isbn, notes, month, year, req.params.id]);
    } catch (err) {
        console.log(err);
    }
    console.log("Redirecting...");
    res.redirect("/");
});

app.post("/add", async (req, res) => {
    console.log("Adding...");
    const title = req.body.title;
    const author = req.body.author;
    const isbn = req.body.isbn;
    const notes = req.body.notes;
    const rating = req.body.rating;
    const month = req.body.month;
    const year = req.body.year;
    try {
        await db.query("INSERT INTO book_reviews (title, author, rating, isbn, notes, month, year) VALUES ($1, $2, $3, $4, $5, $6, $7);", 
            [title, author, rating, isbn, notes, month, year]);
    } catch (err) {
        console.log(err);
    }
    console.log("Redirecting...");
    res.redirect("/");
});

// app.post("/delete/:id", async (req, res) => {
//     console.log("Deleting...");
//     try {
//         await db.query("DELETE FROM book_reviews WHERE id = $1;", 
//             [req.params.id]);
//     } catch (err) {
//         console.log(err);
//     }
//     console.log("Redirecting...");
//     res.redirect("/");
// });

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });