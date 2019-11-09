// ██╗  ██╗███████╗██╗     ██████╗ ███████╗██████╗
// ██║  ██║██╔════╝██║     ██╔══██╗██╔════╝██╔══██╗
// ███████║█████╗  ██║     ██████╔╝█████╗  ██████╔╝
// ██╔══██║██╔══╝  ██║     ██╔═══╝ ██╔══╝  ██╔══██╗
// ██║  ██║███████╗███████╗██║     ███████╗██║  ██║
// ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝

/**
 * File:.js
 * Author: Tommy Gingras
 * Date: 2019-03-07
 * License: All rights reserved Studio Webux S.E.N.C 2015-Present
 */

"use strict";

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const fileUpload = require("express-fileupload");
const mime = require("mime");
const imageType = require("image-type");

/**
 * It delete the file pass in parameter.
 * @param {String} filepath the full path to the file
 * @returns {Promise} Return a promise
 */
const DeleteFile = filepath => {
  return new Promise((resolve, reject) => {
    try {
      // Check if the file is present
      fs.stat(filepath, err => {
        if (err) {
          return reject(err);
        }
        // The file is present, delete it.
        fs.unlink(filepath, err => {
          if (err) {
            return reject(err);
          }
          // The file has been deleted succesfully.
          return resolve();
        });
      });
    } catch (e) {
      throw e;
    }
  });
};

/**
 * it checks if the file is valid to beed on the server.
 * @param {Object} options the options object
 * @param {Object} files the files array from the user input
 * @param {String} filename the filename
 * @param {string} label the identifier to be added at the end of the file
 */
const PrepareFile = (options, files, filename, label = "") => {
  return new Promise((resolve, reject) => {
    try {
      if (options.mimeTypes.indexOf(files[options.key].mimetype) > -1) {
        const extension = mime.getExtension(files[options.key].mimetype);

        const realFilename = path.join(
          options.destination,
          filename + label + "." + extension
        );

        if (
          options.filetype === "image" &&
          options.mimeTypes.indexOf(imageType(files[options.key].data).mime) >
            -1
        ) {
          if (extension !== "gif") {
            const TMPfilename = path.join(
              options.tmp,
              filename + label + "_TMP" + "." + extension
            );
            files[options.key].mv(TMPfilename, err => {
              if (err) {
                return reject(err);
              }

              sharp(TMPfilename)
                .resize(options.size)
                .toFile(realFilename, async err => {
                  if (err) {
                    return reject(err);
                  }

                  // Delete the temporary file
                  await DeleteFile(TMPfilename).catch(e => {
                    return reject(e);
                  });

                  return resolve(realFilename);
                });
            });
          } else {
            files[options.key].mv(realFilename, err => {
              if (err) {
                return reject(err);
              }
              return resolve(realFilename);
            });
          }
        } else if (options.filetype === "document") {
          files[options.key].mv(realFilename, err => {
            if (err) {
              return reject(err);
            }
            return resolve(realFilename);
          });
        } else {
          files[options.key].mv(realFilename, err => {
            if (err) {
              return reject(err);
            }
            return resolve(realFilename);
          });
        }
      } else {
        return reject(new Error("Invalid mime type"));
      }
    } catch (e) {
      throw e;
    }
  });
};

/**
 *
 * @param {Object} options The options to configure the fileupload module
 * @returns {Function} the express-fileupload module configured
 */
function fileUploadMiddleware(options) {
  return fileUpload(options);
}

module.exports = { PrepareFile, DeleteFile, fileUploadMiddleware };
