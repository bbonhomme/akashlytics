"use strict";

const express = require("express");
const path = require("path");

// Constants
const PORT = 3080;

// App
const app = express();

const users = [
  { id: 1, name: "Max" },
  { id: 2, name: "John" },
];

app.use(express.static(path.join(__dirname, "../app/build")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../app/build/index.html"));
});

app.get("/api/users", (req, res) => {
  // console.log("/api/users called!", req);
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`Server listening on the port::${PORT}`);
});
