/*--------------------------------Dependencies----------------------------------------------------*/
const express = require('express');
const app = express();
const morgan = require('morgan')
const bodyParser = require("body-parser");//bodyParser is deprecated and express incorporated it and 
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');
const PORT = 8081; //default port


app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(cookieParser())
app.use(morgan('dev'))
app.use(cookieSession({
  name: "session",
  keys: ['key1', 'key2']
}))

/*-----Functions-----------------------------------------------*/
const { getUserByEmail, generateRandomString, urlsForUser} = require('./helpers')

/*-----Database------------------------------------------------*/

const urlDatabase = {
  "b2xVn2":
    { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },


  "9sm5xK":
    { longURL: "http://www.google.com", userID: "user2RandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "memon@gmail.com",
    password: bcrypt.hashSync("mermaid", 10)
  },

  "user2RandomID": {
    id: "user2RandomID",
    email: "seabird@gmail.com",
    password: bcrypt.hashSync("goldfish", 10)
  }
}
/*------Routes/End points-------------------------------------------*/

//GET /:>
//Redirect of root / to urls page if user logged in else redirect to login page
app.get('/', (req, res) => {
  if (!users[req.session.user_id]) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
})
// res.status(400).send("Invalid Credential!Please <a href='/login'</a>!")

//GET /urls:>
//Shows the urls belonging to the logged in user
app.get('/urls', (req, res) => {
  if (!users[req.session.user_id]) {
    res.status(401).send("Must be logged in to view your URLs! If a registered user, please <a href='/login'>login!</a> or  please <a href='/register'> register!</a>");
    // res.redirect('/login')
  } else {
    const templateVars = { user: users[req.session.user_id], urls: urlsForUser(urlDatabase, req.session.user_id) };
    res.render('urls_index', templateVars);
  }
})
//POST /urls :>
// Adds new URL to database after shortURL created through the POST request from urls/new and redirects to /urls/shortURL
app.post("/urls", (req, res) => {
  
  if (!users[req.session.user_id]) {
    res.status(400).send("Must be logged in to view your URLs! If a registered user, please <a href='/login'>login!</a> or  please <a href='/register'> register!</a>");
  } else {
    const shortURL = generateRandomString()
      urlDatabase[shortURL] = { 
      longURL: req.body.longURL, 
      userID: req.session.user_id 
    }; 
    res.redirect(`/urls/${shortURL}`);
  }
  
});

//GET /urls/new :<(create_new_shortURL redirects to registration page?)
//Renders create_new_shortURL page if user logged in, else redirects to login page 
app.get("/urls/new", (req, res) => {
  if (!users[req.session.user_id]) {
    res.redirect('/login');
  } else {
    const templateVars = { user: users[req.session.user_id] }
    res.render("urls_new", templateVars);
  }
});


//GET /urls/:shortURL :>
// Shows the URL for only registered user who owns that URL.
app.get("/urls/:shortURL", (req, res) => {
  const shortURL= req.params.shortURL;
  const userID = req.session.user_id;
  const userUrls = urlsForUser(urlDatabase, userID);
  const templateVars = { 
    user: users[userID],
    urlDatabase, 
    userUrls, 
    shortURL };

  if(!urlDatabase[shortURL]) {
    res.status(404).send("Please enter a valid URL or URL does not exist for the given tinyURL");
  } else if (!users[userID]) {
    res.status(401).send("User must login to view the URL! please <a href='/login'>login!</a>");
  } else if(!userUrls[shortURL]) {
    res.status(401).send("Unauthorized access! This URL does not belong to you!");
  } else {
    res.render("urls_show", templateVars);
  }
   
});

// GET u/:shortURL :>
//tinyURL(u/:shortURL) redirects to original website
app.get("/u/:shortURL", (req, res) => {
  if(!urlDatabase[req.params.shortURL]) {
    res.status(404).send("Please enter a valid URL or URL does not exist for the given tinyURL");
  } else {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  }

});

//To Delete a URL from user list
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
   if (users[req.session.user_id] && (req.session.user_id === urlDatabase[shortURL].userID)) {delete urlDatabase[shortURL]
    res.redirect('/urls');
  } else {
    res.status(401).send('Only authorized user is allowed to delete')
  }
})


//Get a update request from url-show page to update existing longUrl in the index page
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  console.log('req.body value', req.body.updatedURL)
  if (users[req.session.user_id] && (req.session.user_id === urlDatabase[shortURL].userID)) {
  urlDatabase[shortURL].longURL = req.body.updatedURL; 
  res.redirect('/urls'); 
  } else {
    res.status(401).send('Only authorized user allowed to edit')
  }
});

//GET /login
app.get('/login', (req, res) => {
  const user = users[req.session.user_id]
  if (user) {
    res.redirect('/urls');
    return;
  }
  const templateVars = {user: user}
  res.render("login", templateVars);
})

//POST /logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
})

//POST /login
app.post('/login', (req, res) => {
  const user_id = getUserByEmail(req.body.email, users)
  if (!req.body.email || !req.body.password || !user_id) {
    return res.status(400).send("Invalid Email or Password. <a href= '/register'> Return to Login Page <a>")
  }
  if (!bcrypt.compareSync(req.body.password, users[user_id].password)) {
    return res.status(400).send("Invalid credentials. <a href= '/login'> Return to Login Page <a>")
  } else {
    req.session.user_id = user_id;
    res.redirect('/urls');
  }
})


//GET /register
app.get("/register", (req, res) => {
  const user = users[req.session.user_id]
  if (user) {
    return res.redirect('/urls');
  }
  res.render("register", { user });
});

//POST /register
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Invalid Email or Password. <a href= '/register'> Return to Registeration Page <a>")
  }

  if (getUserByEmail(req.body.email, users)) {
    return res.status(400).send("Email already exists. <a href= '/login'> Return to Login Page <a>")
  }
  const user_id = generateRandomString()
  const email = req.body.email;
  const password = req.body.password
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[user_id] = { id: user_id, email: email, password: hashedPassword }
  req.session.user_id = user_id;
  res.redirect("/urls")
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});