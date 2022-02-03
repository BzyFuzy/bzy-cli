#!/usr/bin/env node
const fs = require("fs-extra");

fs.copy(__dirname + "/structure", "./", (err) => {
  if (err) return console.error(err);
  console.log("success!");
});
