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

     // Add handlers for message updates and deletions
     const messageDeletedHandler = (messageId) => {
      console.log("Received message deleted:", messageId);
      callback({ type: 'delete', messageId });
    };

    const messageUpdatedHandler = (message) => {
      console.log("Received message updated:", message);
      callback(message);
    };



    socketRef.current.on("receive-message", messageHandler);
    socketRef.current.on("message-deleted", messageDeletedHandler);
    socketRef.current.on("message-updated", messageUpdatedHandler);

    return () => {
      socketRef.current.off("receive-message", messageHandler);
      socketRef.current.off("message-deleted", messageDeletedHandler);
      socketRef.current.off("message-updated", messageUpdatedHandler);
    };
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


  // ===========================call=============================


  const [currentCall, setCurrentCall] = useState(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  
    const initializeCallConnection = async (type) => {
      try {
        const configuration = {
          iceServers: [
            { urls: 'stun:stun.localhost:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        };

        peerConnectionRef.current = new RTCPeerConnection(configuration);

        // Set up event handlers before getting media
        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit("iceCandidate", {
              to: currentCall?.with,
              candidate: event.candidate
            });
          }
        };

        peerConnectionRef.current.ontrack = (event) => {
          remoteStreamRef.current = event.streams[0];
        };

        // Get user media based on call type
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: type === 'video' ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
            echoCancellation: true
          } : false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;

        console.log(stream);

        stream.getTracks().forEach(track => {
          track.enabled = true; // Ensure tracks are enabled
          peerConnectionRef.current.addTrack(track, stream);
        });

        console.log(peerConnectionRef.current);

        return stream;
      } catch (err) {
        console.error("Error initializing call:", err);
        throw new Error("Failed to initialize call connection");
      }
    };
  
    const makeCall = async (receiverId, type = 'video') => {
      try {
        const localStream = await initializeCallConnection(type);

        console.log(localStream);
        
        // Create and set local description
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);

        console.log(offer);
  
        // Send offer to receiver
        socketRef.current.emit("callOffer", {
          to: receiverId,
          from: userId,
          offer: offer,
          type: type
        });
  
        setCurrentCall({
          with: receiverId,
          type: type,
          status: 'calling'
        });
  
        return localStream;
      } catch (error) {
        console.error("Error making call:", error);
        throw error;
      }
    };
  
    const answerCall = async (callData) => {
      try {
        const localStream = await initializeCallConnection(callData.type);
        
        // Set remote description from offer
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(callData.offer)
        );
  
        // Create and send answer
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
  
        socketRef.current.emit("callAnswer", {
          to: callData.from,
          answer: answer
        });
  
        setCurrentCall({
          with: callData.from,
          type: callData.type,
          status: 'connected'
        });
  
        return localStream;
      } catch (error) {
        console.error("Error answering call:", error);
        throw error;
      }
    };
  
    const endCall = () => {
      if (currentCall) {
        socketRef.current.emit("endCall", {
          to: currentCall.with
        });
      }
  
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
  
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
  
      setCurrentCall(null);
    };
  
    // Add call-related socket listeners
    useEffect(() => {
      if (!socketRef.current) return;
  
      socketRef.current.on("callOffer", (data) => {
        // Handle incoming call
        const incomingCall = {
          ...data,
          status: 'incoming'
        };
        setCurrentCall(incomingCall);
      });
  
      socketRef.current.on("callAnswer", async (data) => {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          setCurrentCall(prev => ({ ...prev, status: 'connected' }));
        } catch (error) {
          console.error("Error setting remote description:", error);
        }
      });
  
      socketRef.current.on("iceCandidate", async (data) => {
        try {
          if (data.candidate) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          }
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      });
  
      socketRef.current.on("callEnded", () => {
        endCall();
      });
  
      return () => {
        socketRef.current?.off("callOffer");
        socketRef.current?.off("callAnswer");
        socketRef.current?.off("iceCandidate");
        socketRef.current?.off("callEnded");
      };
    }, []);
  
    // Handle ICE candidates
    useEffect(() => {
      if (!peerConnectionRef.current) return;
  
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && currentCall) {
          socketRef.current.emit("iceCandidate", {
            to: currentCall.with,
            candidate: event.candidate
          });
        }
      };
  
      peerConnectionRef.current.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
      };
    }, [currentCall]);

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
    makeCall,
    answerCall,
    endCall,
    currentCall,
    localStreamRef,
    remoteStreamRef
  }
};
