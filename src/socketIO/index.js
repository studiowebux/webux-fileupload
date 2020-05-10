// TBD
let SocketIOFileUpload = require("socketio-file-upload");

// https://github.com/sffc/socketio-file-upload
// instance.dir = "/path/to/upload/directory"
// instance.mode = "0666"
// instance.maxFileSize = null
// instance.emitChunkFail = false
// instance.uploadValidator(event, callback)
// instance.topicName = "siofu" (see client)
// instance.wrapData = false (see client)
// instance.exposePrivateFunction = false (see client)

// io.of("upload").on("connection", /* this import */ );

// Tbd
module.exports = (opts, log = console) => {
  return function (socket) {
    log.debug("'upload' > Hello - " + socket.id);

    socket.on("disconnect", (r) => {
      log.debug("'upload' > Bye Bye " + socket.id);
      log.debug(r);
    });
    // Make an instance of SocketIOFileUpload and listen on this socket:
    var uploader = new SocketIOFileUpload(opts);

    uploader.listen(socket);

    // Do something when a file is saved:
    uploader.on("saved", function (event) {
      log.debug(event.file);
    });

    // Do something when a file start to upload:
    uploader.on("start", function (event) {
      log.debug("STart");
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
  };
};
