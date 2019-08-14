// █████╗  ██████╗████████╗██╗ ██████╗ ███╗   ██╗
// ██╔══██╗██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║
// ███████║██║        ██║   ██║██║   ██║██╔██╗ ██║
// ██╔══██║██║        ██║   ██║██║   ██║██║╚██╗██║
// ██║  ██║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║
// ╚═╝  ╚═╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝

/**
 * File: test 1.js
 * Author: Tommy Gingras
 * Date: 2019-08-13
 * License: All rights reserved Studio Webux S.E.N.C 2015-Present
 */

"use strict";

const express = require("express");
const app = express();
const path = require("path");
const router = express.Router();
const {
  PrepareFile,
  DeleteFile,
  fileUploadMiddleware
} = require("../../index");
const options = require("./config/upload");

// action
const download = async someID => {
  // Normally a call to the database to find the picture URL
  // But here we will use a hardcoded value.
  console.log(
    "Calling database with an ID : ",
    someID,
    " to get the image ID."
  );
  return Promise.resolve(
    "./uploads/" + someID || "./uploads/5d2fb7606df7688537f20b6d.png"
  );
};

// route
const downloadRoute = async (req, res, next) => {
  try {
    const pictureURL = await download(req.params.id);

    if (!pictureURL) {
      return res.status(404).json({ msg: "Image not found !" });
    }

    return res.sendFile(path.resolve(pictureURL), err => {
      if (err) {
        res.status(422).json({ msg: "Image unprocessable !", error: err });
      }
    });
  } catch (e) {
    res.status(422).json({ msg: "Image unprocessable !", error: e });
  }
};

// action
const upload = async (someID, filename) => {
  // Normally a call to the database to put the picture URL
  // But here we will use a hardcoded value.
  console.log(
    "Calling database with an ID : ",
    someID,
    " to put the image ID."
  );

  // If an error occur you must use this function,
  // For example unable to find the resource in the database
  if (!someID) {
    // if something went wrong,
    DeleteFile(filename);
    throw new Error("an error occur !");
  }

  return Promise.resolve("file uploaded !");
};

// route
const uploadRoute = async (req, res, next) => {
  try {
    const filename = await PrepareFile(
      options,
      req.files,
      req.files.picture.name
    );

    if (!filename) {
      return res.status(422).json({ msg: "Image not uploaded !" });
    }

    const databaseUpdated = await upload("some ID", filename);

    if (!databaseUpdated) {
      return res.status(422).json({ msg: "Image not uploaded !" });
    }

    return res.status(200).json({ msg: "image uploaded !", name: filename });
  } catch (e) {
    return res.status(422).json({ msg: "Image unprocessable !", error: e });
  }
};

router["get"]("/download/:id", downloadRoute);
router["post"]("/upload", fileUploadMiddleware(options), uploadRoute);

app.use(router);

app.listen(1337, () => {
  console.log("Server is listening ...");
});
