const express = require("express");
const app = express();
const socketIO = require("socket.io");
const path = require("path");
const cors = require("cors");

const WebuxFileupload = require("../src/index");

const opts = {
  express: {
    destination: path.join(__dirname, "./uploads"),
    tmp: path.join(__dirname, "./.tmp"),
    limits: {
      fileSize: "1024*1024*10",
    },
    abortOnLimit: true,
    safeFileNames: true,
    size: 200,
    mimeTypes: [
      "image/gif",
      "image/png",
      "image/jpeg",
      "image/bmp",
      "image/webp",
    ],
    filetype: "image",
    key: "file",
  },
  socketIO: {
    dir: path.join(__dirname, "./uploads"),
    mode: "0666",
    maxFileSize: null,
    emitChunkFail: false,
    uploadValidator: (event, callback) => {
      // asynchronous operations allowed here; when done,
      if (true) {
        callback(true);
      } else {
        callback(false);
      }
    },
    topicName: "siofu",
    wrapData: false,
    exposePrivateFunction: false,
  },
};

app.use(
  "/public",
  express.static(path.join(__dirname, opts.express.destination))
);

app.use(cors());

const webuxFileupload = new WebuxFileupload(opts);

app.post("/upload", webuxFileupload.OnRequest(), webuxFileupload.UploadRoute());

const downloadFn = (filename, destination) => {
  console.log("Using custom download function");
  console.log(`GET ${destination}/${filename}`);

  // This function can be use to get data from the database
  // or other actions
};

app.post(
  "/download",
  webuxFileupload.DownloadRoute(downloadFn(opts.express.destination))
);

let server = app.listen(1340, () => {
  console.log("Server listening on port 1340");
});

let io = socketIO.listen(server);

// default namespace
io.on("connection", function (socket) {
  console.log("'Default' > Hello - " + socket.id);

  socket.on("disconnect", (e) => {
    console.log("'Default' > Bye Bye " + socket.id);
    console.log(e);
  });
});

// upload namespace
io.of("upload").on("connection", webuxFileupload.SocketIO());
