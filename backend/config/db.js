const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "missionary2",
    database: "surveillance_db",
    port: 3307
});

db.connect((err) => {

    if (err) {

        console.error(
            "❌ MySQL Connection Failed:",
            err
        );

        return;
    }

    console.log(
        "✅ MySQL Connected Successfully"
    );

});

module.exports = db;