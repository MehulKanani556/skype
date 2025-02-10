import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:4000"; // Move to environment variable in production

export const useSocket = (userId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);

  // console.log(isConnected);

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
      if (!socketRef.current?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      const messageData = {
        senderId: userId,
        receiverId,
        content: message, // Changed from 'message' to 'content' to match your data structure
      };

      console.log("Sending message:", messageData);

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

    console.log(userId, receiverId, isTyping);

    socketRef.current.emit("typing-status", {
      senderId: userId,
      receiverId,
      isTyping,
    });
  };

  // Subscribe to messages
  const subscribeToMessages = (callback) => {
    if (!socketRef.current?.connected) return;

    const messageHandler = (message) => {
      console.log("Received message:", message);
      callback(message);
    };

    socketRef.current.on("receive-message", messageHandler);
    return () => socketRef.current.off("receive-message", messageHandler);
  };

  // Subscribe to typing status
  const subscribeToTyping = (callback) => {
    if (!socketRef.current?.connected) return;

    socketRef.current.on("user-typing", callback);
    return () => socketRef.current.off("user-typing", callback);
  };

  // Screen sharing functions
  const startScreenShare = async (receiverId) => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Create new RTCPeerConnection
      peerConnectionRef.current = new RTCPeerConnection();

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Create and set local description
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      // Send offer to receiver via socket
      socketRef.current.emit("screenShareOffer", {
        senderId: userId,
        receiverId,
        offer: peerConnectionRef.current.localDescription,
      });
      

      return true;
    } catch (error) {
      console.error("Error starting screen share:", error);
      return false;
    }
  };

  const handleIncomingScreenShare = async (data, videoElement) => {
    try {
      // Check if a peer connection already exists
      if (peerConnectionRef.current) {
        console.warn("A peer connection already exists. Closing it.");
        peerConnectionRef.current.close();
      }

      // Create a new RTCPeerConnection
      peerConnectionRef.current = new RTCPeerConnection();

      // Set remote description from offer
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data)
      );

      // Create and send answer
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socketRef.current.emit("screenShareAnswer", {
        senderId: userId,
        receiverId: data.senderId,
        answer: peerConnectionRef.current.localDescription,
      });
   

      // Handle incoming stream
      peerConnectionRef.current.ontrack = (event) => {
        console.log("ontrack event handler set up");
        console.log("ontrack event received:", event);
        if (videoElement) {
          console.log("Setting video element source to incoming stream");
          videoElement.srcObject = event.streams[0];
        } else {
          console.error("Video element is not defined");
        }
      };

      // Added log to check if ICE candidates are being received
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("New ICE candidate:", event.candidate);
          socketRef.current.emit("ice-candidate", event.candidate);
        } else {
          console.log("All ICE candidates have been sent");
        }
      };

    } catch (error) {
      console.error("Error handling incoming screen share:", error);
    }
  };

  const stopScreenShare = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  // Add socket listeners for screen sharing
  useEffect(() => {
    console.log("answer")
    if (!socketRef.current) return;

    socketRef.current.on("screenShareAnswer", async (data) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        }
      } catch (error) {
        console.error("Error setting remote description:", error);
      }
    });

    return () => {
      socketRef.current?.off("screenShareAnswer");
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    sendPrivateMessage,
    sendTypingStatus,
    subscribeToMessages,
    subscribeToTyping,
    startScreenShare,
    stopScreenShare,
    handleIncomingScreenShare,
  };
};
