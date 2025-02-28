import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import { getAllMessages, getAllMessageUsers, setOnlineuser } from "../redux/slice/user.slice";
import { useDispatch } from "react-redux";

const SOCKET_SERVER_URL = "http://localhost:4000"; // Move to environment variable in production

export const useSocket = (userId, localVideoRef, remoteVideoRef, allUsers) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const peersRef = useRef({});
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
  const [voiceCallData, setVoiceCallData] = useState(null);
  const streamRef = useRef(null);
  const [callAccept, setCallAccept] = useState(false);
  const [callParticipants, setCallParticipants] = useState(new Set());
  const [remoteStreams, setRemoteStreams] = useState(new Map());

  // Add state for call duration
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(null);
  const callTimerRef = useRef(null);

  // Add to existing state declarations
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);

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

      console.log("messageeeeeeeeeeeeeeeee", message);

      const messageData = {
        senderId: userId,
        receiverId,
        content: message.data,
        replyTo: message.replyTo,
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

    const reactionHandler = (data) => {
      console.log("Received reaction:", data);
      callback({ type: "reaction", ...data });
    };

    socketRef.current.on("receive-message", messageHandler);
    socketRef.current.on("message-sent-status", messageStatusHandler);
    socketRef.current.on("message-read", messageReadHandler);
    socketRef.current.on("message-deleted", messageDeletedHandler);
    socketRef.current.on("message-updated", messageUpdatedHandler);
    socketRef.current.on("receive-group", groupMessageHandler);
    socketRef.current.on("message-reaction", reactionHandler);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("receive-message", messageHandler);
        socketRef.current.off("message-sent-status", messageStatusHandler);
        socketRef.current.off("message-read", messageReadHandler);
        socketRef.current.off("message-deleted", messageDeletedHandler);
        socketRef.current.off("message-updated", messageUpdatedHandler);
        socketRef.current.off("receive-group", groupMessageHandler);
        socketRef.current.off("message-reaction", reactionHandler);
      }
    };
  };

  // ===========================screen share=============================

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
      console.log("Incoming video call from:", data);
      setIncomingCall({
        fromEmail: data.fromEmail,
        signal: data.signal,
        type: data.type,
        participants: data.participants,
        isGroupCall: data.isGroupCall,
      });
    });

    socketRef.current.on("video-call-invite", async (data) => {
      console.log("Incoming video call invite from:", data);
      setIncomingCall({
        fromEmail: data.fromEmail,
        signal: data.signal,
        type: data.type,
        participants: data.participants || [],
        isGroupCall: data.isGroupCall || false,
      });
    });

    socketRef.current.on("voice-call-request", async (data) => {
      console.log("Incoming voice call from:", data.fromEmail);
      setIncomingCall({
        fromEmail: data.fromEmail,
        signal: data.signal,
        type: data.type,
      });
      setVoiceCallData(data);
    });

    socketRef.current.on(
      "participant-joined",
      async ({ newParticipantId, from, participants }) => {
        if (newParticipantId !== userId && streamRef.current) {
          console.log(
            "participant-joined",
            newParticipantId,
            from,
            participants
          );
          const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: streamRef.current,
          });

          peer.on("signal", (signal) => {
            socketRef.current.emit("video-call-signal", {
              signal,
              to: newParticipantId,
              from: userId,
            });
          });

          peer.on("stream", (stream) => {
            setRemoteStreams((prev) =>
              new Map(prev).set(newParticipantId, stream)
            );
          });

          peersRef.current[newParticipantId] = peer;
          setCallParticipants((prev) => new Set([...prev, newParticipantId]));
        }
      }
    );

    socketRef.current.on("video-call-signal", ({ signal, from }) => {
      if (peersRef.current[from]) {
        peersRef.current[from].signal(signal);
      }
    });

    socketRef.current.on("participant-left", ({ leavingUser }) => {
      // Remove the leaving participant's remote stream
      setRemoteStreams((prev) => {
        const newStreams = new Map(prev);
        newStreams.delete(leavingUser);
        return newStreams;
      });

      // Remove the leaving participant from the participants list
      setCallParticipants((prev) => {
        const newParticipants = new Set(prev);
        newParticipants.delete(leavingUser);
        return newParticipants;
      });

      // Clean up peer connection for the leaving participant
      if (peersRef.current[leavingUser]) {
        peersRef.current[leavingUser].destroy();
        delete peersRef.current[leavingUser];
      }
    });

    socketRef.current.on("screen-share-request", async (data) => {
      console.log("Incoming screen share from:", data.fromEmail);
      setIncomingShare(data);
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
      console.log("Video call accepted by:", fromEmail, signal);
      setCallAccept(true);
      if (peersRef.current) {
        peersRef.current[fromEmail].signal(signal);
        setIsVideoCalling(true);
      } else {
        console.error("No peer connection found for:", fromEmail);
      }
    });

    socketRef.current.on("voice-call-accepted", ({ signal, fromEmail }) => {
      console.log("Voice call accepted by:", fromEmail);
      setCallAccept(true);
      if (peerRef.current) {
        peerRef.current.signal(signal);
        setIsVoiceCalling(true);
      } else {
        console.error("No peer connection found for:", fromEmail);
      }
    });

    socketRef.current.on("video-call-ended", ({ to, from, duration }) => {
      // console.log("Video call ended between:", to, from, "Duration:", duration);
      endVideoCall();
      setIsVoiceCalling(false);
      setIsVideoCalling(false);
      setIncomingCall(null);
      // Add any additional logic you need here
    });

    socketRef.current.on("voice-call-ended", ({ to, from, duration }) => {
      // console.log("Video call ended between:", to, from, "Duration:", duration);
      endVoiceCall();
      setIsVoiceCalling(false);
      setIsVideoCalling(false);
      setIncomingCall(null);

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
        socketRef.current.off("voice-call-ended");
        socketRef.current.off("video-call-invite");
        socketRef.current?.off("participant-joined");
        socketRef.current?.off("participant-left");
      }
    };
  }, [socketRef.current, userId]);

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
      setError(
        "Failed to start screen share: " + (err.message || "Unknown error")
      );
      cleanupConnection();
    }
  };

  //==========================video call=============================

  const startVideoCall = async (receiverId, isGroupCall = false) => {
    if (!receiverId) {
      setError("Please enter peer email first");
      return;
    }

    try {
      let stream = null;
      try {
        // Try to get media stream but don't block if devices aren't available
        // console.log("hasWebcam", hasWebcam, "hasMicrophone", hasMicrophone);
        stream = await navigator.mediaDevices.getUserMedia({
          video: hasWebcam,
          audio: hasMicrophone,
        });
        // stream = await navigator.mediaDevices.getDisplayMedia({
        //   video: true,
        // });
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

      setCallStartTime(new Date());
      setIsCameraOn(true);
      setIsMicrophoneOn(true);

      // Create peer for initial call
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
      });

      peer.on("signal", (signal) => {
        const data = {
          fromEmail: userId,
          toEmail: receiverId,
          signal,
          type: "video",
          isGroupCall,
          participants: Array.from(new Set([userId, receiverId])),
        };

        console.log("data", data);
        socketRef.current.emit("video-call-request", data);
      });

      peer.on("stream", (remoteStream) => {
        console.log("Got stream from initial peer:", receiverId);
        setRemoteStreams((prev) => new Map(prev).set(receiverId, remoteStream));
      });

      peersRef.current[receiverId] = peer;
      setIsVideoCalling(true);
      setPeerEmail(receiverId);
      setCallParticipants(new Set([userId, receiverId]));
    } catch (err) {
      console.error("Error starting video call:", err);
      endVideoCall();
    }
  };

  // console.log("remote stream", remoteStreams);

  // New function to invite additional participants
  const inviteToCall = async (newParticipantId) => {
    if (!streamRef.current) return;

    try {
      const newPeer = new Peer({
        initiator: true,
        trickle: false,
        stream: streamRef.current,
      });

      newPeer.on("signal", (signal) => {
        socketRef.current.emit("video-call-invite", {
          fromEmail: userId,
          toEmail: newParticipantId,
          signal,
          type: "video",
          participants: Array.from(callParticipants),
        });
      });

      newPeer.on("stream", (remoteStream) => {
        setRemoteStreams((prev) =>
          new Map(prev).set(newParticipantId, remoteStream)
        );
      });

      peersRef.current[newParticipantId] = newPeer;

      // Notify all existing participants about the new member
      Array.from(callParticipants).forEach((participantId) => {
        if (participantId !== userId) {
          socketRef.current.emit("participant-join", {
            newParticipantId,
            to: participantId,
            from: userId,
            participants: Array.from(callParticipants),
          });
        }
      });

      setCallParticipants((prev) => new Set([...prev, newParticipantId]));
    } catch (err) {
      console.error("Error inviting to call:", err);
    }
  };

  const acceptVideoCall = async () => {
    if (!incomingCall) return;

    try {
      // Set call start time when call is accepted
      setCallStartTime(new Date());
      startCallDurationTimer();

      let stream = null;
      try {
        // Try to get media stream but don't block if devices aren't available
        stream = await navigator.mediaDevices.getUserMedia({
          video: hasWebcam,
          audio: hasMicrophone,
        });
        // stream = await navigator.mediaDevices.getDisplayMedia({
        //   video: true,
        // });
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

      // Create peer for the caller
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream,
      });

      peer.on("signal", (signal) => {
        socketRef.current.emit("video-call-accept", {
          signal,
          fromEmail: incomingCall.fromEmail,
          toEmail: userId,
          participants: incomingCall.participants,
        });
      });

      peer.on("stream", (stream) => {
        console.log("Got stream from caller:", incomingCall.fromEmail);
        setRemoteStreams((prev) =>
          new Map(prev).set(incomingCall.fromEmail, stream)
        );
      });

      peer.signal(incomingCall.signal);
      peersRef.current[incomingCall.fromEmail] = peer;

      // Connect with other existing participants
      if (incomingCall.participants) {
        incomingCall.participants.forEach((participantId) => {
          if (
            participantId !== userId &&
            participantId !== incomingCall.fromEmail
          ) {
            const participantPeer = new Peer({
              initiator: true,
              trickle: false,
              stream,
            });

            participantPeer.on("signal", (signal) => {
              socketRef.current.emit("video-call-signal", {
                signal,
                to: participantId,
                from: userId,
              });
            });

            participantPeer.on("stream", (stream) => {
              console.log(
                "Got stream from existing participant:",
                participantId
              );
              setRemoteStreams((prev) =>
                new Map(prev).set(participantId, stream)
              );
            });

            peersRef.current[participantId] = participantPeer;
          }
        });
      }

      setIsVideoCalling(true);
      setPeerEmail(incomingCall.fromEmail);
      setCallParticipants(new Set(incomingCall.participants));
      setIncomingCall(null);
    } catch (err) {
      console.error("Error accepting call:", err);
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
    // if (callTimerRef.current) {
    //   clearInterval(callTimerRef.current);
    // }

    console.log("callParticipants", callParticipants, callParticipants.size);

    if (callParticipants.size > 2) {
      // Notify other participants about this user leaving
      Array.from(callParticipants).forEach((participantId) => {
        if (participantId !== userId) {
          if (socketRef.current) {
            socketRef.current.emit("participant-left", {
              leavingUser: userId,
              to: participantId,
              duration: finalDuration,
            });
          }
        }
      });
    } else {
      // Save call ended message with duration if call was connected
      Array.from(callParticipants).forEach((participantId) => {
        if (participantId !== userId) {
          if (socketRef.current) {
            socketRef.current.emit("end-video-call", {
              to: participantId,
              from: userId,
              duration: finalDuration,
            });
          }
        }
      });
    }

    Array.from(callParticipants).forEach((participantId) => {
      if (participantId !== userId) {
        if (callStartTime) {
          socketRef.current.emit("save-call-message", {
            senderId: userId,
            receiverId: participantId,
            callType: "video",
            status: "ended",
            duration: finalDuration,
            timestamp: new Date(),
          });
        }
      }
    });

    // Reset call-related states
    setCallStartTime(null);
    setCallDuration(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clean up only this participant's peer connections
    if (peersRef.current) {
      Object.entries(peersRef.current).forEach(([peerId, peer]) => {
        if (peer && typeof peer.destroy === "function") {
          peer.destroy();
          delete peersRef.current[peerId];
        }
      });
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

  const rejectVideoCall = (type) => {
    if (!incomingCall) return;
    // Save missed call message
    socketRef.current.emit("save-call-message", {
      senderId: incomingCall.fromEmail,
      receiverId: userId,
      callType: type,
      status: "missed",
      timestamp: new Date(),
    });
    if (socketRef.current) {
      socketRef.current.emit("end-video-call", {
        to: incomingCall.fromEmail,
        from: userId,
        duration: null,
      });
    }

    setIsVoiceCalling(false);
    setIsVideoCalling(false);
    setIncomingCall(null);
  };

  // ===========================call=============================

  const startVoiceCall = async (receiverId) => {
    if (!receiverId) {
      setError("Please enter peer email first");
      return;
    }

    setCallAccept(false);
    console.log("startVoiceCall", receiverId);
    try {
      let stream = null;
      try {
        // Only request audio stream for voice call
        stream = await navigator.mediaDevices.getUserMedia({
          audio: hasMicrophone,
          video: false,
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
        // endVoiceCall();
      });

      peerRef.current = peer;
      setIsVoiceCalling(true);
      setPeerEmail(receiverId);
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
          video: false,
        });
      } catch (err) {
        console.warn("Could not get audio device:", err);
        return;
      }

      if (stream) {
        streamRef.current = stream;
        setIsMicrophoneOn(true);
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
    console.log("endVoiceCall", peerEmail, userId);
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
        duration: finalDuration,
      });
    }

    if (callStartTime) {
      socketRef.current.emit("save-call-message", {
        senderId: userId,
        receiverId: peerEmail,
        callType: "voice",
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
    setIsVideoCalling(false);
    setIncomingCall(null);
    setIsCameraOn(false);
    setIsMicrophoneOn(false);
    setCallDuration(null);
    setCallStartTime(null);
    setPeerEmail(null);
    setVoiceCallData(null);
  };
  const rejectVoiceCall = (receiverId, type) => {
    if (!receiverId) return;
    // alert(type)

    // Save missed call message
    socketRef.current.emit("save-call-message", {
      senderId: userId,
      receiverId: receiverId,
      callType: type,
      status: "missed",
      timestamp: new Date(),
    });
    if (socketRef.current) {
      socketRef.current.emit("end-video-call", {
        to: receiverId,
        from: userId,
        duration: null,
      });
    }

    setIsVoiceCalling(null);
    setIsVideoCalling(null);
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

  // ===========================message reaction=============================
  const addMessageReaction = (message, emoji) => {
    console.log("addMessageReaction", message, emoji);
    if (!socketRef.current?.connected) return;
    socketRef.current.emit("message-reaction", {
      messageId:message._id,
      userId,
      emoji
    });
    if(message.receiver === userId){
      dispatch(getAllMessages({selectedId:message.sender}));
    }else{
      dispatch(getAllMessages({selectedId:message.receiver}));
    }
  };

  // ===========================cleanup Connection=============================

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

  // Add new socket event handlers
  const forwardMessage = (receiverId, message) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      const messageData = {
        senderId: userId,
        receiverId,
        content:message.content,
        forwardedFrom: message.sender,
      };
      console.log("messageData", messageData);

      socketRef.current.emit("forward-message", messageData);
      resolve();
    });
  };

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
    rejectVoiceCall,
    incomingShare,
    setIncomingShare,
    acceptScreenShare,
    startVoiceCall,
    acceptVoiceCall,
    endVoiceCall,
    isVoiceCalling,
    callAccept,
    remoteStreams,
    inviteToCall,
    callParticipants,
    isMicrophoneOn,
    voiceCallData,
    setVoiceCallData,
    forwardMessage,
    addMessageReaction
  };
};
