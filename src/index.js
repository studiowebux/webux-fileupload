"use strict";

const fileUpload = require("express-fileupload");

class fileupload {
  constructor(opts, log = console){
    this.httpFileUpload = fileUpload(opts.http);
    this.httpFileUpload = fileUpload(opts.http);
  }

  

}