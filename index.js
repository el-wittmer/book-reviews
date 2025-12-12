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
let remove = false;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

async function getReadBooks(){
    let result;
    if (sort === "newest") {
        result = await db.query("SELECT * FROM books ORDER BY id DESC;");
    }
    else if (sort === "oldest") {
        result = await db.query("SELECT * FROM books ORDER BY id ASC;");
    }
    else if (sort === "title") {
        result = await db.query("SELECT * FROM books ORDER BY title ASC;");
    }
    else if (sort === "liked") {
        result = await db.query("SELECT * FROM books WHERE liked = 'true' ORDER BY id DESC;");
    }
    else if (sort === "disliked") {
        result = await db.query("SELECT * FROM books WHERE liked = 'false';");
    }
    return result;
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

app.get("/oldest", async (req, res) => {
    try {
        sort = "oldest";
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


// app.get("/pair/:base/:target", async (req, res) => {
//     try {
//         const base = req.params.base;
//         const target = req.params.target;
//         const url = baseURL + APIkey + "/pair/" + base + "/" + target;
//         const result = await axios.get(url);
//         res.render("index.ejs", {baseCode: result.data.base_code, targetCode: result.data.target_code, conversionRate: result.data.conversion_rate});
//     }
//     catch (error) {
//         res.status(500);
//     }

// });

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
        } catch (err) {
            console.log(err);
            alert("Error entering book data. Redirecting...")
        }
        console.log("Redirecting...");
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});

// app.get("/submit/:id", async (req, res) => {
//     console.log("Editing...");
//     try {
//         let liked;
//         if (req.query.liked == null) {
//             liked = false;
//         } else {
//             liked = true;
//         };
//         await db.query("UPDATE books SET title = $1, author = $2, liked = $3, date_read = $4, isbn = $5, notes = $6 WHERE id = $7", [req.query.title, req.query.name, liked, req.query.date, req.query.isbn, req.query.notes, req.params.id]);
//     } catch (err) {
//         console.log(err);
//         console.log("Error updating book data.");
//     }
//     res.redirect("/");
// });

// app.get("/delete/:id", async (req, res) => {
//     try {
//         await db.query("DELETE FROM books WHERE id = $1", [req.params.id]);
//     } catch (err) {
//         console.log(err);
//         console.log("Error updating book data.");
//     }
//     res.redirect("/");
// });

app.get("/add", async (req, res) => {
    res.render("add.ejs");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });