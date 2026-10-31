require("dotenv").config();
const fs = require("fs");
const mysql = require("mysql2/promise");

async function setup() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  });

  const sql = fs.readFileSync("./database/schema.sql", "utf8");
  await connection.query(sql);
  console.log("Database and tables created successfully!");
  await connection.end();
}

setup().catch(error => {
  console.error("Database setup failed:", error.message);
  process.exit(1);
});
