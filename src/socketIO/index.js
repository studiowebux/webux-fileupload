/**
 * File: index.js
 * Author: Tommy Gingras
 * Date: 2020-05-10
 * License: All rights reserved Studio Webux S.E.N.C 2015-Present
 */

"use strict";

const SocketIOFileUpload = require("socketio-file-upload");
const fs = require("fs");
const path = require("path");
const { ProcessImage } = require("../validators/index");
const readChunk = require("read-chunk");
const imageType = require("image-type");

// Configuration
// https://github.com/sffc/socketio-file-upload

/**
 * It configures the socket.IO uploader
 * @param {Object} opts The full path to the file
 * @param {Object} log Custom logger, by default : console
 * @returns {Function<Object>} It returns a function to be use with 'io.of("upload").on("connection", * this function * );'
 */
module.exports = (opts, log = console) => {
  return function (socket) {
    log.debug("'upload' > Hello - " + socket.id);

    socket.on("disconnect", (reason) => {
      log.debug("'upload' > Bye Bye " + socket.id);
      log.debug(reason);
    });
    // Make an instance of SocketIOFileUpload and listen on this socket:
    var uploader = new SocketIOFileUpload(opts.socketIO);

    uploader.listen(socket);

    // Do something when a file is saved:
    uploader.on("saved", async function (event) {
      log.debug(event);

      const buffer = readChunk.sync(event.file.pathName, 0, 12);
      const info = imageType(buffer);

      const finalPath = path.join(
        opts.destination,
        (opts.sanitizeFilename
          ? await opts.sanitizeFilename(event.file.base)
          : event.file.base) +
          opts.label +
          "." +
          info.ext
      );

      if (opts.filetype === "image") {
        if (!opts.mimeTypes.includes(info.mime)) {
          throw new Error("Invalid mime type");
        }

        await ProcessImage(
          opts.tmp,
          event.file.name,
          info.ext,
          event.file.pathName,
          opts.width,
          finalPath
        );
      } else {
        fs.renameSync(event.file.pathName, finalPath);
      }
    });

    // Do something when a file start to upload:
    uploader.on("start", function (event) {
      log.debug("Start");
      log.debug(event);
    });

    // Do something when a file is in progress:
    uploader.on("progress", function (event) {
      log.debug("progress");
      log.debug(event);
    });

    // Do something when a file is complete:
    uploader.on("complete", function (event) {
      log.debug(event);
    });

    // Error handler:
    uploader.on("error", function (event) {
      log.debug("Error from uploader", event);
    });

    socket.on("download", function (stream, name, callback) {
      const filePath = path.join(opts.destination, name.toString());

      if (!fs.existsSync(filePath)) {
        return callback(`The file ${name} doesn't exist`);
      }

      callback({
        name: name,
        size: fs.statSync(filePath).size,
      });

      var MyFileStream = fs.createReadStream(filePath);
      MyFileStream.pipe(stream);
    });
  };
};
