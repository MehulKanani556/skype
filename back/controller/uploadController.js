const FileModel = require("../models/fileModel");

const uploadController = {
  uploadFile: async (req, res) => {
    try {
      const file = req.file;
      // console.log("file", file);

      // Save file details to your database
      const fileDoc = await FileModel.create({
        filename: file.originalname,
        path: file.path,
        type: file.mimetype,
        size: file.size,
        userId: req.user._id, // Assuming you have user authentication
        uploadDate: new Date(),
      });

      // Return the file URL and type
      res.status(200).json({
        fileUrl: `${file.path}`,
        fileType: file.mimetype,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  },
};

module.exports = uploadController;
