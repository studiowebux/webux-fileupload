// Require the libraries:
var SocketIOFileUpload = require("socketio-file-upload"),
  socketio = require("socket.io"),
  express = require("express");

// Make your Express server:
var app = express()
  // .use(SocketIOFileUpload.router)
  .use(express.static(__dirname + "/public"))
  .listen(1340);

// Start up Socket.IO:
var io = socketio.listen(app);

io.on("connection", function (socket) {
  console.log("'Default' > Hello - " + socket.id);

  socket.on("disconnect", (e) => {
    console.log("'Default' > Bye Bye " + socket.id);
    console.log(e);
  });
});

io.of("upload").on("connection", function (socket) {
  console.log("'upload' > Hello - " + socket.id);

  socket.on("disconnect", (e) => {
    console.log("'upload' > Bye Bye " + socket.id);
    console.log(e);
  });
  // Make an instance of SocketIOFileUpload and listen on this socket:
  var uploader = new SocketIOFileUpload();
  uploader.dir = "./public";
  uploader.listen(socket);

  // Do something when a file is saved:
  uploader.on("saved", function (event) {
    console.log(event.file);
  });

  // Do something when a file start to upload:
  uploader.on("start", function (event) {
    console.log("STart");
    console.log(event);
  });

  // Do something when a file is in progress:
  uploader.on("progress", function (event) {
    console.log("progress");
    console.log(event);
  });

  // Do something when a file is complete:
  uploader.on("complete", function (event) {
    console.log(event);
  });

  // Error handler:
  uploader.on("error", function (event) {
    console.log("Error from uploader", event);
  });
});
