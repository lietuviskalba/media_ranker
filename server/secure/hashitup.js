// hash-password.js
const bcrypt = require("bcrypt");

// You can pass the plain text password as a command line argument
const password = process.argv[2] || "cookiesareforme";
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error("Error generating hash:", err);
  } else {
    console.log("Hashed password:", hash);
  }
});
