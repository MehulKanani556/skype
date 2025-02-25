const groupModel = require("../models/groupModel");
const Message = require("../models/messageModel");

exports.saveMessage = async (messageData) => {
  try {
    console.log("messageData", messageData);
    const message = new Message({
      sender: messageData.senderId,
      receiver: messageData.receiverId,
      content: messageData.content,
      forwardedFrom: messageData.forwardedFrom,
      replyTo: messageData.replyTo,
    });
    await message.save();
    return message;
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
};

exports.getMessageHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender receiver", "userName email");

    return res.status(200).json({
      status: 200,
      message: "Messages retrieved successfully",
      data: messages,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

exports.getAllMessages = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    let pageSize = parseInt(req.query.pageSize);
    const userId = req.user._id;

    if (page < 1 || pageSize < 1) {
      return res.status(401).json({
        status: 401,
        message: "Page And PageSize Cann't Be Less Than 1",
      });
    }

    const { selectedId } = req.body;
    // console.log(selectedId);

    let paginatedUser;

    const group = await groupModel.findById(selectedId);

    if (group) {
      paginatedUser = await Message.find({
        receiver: selectedId,
        deletedFor: { $ne: userId },
      });
    } else {
      paginatedUser = await Message.find({
        $or: [
          { sender: userId, receiver: selectedId },
          { sender: selectedId, receiver: userId },
        ],
        deletedFor: { $ne: userId },
      });
    }

    let count = paginatedUser.length;

    if (page && pageSize) {
      let startIndex = (page - 1) * pageSize;
      let lastIndex = startIndex + pageSize;
      paginatedUser = await paginatedUser.slice(startIndex, lastIndex);
    }

    return res.status(200).json({
      status: 200,
      totalUsers: count,
      message: "All Users Found SuccessFully...",
      messages: paginatedUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    // console.log(messageId);

    // Find the message first to check if it exists and if the user has permission
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        status: 404,
        message: "Message not found",
      });
    }

    // Check if the user is either the sender or receiver of the message
    if (
      message.sender.toString() !== req.user._id.toString() &&
      message.receiver.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 403,
        message: "You don't have permission to delete this message",
      });
    }

    // await Message.findByIdAndUpdate(messageId, {
    //   content: { content: "deleted message", type: "text" },
    //   deletedAt: new Date(),
    //   status: "deleted",
    // });

    await Message.findByIdAndDelete(messageId);

    return res.status(200).json({
      status: 200,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    // Find the message first to check if it exists and if the user has permission
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        status: 404,
        message: "Message not found",
      });
    }

    // Only allow sender to update the message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 403,
        message: "You don't have permission to update this message",
      });
    }

    // Only allow updating text messages
    if (message.content.type !== "text") {
      return res.status(400).json({
        status: 400,
        message: "Only text messages can be updated",
      });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { content: { content, type: "text" }, edited: true },
      { new: true }
    );

    return res.status(200).json({
      status: 200,
      message: "Message updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.clearChat = async (req, res) => {
  try {
    const { selectedId } = req.body;
    const userId = req.user._id;

    // Find all messages between these users
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: selectedId },
        { sender: selectedId, receiver: userId },
      ],
    });

    // Add current user to deletedFor array for each message
    await Promise.all(
      messages.map(async (message) => {
        await Message.findByIdAndUpdate(message._id, {
          $addToSet: { deletedFor: userId },
        });
      })
    );

    return res.status(200).json({
      status: 200,
      message: "Chat cleared successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
