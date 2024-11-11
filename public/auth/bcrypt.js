const bcrypt = require("bcrypt");
const fs = require("fs");
const readline = require("readline");

class PasswordManager {
  constructor() {
    this.saltRounds = 10;
  }

  async hashPassword(password) {
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);
    return hashedPassword;
  }

  async comparePassword(password, hashedPassword) {
    const result = await bcrypt.compare(password, hashedPassword);
    return result;
  }
}

module.exports = { PasswordManager };

// Only for local testing purposes, create a users.json file to store user data as database
async function main() {
  const passwordManager = new PasswordManager();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Read existing user data (if any)
  let users = [];
  try {
    const data = fs.readFileSync("users.json");
    users = JSON.parse(data);
  } catch (err) {
    console.error("Error reading user data:", err);
  }

  rl.question("1. Log In\n2. Register\nLet's (1 or 2): ", async (choice) => {
    if (choice === "1") {
      // Simulate signin
      rl.question("Enter username: ", async (enteredUsername) => {
        rl.question("Enter password: ", async (enteredPassword) => {
          const user = users.find((user) => user.username === enteredUsername);
          if (user) {
            const isMatch = await passwordManager.comparePassword(
              enteredPassword,
              user.hashedPassword
            );
            if (isMatch) {
              console.log("Password match, sign in successful!");
            } else {
              console.log("Password does not match, sign in failed.");
            }
          } else {
            console.log("User not found.");
          }

          rl.close();
        });
      });
    } else if (choice === "2") {
      // Simulate signup
      rl.question("Enter username: ", async (username) => {
        if (users.some((user) => user.username === username)) {
          console.log(
            "Username already exists. Please choose a different username."
          );
          rl.close();
        } else {
          rl.question("Enter password: ", async (password) => {
            const hashedPassword = await passwordManager.hashPassword(password);
            console.log("User signed up with username:", username);

            // Add the new user to the array
            users.push({
              username: username,
              hashedPassword: hashedPassword,
            });

            // Write the updated user data to the file
            fs.writeFileSync("users.json", JSON.stringify(users, null, 2));

            rl.close();
          });
        }
      });
    } else {
      console.log("Invalid choice. Please enter 1 or 2.");
      rl.close();
    }
  });
}