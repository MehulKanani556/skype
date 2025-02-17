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

export const useSocket = (userId, localVideoRef, remoteVideoRef) => {
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
  const [error, setError] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [hasWebcam, setHasWebcam] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(false);
  const streamRef = useRef(null);

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

  const startSharing = async (receiverId) => {
    if (!receiverId) {
      setError("Please enter peer email first");
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

      // Create sending peer
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
      });

      peer.on("signal", (signal) => {
        console.log("Sender generated signal, sending request");
        socketRef.current.emit("screen-share-request", {
          fromEmail: userId,
          toEmail: receiverId,
          signal,
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

      peerRef.current = peer;
      setIsSharing(true);

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        console.log("Stream ended by user");
        cleanupConnection();
      };
    } catch (err) {
      console.error("Error starting share:", err);
      setError(
        "Failed to start screen sharing: " + (err.message || "Unknown error")
      );
      cleanupConnection();
    }
  };

  // Add socket listeners for screen sharing
  useEffect(() => {
    if (!socketRef.current) return;

    // Handle incoming video call request
    socketRef.current.on("video-call-request", async (data) => {
      console.log("Incoming video call from:", data.fromEmail);
      setIncomingCall({ fromEmail: data.fromEmail, signal: data.signal });
    });

    socketRef.current.on("screen-share-request", async (data) => {
      console.log("Received share request from:", data.fromEmail, document.visibilityState);
      const accept =
        document.visibilityState === "visible"
          ? new Promise((resolve) => {
            const confirmDialog = document.createElement("div");
            confirmDialog.style.position = "fixed";
            confirmDialog.style.top = "50%";
            confirmDialog.style.left = "50%";
            confirmDialog.style.transform = "translate(-50%, -50%)";
            confirmDialog.style.backgroundColor = "white";
            confirmDialog.style.padding = "20px";
            confirmDialog.style.borderRadius = "8px";
            confirmDialog.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
            confirmDialog.style.zIndex = "1000";

            confirmDialog.innerHTML = `
                    <div style="margin-bottom: 20px;">
                        ${data.fromEmail} wants to share their screen. Accept?
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button id="confirm-accept" style="background: #4CAF50; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Accept</button>
                        <button id="confirm-decline" style="background: #f44336; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Decline</button>
                    </div>
                `;

            const overlay = document.createElement("div");
            overlay.style.position = "fixed";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.right = "0";
            overlay.style.bottom = "0";
            overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
            overlay.style.zIndex = "999";

            document.body.appendChild(overlay);
            document.body.appendChild(confirmDialog);

            document.getElementById("confirm-accept").onclick = () => {
              document.body.removeChild(confirmDialog);
              document.body.removeChild(overlay);
              resolve(true);
            };
            document.getElementById("confirm-decline").onclick = () => {
              document.body.removeChild(confirmDialog);
              document.body.removeChild(overlay);
              resolve(false);
            };
          })
          : false;

      console.log(accept);

      if (accept) {
        setIsReceiving(true);
        setPeerEmail(data.fromEmail);

        // Create receiving peer
        const peer = new Peer({
          initiator: false,
          trickle: false,
        });

        peer.on("signal", (signal) => {
          console.log("Receiver generated signal, sending accept");
          socketRef.current.emit("share-accept", {
            signal,
            fromEmail: data.fromEmail,
            toEmail: userId,
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
        if (data.signal) {
          console.log("Receiver signaling with initial offer");
          peer.signal(data.signal);
        }

        peerRef.current = peer;
      }
    });

    // Handle incoming signals
    socketRef.current.on("share-signal", ({ signal }) => {
      console.log("Received peer signal");
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    });
    // Handle when share is accepted
    socketRef.current.on("share-accepted", async ({ signal, fromEmail }) => {
      console.log("Share accepted by peer, signaling...");
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    });

    // Handle when video call is accepted
    socketRef.current.on("video-call-accepted", ({ signal, fromEmail }) => {
      console.log("Video call accepted by:", fromEmail);
      if (peerRef.current) {
        peerRef.current.signal(signal);
        setIsVideoCalling(true);
      }
    });

    // Handle incoming video signals
    socketRef.current.on("video-call-signal", ({ signal }) => {
      console.log("Received video call signal");
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
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
      }
    };
  }, [userId]);

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
        // console.log(stream,localStreamRef);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;

          try {
            await localVideoRef.current.play();
            // console.log(localVideoRef.current)
          } catch (err) {
            console.error("Error playing local video:", err);
          }
        }
      }

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

  const endVideoCall = () => {
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
    setIsCameraOn(true);
    setIsMicrophoneOn(true);
  };

  // ===========================call=============================

  const [currentCall, setCurrentCall] = useState(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const initializeCallConnection = async (type) => {
    try {
      const configuration = {
        iceServers: [
          { urls: "stun:stun.localhost:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
        ],
      };

      peerConnectionRef.current = new RTCPeerConnection(configuration);

      // Set up event handlers before getting media
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit("iceCandidate", {
            to: currentCall?.with,
            candidate: event.candidate,
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
          autoGainControl: true,
        },
        video:
          type === "video"
            ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
              echoCancellation: true,
            }
            : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      console.log(stream);

      stream.getTracks().forEach((track) => {
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

  const makeCall = async (receiverId, type = "video") => {
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
        type: type,
      });

      setCurrentCall({
        with: receiverId,
        type: type,
        status: "calling",
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
        answer: answer,
      });

      setCurrentCall({
        with: callData.from,
        type: callData.type,
        status: "connected",
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
        to: currentCall.with,
      });
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
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
        status: "incoming",
      };
      setCurrentCall(incomingCall);
    });

    socketRef.current.on("callAnswer", async (data) => {
      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        setCurrentCall((prev) => ({ ...prev, status: "connected" }));
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
      if (socketRef.current) {
        socketRef.current?.off("callOffer");
        socketRef.current?.off("callAnswer");
        socketRef.current?.off("iceCandidate");
        socketRef.current?.off("callEnded");
      }
    };
  }, []);

  // Handle ICE candidates
  useEffect(() => {
    if (!peerConnectionRef.current) return;

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && currentCall) {
        socketRef.current.emit("iceCandidate", {
          to: currentCall.with,
          candidate: event.candidate,
        });
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
    };
  }, [currentCall]);

  // Modify the existing useEffect for handling ICE candidates
  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on("ice-candidate", async (data) => {
      try {
        if (peerConnectionRef.current && data.candidate) {
          if (peerConnectionRef.current.remoteDescription) {
            // If remote description is set, add candidate immediately
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          } else {
            // Queue the candidate if remote description isn't set yet
            setIceCandidatesQueue((queue) => [...queue, data.candidate]);
          }
        }
      } catch (error) {
        console.error("Error handling ICE candidate:", error);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current?.off("ice-candidate");
      }
    };
  }, []);

  // Add this effect to process queued candidates when remote description is set
  useEffect(() => {
    const processQueuedCandidates = async () => {
      if (
        peerConnectionRef.current?.remoteDescription &&
        iceCandidatesQueue.length > 0
      ) {
        try {
          for (const candidate of iceCandidatesQueue) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          }
          setIceCandidatesQueue([]); // Clear the queue after processing
        } catch (error) {
          console.error("Error processing queued ICE candidates:", error);
        }
      }
    };

    processQueuedCandidates();
  }, [iceCandidatesQueue]);

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
    endVideoCall();
    setIsSharing(false);
    setIsReceiving(false);
    setPeerEmail("");
    setError("");
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

  // useEffect(() => {
  //   if (!socketRef.current?.connected) return;

  //   socketRef.current.on("user-status-changed", (onlineUserIds) => {
  //     console.log("Online users updated:", onlineUserIds);
  //     setOnlineUsers(onlineUserIds); // Local state update
  //     if (onlineUserIds.length > 0) {
  //       dispatch(setOnlineuser(onlineUserIds)); // Redux state update
  //     }
  //   });

  //   return () => {
  //     socketRef.current?.off("user-status-changed");
  //   };
  // }, [dispatch]);

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
  };
};
