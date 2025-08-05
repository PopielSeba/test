import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const databasePath = process.env.DATABASE_URL || path.join(__dirname, "db.json");

let db = JSON.parse(fs.readFileSync(databasePath, "utf8"));

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// API ENDPOINTS
app.get("/api/data", (req, res) => {
  res.json(db);
});

app.post("/api/data", (req, res) => {
  const newItem = { ...req.body, id: uuidv4() };
  db.push(newItem);
  fs.writeFileSync(databasePath, JSON.stringify(db, null, 2));
  res.status(201).json(newItem);
});

app.delete("/api/data/:id", (req, res) => {
  const itemId = req.params.id;
  db = db.filter(item => item.id !== itemId);
  fs.writeFileSync(databasePath, JSON.stringify(db, null, 2));
  res.sendStatus(204);
});

// SERWER START
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
