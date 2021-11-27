
function getUserByEmail(email, database) {

  for (let id in database) {
    if (database[id].email === email) {
      return id;
    }
  } return false;
}

function generateRandomString() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  let result = '';
  for (let i = 6; i > 0; i--) {
    result += chars[Math.floor(Math.random() * (chars.length))];
  }
  return result;
}

const urlsForUser = function (urlDatabase, id) {
  const userUrls = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      userUrls[key] = urlDatabase[key]
    }
  } return userUrls
}
module.exports = { getUserByEmail, generateRandomString, urlsForUser }

