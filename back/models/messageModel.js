const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    replyTo: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "message",
      },
      content: Object,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    },
    forwardedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    content: {
      type: {
        type: String,
        enum: ["text", "file", "system", "call"],
        required: true,
      },
      content: String,
      fileUrl: String,
      fileType: String,
      size: String,
      timestamp: String,
      status: String,
      callType: String,
      duration: String,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "deleted"],
      default: "sent",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("message", messageSchema);
