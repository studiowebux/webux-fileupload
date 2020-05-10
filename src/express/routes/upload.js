// TBD

const { DeleteFile, PrepareFile } = require("../../validators/index");

// action
const upload = async (filename) => {
  // If any error occured,
  // by doing this you we will be able to delete the file
  // if (error) {
  //   // if something went wrong,
  //   DeleteFile(filename);
  //   throw new Error("An error occured !");
  // }

  // Default function to upload file.
  return Promise.resolve(`file '${filename}' uploaded !`);
};

// route
const uploadRoute = (opts, uploadFn = null, log = console) => {
  return async (req, res, next) => {
    try {
      log.debug("Default - uploadRoute");
      log.debug(req.files);
      log.debug(opts);
      const filename = await PrepareFile(
        opts,
        req.files,
        req.files[opts.key].name
      );

      if (!filename) {
        log.error("Image not uploaded !");
        return res.status(422).json({ message: "Image not uploaded !" });
      }

      // It should have some interaction or something like that done
      await (uploadFn ? uploadFn(req, filename) : upload(filename));
      log.debug("file uploaded !");

      return res
        .status(200)
        .json({ message: "file uploaded !", name: filename });
    } catch (e) {
      log.error(e);
      return res
        .status(422)
        .json({ message: "Image unprocessable !", error: e });
    }
  };
};

module.exports = { upload, uploadRoute };
