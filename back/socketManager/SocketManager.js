const { saveMessage } = require("../controller/messageController");
const Message = require("../models/messageModel");
const {
  deleteGroup,
  getGroupById,
  findGroupById,
} = require("../controller/groupController");
const User = require("../models/userModels");

const onlineUsers = new Map();

async function handleUserLogin(socket, userId) {
  // Remove any existing socket connection for this user
  for (const [existingUserId, existingSocketId] of onlineUsers.entries()) {
    if (existingUserId === userId && existingSocketId !== socket.id) {
      const existingSocket = global.io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.disconnect();
      }
      onlineUsers.delete(existingUserId);
    }
  }

  // Add new socket connection
  onlineUsers.set(userId, socket.id);
  socket.userId = userId;

  // Broadcast updated online users list to all connected clients
  const onlineUsersList = Array.from(onlineUsers.keys());
  global.io.emit("user-status-changed", onlineUsersList);

  try {
    // Find all unread messages for this user
    const pendingMessages = await Message.find({
      receiver: userId,
      status: "sent",
    });

    if (pendingMessages.length > 0) {
      // Update status to delivered
      for (const message of pendingMessages) {
        await Message.findByIdAndUpdate(message._id, { status: "delivered" });

        // Notify sender about delivery
        const senderSocketId = onlineUsers.get(message.sender.toString());
        if (senderSocketId) {
          socket.to(senderSocketId).emit("message-sent-status", {
            messageId: message._id,
            status: "delivered",
          });
        }
      }
    }
  } catch (error) {
    console.error("Error updating pending messages:", error);
  }

  // console.log("User logged in:", userId);
  // console.log("Current online users:", onlineUsersList);
}

function getSocketByUserId(userId) {
  // console.log("userId", userId, onlineUsers);
  const socketId = onlineUsers.get(userId);
  if (socketId && global.io && global.io.sockets) {
    return global.io.sockets.get(socketId);
  }
  return null;
}

