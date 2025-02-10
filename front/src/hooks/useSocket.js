import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:4000"; // Move to environment variable in production

export const useSocket = (userId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  console.log(isConnected);

  useEffect(() => {
    // Create socket connection
    socketRef.current = io(SOCKET_SERVER_URL);

    // Connection event handlers
    socketRef.current.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected");

      // Login user after connection
      if (userId) {
        socketRef.current.emit("user-login", userId);
      }
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    });

    // Update online users
    socketRef.current.on("user-status-changed", (onlineUserIds) => {
      setOnlineUsers(onlineUserIds);
    });

    // Cleanup on unmount
    return () => {
      socketRef.current.disconnect();
    };
  }, [userId]);

  // Send private message
  const sendPrivateMessage = (receiverId, message) => {
    return new Promise((resolve, reject) => {
    //   console.log(receiverId,message);
      if (!socketRef.current?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      console.log(userId,receiverId,message);

      const messageData = {
        senderId: userId,
        receiverId,
        message,
      };

      console.log(messageData);

      socketRef.current.emit("private-message", messageData);

      // Wait for message status
      socketRef.current.once("message-sent-status", (status) => {
        resolve(status);
      });
    });
  };

  // Send typing status
  const sendTypingStatus = (receiverId, isTyping) => {
    if (!socketRef.current?.connected) return;

    console.log(userId,receiverId,isTyping);

    socketRef.current.emit("typing-status", {
      senderId: userId,
      receiverId,
      isTyping,
    });
  };

  // Subscribe to messages
  const subscribeToMessages = (callback) => {
    if (!socketRef.current?.connected) return;

    socketRef.current.on("receive-message", callback);
    return () => socketRef.current.off("receive-message", callback);
  };

  // Subscribe to typing status
  const subscribeToTyping = (callback) => {
    if (!socketRef.current?.connected) return;

    socketRef.current.on("user-typing", callback);
    return () => socketRef.current.off("user-typing", callback);
  };

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    sendPrivateMessage,
    sendTypingStatus,
    subscribeToMessages,
    subscribeToTyping,
  };
};
