import { useEffect, useRef, useState } from "react";

const useScreenShare = (socketInstance) => {
  const peerConnection = useRef(null);
  const videoRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const initializePeerConnection = () => {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    peerConnection.current = new RTCPeerConnection(configuration);

    peerConnection.current.ontrack = (event) => {
      console.log("Track received:", event);
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketInstance.emit("ice-candidate", event.candidate);
      }
    };
  };

  const handleScreenShareOffer = async (offer) => {
    try {
      console.log("Received screen share offer:", offer);

      if (!peerConnection.current) {
        initializePeerConnection();
      }

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socketInstance.emit("screenShareAnswer", { to: offer.from, answer });
      setIsConnected(true);
    } catch (error) {
      console.error("Error handling screen share offer:", error);
    }
  };



  useEffect(() => {
    if (!socketInstance) return;

    socketInstance.on("screenShareOffer", handleScreenShareOffer);

    socketInstance.on("ice-candidate", async (candidate) => {
      try {
        if (peerConnection.current) {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        }
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });

    return () => {
      socketInstance.off("screenShareOffer");
      socketInstance.off("ice-candidate");

      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
    };
  }, [socketInstance]);

  return {
    videoRef,
    isConnected,
    peerConnection: peerConnection.current,
  };
};

export default useScreenShare;
