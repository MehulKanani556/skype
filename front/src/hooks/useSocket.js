import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import {
  getAllMessageUsers,
  getAllGroups,
  setOnlineUsers,
  setOnlineuser,
} from "../redux/slice/user.slice";
import { useDispatch } from "react-redux";

const SOCKET_SERVER_URL = "http://localhost:4000"; // Move to environment variable in production

export const useSocket = (userId, localVideoRef, remoteVideoRef, allUsers) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [iceCandidatesQueue, setIceCandidatesQueue] = useState([]);
  const [peer, setPeer] = useState(null);
  const peerRef = useRef(null);
  const [peerEmail, setPeerEmail] = useState("");
  const [isReceiving, setIsReceiving] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isVideoCalling, setIsVideoCalling] = useState(false);
  const [isVoiceCalling, setIsVoiceCalling] = useState(false);
  const [incomingShare, setIncomingShare] = useState(null);
  const [error, setError] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [hasWebcam, setHasWebcam] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(false);
  const streamRef = useRef(null);


  // Add state for call duration
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(null);
  const callTimerRef = useRef(null);

  const dispatch = useDispatch();

  useEffect(() => {
    // Check for available media devices when component mounts
    checkMediaDevices();
  }, []);

  const checkMediaDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      const audioDevices = devices.filter(
        (device) => device.kind === "audioinput"
      );

      // console.log(devices);

      setHasWebcam(videoDevices.length > 0);
      setHasMicrophone(audioDevices.length > 0);

      console.log("Available devices:", {
        webcams: videoDevices.length,
        microphones: audioDevices.length,
      });
    } catch (err) {
      console.error("Error checking media devices:", err);
      setError(
        "Unable to detect media devices. Please ensure you have granted necessary permissions."
      );
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((track) => (track.enabled = !track.enabled));
      setIsCameraOn((prev) => !prev);
    }
  };

  const toggleMicrophone = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => (track.enabled = !track.enabled));
      setIsMicrophoneOn((prev) => !prev);
    }
  };

  // ===========================socket connection=============================

  useEffect(() => {
    // Clear any existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Only create socket connection if we have a userId
    if (userId) {
      socketRef.current = io(SOCKET_SERVER_URL);

      socketRef.current.on("connect", () => {
        setIsConnected(true);
        console.log("Socket connected with userId:", userId);

        // Emit user-login after connection
        socketRef.current.emit("user-login", userId);
      });

      socketRef.current.on("disconnect", () => {
        setIsConnected(false);
        setOnlineUsers([]); // Clear online users on disconnect
        console.log("Socket disconnected");
      });

      socketRef.current.on("user-status-changed", (onlineUserIds) => {
        console.log("Online users updated:", onlineUserIds);
        setOnlineUsers(onlineUserIds);
        if (onlineUserIds.length > 0) {
          dispatch(setOnlineuser(onlineUserIds));
        }
      });

      // Handle reconnection
      socketRef.current.on("reconnect", () => {
        console.log("Socket reconnected, re-emitting user-login");
        socketRef.current.emit("user-login", userId);
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
        setOnlineUsers([]);
      });

      socketRef.current.on("connect_timeout", () => {
        console.error("Socket connection timeout");
        setIsConnected(false);
        setOnlineUsers([]);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [userId]); // Only depend on userId

  // ===========================private message=============================

  const sendPrivateMessage = (receiverId, message) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      const messageData = {
        senderId: userId,
        receiverId,
        content: message,
      };

      console.log("Sending message:", messageData);

      socketRef.current.emit("private-message", messageData);

      socketRef.current.once("message-sent-status", (status) => {
        resolve(status);
      });
    });
  };

  // ===========================typing status=============================

  const sendTypingStatus = (receiverId, isTyping) => {
    if (!socketRef.current?.connected) return;

    console.log(userId, receiverId, isTyping);

    socketRef.current.emit("typing-status", {
      senderId: userId,
      receiverId,
      isTyping,
    });
  };

  // ===========================messages=============================

  const markMessageAsRead = (messageIds) => {
    if (!socketRef.current?.connected || !messageIds?.length) return;

    // Mark each message as read
    messageIds.forEach((messageId) => {
      socketRef.current.emit("message-read", {
        messageId,
        readerId: userId,
      });
    });
    dispatch(getAllMessageUsers());
  };

  const subscribeToMessages = (callback) => {
    if (!socketRef.current?.connected) return;

    const messageHandler = (message) => {
      console.log("Received message:", message);
      // markMessageAsRead(message._id);
      callback(message);
    };

    const messageStatusHandler = (data) => {
      console.log("Message status update:", data);
      callback({ type: "status", ...data });
    };

    const messageReadHandler = (data) => {
      console.log("Message read update:", data);
      callback({ type: "read", ...data });
    };

    const messageDeletedHandler = (messageId) => {
      console.log("Received message deleted:", messageId);
      callback({ type: "delete", messageId });
    };

    const messageUpdatedHandler = (message) => {
      console.log("Received message updated:", message);
      callback(message);
    };

    const groupMessageHandler = (message) => {
      console.log("Received group message:", message);
      callback(message);
    };

    socketRef.current.on("receive-message", messageHandler);
    socketRef.current.on("message-sent-status", messageStatusHandler);
    socketRef.current.on("message-read", messageReadHandler);
    socketRef.current.on("message-deleted", messageDeletedHandler);
    socketRef.current.on("message-updated", messageUpdatedHandler);
    socketRef.current.on("receive-group", groupMessageHandler);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("receive-message", messageHandler);
        socketRef.current.off("message-sent-status", messageStatusHandler);
        socketRef.current.off("message-read", messageReadHandler);
        socketRef.current.off("message-deleted", messageDeletedHandler);
        socketRef.current.off("message-updated", messageUpdatedHandler);
        socketRef.current.off("receive-group", groupMessageHandler);
      }
    };
  };

  // ===========================typing status=============================

  const subscribeToTyping = (callback) => {
    if (!socketRef.current?.connected) return;

    socketRef.current.on("user-typing", callback);
    return () => socketRef.current.off("user-typing", callback);
  };

  // ===========================screen share=============================

  // const startScreenShare = async (receiverId) => {
  //   try {
  //     const stream = await navigator.mediaDevices.getDisplayMedia({
  //       video: true,
  //       audio: true,
  //     });

  //     if (peerConnectionRef.current) {
  //       peerConnectionRef.current.close();
  //     }

  //     // Create new RTCPeerConnection with STUN servers
  //     peerConnectionRef.current = new RTCPeerConnection({
  //       iceServers: [
  //         { urls: "stun:stun.l.google.com:19302" },
  //         { urls: "stun:stun1.l.google.com:19302" },
  //       ],
  //     });

  //     // Add ICE candidate handler
  //     peerConnectionRef.current.onicecandidate = (event) => {
  //       if (event.candidate) {
  //         socketRef.current.emit("ice-candidate", {
  //           candidate: event.candidate,
  //           to: receiverId,
  //         });
  //       }
  //     };

  //     // Add tracks to peer connection
  //     stream.getTracks().forEach((track) => {
  //       peerConnectionRef.current.addTrack(track, stream);
  //     });

  //     // Create and set local description
  //     const offer = await peerConnectionRef.current.createOffer();
  //     await peerConnectionRef.current.setLocalDescription(offer);

  //     // Send offer to receiver
  //     socketRef.current.emit("screenShareOffer", {
  //       senderId: userId,
  //       receiverId,
  //       offer: peerConnectionRef.current.localDescription,
  //     });

  //     return true;
  //   } catch (error) {
  //     console.error("Error in startScreenShare:", error);
  //     return false;
  //   }
  // };

  // const handleIncomingScreenShare = async (data, videoElement) => {
  //   try {
  //     console.log("Received screen share data:", data);

  //     // Handle both data structures - either {offer, senderId} or direct offer
  //     const offer = data.offer ? data.offer : data;
  //     const senderId = data.senderId || null;

  //     // Validate the offer has required fields
  //     if (!offer || !offer.sdp) {
  //       console.error("Invalid offer data:", data);
  //       throw new Error("Invalid screen share data received");
  //     }

  //     // Create new RTCPeerConnection if needed
  //     if (peerConnectionRef.current) {
  //       peerConnectionRef.current.close();
  //     }

  //     peerConnectionRef.current = new RTCPeerConnection({
  //       iceServers: [
  //         { urls: "stun:stun.l.google.com:19302" },
  //         { urls: "stun:stun1.l.google.com:19302" },
  //       ],
  //     });

  //     // Set up event handlers before setting remote description
  //     peerConnectionRef.current.ontrack = (event) => {
  //       console.log("Track received:", event);
  //       if (videoElement && event.streams[0]) {
  //         videoElement.srcObject = event.streams[0];
  //         videoElement.muted = true;
  //         videoElement.autoplay = true;
  //         videoElement.playsInline = true;
  //         videoElement
  //           .play()
  //           .catch((err) => console.error("Error playing video:", err));
  //       }
  //     };

  //     peerConnectionRef.current.onicecandidate = (event) => {
  //       if (event.candidate) {
  //         socketRef.current.emit("ice-candidate", {
  //           candidate: event.candidate,
  //           to: senderId, // Use senderId if available
  //         });
  //       }
  //     };

  //     // Set remote description with the offer
  //     await peerConnectionRef.current.setRemoteDescription(
  //       new RTCSessionDescription(offer)
  //     );

  //     // Create and set local description
  //     const answer = await peerConnectionRef.current.createAnswer();
  //     await peerConnectionRef.current.setLocalDescription(answer);

  //     // Send answer back
  //     socketRef.current.emit("screenShareAnswer", {
  //       to: senderId,
  //       answer: answer,
  //     });
  //   } catch (error) {
  //     console.error("Error in handleIncomingScreenShare:", error);
  //     console.error("Error details:", {
  //       data: data,
  //       peerConnection: peerConnectionRef.current,
  //     });
  //   }
  // };

  // const stopScreenShare = () => {
  //   if (peerConnectionRef.current) {
  //     peerConnectionRef.current.close();
  //     peerConnectionRef.current = null;
  //   }
  // };

  // const startSharing = async (receiverId) => {
  //   if (!receiverId) {
  //     setError("Please enter peer email first");
  //     return;
  //   }

  //   try {
  //     console.log("Requesting screen share...");
  //     const stream = await navigator.mediaDevices.getDisplayMedia({
  //       video: true,
  //     });

  //     console.log("Got screen stream, creating peer...");
  //     streamRef.current = stream;

  //     // Show local stream
  //     if (localVideoRef.current) {
  //       localVideoRef.current.srcObject = stream;
  //     }

  //     // Create sending peer
  //     const peer = new Peer({
  //       initiator: true,
  //       trickle: false,
  //       stream: stream,
  //     });

  //     peer.on("signal", (signal) => {
  //       console.log("Sender generated signal, sending request");
  //       socketRef.current.emit("screen-share-request", {
  //         fromEmail: userId,
  //         toEmail: receiverId,
  //         signal,
  //       });
  //     });

  //     peer.on("error", (err) => {
  //       console.error("Peer error:", err);
  //       setError("Connection error occurred: " + err.message);
  //       cleanupConnection();
  //     });

  //     peer.on("connect", () => {
  //       console.log("Peer connection established");
  //     });

  //     peerRef.current = peer;
  //     setIsSharing(true);

  //     // Handle stream end
  //     stream.getVideoTracks()[0].onended = () => {
  //       console.log("Stream ended by user");
  //       cleanupConnection();
  //     };
  //   } catch (err) {
  //     console.error("Error starting share:", err);
  //     setError(
  //       "Failed to start screen sharing: " + (err.message || "Unknown error")
  //     );
  //     cleanupConnection();
  //   }
  // };

  const startSharing = async (selectedChat) => {
    if (!selectedChat) {
      setError("No chat selected");
      return;
    }

    try {
      console.log("Requesting screen share...");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      console.log("Got screen stream, creating peer...");
      streamRef.current = stream;

      // Show local stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Check if it's a group chat
      const isGroup = selectedChat.isGroupChat || selectedChat.members;

      if (isGroup) {
        // Request group members from server
        socketRef.current.emit("get-group-members", selectedChat._id);

        socketRef.current.once("group-members", ({ members }) => {
          members.forEach((memberId) => {
            if (memberId !== userId) {
              // Don't create connection to self
              const peer = new Peer({
                initiator: true,
                trickle: false,
                stream: stream,
              });

              peer.on("signal", (signal) => {
                socketRef.current.emit("screen-share-request", {
                  fromEmail: userId,
                  toEmail: memberId,
                  signal,
                  groupId: selectedChat._id,
                  isGroup: true,
                });
              });

              peer.on("error", (err) => {
                console.error("Peer error:", err);
                setError(
                  `Connection error with member ${memberId}: ${err.message}`
                );
              });

              peer.on("connect", () => {
                console.log(
                  "Peer connection established with member:",
                  memberId
                );
              });

              // Store peer connection for this member
              if (!peerRef.current) peerRef.current = {};
              peerRef.current[memberId] = peer;
            }
          });
        });
      } else {
        // Single user share
        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: stream,
        });

        peer.on("signal", (signal) => {
          socketRef.current.emit("screen-share-request", {
            fromEmail: userId,
            toEmail: selectedChat._id,
            signal,
            isGroup: false,
          });
        });

        peer.on("error", (err) => {
          console.error("Peer error:", err);
          setError("Connection error occurred: " + err.message);
          cleanupConnection();
        });

        peer.on("connect", () => {
          console.log("Peer connection established");
        });

        peerRef.current = { [selectedChat._id]: peer };
      }

      setIsSharing(true);

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        console.log("Stream ended by user");
        cleanupConnection();
      };

      return true;
    } catch (err) {
      console.error("Error starting share:", err);
      setError(
        "Failed to start screen sharing: " + (err.message || "Unknown error")
      );
      cleanupConnection();
      return false;
    }
  };

  // Add socket listeners for screen sharing
  useEffect(() => {
    if (!socketRef.current) return;

    // Handle incoming video call request
    socketRef.current.on("video-call-request", async (data) => {
      console.log("Incoming video call from:", data.fromEmail);
      setIncomingCall({ fromEmail: data.fromEmail, signal: data.signal, type: data.type });
    });

    socketRef.current.on("voice-call-request", async (data) => {
      console.log("Incoming voice call from:", data.fromEmail);
      setIncomingCall({ fromEmail: data.fromEmail, signal: data.signal, type: data.type });
    });

    socketRef.current.on("screen-share-request", async (data) => {
      console.log("Incoming screen share from:", data.fromEmail);
      setIncomingShare(data)
    });

    // Handle incoming signals
    socketRef.current.on("share-signal", ({ signal, fromEmail }) => {
      console.log("Received peer signal from:", fromEmail);
      if (peerRef.current && peerRef.current[fromEmail]) {
        peerRef.current[fromEmail].signal(signal);
      } else {
        console.error("No peer connection found for:", fromEmail);
      }
    });

    // Handle when share is accepted
    socketRef.current.on("share-accepted", async ({ signal, fromEmail }) => {
      console.log("Share accepted by peer:", fromEmail);
      if (peerRef.current && peerRef.current[fromEmail]) {
        peerRef.current[fromEmail].signal(signal);
      } else {
        console.error("No peer connection found for:", fromEmail);
      }
    });

    // Handle when video call is accepted
    socketRef.current.on("video-call-accepted", ({ signal, fromEmail }) => {
      console.log("Video call accepted by:", fromEmail);
      if (peerRef.current) {
        peerRef.current.signal(signal);
        setIsVideoCalling(true);
      } else {
        console.error("No peer connection found for:", fromEmail);
      }
    });

    // Handle incoming video signals
    socketRef.current.on("video-call-signal", ({ signal, fromEmail }) => {
      console.log("Received video call signal from:", fromEmail);
      if (peerRef.current) {
        peerRef.current.signal(signal);
      } else {
        console.error("No peer connection found for:", fromEmail);
      }
    });

    socketRef.current.on("video-call-ended", ({ to, from, duration }) => {
      // console.log("Video call ended between:", to, from, "Duration:", duration);
      endVideoCall();
      // Add any additional logic you need here
    });

    return () => {
      cleanupConnection();
      if (socketRef.current) {
        socketRef.current.off("video-call-request");
        socketRef.current.off("video-call-accepted");
        socketRef.current.off("video-call-signal");
        socketRef.current.off("screen-share-request");
        socketRef.current.off("share-accepted");
        socketRef.current.off("share-signal");
        socketRef.current.off("video-call-ended");
      }
    };
  }, [userId]);

  const acceptScreenShare = () => {
    if (!incomingShare) return;

    try {
      setIsReceiving(true);
      setPeerEmail(incomingShare.fromEmail);

      // Create receiving peer
      const peer = new Peer({
        initiator: false,
        trickle: false,
      });

      // Initialize peerRef.current if needed
      if (!peerRef.current) peerRef.current = {};

      // Store the peer connection immediately
      peerRef.current[incomingShare.fromEmail] = peer;

      peer.on("signal", (signal) => {
        console.log("Receiver generated signal, sending accept");
        socketRef.current.emit("share-accept", {
          signal,
          fromEmail: incomingShare.fromEmail,
          toEmail: userId,
          groupId: incomingShare?.groupId,
          isGroup: incomingShare?.isGroup,
        });
      });

      peer.on("stream", (stream) => {
        console.log("Receiver got stream");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current
            .play()
            .catch((e) => console.error("Error playing:", e));
        }
      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        setError("Connection error occurred");
        cleanupConnection();
      });

      // Signal the peer with the initial offer
      if (incomingShare.signal) {
        console.log("Receiver signaling with initial offer");
        peer.signal(incomingShare.signal);
      }
      setIncomingShare(null);
    } catch (err) {
      console.error("Error starting screen share:", err);
      setError("Failed to start screen share: " + (err.message || "Unknown error"));
      cleanupConnection();
    }
  };

  //==========================video call=============================

  const startVideoCall = async (receiverId) => {

    if (!receiverId) {
      setError("Please enter peer email first");
      return;
    }

    try {
      let stream = null;
      try {
        // Try to get media stream but don't block if devices aren't available
        stream = await navigator.mediaDevices.getUserMedia({
          video: hasWebcam,
          audio: hasMicrophone,
        });
      } catch (err) {
        console.warn("Could not get media devices:", err);
        // Continue without media stream
      }
      if (stream) {
        setIsCameraOn(true);
        setIsMicrophoneOn(true);
        streamRef.current = stream;

        if (localVideoRef?.current) {
          localVideoRef.current.srcObject = stream;
          console.log("Local video stream set successfully");

          try {
            await localVideoRef.current.play();
            // console.log(localVideoRef.current)
          } catch (err) {
            console.error("Error playing local video:", err);
          }
        }
      }

      // Set call start time when call is initiated
      setCallStartTime(new Date());

      // Create peer connection even without media stream
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream, // This can be null
      });

      peer.on("signal", (signal) => {
        socketRef.current.emit("video-call-request", {
          fromEmail: userId,
          toEmail: receiverId,
          signal,
          type: "video",
        });
      });

      peer.on("stream", (remoteStream) => {
        console.log("Received remote stream");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch((err) => {
            console.error("Error playing remote video:", err);
          });
        }
      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        setError("Video call connection error occurred");
        endVideoCall();
      });

      peerRef.current = peer;
      setIsVideoCalling(true);
    } catch (err) {
      console.error("Error starting video call:", err);
      setError(err.message || "Failed to start video call");
      endVideoCall();
    }
  };

  const acceptVideoCall = async () => {
    if (!incomingCall) return;

    try {
      // Set call start time when call is accepted
      setCallStartTime(new Date());

      // Start call duration timer
      startCallDurationTimer();

      let stream = null;
      try {
        // Try to get media stream but don't block if devices aren't available
        stream = await navigator.mediaDevices.getUserMedia({
          video: hasWebcam,
          audio: hasMicrophone,
        });
      } catch (err) {
        console.warn("Could not get media devices:", err);
        // Continue without media stream
      }

      if (stream) {
        setIsCameraOn(true);
        setIsMicrophoneOn(true);
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream, // This can be null
      });

      peer.on("signal", (signal) => {
        socketRef.current.emit("video-call-accept", {
          signal,
          fromEmail: incomingCall.fromEmail,
          toEmail: userId,
        });
      });

      peer.on("stream", (remoteStream) => {
        console.log("Received remote stream");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        setError("Video call connection error occurred");
        endVideoCall();
      });

      peer.signal(incomingCall.signal);
      peerRef.current = peer;
      setPeerEmail(incomingCall.fromEmail);
      setIsVideoCalling(true);
      setIncomingCall(null);
    } catch (err) {
      console.error("Error accepting video call:", err);
      setError(err.message || "Failed to accept video call");
      endVideoCall();
    }
  };

  // Add function to start call duration timer
  const startCallDurationTimer = () => {
    callTimerRef.current = setInterval(() => {
      if (callStartTime) {
        const duration = Math.floor((new Date() - callStartTime) / 1000);
        setCallDuration(duration);
      }
    }, 1000);
  };

  const endVideoCall = () => {
    // Calculate final call duration
    const finalDuration = callStartTime
      ? Math.floor((new Date() - callStartTime) / 1000)
      : 0;

    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }

    // Save call ended message with duration if call was connected

    if (socketRef.current?.connected && peerEmail) {
      socketRef.current.emit("end-video-call", {
        to: peerEmail,
        from: userId,
        duration: finalDuration
      });
    }
    if (callStartTime) {
      socketRef.current.emit("save-call-message", {
        senderId: userId,
        receiverId: peerEmail,
        callType: "video",
        status: "ended",
        duration: finalDuration,
        timestamp: new Date(),
      });
    }

    // Reset call-related states
    setCallStartTime(null);
    setCallDuration(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setIsVideoCalling(false);
    setIncomingCall(null);
    setIsCameraOn(false);
    setIsMicrophoneOn(false);
    setCallDuration(null);
    setCallStartTime(null);
    setPeerEmail(null);
    // setCurrentCall(null);
  };

  const rejectVideoCall = () => {
    if (!incomingCall) return;

    // Save missed call message
    socketRef.current.emit("save-call-message", {
      senderId: incomingCall.fromEmail,
      receiverId: userId,
      callType: "video",
      status: "missed",
      timestamp: new Date(),
    });

    setIncomingCall(null);
  };

  // ===========================call=============================

  const startVoiceCall = async (receiverId) => {
    if (!receiverId) {
      setError("Please enter peer email first");
      return;
    }

    try {
      let stream = null;
      try {
        // Only request audio stream for voice call
        stream = await navigator.mediaDevices.getUserMedia({
          audio: hasMicrophone,
          video: false
        });
      } catch (err) {
        console.warn("Could not get audio device:", err);
        return;
      }

      if (stream) {
        setIsMicrophoneOn(true);
        streamRef.current = stream;

        if (localVideoRef?.current) {
          localVideoRef.current.srcObject = stream;
          console.log("Local video stream set successfully");

          try {
            await localVideoRef.current.play();
            // console.log(localVideoRef.current)
          } catch (err) {
            console.error("Error playing local video:", err);
          }
        }
      }

      // Set call start time when call is initiated
      setCallStartTime(new Date());

      // Create peer connection for voice only
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
      });

      peer.on("signal", (signal) => {
        socketRef.current.emit("voice-call-request", {
          fromEmail: userId,
          toEmail: receiverId,
          signal,
          type: "voice",
        });
      });

      peer.on("stream", (remoteStream) => {
        console.log("Received remote audio stream");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch((err) => {
            console.error("Error playing remote audio:", err);
          });
        }
      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        setError("Voice call connection error occurred");
        endVoiceCall();
      });

      peerRef.current = peer;
      setIsVoiceCalling(true);
    } catch (err) {
      console.error("Error starting voice call:", err);
      setError(err.message || "Failed to start voice call");
      endVoiceCall();
    }
  };

  const acceptVoiceCall = async () => {
    if (!incomingCall) return;

    try {
      // Set call start time when call is accepted
      setCallStartTime(new Date());
      startCallDurationTimer();

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: hasMicrophone,
          video: false
        });
      } catch (err) {
        console.warn("Could not get audio device:", err);
        return;
      }

      if (stream) {
        streamRef.current = stream;
      }

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream,
      });

      peer.on("signal", (signal) => {
        socketRef.current.emit("voice-call-accept", {
          signal,
          fromEmail: incomingCall.fromEmail,
          toEmail: userId,
        });
      });

      peer.on("stream", (remoteStream) => {
        console.log("Received remote audio stream");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        setError("Voice call connection error occurred");
        endVoiceCall();
      });

      peer.signal(incomingCall.signal);
      peerRef.current = peer;
      setPeerEmail(incomingCall.fromEmail);
      setIsVoiceCalling(true);
      setIncomingCall(null);
    } catch (err) {
      console.error("Error accepting voice call:", err);
      setError(err.message || "Failed to accept voice call");
      endVoiceCall();
    }
  };

  const endVoiceCall = () => {
    // Calculate final call duration
    const finalDuration = callStartTime
      ? Math.floor((new Date() - callStartTime) / 1000)
      : 0;

    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }

    if (socketRef.current?.connected && peerEmail) {
      socketRef.current.emit("end-voice-call", {
        to: peerEmail,
        from: userId,
        duration: finalDuration
      });
    }

    if (callStartTime) {
      socketRef.current.emit("save-call-message", {
        senderId: userId,
        receiverId: peerEmail,
        callType: "audio",
        status: "ended",
        duration: finalDuration,
        timestamp: new Date(),
      });
    }

    // Reset states
    setCallStartTime(null);
    setCallDuration(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setIsVoiceCalling(false);
    setIncomingCall(null);
    setIsMicrophoneOn(false);
    setCallDuration(null);
    setCallStartTime(null);
    setPeerEmail(null);
  };
  // ==================group message=============================
  // Send group message
  const sendGroupMessage = (groupId, message) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      const messageData = {
        senderId: userId,
        groupId,
        content: message,
      };

      console.log("Sending group message:", messageData);

      socketRef.current.emit("group-message", messageData);

      // Wait for message status (if needed)
      resolve();
    });
  };

  const subscribeToGroupMessages = (callback) => {
    if (!socketRef.current?.connected) return;

    const groupMessageHandler = (message) => {
      console.log("Received group message:", message);
      callback(message);
    };

    socketRef.current.on("receive-group", groupMessageHandler);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("receive-group", groupMessageHandler);
      }
    };
  };

  const cleanupConnection = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Cleanup all peer connections
    if (peerRef.current) {
      Object.values(peerRef.current).forEach((peer) => {
        if (peer && typeof peer.destroy === "function") {
          peer.destroy();
        }
      });
      peerRef.current = {};
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setIsSharing(false);
    setIsReceiving(false);
    setPeerEmail("");
    setError("");
    setIsVideoCalling(false);
    setIncomingCall(null);
    setIsCameraOn(false);
    setIsMicrophoneOn(false);
    setIncomingShare(null);
  };

  useEffect(() => {
    if (!socketRef.current) return;

    // Handle group updates
    const handleGroupUpdate = (data) => {
      console.log("Group update received:", data);
      // Dispatch action to refresh groups in the Redux store
      // dispatch(getAllGroups());
      dispatch(getAllMessageUsers());
    };
    socketRef.current.on("group-updated", handleGroupUpdate);
    return () => {
      if (socketRef.current) {
        socketRef.current.off("group-updated", handleGroupUpdate);
      }
    };
  }, [socketRef.current]);

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    sendPrivateMessage,
    sendTypingStatus,
    subscribeToMessages,
    sendGroupMessage,
    isVideoCalling,
    incomingCall,
    setIncomingCall,
    cleanupConnection,
    peerEmail,
    setPeerEmail,
    hasWebcam,
    hasMicrophone,
    isCameraOn,
    isMicrophoneOn,
    startSharing,
    startVideoCall,
    acceptVideoCall,
    endVideoCall,
    isSharing,
    setIsSharing,
    isReceiving,
    setIsReceiving,
    toggleCamera,
    toggleMicrophone,
    markMessageAsRead,
    rejectVideoCall,
    incomingShare,
    setIncomingShare,
    acceptScreenShare,
    startVoiceCall,
    acceptVoiceCall,
    endVoiceCall,
    isVoiceCalling,
  };
};
