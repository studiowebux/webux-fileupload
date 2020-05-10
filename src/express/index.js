// TBD

const fileUpload = require("express-fileupload");

/**
 *
 * @param {Object} options The options to configure the fileupload module
 * @returns {Function} the express-fileupload module configured
 */
function fileUploadMiddleware(options) {
  return fileUpload(options);
}

module.exports = { fileUploadMiddleware };
