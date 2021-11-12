/*--------------------------------Dependencies----------------------------------------------------*/
const express = require('express');
const app = express();
const morgan = require('morgan')
const bodyParser = require("body-parser");//bodyParser is deprecated and express incorporated it and 
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');
const PORT = 8080; //default port


app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(cookieParser())
app.use(morgan('dev'))
app.use(cookieSession({
  name: "session",
  keys: ['key1', 'key2']
}))

/*-------------------------------------Helper Functions-----------------------------------------------*/
const { getUserByEmail } = require('./helpers')

function generateRandomString() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  let result = '';
  for (let i = 6; i > 0; i--) {
    result += chars[Math.floor(Math.random() * (chars.length))];
  }
  return result;
}

const urlsforUser = function (urlDatabase, id) {
  const userUrls = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      userUrls[key] = urlDatabase[key]
    }
  } return userUrls
}
/*-------------------------------------Database-----------------------------------------------*/

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

/*------------------------------------------------------------------------------------*/

app.get('/', (req, res) => {
  res.redirect('/login');
})


//list all urls of use from urlDatabase
app.get('/urls', (req, res) => {

  if (users[req.session.user_id]) {
    const templateVars = { user: users[req.session.user_id], urls: urlsforUser(urlDatabase, req.session.user_id) };
    // console.log(templateVars)
    res.render('urls_index', templateVars);
  } else {
    res.redirect('/login')
  }
})

//To create new short URL
app.get("/urls/new", (req, res) => {
  if (users[req.session.user_id]) {
    const templateVars = { user: users[req.session.user_id] }
    res.render("urls_new", templateVars);
  } else {
    return res.redirect('/login')
  }
});

// Convert user input url to shortURL
app.post("/urls", (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  const shortformURL = generateRandomString()
  urlDatabase[shortformURL] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect(`/urls/${shortformURL}`); // Respond with redirect to /urls/:shortURL
});

// Shorturl to be shared with your friends and family
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user: users[req.session.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);
});

//To Delete a URL from user list
app.post("/urls/:shortURL/delete", (req, res) => {
  // console.log(req.params.shortURL);
  if (users[req.session.user_id]) {
    const shortURLToDel = req.params.shortURL;
    delete urlDatabase[shortURLToDel]
    res.redirect('/urls');
  } else {
    res.status(401).send('Only authorized user allowed to delete')
  }
})

//To Edit or Delete an existing user URL
app.post("/urls/:shortURL", (req, res) => {
  if (users[req.session.user_id]) {
    const shortURLToEdit = req.params.shortURL;
    res.redirect(`/urls/${shortURLToEdit}`);
  } else {
    res.status(401).send('Only authorized user allowed to edit')
  }
})

//Get a update request from url-show page to update existing longUrl in the index page
app.post('/urls/:shortURL/update', (req, res) => {
  const shortURL = req.params.shortURL;
  const updatedLongURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL: updatedLongURL, userID: req.session.user_id }; 
  res.redirect('/urls'); 
});

//Handling authentication and login and new user registration
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

app.get('/login', (req, res) => {
  const user = users[req.session.user_id]
  if (user) {
    return res.redirect('urls');
  }
  res.render("login", { user });
})

//handling logout and clearing cookie
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
})


// Registration form created
app.get("/register", (req, res) => {
  const user = users[req.session.user_id]
  if (user) {
    return res.redirect('urls');
  }
  res.render("register", { user });
});


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