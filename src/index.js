"use strict";

const { fileUploadMiddleware } = require("./express/index");
const SocketIOFileUpload = require("./socketIO/index");
const { PrepareFile, DeleteFile } = require("./validators/index");
const { downloadRoute } = require("./express/routes/download");
const { uploadRoute } = require("./express/routes/upload");

class fileupload {
  constructor(opts, log = console) {
    console.log(opts);
    this.config = opts;
    this.log = log;
  }

  OnRequest() {
    console.log(this.config);
    return fileUploadMiddleware(this.config.express);
  }

  SocketIO() {
    console.log(this.config);
    return SocketIOFileUpload(this.config.socketIO, this.log);
  }

  DownloadRoute(downloadFn = null) {
    return downloadRoute(
      this.config.express.destination,
      this.config.express.key,
      downloadFn,
      this.log
    );
  }

  UploadRoute(uploadFn = null) {
    return uploadRoute(this.config.express, uploadFn, this.log);
  }

  PrepareFile(files, filename, label) {
    return PrepareFile(this.config.express, files, filename, label);
  }

  DeleteFile(filepath) {
    return DeleteFile(filepath);
  }
}

module.exports = fileupload;
