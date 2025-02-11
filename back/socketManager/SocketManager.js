const { saveMessage } = require("../controller/messageController");
const Message = require("../models/messageModel");

const onlineUsers = new Map();

function handleUserLogin(socket, userId) {
  onlineUsers.set(userId, socket.id);
  socket.userId = userId; // Store userId in socket for easy access

  // Broadcast updated online users list
  socket.broadcast.emit("user-status-changed", Array.from(onlineUsers.keys()));
  console.log("User logged in:", userId);
}

function getSocketByUserId(userId) {
  console.log("userId", userId, onlineUsers);
  const socketId = onlineUsers.get(userId);
  if (socketId && global.io && global.io.sockets) {
    return global.io.sockets.get(socketId);
  }
  return null;
}

async function handlePrivateMessage(socket, data) {
  const { senderId, receiverId, content } = data;
  console.log("Handling private message:", data);

  try {
    // Save message to database
    await saveMessage({
      senderId,
      receiverId,
      content: content,
    });

    const receiverSocketId = onlineUsers.get(receiverId);
    console.log("Receiver socket ID:", receiverSocketId);

    if (receiverSocketId) {
      // Send to receiver
      socket.to(receiverSocketId).emit("receive-message", {
        _id: Date.now().toString(),
        sender: senderId,
        content: content,
        createdAt: new Date().toISOString(),
      });

      // Confirm delivery to sender
      socket.emit("message-sent-status", {
        messageId: Date.now(),
        status: "delivered",
      });
    } else {
      console.log("Receiver is offline:", receiverId);
      // Receiver is offline - save message and mark as pending
      socket.emit("message-sent-status", {
        messageId: Date.now(),
        status: "pending",
      });
    }
  } catch (error) {
    console.error("Error handling private message:", error);
    socket.emit("message-sent-status", {
      messageId: Date.now(),
      status: "failed",
      error: error.message,
    });
  }
}

function handleTypingStatus(socket, data) {
  const { senderId, receiverId, isTyping } = data;
  const receiverSocketId = onlineUsers.get(receiverId);

  if (receiverSocketId) {
    socket.to(receiverSocketId).emit("user-typing", {
      userId: senderId,
      isTyping,
      receiverId
    });
  }
}

async function handleDeleteMessage(socket, messageId) {
  try {

    console.log("messageId", messageId);
    // Assuming the message document contains senderId and receiverId
    const message = await Message.findById(messageId);
    if (!message) return;

    console.log("message", message.receiver.toString());

    // Notify the other user about the message deletion
    const receiverSocketId = onlineUsers.get(message.receiver.toString());
    console.log("receiverSocketId", receiverSocketId);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("message-deleted", messageId);
    }

  } catch (error) {
    console.error("Error handling message deletion:", error);
  }
}

async function handleUpdateMessage(socket, data) {
  try {
    const { messageId, content } = data;
    const message = await Message.findById(messageId);
    if (!message) return;

    // Notify the other user about the message update
    const receiverSocketId = onlineUsers.get(message.receiver.toString());
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("message-updated", {
        messageId,
        content
      });
    }
  } catch (error) {
    console.error("Error handling message update:", error);
  }
}

function handleDisconnect(socket) {
  if (socket.userId) {
    onlineUsers.delete(socket.userId);
    // Broadcast updated online users list
    socket.broadcast.emit(
      "user-status-changed",
      Array.from(onlineUsers.keys())
    );
  }
  console.log("User disconnected:", socket.id);
}

function handleScreenShare(socket, data) {
  const { receiverId, senderId, offer } = data;
  console.log("Handling screen share request:", { receiverId, senderId, offer });
  
  const receiverSocketId = onlineUsers.get(receiverId);

  if (receiverSocketId) {
    socket.to(receiverSocketId).emit("screenShareOffer", {
      senderId,
      offer,
    });
    console.log("Screen share offer sent to:", receiverId);
  } else {
    socket.emit("screenShare-error", {
      error: "Receiver is offline",
      receiverId,
    });
  }
}


function handleScreenShareAnswer(socket, data) {
  console.log("aa",data)
  const { senderId, answer } = data;
  const senderSocket = onlineUsers.get(senderId);

  if (senderSocket) {
    socket.to(senderSocket).emit("screenShareAnswer", {
      answer,
    });
  }
}


// ===========================call=============================


function handleCallOffer(socket, data) {
  const { to, from, offer, type } = data;
  const receiverSocketId = onlineUsers.get(to);

  if (receiverSocketId) {
    socket.to(receiverSocketId).emit("callOffer", {
      from,
      offer,
      type // 'video' or 'audio'
    });
  }
}

function handleCallAnswer(socket, data) {
  const { to, answer } = data;
  const callerSocketId = onlineUsers.get(to);

  if (callerSocketId) {
    socket.to(callerSocketId).emit("callAnswer", {
      answer
    });
  }
}

function handleIceCandidate(socket, data) {
  const { to, candidate } = data;
  const targetSocketId = onlineUsers.get(to);

  if (targetSocketId) {
    socket.to(targetSocketId).emit("iceCandidate", {
      candidate
    });
  }
}

function handleCallEnd(socket, data) {
  const { to } = data;
  const targetSocketId = onlineUsers.get(to);

  if (targetSocketId) {
    socket.to(targetSocketId).emit("callEnded");
  }
}

function handleConnection(socket) {
  console.log("User connected:", socket.id);

  // Handle user login
  socket.on("user-login", (userId) => handleUserLogin(socket, userId));

  // Handle private messages
  socket.on("private-message", (data) => handlePrivateMessage(socket, data));

  // Handle typing status
  socket.on("typing-status", (data) => handleTypingStatus(socket, data));

  // Handle disconnection
  socket.on("disconnect", () => handleDisconnect(socket));

  // Handle message deletion
  socket.on("delete-message", (messageId) => handleDeleteMessage(socket, messageId));

  // Handle message update
  socket.on("update-message", (data) => handleUpdateMessage(socket, data));

  // Add screen sharing handlers
  socket.on("screenShareOffer", (data) => { handleScreenShare(socket, data)});
  socket.on("screenShareAnswer", (data) =>
  {

    console.log("screen-share", data)
    
    handleScreenShareAnswer(socket, data)
  }
  );

  // =====calll======
  socket.on("callOffer", (data) => handleCallOffer(socket, data));
  socket.on("callAnswer", (data) => handleCallAnswer(socket, data));
  socket.on("iceCandidate", (data) => handleIceCandidate(socket, data));
  socket.on("endCall", (data) => handleCallEnd(socket, data));
}

function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}

module.exports = {
  handleConnection,
  handleDisconnect,
  getOnlineUsers,
  getSocketByUserId,
};
