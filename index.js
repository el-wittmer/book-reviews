import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

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

app.get("/pair/:base/:target", async (req, res) => {
    try {
        const base = req.params.base;
        const target = req.params.target;
        const url = baseURL + APIkey + "/pair/" + base + "/" + target;
        const result = await axios.get(url);
        res.render("index.ejs", {baseCode: result.data.base_code, targetCode: result.data.target_code, conversionRate: result.data.conversion_rate});
    }
    catch (error) {
        res.status(500);
    }

});

app.get("/submit", async (req, res) => {
    try {
        console.log(req.query);
        const base = req.query.base;
        const target = req.query.target;
        const amount = parseFloat(req.query.amount);
        console.log(amount);
        if (isNaN(amount)) {
            console.log("Please enter a numerical amount.");
            res.render("index.ejs", {error: "error"});
        }
        else{
            const url = baseURL + APIkey + "/pair/" + base + "/" + target; 
            const result = await axios.get(url);
            res.render("index.ejs", {baseCode: result.data.base_code, targetCode: result.data.target_code, conversionRate: result.data.conversion_rate, baseAmount: Math.floor(amount * 100) / 100});
        }

    }
    catch (error) {
        res.status(500);
    }

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