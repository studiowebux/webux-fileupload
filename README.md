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
const { PrepareFile, DeleteFile, fileUploadMiddleware } = require("@studiowebux/fileupload");
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
