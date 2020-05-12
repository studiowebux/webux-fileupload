## Introduction

This module uses these NPM modules:

- express-fileupload
- image-type
- mime
- sharp
- socketio-file-upload

It allows to upload files using the express **Routes** and/or the **Socket.IO** implementation.  
When images are uploaded, there is some _validations and post processing_ available using the _sharp_ library.

For more details (EN/FR) : <a href="https://github.com/studiowebux/webux-fileupload/wiki" target="_blank">Wiki</a>

## Installation

```bash
npm install --save @studiowebux/fileupload
```

[NPM](https://www.npmjs.com/package/@studiowebux/fileupload)

## Usage

### Configurations

#### Options

The available options are split by upload mode, **express** and **socketIO**

```javascript
const opts = {
  express: {
    destination: path.join(__dirname, "./uploads"),
    tmp: path.join(__dirname, "./.tmp"),
    limits: {
      fileSize: "1024*1024*10",
    },
    sanitizeFilename: (filename) => {
      console.log(filename);

      return Promise.resolve(filename.split("").reverse().join(""));
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
    uploadValidator: (event, callback) => {
      // asynchronous operations allowed here; when done,
      if (true) {
        callback(true);
      } else {
        callback(false);
      }
    },
  },
};
```

### Express options

> all available options to configure : [express-fileupload](https://www.npmjs.com/package/express-fileupload)

| Option           | Description                                                                             |
| ---------------- | --------------------------------------------------------------------------------------- |
| destination      | The directory to store the uploaded files                                               |
| tmp              | The directory to store temporarily the files, this is used for post processing steps    |
| limits.filesize  | To specify the limit                                                                    |
| sanitizeFilename | A function to change the filename                                                       |
| abortOnLimit     | A boolean to cancel the upload when the limit is exceeded                               |
| safeFileNames    | A boolean to enable the filename stripping                                              |
| size             | the width size of images, if specified, the uploaded image will be resize automatically |
| mimeTypes        | The allowed mime types                                                                  |
| filetype         | Currently only 'image' and 'document' are handled                                       |
| key              | The key value to retrieve an uploaded file, it configures the `req.params[key]`         |

### SocketIO options

> all available options to configure : [socketio-file-upload](https://www.npmjs.com/package/socketio-file-upload)

| Option          | Description                               |
| --------------- | ----------------------------------------- |
| dir             | The directory to store the uploaded files |
| mode            | The file mode                             |
| maxFileSize     | To specify the limit                      |
| uploadValidator | To validate the file uploaded             |

### Functions

#### constructor(opts, log = console)

It initializes the configuration.

```javascript
const WebuxFileupload = require("@studiowebux/fileupload");

const webuxFileupload = new WebuxFileupload(opts, console);
```

> The `log` parameter allows to use a custom logger function.

#### OnRequest(): Function

It returns an express middleware to configure the file upload.  
It uses the `express` configuration object.

```javascript
...

app.post(
  "/upload",
  webuxFileupload.OnRequest(),
  (req, res, next)=>{...})
);

...
```

#### SocketIO(): Function

It returns the function to be use by the SocketIO Namespace dedicated to upload.  
It uses the `socketIO` configuration object.

```javascript
...

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
```

#### DownloadRoute(downloadFn = null): Function

It offers a default download route, this one can be use as is. But it is recommended to use your own function. See below for more details.

> The `downloadFn` is a custom function to add some logic.

With the default behavior,

```javascript
...

app.get("/defaultdownload/:file", webuxFileupload.DownloadRoute());

...
```

With a custom downloadFn,

```javascript
...

const downloadFn = (destination) => {
  return (req) => {
    return new Promise((resolve, reject) => {
      console.log("> Using custom download function");
      console.log(`> GET ${destination}/${req.params[opts.express.key]}`);

      // This function can be use to get data from the database
      // or other actions

      // Returns the path to the file
      return resolve(path.join(destination, req.params[opts.express.key]));
    });
  };
};

app.get("/download/:file", webuxFileupload.DownloadRoute(downloadFn));

...
```

##### The custom `downloadFn`

This function must contains

1. the **destination** (the upload directory) as parameter and must return a function that has the **express request** as parameter.
2. This function must returns a **promise** with the absolute path including the **filename** to download.

```javascript
function downloadFn(destination) {
  return (req) => {
    return Promise.resolve(
      path.join(destination, req.params[opts.express.key])
    );
  };
}
```

The function will be use by `DownloadRoute` that way : `webuxFileupload.DownloadRoute(downloadFn)`

#### Your own DownloadRoute

The default one is structured like this:

```javascript
const downloadRoute = (
  destination,
  key = "id",
  downloadFn = null,
  log = console
) => {
  return async (req, res, next) => {
    try {
      const pictureURL = await (downloadFn
        ? downloadFn(destination)(req)
        : download(req.params[key], destination));

      if (!pictureURL) {
        log.error(`Image not Found - ${pictureURL}`);
        return res.status(404).json({ message: "Image not found !" });
      }

      return res.sendFile(path.resolve(pictureURL), (err) => {
        if (err) {
          log.error(err);
          res
            .status(422)
            .json({ message: "Image unprocessable !", error: err });
        }
      });
    } catch (e) {
      log.error(e);
      res.status(422).json({ message: "Image unprocessable !", error: e });
    }
  };
};
```

#### UploadRoute(uploadFn = null): Function

It offers a default upload route, this one can be use as is. But it is recommended to use your own function. See below for more details.

> The `uploadFn` is a custom function to add some logic.

With the default behavior,

```javascript
...

app.post(
  "/upload",
  webuxFileupload.OnRequest(),
  webuxFileupload.UploadRoute()
);
...
```

With a custom uploadFn,

```javascript
...

const uploadFn = (filename) => {
  return (req) => {
    return new Promise(async (resolve, reject) => {
      // This function can be use to get data from the database
      // or other actions
      console.log(
        "> Using custom upload function and block the transaction is something wrong"
      );
      console.log(`> POST ${filename}`);

      let somethingWrong = false;

      if (somethingWrong) {
        console.log(filename);
        await webuxFileupload.DeleteFile(filename);

        return reject(new Error("You are not authorized to upload files"));
      }
      return resolve("File uploaded with success !");
    });
  };
};

app.post(
  "/upload",
  webuxFileupload.OnRequest(),
  webuxFileupload.UploadRoute(uploadFn)
);

...
```

##### The custom `uploadFn`

This function must contains

1. the **filename** (the complete path) as parameter and must return a function that has the **express request** as parameter.
2. This function must returns a **promise**.
3. To **reject** the uploaded file, you can return a **rejection** including an **error**.

```javascript
const uploadFn = (filename) => {
  return (req) => {
    return new Promise(async (resolve, reject) => {
      // This function can be use to get data from the database
      // or other actions
      console.log(
        "> Using custom upload function and block the transaction is something wrong"
      );
      console.log(`> POST ${filename}`);

      let somethingWrong = false;

      if (somethingWrong) {
        console.log(filename);
        await webuxFileupload.DeleteFile(filename);

        return reject(new Error("You are not authorized to upload files"));
      }
      return resolve("File uploaded with success !");
    });
  };
};
```

The function will be use by `UploadRoute` that way : `webuxFileupload.UploadRoute(uploadFn)`

#### Your own UploadRoute

The default one is structured like this:

```javascript
const uploadRoute = (opts, uploadFn = null, log = console) => {
  return async (req, res, next) => {
    try {
      const filename = await UploadFile(
        opts,
        req.files,
        req.files[opts.key].name
      );

      if (!filename) {
        log.error("Image not uploaded !");
        return res.status(422).json({ message: "Image not uploaded !" });
      }

      // It should have some interaction or something like that done
      (uploadFn ? uploadFn(filename)(req) : upload(filename))
        .then((uploaded) => {
          return res
            .status(200)
            .json({ message: "file uploaded !", name: filename, uploaded });
        })
        .catch((e) => {
          log.error(e.message);
          return res
            .status(422)
            .json({ message: "Image unprocessable !", error: e.message });
        });
    } catch (e) {
      log.error(e);
      return res
        .status(422)
        .json({ message: "Image unprocessable !", error: e });
    }
  };
};
```

#### UploadFile(files, filename, label): Promise \<String\>

This function prepares the file to be uploaded correctly.

> The `files` parameter has the array of files to upload (`req.files`)
> The `filename` parameter is the real filename (before any modification)
> The `label` parameter allows to add an identifier at the end of the filename

#### ProcessImage(filename, extension, file, realFilename): Promise \<String\>

It processes an uploaded image, currently it only resize images except gif.

> The `filename` parameter is the filename before any modification
> The `extension` parameter is the file extension
> The `file` parameter is the actual file or a path to access the uploaded file
> The `realFilename` parameter is the final file name (absolute path)

#### DeleteFile(filepath): Promise

It deletes the file passed in parameter.

> The `filepath` must be an absolute path.

## Quick Start

The complete example is available in `examples/example.js`.
The frontend (in VueJS) is available in `examples/frontend`.

The uploaded files will be stored in `uploads`

The complete example:

```javascript
const express = require("express");
const socketIO = require("socket.io");
const path = require("path");
const cors = require("cors");

const app = express();
const WebuxFileupload = require("@studiowebux/fileupload");

const opts = {
  express: {
    destination: path.join(__dirname, "./uploads"),
    tmp: path.join(__dirname, "./.tmp"),
    limits: {
      fileSize: "1024*1024*10",
    },
    sanitizeFilename: (filename) => {
      console.log(filename);

      return Promise.resolve(filename.split("").reverse().join(""));
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

// To expose the resources directly
// in case that you want to manage the access to the uploaded files,
// this is possible to use the `/download` route and add middlewares to secure the route
app.use("/public", express.static(opts.express.destination));

app.use(cors());

const webuxFileupload = new WebuxFileupload(opts);

// Default upload route
app.post(
  "/defaultupload",
  webuxFileupload.OnRequest(),
  webuxFileupload.UploadRoute()
);

// Custom uploadFn action
const uploadFn = (filename) => {
  return (req) => {
    return new Promise((resolve, reject) => {
      console.log("> Using custom upload function");
      console.log(`> POST ${filename}`);

      // This function can be use to get data from the database
      // or other actions

      // Returns true if the file can be uploaded
      return resolve(true);
    });
  };
};

// Custom upload route
app.post(
  "/upload",
  webuxFileupload.OnRequest(),
  webuxFileupload.UploadRoute(uploadFn)
);

// Block upload action
const blockUpload = (filename) => {
  return (req) => {
    return new Promise(async (resolve, reject) => {
      console.log("> Using custom upload function and block the transaction");
      console.log(`> POST ${filename}`);

      // This function can be use to get data from the database
      // or other actions
      console.log(filename);
      await webuxFileupload.DeleteFile(filename);

      return reject(new Error("You are not authorized to upload files"));
    });
  };
};

// To test when the upload is rejected
app.post(
  "/blockupload",
  webuxFileupload.OnRequest(),
  webuxFileupload.UploadRoute(blockUpload)
);

// custom downloadFn action
const downloadFn = (destination) => {
  return (req) => {
    return new Promise((resolve, reject) => {
      console.log("> Using custom download function");
      console.log(`> GET ${destination}/${req.params[opts.express.key]}`);

      // This function can be use to get data from the database
      // or other actions

      // Returns the path to the file
      return resolve(path.join(destination, req.params[opts.express.key]));
    });
  };
};

// Custom download route
app.get("/download/:file", webuxFileupload.DownloadRoute(downloadFn));

// Default download route
app.get("/defaultdownload/:file", webuxFileupload.DownloadRoute());

// Start the express server
let server = app.listen(1340, () => {
  console.log("Server listening on port 1340");
});

// Attaches the socketIO to the express server
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
```

## Videos and other resources

## Contribution

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## license

SEE LICENSE IN license.txt

# TBD

# Webux Fileupload

This module is a wrapper for express-fileupload
Currently you can only upload files locally and in .png format

## Installation

```bash
npm i --save @studiowebux/fileupload
```

## Usage

How it works,  
You have to create the routes and the actions to get a working module.
I recommend you to check the examples/ directory for more details.

### The options

For more details, please read the express-fileupload documentation.

```
module.exports = {
  destination: path.join(__dirname, "../uploads"),
  tmp: path.join(__dirname, "../.tmp"),
  limits: {
    fileSize: "1024*1024*10"
  },
  abortOnLimit: true,
  safeFileNames: true,
  size: 200,
  mimeTypes: [
    "image/gif",
    "image/png",
    "image/jpeg",
    "image/bmp",
    "image/webp"
  ],
  filetype: ".png",
  key: "picture"
};
```

### Example

This example need adaptation to work with a real environment.

the files structure:

```
.tmp/
config/
  upload.js
uploads/
index.js
```

index.js

```
const express = require("express");
const app = express();
const path = require("path");
const router = express.Router();
const { UploadFile, DeleteFile, fileUploadMiddleware } = require("@studiowebux/fileupload");
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
  return Promise.resolve("./uploads/5d2fb7606df7688537f20b6d.png");
};

// route
const downloadRoute = async (req, res, next) => {
  try {
    const pictureURL = await download("some ID");

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
    const filename = await UploadFile(
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

router["get"]("/download", downloadRoute);
router["post"]("/upload", fileUploadMiddleware(options), uploadRoute);

app.use(router);

app.listen(1337, () => {
  console.log("Server is listening ...");
});

```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

SEE LICENSE IN license.txt