async function handlePrivateMessage(socket, data) {
  const { senderId, receiverId, content } = data;
  // console.log("Handling private message:", data);

  try {
    // Save message to database with initial status 'sent'
    const savedMessage = await saveMessage({
      senderId,
      receiverId,
      content: content,
      status: "sent", // Add initial status
    });

    const receiverSocketId = onlineUsers.get(receiverId);
    // console.log("Receiver socket ID:", receiverSocketId);

    if (receiverSocketId) {
      // Send to receiver
      socket.to(receiverSocketId).emit("receive-message", {
        _id: savedMessage._id,
        sender: senderId,
        content: content,
        createdAt: savedMessage.createdAt,
        status: "delivered", // Set status to delivered for online users
      });

      // Update message status to delivered in database
      await Message.findByIdAndUpdate(savedMessage._id, {
        status: "delivered",
      });

      // Confirm delivery to sender
      socket.emit("message-sent-status", {
        messageId: savedMessage._id,
        status: "delivered",
      });
    } else {
      // console.log("Receiver is offline:", receiverId);
      // Receiver is offline - message stays as 'sent'
      socket.emit("message-sent-status", {
        messageId: savedMessage._id,
        status: "sent",
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

// ===========================handle message read status=============================
async function handleMessageRead(socket, data) {
  const { messageId, readerId } = data;

  try {
    // Update message status to 'read' in database
    await Message.findByIdAndUpdate(messageId, { status: "read" });

    // Get sender's socket ID to notify them
    const message = await Message.findById(messageId);
    const senderSocketId = onlineUsers.get(message.sender.toString());

    if (senderSocketId) {
      // Notify sender that message was read
      socket.to(senderSocketId).emit("message-read", {
        messageId,
        readerId,
      });
    }
  } catch (error) {
    console.error("Error handling message read status:", error);
  }
}

// ===========================handle typing status=============================
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
    // console.log("messageId", messageId);
    // Assuming the message document contains senderId and receiverId
    const message = await Message.findById(messageId);
    if (!message) return;

    // console.log("message", message.receiver.toString());

    // Notify the other user about the message deletion
    const receiverSocketId = onlineUsers.get(message.receiver.toString());
    // console.log("receiverSocketId", receiverSocketId);
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

// ===========================screen share=============================

function handleScreenShareRequest(socket, data) {
  if (data.isGroup) {
    // For group sharing, forward to specific member
    const targetSocketId = onlineUsers.get(data.toEmail);
    if (targetSocketId) {
      socket.to(targetSocketId).emit("screen-share-request", {
        fromEmail: data.fromEmail,
        signal: data.signal,
        groupId: data.groupId,
        isGroup: true,
      });
    }
  } else {
    // Original single-user logic
    const targetSocketId = onlineUsers.get(data.toEmail);
    if (targetSocketId) {
      socket.to(targetSocketId).emit("screen-share-request", {
        fromEmail: data.fromEmail,
        signal: data.signal,
        isGroup: false,
      });
    }
  }
}

function handleScreenShareAccept(socket, data) {
  const targetSocketId = onlineUsers.get(data.fromEmail);
  if (targetSocketId) {
    socket.to(targetSocketId).emit("share-accepted", {
      signal: data.signal,
      fromEmail: data.toEmail,
      groupId: data.groupId,
      isGroup: data.isGroup,
    });
  }
}

function handleScreenShareSignal(socket, data) {
  const targetSocketId = onlineUsers.get(data.toEmail);
  if (targetSocketId) {
    socket.to(targetSocketId).emit("share-signal", {
      signal: data.signal,
    });
  }
}

// ===========================Video call=============================

function handleVideoCallRequest(socket, data) {
  const targetSocketId = onlineUsers.get(data.toEmail);
  if (targetSocketId) {
    socket.to(targetSocketId).emit("video-call-request", {
      fromEmail: data.fromEmail,
      signal: data.signal,
    });
  }
}

function handleVideoCallAccept(socket, data) {
  const targetSocketId = onlineUsers.get(data.fromEmail);
  if (targetSocketId) {
    socket.to(targetSocketId).emit("video-call-accepted", {
      signal: data.signal,
      fromEmail: data.toEmail,
    });
  }
}

function handleVideoCallSignal(socket, data) {
  const targetSocketId = onlineUsers.get(data.toEmail);
  if (targetSocketId) {
    socket.to(targetSocketId).emit("video-call-signal", {
      signal: data.signal,
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
  // console.log("candidate", data);
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


// ================ Handle save call message================
async function handleSaveCallMessage(socket, data) {
  try {
    const { senderId, receiverId, callType, status, duration, timestamp } = data;
    
    // Format duration string if exists
    let durationStr = '';
    if (duration) {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Create message content based on status
    let content = {
      type: "call",
      callType,
      status,
      timestamp
    };

    // Add duration for ended calls
    if (status === 'ended') {
      content.duration = durationStr;
    }

    // Save the message
    const savedMessage = await saveMessage({
      senderId,
      receiverId,
      content,
    });

    // Emit to both sender and receiver
    const senderSocket = onlineUsers.get(senderId);
    const receiverSocket = onlineUsers.get(receiverId);

    if (senderSocket) {
      socket.to(senderSocket).emit("receive-message", savedMessage);
    }
    if (receiverSocket) {
      socket.to(receiverSocket).emit("receive-message", savedMessage);
    }

  } catch (error) {
    console.error("Error saving call message:", error);
  }
}

// ===========================group=============================

async function handleCreateGroup(socket, data) {
  try {
    const { members, userName, createdBy } = data;
    console.log("members", members, data);

    const createdByUser = await User.findById(createdBy);

    // Create system message for group creation
    const systemMessage = await saveMessage({
      senderId: createdBy,
      receiverId: data._id, // group ID
      content: {
        type: "system",
        content: `**${createdByUser.userName}** created the group`,
      },
    });

    // Create system messages for each member added
    for (const memberId of members) {
      const memberName = await User.findById(memberId); // Function to get user name by ID
      if (createdBy !== memberId) {
        await saveMessage({
          senderId: createdBy,
          receiverId: data._id,
          content: {
            type: "system",
            content: `**${createdByUser.userName}** added **${memberName.userName}** to this conversation`,
          },
        });
      }
    }

    // Emit to all members of the group
    members.forEach((memberId) => {
      const memberSocket = onlineUsers.get(memberId.toString());
      console.log("memberSocket", memberSocket);
      if (memberSocket) {
        socket.to(memberSocket).emit("group-updated", {
          type: "created",
          group: data,
        });
      }
    });
  } catch (error) {
    console.error("Error creating group:", error);
  }
}

async function handleUpdateGroup(socket, data) {
  const { groupId, name, members } = data;
  try {
    // const updatedGroup = await updateGroup(groupId, name, members);
    // Emit to all members of the group
    members.forEach((memberId) => {
      const memberSocket = onlineUsers.get(memberId);
      if (memberSocket) {
        socket.to(memberSocket).emit("group-updated", {
          type: "updated",
          // group: updatedGroup,
        });
      }
    });
  } catch (error) {
    console.error("Error updating group:", error);
  }
}

async function handleDeleteGroup(socket, groupId) {
  try {
    const group = await getGroupById(groupId);
    await deleteGroup(groupId);
    // Emit to all members of the group
    group.members.forEach((memberId) => {
      const memberSocket = onlineUsers.get(memberId.toString());
      if (memberSocket) {
        socket.to(memberSocket).emit("group-updated", {
          type: "deleted",
          groupId,
        });
      }
    });
  } catch (error) {
    console.error("Error deleting group:", error);
  }
}

async function handleGroupMessage(socket, data) {
  const { groupId, senderId, content } = data;
  // console.log("Handling group message:", data, socket.id);

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
      // console.log("group", group);
      return group.members
        .map((memberId) => onlineUsers.get(memberId.toString()))
        .filter(Boolean);
    }

    const groupMembers = await getGroupMembers(groupId);
    // console.log("Group members' socket IDs:", groupMembers); // Log the socket IDs

    groupMembers.forEach((memberSocketId) => {
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

// ===========================socket connection=============================

function handleDisconnect(socket) {
  if (socket.userId) {
    onlineUsers.delete(socket.userId);
    // Broadcast updated online users list
    const onlineUsersList = Array.from(onlineUsers.keys());
    global.io.emit("user-status-changed", onlineUsersList);

    // console.log("User disconnected:", socket.userId);
    // console.log("Current online users:", onlineUsersList);
  }
}

async function getOnlineUsers(req, res) {
  // console.log("onlineUsers", onlineUsers);
  const onlineUsersArray = Array.from(onlineUsers.keys());
  // console.log("onlineUsersArray", onlineUsersArray);

  return res.status(200).json(onlineUsersArray);
  // return onlineUsersArray;
}

// Add new function to handle group member retrieval
async function handleGetGroupMembers(socket, groupId) {
  try {
    const group = await findGroupById(groupId);
    if (!group) {
      socket.emit("error", { message: "Group not found" });
      return;
    }

    socket.emit("group-members", {
      members: group.members,
    });
  } catch (error) {
    console.error("Error getting group members:", error);
    socket.emit("error", { message: "Failed to get group members" });
  }
}

function initializeSocket(io) {
  io.on("connection", (socket) => {
    console.log("New socket connection:", socket.id);

    // socket.on("user-login", (userId) => {
    //   handleUserLogin(socket, userId);
    // });

    socket.on("user-login", async (userId) => {
      handleUserLogin(socket, userId);
    });

    // Handle disconnection
    socket.on("disconnect", () => handleDisconnect(socket));

    // Handle private messages
    socket.on("private-message", (data) => handlePrivateMessage(socket, data));

    // Add handler for message read status
    socket.on("message-read", (data) => handleMessageRead(socket, data));

    // Handle typing status
    socket.on("typing-status", (data) => handleTypingStatus(socket, data));

    // Handle message deletion
    socket.on("delete-message", (messageId) =>
      handleDeleteMessage(socket, messageId)
    );

    // Handle message update
    socket.on("update-message", (data) => handleUpdateMessage(socket, data));

    // ===========================screen share=============================
    socket.on("screen-share-request", (data) =>
      handleScreenShareRequest(socket, data)
    );
    socket.on("share-accept", (data) => handleScreenShareAccept(socket, data));
    socket.on("share-signal", (data) => handleScreenShareSignal(socket, data));

    // ===========================Video call=============================
    socket.on("video-call-request", (data) =>
      handleVideoCallRequest(socket, data)
    );
    socket.on("video-call-accept", (data) =>
      handleVideoCallAccept(socket, data)
    );
    socket.on("video-call-signal", (data) =>
      handleVideoCallSignal(socket, data)
    );

    // ===========================save call message=============================

    socket.on("save-call-message", (data) => handleSaveCallMessage(socket, data));

    // ===========================call=============================
    socket.on("callOffer", (data) => handleCallOffer(socket, data));
    socket.on("callAnswer", (data) => handleCallAnswer(socket, data));
    socket.on("ice-candidate", (data) => handleIceCandidate(socket, data));
    socket.on("endCall", (data) => handleCallEnd(socket, data));

    // Add group handlers
    socket.on("create-group", (data) => handleCreateGroup(socket, data));
    // socket.on("create-group", (data) => console.log("create-group", data));
    socket.on("update-group", (data) => handleUpdateGroup(socket, data));
    socket.on("delete-group", (groupId) => handleDeleteGroup(socket, groupId));

    // Handle group messages
    socket.on("group-message", (data) => handleGroupMessage(socket, data));

    // Add new handler for getting group members
    socket.on("get-group-members", (groupId) =>
      handleGetGroupMembers(socket, groupId)
    );
  });
}

module.exports = {
  handleDisconnect,
  getOnlineUsers,
  getSocketByUserId,
  initializeSocket,
  onlineUsers, // Export if needed elsewhere
};
