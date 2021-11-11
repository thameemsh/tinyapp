const express = require('express');
const app = express();
const morgan = require('morgan')
const bodyParser = require("body-parser");//bodyParser is deprecated and express incorporated it and 
const cookieParser = require('cookie-parser');
const PORT = 8080; //default port

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(cookieParser())
app.use(morgan('dev'))

/*------------------------------------------------------------------------------------*/


function generateRandomString() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  let result = '';
  for (let i = 6; i > 0; i--) {
    result += chars[Math.floor(Math.random() * (chars.length))];
  }
  return result;
}

const urlDatabase = {
  "b2xVn2": 
      { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },   //-----1

  "9sm5xK": 
      { longURL: "http://www.google.com", userID: "user2RandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "memon@gmail.com",
    password: "mermaid"
  },

  "user2RandomID": {
    id: "user2RandomID",
    email: "seabird@gmail.com",
    password: "goldfish"
  }
}


const getUserByEmail = function (email) {
  for (let id in users) {
    if (users[id].email === email) {
      return users[id];
    }
  }
}

// const authenticator = function(email,password) {
//   for (let id in users) {
//     if(users[id].email === email) {
//       if(users[id].password === password) {
//         return {user: id, err: null};
//       } else return { user_id: null, err: "Invalid password"};
//   }

// }
// return { user: null, err: "Oop! No user found. Register as a new user"};
// }


const authenticator = function (email, password) {
  for (let id in users) {
    if (users[id].email === email && (users[id].password === password)) {
      return id;
    }
  } return false;
}

//function to get the entries fron urlDatabase that matches a particular user ID
const urlsofUser = function (urlDatabase, id) {
  const userUrls = {};
  for(let key in urlDatabase) {
    if(urlDatabase[key].userID === id) {
      userUrls[key] = urlDatabase[key]
    }
  } return userUrls
}
/*------------------------------------------------------------------------------------*/

app.get("/urls.json", (req, res) => { res.json(urlDatabase); });

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!' };
  res.render("hello", templateVars); // need hello_word ejs template
});

app.get('/', (req, res) => {
  res.send('Hello');
})


//To add all urls from urlDatabase
app.get('/urls', (req, res) => {
  // console.log(req.cookies)
  if(req.cookies.user_id) {
  const templateVars = { user: users[req.cookies.user_id], urls: urlsofUser(urlDatabase,req.cookies.user_id) };
  // console.log(templateVars)
  res.render('urls_index', templateVars);
  } else {
    res.redirect('/login')
  }
})


app.get("/urls/new", (req, res) => {
  if(req.cookies.user_id) {
    const templateVars = { user: users[req.cookies.user_id] }
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login')
  }
});

// to convert the url to shortURL and redirect to show page
app.post("/urls", (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  const shortformURL = generateRandomString()
  urlDatabase[shortformURL] = {longURL:req.body.longURL, userID: req.cookies.user_id };
  res.redirect(`/urls/${shortformURL}`); // Respond with redirect to /urls/:shortURL
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});


app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  // const templateVars = { user: users[req.cookies.user_id], urls: urlsofUser(urlDatabase,req.cookies.user_id)
  res.render("urls_show", templateVars);
});

//To Delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  // console.log(req.params.shortURL);
  if(req.cookies.user_id) {
  const shortURLToDel = req.params.shortURL;
  delete urlDatabase[shortURLToDel]
  res.redirect('/urls');
  } else {
    res.status(401).send('Only authorized user allowed to delete')
  }
})


//To Edit the longurl by clicking edit button
app.post("/urls/:shortURL", (req, res) => {
  if(req.cookies.user_id) {
  const shortURLToEdit = req.params.shortURL;
  res.redirect(`/urls/${shortURLToEdit}`);
  } else {
    res.status(401).send('Only authorized user allowed to edit')
  }
})

//Get a update request from url-show page to update existing longUrl in the index page
app.post('/urls/:shortURL/update', (req, res) => {
  // console.log("req.params.shortURL:",req.params.shortURL)
  const shortURL = req.params.shortURL;
  // console.log("req.body.longURL:",req.body.longURL)
  const updatedLongURL = req.body.longURL;
  
  urlDatabase[shortURL] = {longURL: updatedLongURL, userID: req.cookies.user_id}; //longURL in the database now equals the updated URL - urlDatabase[shortURL] equals what the value of the property shortURL 
  res.redirect('/urls'); //redirect to urls page
});

//handling login  and saving cookie
app.post('/login', (req, res) => {
  const user_email = req.body.email;
  const user_password = req.body.password;
  // console.log(req.body)
  const user_id = authenticator(user_email, user_password)
  if (!user_id) {
    res.status(403).send("Password wrong or Username doesn't exist")
    return;
  }
  res.cookie('user_id', user_id)
  res.redirect('/urls');
})

app.get('/login', (req, res) => {
  const user = users[req.cookies.user_id]
  res.render("login", { user });
})

//handling logout and clearing cookie
app.post('/logout', (req, res) => {
  res.clearCookie('user_id')
  res.redirect('/urls');
})


// Registration form created
app.get("/register", (req, res) => {
  const user = users[req.cookies.user_id]
  res.render("register", { user });
});


app.post("/register", (req, res) => {
  // console.log('req.body:',req.body)
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Invalid Email or Password")
    return;
  }

  if (getUserByEmail(req.body.email)) {
    res.status(400).send("Email already exists")
    return
  }
  const user_id = generateRandomString()
  users[user_id] = { id: user_id, email: req.body.email, password: req.body.password }
  // console.log(users)
  res.cookie("user_id", user_id)
  res.redirect("/urls")
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});