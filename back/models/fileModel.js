const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  // Optional: Add more fields as needed
  originalName: String,
  extension: String,
  isDeleted: {
    type: Boolean,
    default: false,
  },
  metadata: {
    width: Number, // For images
    height: Number, // For images
    duration: Number, // For audio/video
    format: String, // File format
  },
});

// Add indexes for better query performance
fileSchema.index({ userId: 1 });
fileSchema.index({ uploadDate: -1 });

// Add a virtual property for file URL
fileSchema.virtual("fileUrl").get(function () {
  return `${process.env.SERVER_URL}/${this.path}`;
});

// Add methods if needed
fileSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  return await this.save();
};

const FileModel = mongoose.model("File", fileSchema);

module.exports = FileModel;
