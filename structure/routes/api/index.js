const express = require("express");
const apiRouter = express.Router();
/* const fs = require("fs"); 
  fs.readdir(__dirname + "/", { withFileTypes: true }, (error, files) => {
  const directoriesInDIrectory = files
    .filter((item) => item.isDirectory())
    .map((item) => item.name);
  directoriesInDIrectory.forEach((dName) =>
    apiRouter.use(`/${dName}`, require(`./${dName}`))
  );
}); */
apiRouter.get("/", function (req, res) {
  res.json({ status: "ok!" });
});

module.exports = apiRouter;
