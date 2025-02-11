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
  
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
  
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
  
      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });
  
      // Create and set local description
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
  
      // Send properly formatted offer
      socketRef.current.emit("screenShareOffer", {
        senderId: userId,
        receiverId,
        offer: {
          type: 'offer',
          sdp: offer.sdp
        }
      });
  
      return true;
    } catch (error) {
      console.error("Error in startScreenShare:", error);
      return false;
    }
  };

// In useSocket.js
const handleIncomingScreenShare = async (data, videoElement) => {
  try {
    console.log("Received screen share data:", data); // Debug log

    // The data itself is the offer now, so we adjust our validation
    if (!data || !data.sdp) {
      console.error("Invalid offer data:", data);
      throw new Error("Invalid screen share data received");
    }

    // Create new RTCPeerConnection if needed
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Set up event handlers before setting remote description
    peerConnectionRef.current.ontrack = (event) => {
      console.log("Track received:", event);
      if (videoElement && event.streams[0]) {
        videoElement.srcObject = event.streams[0];
        videoElement.play().catch(err => console.error("Error playing video:", err));
      }
    };

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", {
          candidate: event.candidate,
          to: data.senderId
        });
      }
    };

    // The data is already in the correct format
    console.log("Setting remote description with offer:", data);
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data));

    // Create and set local description
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);

    // Send answer back
    socketRef.current.emit("screenShareAnswer", {
      to: data.senderId,
      answer: answer
    });

  } catch (error) {
    console.error("Error in handleIncomingScreenShare:", error);
    console.error("Error details:", {
      data: data,
      peerConnection: peerConnectionRef.current
    });
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
