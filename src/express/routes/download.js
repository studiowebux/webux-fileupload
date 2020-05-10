// TBD

const path = require("path");

// action
const download = (opts) => {
  return (filename) => {
    // Default function to get started quickly
    return Promise.resolve(path.join(opts.destination, filename));
  };
};

// route
const downloadRoute = (
  uploadDir,
  key = "id",
  downloadFn = null,
  log = console
) => {
  return async (req, res, next) => {
    try {
      const pictureURL =
        (await downloadFn(req)(uploadDir)) ||
        download(req.params[key], uploadDir);

      if (!pictureURL) {
        return res.status(404).json({ message: "Image not found !" });
      }

      return res.sendFile(path.resolve(pictureURL), (err) => {
        if (err) {
          res
            .status(422)
            .json({ message: "Image unprocessable !", error: err });
        }
      });
    } catch (e) {
      res.status(422).json({ message: "Image unprocessable !", error: e });
    }
  };
};

module.exports = { downloadRoute };
