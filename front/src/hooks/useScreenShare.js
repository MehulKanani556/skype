import { useRef, useCallback } from "react";

export const useScreenShare = (socket) => {
  const peerConnection = useRef(null);
  const screenStream = useRef(null);

  const startScreenShare = useCallback(
    async (contactId) => {
      try {
        // Get screen sharing stream
        screenStream.current = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        // Create new RTCPeerConnection
        peerConnection.current = new RTCPeerConnection();

        // Add tracks to peer connection
        screenStream.current.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, screenStream.current);
        });

        // Create and send offer
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);

        socket.emit("screenShareRequest", {
          to: contactId,
          from: socket.id,
          offer,
        });

        return true;
      } catch (error) {
        console.error("Error starting screen share:", error);
        return false;
      }
    },
    [socket]
  );

  const stopScreenShare = useCallback(() => {
    if (screenStream.current) {
      screenStream.current.getTracks().forEach((track) => track.stop());
      screenStream.current = null;
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
  }, []);

  const handleIncomingScreenShare = useCallback(
    async (data, videoElement) => {
      try {
        peerConnection.current = new RTCPeerConnection();

        // Set up video element to show remote screen
        peerConnection.current.ontrack = (event) => {
          if (videoElement) {
            videoElement.srcObject = event.streams[0];
          }
        };

        // Set remote description and create answer
        await peerConnection.current.setRemoteDescription(data.offer);
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        socket.emit("screenShareAnswer", {
          to: data.from,
          answer,
        });
      } catch (error) {
        console.error("Error handling incoming screen share:", error);
      }
    },
    [socket]
  );

  return {
    startScreenShare,
    stopScreenShare,
    handleIncomingScreenShare,
  };
};
