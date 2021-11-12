
function getUserByEmail(email, database) {

  for (let id in database) {
    if (database[id].email === email) {
      return id;
    }
  } return false;
}

module.exports = { getUserByEmail }

