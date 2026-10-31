require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../src/db");

async function createAdmin() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password || password.length < 12) {
    throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD (minimum 12 characters) in backend/.env");
  }

  const hash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO admins (username, password_hash)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [username, hash]
  );

  console.log("Admin account created/updated successfully.");
}

createAdmin()
  .catch((error) => {
    console.error("Could not create admin:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
