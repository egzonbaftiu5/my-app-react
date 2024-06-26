const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(cors());

const dbPath = "C:/Users/BaftiuEg/Desktop/Egzons2.db";

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Database connected.");
    createTable();
  }
});

function createTable() {
  db.run(
    `CREATE TABLE IF NOT EXISTS texts (
      id INTEGER PRIMARY KEY,
      content TEXT
    )`,
    (err) => {
      if (err) {
        console.error("Error creating table:", err.message);
      } else {
        console.log("Table created or verified.");
      }
    }
  );
}

const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No files were uploaded.");
  }

  const filePath = req.file.path;

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("Error reading file");
    }

    db.serialize(() => {
      const stmt = db.prepare("INSERT INTO texts (content) VALUES (?)");
      stmt.run(data, function (err) {
        if (err) {
          console.error("Error inserting data:", err);
          return res.status(500).send("Error inserting data");
        }
        stmt.finalize((err) => {
          if (err) {
            console.error("Error finalizing statement:", err);
          } else {
            console.log("Data inserted successfully.");
          }
        });
        res.send("Data has been inserted into the database");
      });
    });

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("Uploaded file deleted successfully.");
      }
    });
  });
});

app.listen(PORT, (err) => {
  if (err) {
    console.error("Error starting server:", err);
  } else {
    console.log(`Server is running on port ${PORT}`);
  }
});
