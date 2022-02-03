#!/usr/bin/env node
const process = require("process");
const fs = require("fs-extra");

const main = async () => {
  const argus = process.argv.slice(2);
  const configArg = argus.find((element) => element.includes("--config="));
  if (configArg) {
    const configFilePath = configArg.split("=")[1];
    let rawdata = fs.readFileSync(configFilePath);
    let configData = JSON.parse(rawdata);
    await createModel(configData);
    await createRouter(configData.modeName);
    await editApi(configData.modeName.toLowerCase());
  } else {
    console.log("config file!");
  }
};

main();

function controllerString(modelName) {
  return `const { ${modelName} } = require("../../../models");
  module.exports = {
    create: (req, res) => {
      const newDoc = new ${modelName}(req.body);
      newDoc.save((err) => {
        if (!err) {
          res.json({ status: "ok", message: "successfully created" });
        }
        res.json({ status: "failed", message: "some error" });
      });
    },
    read: {
      selectOne: (req, res) => {
        const { id } = req.params;
        ${modelName}.findById(id, (err, result) => {
          if (result) {
            res.json({ status: "ok", result });
          }
          res.json({ status: "failed", message: "some error" });
        });
      },
      selectAll: (req, res) => {
        ${modelName}.find({}, (err, result) => {
          if (!err) {
            res.json({ status: "ok", result });
          }
          res.json({ status: "failed", message: "some error" });
        });
      },
    },
    update: (req, res) => {
      const { id } = req.params;
      ${modelName}.findByIdAndUpdate(id, req.body, function (err) {
        if (!err) {
          res.json({ status: "ok", message: "successfully updated" });
        }
        res.json({ status: "failed", message: "some error" });
      });
    },
    delete: (req, res) => {
      const { id } = req.params;
      ${modelName}.findByIdAndDelete(id, function (err) {
        if (!err) {
          res.json({ status: "ok", message: "successfully deleted" });
        }
        res.json({ status: "failed", message: "some error" });
      });
    },
  };`;
}

function routerString(modelName) {
  const routerName = `${modelName}Router`;
  return `const express = require("express");
          const ${routerName} = express.Router();
          const controller = require("./controller");
            ${routerName}.post("/create", controller.create);
            ${routerName}.get("/list", controller.read.selectAll);
            ${routerName}.get("/:id", controller.read.selectOne);
            ${routerName}.post("/:id/update", controller.update);
            ${routerName}.get("/:id/delete", controller.delete);
          module.exports = ${routerName};`;
}

function modelString({ modeName, fields }) {
  var lowerName = modeName.toLowerCase();
  return `const mongoose = require("mongoose"); const ${lowerName}Schema = new mongoose.Schema({${fields
    .map((field) => `${field.name}: { type: ${field.type} }`)
    .join(",")}
    }); module.exports = mongoose.model("${modeName}", ${lowerName}Schema);`;
}

function createModel({ modeName, fields }) {
  return new Promise((resolve, reject) => {
    fs.writeFile(
      `./models/${modeName}.js`,
      modelString({ modeName, fields }),
      (err) => {
        if (err) {
          reject(err);
        }
        resolve("done");
      }
    );
  });
}

function createRouter(modelName) {
  return new Promise((resolve, reject) =>
    fs.mkdir("./routes/api/" + modelName.toLowerCase(), (err, path) => {
      if (err) {
        return console.error(err);
      }
      fs.writeFile(
        `./routes/api/${modelName.toLowerCase()}/index.js`,
        routerString(modelName),
        (err) => {
          if (err) {
            return console.error(err);
          }
          fs.writeFile(
            `./routes/api/${modelName.toLowerCase()}/controller.js`,
            controllerString(modelName),
            (err) => {
              if (err) {
                return console.error(err);
              }
              resolve("done");
            }
          );
        }
      );
    })
  );
}

async function editApi(modelName) {
  const findReqIndexes = (arr) => {
    var indexes = [],
      i;
    arr.forEach((element, i) => {
      if (element.includes("require(")) indexes.push(i);
    });

    return indexes;
  };
  return new Promise((resolve, reject) => {
    fs.readFile("./routes/api/index.js", "utf8", (err, data) => {
      if (err) {
        reject(err);
      }
      var toArray = data.split(/\r?\n/).filter((elem) => elem != "");
      const requires = findReqIndexes(toArray);
      toArray.splice(
        requires[requires.length - 1] + 1,
        0,
        `const ${modelName}Router = require("./${modelName}");`
      );
      const indexOfExports = toArray.findIndex((elem) =>
        elem.includes("module.exports")
      );
      toArray.splice(
        indexOfExports,
        0,
        `apiRouter.use("/${modelName}", ${modelName}Router);`
      );
      fs.writeFile(`./routes/api/index.js`, toArray.join(" "), (err) => {
        if (err) {
          return console.error(err);
        }
        resolve("done");
      });
    });
  });
}
