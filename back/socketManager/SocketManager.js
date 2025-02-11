const { saveMessage } = require("../controller/messageController");
const Message = require("../models/messageModel");
const {
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupById,
  findGroupById,
} = require("../controller/groupController");

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
      receiverId,
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
        content,
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
  console.log("Handling screen share request:", {
    receiverId,
    senderId,
    offer,
  });

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
  // console.log("aa", data);
  const { senderId, answer } = data;
  const senderSocket = onlineUsers.get(senderId);

  if (senderSocket) {
    socket.to(senderSocket).emit("screenShareAnswer", {
      answer,
      from: socket.userId,
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
      type, // 'video' or 'audio'
    });
  }
}

function handleCallAnswer(socket, data) {
  const { to, answer } = data;
  const callerSocketId = onlineUsers.get(to);

  if (callerSocketId) {
    socket.to(callerSocketId).emit("callAnswer", {
      answer,
    });
  }
}

function handleIceCandidate(socket, data) {
  const { to, candidate } = data;
  console.log("candidate", data);
  const targetSocketId = onlineUsers.get(to);

  if (targetSocketId) {
    socket.to(targetSocketId).emit("ice-candidate", {
      candidate,
      from: socket.userId,
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

function handleCreateGroup(socket, data) {
  const { name, members } = data;
  const groupId = createGroup(name, members);
  socket.emit("group-created", { groupId, name, members });
}

function handleUpdateGroup(socket, data) {
  const { groupId, name, members } = data;
  updateGroup(groupId, name, members);
  socket.emit("group-updated", { groupId, name, members });
}

function handleDeleteGroup(socket, groupId) {
  deleteGroup(groupId);
  socket.emit("group-deleted", groupId);
}

async function handleGroupMessage(socket, data) {
  const { groupId, senderId, content } = data;
  console.log("Handling group message:", data, socket.id);

  try {
    // Save message to database (you may need to adjust this part)
    await saveMessage({
      senderId,
      receiverId: groupId,
      content,
    });

    async function getGroupMembers(groupId) {
      // Assuming you have a way to get group members from your database or in-memory store
      const group = await findGroupById(groupId); // Implement this function to retrieve the group
      console.log("group", group);
      return group.members.map(memberId => onlineUsers.get(memberId.toString())).filter(Boolean);
    }

    const groupMembers = await getGroupMembers(groupId);
       console.log("Group members' socket IDs:", groupMembers); // Log the socket IDs

       groupMembers.forEach(memberSocketId => {
         if (memberSocketId !== socket.id) {
           socket.to(memberSocketId).emit("receive-group", {
             _id: Date.now().toString(),
             sender: senderId,
             content: content,
             createdAt: new Date().toISOString(),
           });
         }
       });
  } catch (error) {
    console.error("Error handling group message:", error);
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
  socket.on("delete-message", (messageId) =>
    handleDeleteMessage(socket, messageId)
  );

  // Handle message update
  socket.on("update-message", (data) => handleUpdateMessage(socket, data));

  // Add screen sharing handlers
  socket.on("screenShareOffer", (data) => handleScreenShare(socket, data));
  socket.on("screenShareAnswer", (data) =>
    handleScreenShareAnswer(socket, data)
  );

  // =====calll======
  socket.on("callOffer", (data) => handleCallOffer(socket, data));
  socket.on("callAnswer", (data) => handleCallAnswer(socket, data));
  socket.on("ice-candidate", (data) => handleIceCandidate(socket, data));
  socket.on("endCall", (data) => handleCallEnd(socket, data));

  // Add group handlers
  socket.on("create-group", (data) => handleCreateGroup(socket, data));
  socket.on("update-group", (data) => handleUpdateGroup(socket, data));
  socket.on("delete-group", (groupId) => handleDeleteGroup(socket, groupId));

  // Handle group messages
  socket.on("group-message", (data) => handleGroupMessage(socket, data));
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
