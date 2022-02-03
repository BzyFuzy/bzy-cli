var express = require("express");
var router = express.Router();
var apiRouter = require("./api");

router.get("/", function (req, res, next) {
  res.render("index", { title: "Express application" });
});

router.use("/api", apiRouter);

module.exports = router;
