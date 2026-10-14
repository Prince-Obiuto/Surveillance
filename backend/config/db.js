const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "surveillance_db",
    port: Number(process.env.DB_PORT || 3306)
});

db.state = "connecting";

db.connect((err) => {

    if (err) {

        console.error(
            "❌ MySQL Connection Failed:",
            err
        );

        db.state = "error";
        return;
    }

    db.state = "connected";
    console.log(
        "✅ MySQL Connected Successfully"
    );

});

module.exports = db;