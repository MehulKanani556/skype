const Message = require("../models/messageModel");

exports.saveMessage = async (messageData) => {
  try {
    const message = new Message({
      sender: messageData.senderId,
      receiver: messageData.receiverId,
      content: messageData.message,
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
