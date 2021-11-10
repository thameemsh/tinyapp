const express = require('express');
const app = express();
const PORT = 8080; //default port

app.set('view engine','ejs');

const bodyParser = require("body-parser");//bodyParser is deprecated
app.use(express.urlencoded({extended: true}));

function generateRandomString() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  let result = '';
  for (let i = 6; i > 0; i--) {
    result += chars[Math.floor(Math.random() * (chars.length))];
  }
  return result;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get('/',(req,res) => {
  res.send('Hello');
})

//To add all urls from urlDatabase
app.get('/urls', (req,res) => {
  const templateVars = { urls : urlDatabase };
  // console.log(templateVars)
  res.render('urls_index', templateVars);
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// to convert the url to shortURL and redirect to show page
app.post("/urls", (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  const shortformURL = generateRandomString()
  urlDatabase[shortformURL] = req.body.longURL; 
  res.redirect(`/urls/${shortformURL}`); // Respond with redirect to /urls/:shortURL
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

//To Delete a URL
app.post("/urls/:shortURL/delete",(req,res) => {
  // console.log(req.params.shortURL);
  const shortURLToDel = req.params.shortURL;
  delete urlDatabase[shortURLToDel]
res.redirect('/urls');
})


//To Edit the longurl by clicking edit button
app.post("/urls/:shortURL",(req,res) => {
  const shortURLToEdit = req.params.shortURL;
res.redirect(`/urls/${shortURLToEdit}`);
})

//Get a update request from url-show page to update existing longUrl in the index page
app.post('/urls/:shortURL/update', (req, res) => {
  // console.log("req.params.shortURL:",req.params.shortURL)
  const shortURL = req.params.shortURL; 
  // console.log("req.body.longURL:",req.body.longURL)
  const updatedLongURL = req.body.longURL; 

  urlDatabase[shortURL] = updatedLongURL; //longURL in the database now equals the updated URL - urlDatabase[shortURL] equals what the value of the property shortURL 
  res.redirect('/urls'); //redirect to urls page
}); 


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

// Always pass object to EJS template even if one variable
app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!' };
  res.render("hello", templateVars); // need hello_word ejs template
}); 

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});