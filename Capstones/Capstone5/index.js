import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import 'dotenv/config'

const app = express();
const port = 3000;
const isbn = "9780593582503"
const baseURL = "https://covers.openlibrary.org/b/isbn/";
const defaultBase = ".jpg?default=false"

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "books",
    password: "ybc46tab",
    port: 5432,
  });
  db.connect();


let sort = "newest";
let remove = false;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

async function confirmPassword() {
    let password = prompt("Please enter the password","");
};

async function getReadBooks(){
    let result;
    if (sort === "newest") {
        result = await db.query("SELECT * FROM books WHERE date_read IS NOT NULL ORDER BY date_read DESC;");
    }
    else if (sort === "oldest") {
        result = await db.query("SELECT * FROM books WHERE date_read IS NOT NULL ORDER BY date_read ASC;");
    }
    else if (sort === "title") {
        result = await db.query("SELECT * FROM books ORDER BY title ASC;");
    }
    else if (sort === "liked") {
        result = await db.query("SELECT * FROM books WHERE liked = 'true';");
    }
    else if (sort === "disliked") {
        result = await db.query("SELECT * FROM books WHERE liked = 'false';");
    }
    return result;
};

app.get("/", async (req, res) => {
    try {
        const books = await getReadBooks();
        let urls = [];
        for (let i = 0; i < books.rows.length; i++) {
            let url = "https://covers.openlibrary.org/b/isbn/"+ books.rows[i].isbn +"-S.jpg?default=false";
            try {
                let result = await axios.get(url);
                urls.push(url);
            } catch (err) {
                urls.push("0");
            }
        }
        res.render("index.ejs", {data: books.rows, urls: urls});
    }
    catch (err){
        console.log(err.code);
        res.redirect("/");
    }
}); 

app.get("/newest", async (req, res) => {
    sort = "newest";
    res.redirect("/");
});

app.get("/oldest", async (req, res) => {
    sort = "oldest";
    res.redirect("/");
});

app.get("/liked", async (req, res) => {
    sort = "liked";
    res.redirect("/");
});

app.get("/disliked", async (req, res) => {
    sort = "disliked";
    res.redirect("/");
});

app.get("/title", async (req, res) => {
    sort = "title";
    res.redirect("/");
});

app.get("/submit", async (req, res) => {
    console.log("Starting...")
    try {
        let liked;
        let date = req.query.date;
        if (req.query.liked == null) {
            liked = false;
        } else {
            liked = true;
        };
        if (req.query.date === "") {
            date = null;
        };
        try {
            await db.query("INSERT INTO books(title, author, liked, date_read, isbn, notes) VALUES ($1, $2, $3, $4, $5, $6)", [req.query.title, req.query.name, liked, date, req.query.isbn, req.query.notes]);
        }
        catch (err) {
            console.log(err);
            alert("Error entering book data.")
        };
        console.log("Redirecting...")
        res.redirect("/");
    } catch (error) {
        res.status(500);
    };
});

app.get("/submit/:id", async (req, res) => {
    console.log("Editing...");
    try {
        let liked;
        if (req.query.liked == null) {
            liked = false;
        } else {
            liked = true;
        };
        await db.query("UPDATE books SET title = $1, author = $2, liked = $3, date_read = $4, isbn = $5, notes = $6 WHERE id = $7", [req.query.title, req.query.name, liked, req.query.date, req.query.isbn, req.query.notes, req.params.id]);
    } catch (err) {
        console.log(err);
        console.log("Error updating book data.");
    }
    res.redirect("/");
});

app.get("/delete/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM books WHERE id = $1", [req.params.id]);
    } catch (err) {
        console.log(err);
        console.log("Error updating book data.");
    }
    res.redirect("/");
});

app.get("/add", async (req, res) => {
    res.render("add.ejs");
});

app.get("/edit/:id", async (req, res) => {
    const result = await db.query("SELECT * FROM books WHERE id = $1", [req.params.id]);
    res.render("edit.ejs", {data: result.rows});
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });