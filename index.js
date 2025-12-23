import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from 'dotenv';
import axios from "axios"
dotenv.config();

const app = express();
const port = 3000;
const isbn = "9780553418026"
const baseURL = "https://covers.openlibrary.org/b/isbn/";
const defaultBase = ".jpg?default=false"

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();

let sort = "newest";

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

async function getReadBooks(){
    let result;
    if (sort === "newest") {
        result = await db.query("SELECT * FROM books ORDER BY id DESC;");
    }
    else if (sort === "liked") {
        result = await db.query("SELECT * FROM books WHERE liked = 'true' ORDER BY id DESC;");
    }
    else if (sort === "owned") {
        result = await db.query("SELECT * FROM books WHERE owned = 'true' ORDER BY id DESC;");
    }
    return result;
};

async function processBoolean(query_result){
    if (query_result == null) {
        return false;
    } else {
        return true;
    };
};

app.get("/", async (req, res) => {
    try {
        const books = await getReadBooks();
        res.render("index.ejs", {data: books.rows});
    }
    catch (err){
        console.log(err.code);
        res.redirect("/");
    }
}); 

app.get("/liked", async (req, res) => {
    try {
        sort = "liked";
        res.redirect("/");
    }
    catch (err){
        console.log(err.code);
        res.redirect("/");
    }
}); 

app.get("/owned", async (req, res) => {
    try {
        sort = "owned";
        res.redirect("/");
    }
    catch (err){
        console.log(err.code);
        res.redirect("/");
    }
}); 

app.get("/newest", async (req, res) => {
    try {
        sort = "newest";
        res.redirect("/");
    }
    catch (err){
        console.log(err.code);
        res.redirect("/");
    }
}); 


app.get("/view", async (req, res) => {
    try {
        const searchId = req.query.id;
        const idResults = await db.query("SELECT * FROM books WHERE id = "+ searchId + ";");
        res.render("view.ejs", {data: idResults.rows[0]});
    }
    catch (err){
        console.log(err.code);
        res.redirect("/");
    }
}); 

app.get("/edit", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM books WHERE id = " + [req.query.id] + ";");
        res.render("edit.ejs", {data: result.rows[0]});
    }
    catch (err){
        console.log(err.code);
        res.redirect("/");
    }
});

app.get("/submit", async (req, res) => {
    console.log("Starting...")
    const password = req.query.password;
    if (password === process.env.PG_PASSWORD) {
        const liked = await processBoolean(req.query.liked);
        const audio = await processBoolean(req.query.audio);
        const owned = await processBoolean(req.query.owned);
        const month = req.query.month;
        const year = req.query.year;
        const title = req.query.title;
        const author = req.query.author;
        const isbn = req.query.isbn;
        const notes = req.query.notes;
        try {
            await db.query("INSERT INTO books(title, author, month_read, year_read, isbn, notes, audio, liked, owned) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", 
                [title, author, month, year, isbn, notes, audio, liked, owned]);
        } catch (err) {
            console.log(err);
        }
        console.log("Redirecting...");
        res.redirect("/");
    } else {
        console.log("Password was incorrect. Redirecting...");
        res.redirect("/");
    }
});

app.get("/submit/:id", async (req, res) => {
    console.log("Editing...");
    const liked = await processBoolean(req.query.liked);
    try {
        await db.query("UPDATE books SET title = $1, author = $2, liked = $3, date_read = $4, isbn = $5, notes = $6 WHERE id = $7", 
            [req.query.title, req.query.name, liked, req.query.date, req.query.isbn, req.query.notes, req.params.id]);
    } catch (err) {
        console.log(err);
    }
    console.log("Redirecting...");
    res.redirect("/");
});

app.get("/add", async (req, res) => {
    res.render("add.ejs");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });