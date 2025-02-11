const { saveMessage } = require("../controller/messageController");

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
      message: content,
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
    });
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

function handleIceCandidate(socket, data) {
  const { userId, candidate } = data;
  const targetSocketId = onlineUsers.get(userId);

  if (targetSocketId) {
    socket.to(targetSocketId).emit('ice-candidate', candidate);
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

  // Add screen sharing handlers
  socket.on("screenShareOffer", (data) => { handleScreenShare(socket, data)});
  socket.on("screenShareAnswer", (data) =>
  {

    console.log("screen-share", data)
    
    handleScreenShareAnswer(socket, data)
  }
  );

  socket.on('ice-candidate', (data) => handleIceCandidate(socket, data));
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
