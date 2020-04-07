var cheerio = require("cheerio");
var axios = require("axios"); 
var express = require('express');
var exphbs  = require('express-handlebars');
 
var app = express();
 
app.engine('handlebars', exphbs({
  defaultLayout: 'home',
  layoutsDir: __dirname + '/views/layouts/',
  partialDir: __dirname + '/views/partials/'
}));

app.set('view engine', 'handlebars');
 
app.get('/', function (req, res) {
// Make a request via axios to grab the HTML body
axios.get("https://www.allmusic.com/").then(function(response) {

  var $ = cheerio.load(response.data);

  // An empty array to save the data scraped
  var results = [];

  // Select each element in the HTML body.
  $(".new-release").each(function(i, element) {

    var title = $(element).find(".title").text().trim();
    var artist = $(element).find(".artist").text().trim();
    var body = $(element).find(".headline-review").text().trim().split("\n")[0];
    var link = $(element).find(".title").find("a").attr("href");

    // Save these results in an object
    results.push({
      title: title,
      artist: artist,
      body: body,
      link: link
    });
  });

  // Log the results
  console.log(results);
});
 
  res.render('home');
});

app.listen(3000);
