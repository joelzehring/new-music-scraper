var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var express = require("express");
var exphbs = require("express-handlebars");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Set Handlebars as the default templating engine.
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newmusicscraperdb";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });
//mongoose.connect("mongodb://localhost/newmusicsraperdb", { useNewUrlParser: true });

// ========================= Routes =========================

// Scrape the All Music front page
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.allmusic.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    $(".new-release-items-container .meta-container").each(function(i, element) {
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).find(".title").text().trim();
      result.artist = $(this).find(".artist").text().trim();
      result.review = $(this).find(".headline-review").text().split("\n")[1].trim() + " " + $(this).find(".headline-review").text().split("\n")[4].trim();
      result.link = $(this).find(".title a").attr("href");
      
      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err);
        });
    });

    res.send(
      `
      Scrape Complete
      <a href="/">View Articles</a>
      `
      );
  });
});

// Route to show all articles on the main page
app.get("/", function(req, res) {
  db.Article.find({}).lean()
    .then(function(dbArticle) {
      console.log(dbArticle);
      res.render("articles", { articles: dbArticle });
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for displaying only saved articles
app.get("/saved", function(req, res) {
  db.Article.find({ saved: true }).lean()
    .then(function(dbArticle) {
      console.log(dbArticle);
      res.render("articles", { articles: dbArticle });
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for changing the saved state of an article
app.post("/savestatus/:id", function(req, res) {
  db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: req.body.saved })
    .then(function(dbArticle) {
      console.log(`Changed saved status of ${dbArticle.title} to ${dbArticle.saved}.`);
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});


// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id }).lean()
    .populate("note")
    .then(function(dbArticle) {
      res.render("notes", { notes: dbArticle});
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// ========================= Start the server =========================
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});

module.exports = app;
