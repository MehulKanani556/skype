import React, { useState, useEffect, useRef, useContext } from "react";
import {
  FaSearch,
  FaCommentDots,
  FaPhone,
  FaUsers,
  FaBell,
  FaPlus,
  FaVideo,
  FaEllipsisH,
  FaDownload,
  FaMusic,
  FaFile,
} from "react-icons/fa";
import { useSocket } from "../hooks/useSocket";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteMessage,
  getAllMessages,
  getAllUsers,
  getOnlineUsers,
  updateMessage,
} from "../redux/slice/user.slice";
import { BASE_URL, IMG_URL } from "../utils/baseUrl";
import axios from "axios";
// Adjust the import path based on your structure

const Chat2 = () => {
  const [selectedTab, setSelectedTab] = useState("Chats");
  const [recentChats, setRecentChats] = useState([]);
  const [messagesA, setMessages] = useState([]);
  const [currentUser] = useState(sessionStorage.getItem("userId")); // Replace with actual user data
  const [selectedChat, setSelectedChat] = useState(null);
  const typingTimeoutRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [showCallModal, setShowCallModal] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    messageId: null,
  });
  const [editingMessage, setEditingMessage] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const inputRef = useRef(null);

  const dispatch = useDispatch();

  const { onlineUser, isLoading, allUsers, messages } = useSelector(
    (state) => state.user
  );
  

  console.log(messages);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };
  }, []);


  useEffect(() => {
    dispatch(getAllUsers());
    dispatch(getOnlineUsers());
  }, [dispatch]);

  useEffect(() => {
    if (selectedChat) {
      dispatch(getAllMessages({ selectedId: selectedChat._id }));
    }
  }, [selectedChat]);

  // Use the custom socket hook
  const {
    socket,
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
    remoteStreamRef,
  } = useSocket(currentUser);

  console.log(onlineUsers);

  // Subscribe to messages and typing status
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeMessages = subscribeToMessages((message) => {
      console.log("message", message);
      if (message.type === "delete") {
        // Handle message deletion
        dispatch(getAllMessages({ selectedId: selectedChat._id }));
      } else {
        // Handle new message
        if (selectedChat) {
          dispatch(getAllMessages({ selectedId: selectedChat._id }));
        }
      }
    });

    return () => {
      unsubscribeMessages?.();
    };
  }, [isConnected, selectedChat]);

  // ===========================typing=============================

  useEffect(() => {
    if (!isConnected) return;
  
    const handleTypingStatus = (data) => {
      if (data.userId === selectedChat?._id) {
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: data.isTyping
        }));
  
        // Clear typing indicator after 3 seconds of no updates
        if (data.isTyping) {
          setTimeout(() => {
            setTypingUsers(prev => ({
              ...prev,
              [data.userId]: false
            }));
          }, 3000);
        }
      }
    };
  
    socket.on("user-typing", handleTypingStatus);
  
    return () => {
      socket.off("user-typing", handleTypingStatus);
    };
  }, [isConnected, selectedChat]);

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    if (selectedChat) {
      sendTypingStatus(selectedChat._id, true);
      
      // Clear typing status after 3 seconds
      // if (typingTimeoutRef.current) {
      //   clearTimeout(typingTimeoutRef.current);
      // }
      
      // typingTimeoutRef.current = setTimeout(() => {
      //   sendTypingStatus(selectedChat._id, false);
      // }, 3000);
    }
  };

  // ===========================sending message=============================

  // Handle sending messages
  const handleSendMessage = async (data) => {
    if (editingMessage) {
      try {
        await dispatch(
          updateMessage({
            messageId: editingMessage._id,
            content: data.content,
          })
        );

        // Emit socket event for real-time update
        socket.emit("update-message", {
          messageId: editingMessage._id,
          content: data.content,
        });

        setEditingMessage(null);
        dispatch(getAllMessages({ selectedId: selectedChat._id }));
      } catch (error) {
        console.error("Failed to update message:", error);
      }
    } else {
      console.log(data);
      if (
        (data.type == "text" && data?.content?.trim() === "") ||
        !selectedChat
      )
        return;

      try {
        const status = await sendPrivateMessage(selectedChat._id, data);

        console.log(status);

        // Add message to local state
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            content: data,
            time: new Date().toLocaleTimeString(),
            sender: "me",
            status: status.status,
          },
        ]);
        dispatch(getAllMessages({ selectedId: selectedChat._id }));
      } catch (error) {
        console.error("Failed to send message:", error);
        // Handle error (show notification, etc.)
      }
    }
    setMessageInput("");
  };

  // Handle typing status
  const handleTyping = (e) => {
    if (!selectedChat) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendTypingStatus(selectedChat.id, true);

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(selectedChat.id, false);
    }, 2000);
  };

  // Simulate fetching data from an API
  useEffect(() => {
    const fetchChats = async () => {
      // Simulate an API call
      const fetchedChats = [
        {
          id: 1,
          name: "Copilot",
          status: "online",
          time: "25-06-2024",
          message: "Hey, this is Copilot...",
          isVerified: true,
        },
        { id: 2, name: "archit bhuva (You)", time: "", avatar: "AB" },
        {
          id: 3,
          name: "Mehul Kanani",
          status: "active",
          time: "17:10",
          username: "architbhuva123",
        },
        { id: 4, name: "Vaidik Moradiya", time: "16:47", message: "ha" },
        {
          id: 5,
          name: "Akshay Padaliya",
          time: "15:25",
          message: "photo",
          hasPhoto: true,
        },
      ];
      setRecentChats(fetchedChats);
    };

    const fetchMessages = async () => {
      // Simulate an API call
      const fetchedMessages = [
        { id: 1, text: "hello", time: "09:14", sender: "other" },
        {
          id: 2,
          content: "Baby-project (2).zip",
          size: "47.3 MB",
          type: "file",
          time: "17:49",
          sender: "other",
        },
        {
          id: 3,
          content: "grid.zip",
          size: "30 KB",
          type: "file",
          time: "10:50",
          sender: "other",
        },
      ];
      setMessages(fetchedMessages);
    };

    fetchChats();
    fetchMessages();
  }, []);

  // Update the useEffect for screen sharing
  useEffect(() => {
    const videoElement = remoteVideoRef.current;

    const handleScreenShareOffer = async (data) => {
      try {
        console.log("Received screen share offer:", data);
        const acceptShare = window.confirm(`Someone wants to share their screen. Accept?`);

        if (acceptShare) {
          await handleIncomingScreenShare(data.offer);
          
          // Check if data.offer is a valid MediaStream
          if (videoElement && data.offer && data.offer instanceof MediaStream) {
            videoElement.srcObject = data.offer; // Set the srcObject to the incoming stream
            videoElement.play().catch(error => {
              console.error("Error playing video:", error);
            });
          } else {
            console.error("Invalid MediaStream:", data.offer);
          }
        } else {
          socket.emit("screenShareRejected", { to: data.senderId });
        }
      } catch (error) {
        console.error("Error handling screen share:", error);
      }
    };

    if (isConnected && socket) {
      socket.on("screenShareOffer", handleScreenShareOffer);
    }

    return () => {
      if (socket) {
        socket.off("screenShareOffer", handleScreenShareOffer);
      }
    };
  }, [isConnected, handleIncomingScreenShare, socket]);

  const handleStartScreenShare = async () => {
    console.log(selectedChat);
    if (selectedChat) {
      const success = await startScreenShare(selectedChat._id);
      console.log(success);
      if (!success) {
        console.error("Failed to start screen sharing");
      }
    }
  };

  const handleMultipleFileUpload = async (files) => {
    console.log(files);
    // Convert FileList to Array
    const filesArray = Array.from(files);

    console.log(filesArray);

    // Upload each file
    for (const file of filesArray) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        // Upload file to your server

        const response = await axios.post(`${BASE_URL}/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });

        if (response.status === 200) {
          const { fileUrl, fileType } = response.data;

          // Send separate message for each file
          await handleSendMessage({
            type: "file",
            content: file.name,
            fileUrl: fileUrl,
            fileType: fileType || file.type,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          });
        }
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // Handle error (show notification, etc.)
      }
    }
  };
  console.log('Upload', remoteVideoRef)

  // ===========================call=============================

  // Add call handling functions
  const handleMakeCall = async (type) => {
    if (!selectedChat) return;

    try {
      const localStream = await makeCall(selectedChat._id, type);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      setShowCallModal(true);
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  const handleAnswerCall = async () => {
    try {
      const localStream = await answerCall(currentCall);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      setShowCallModal(true);
    } catch (error) {
      console.error("Error answering call:", error);
    }
  };

  // Add useEffect for remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [remoteStreamRef.current]);

  // ===========================delete message=============================

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    if (
      message.sender === sessionStorage.getItem("userId") &&
      message.content?.type === "text"
    ) {
      setContextMenu({
        visible: true,
        x: e.pageX,
        y: e.pageY,
        messageId: message._id,
        message: message,
      });
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await dispatch(deleteMessage(messageId));
      // Emit socket event for real-time deletion
      socket.emit("delete-message", messageId);
      if (selectedChat) {
        dispatch(getAllMessages({ selectedId: selectedChat._id }));
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setMessageInput(message.content.content);
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    const handleClick = () =>
      setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="flex h-screen bg-white">
      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-1">
          Connecting to chat server...
        </div>
      )}

      {/* Left Sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b">
          <div className="flex items-center bg-gray-100 rounded-md p-2">
            <FaSearch className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="People, groups, messages"
              className="bg-transparent ml-2 outline-none flex-1"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-around p-4 border-b">
          <div className="flex flex-col items-center text-blue-500">
            <FaCommentDots className="w-6 h-6" />
            <span className="text-xs mt-1">Chat</span>
          </div>
          <div className="flex flex-col items-center text-gray-500">
            <FaPhone className="w-6 h-6" />
            <span className="text-xs mt-1">Calls</span>
          </div>
          <div className="flex flex-col items-center text-gray-500">
            <FaUsers className="w-6 h-6" />
            <span className="text-xs mt-1">Contacts</span>
          </div>
          <div className="flex flex-col items-center text-gray-500">
            <FaBell className="w-6 h-6" />
            <span className="text-xs mt-1">Notifications</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 space-x-4 border-b">
          <button
            className={`py-2 ${selectedTab === "All" ? "border-b-2 border-blue-500" : ""
              }`}
            onClick={() => setSelectedTab("All")}
          >
            All
          </button>
          <button
            className={`py-2 ${selectedTab === "Chats" ? "border-b-2 border-blue-500" : ""
              }`}
            onClick={() => setSelectedTab("Chats")}
          >
            Chats
          </button>
          <button
            className={`py-2 ${selectedTab === "Channels" ? "border-b-2 border-blue-500" : ""
              }`}
            onClick={() => setSelectedTab("Channels")}
          >
            Channels
          </button>
        </div>

        {/* Chat List with online status */}
        <div className="flex-1 overflow-y-auto">
          {[...allUsers]
            .sort((a, b) => {
              // Put current user first
              if (a._id === currentUser) return -1;
              if (b._id === currentUser) return 1;
              return 0;
            })
            .map((chat) => (
              <div
                key={chat._id}
                className={`flex items-center p-3 hover:bg-gray-100 cursor-pointer ${selectedChat?._id === chat._id ? "bg-gray-100" : ""
                  }`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    {chat.avatar || chat.email.charAt(0)}
                  </div>
                  {onlineUsers.includes(chat._id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full"></div>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {chat._id === currentUser
                        ? `${chat.userName} (You)`
                        : chat.userName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(chat.createdAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {chat.email}
                    {chat.hasPhoto && (
                      <span className="text-xs ml-1">[photo]</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-300"></div>
            <div className="ml-3">
              <div className="font-medium">
                {selectedChat?.userName || "Select a chat"}
              </div>
              <div className="text-sm text-green-500">
                {onlineUsers.includes(selectedChat?._id)
                  ? "Active now"
                  : "Offline"}
              </div>
            </div>
          </div>
          {selectedChat && (
            <div className="flex items-center space-x-4">
              <FaSearch className="w-6 h-6" />
              <FaPhone
                className="w-6 h-6 cursor-pointer"
                onClick={() => handleMakeCall("audio")}
              />
              <FaVideo
                className="w-6 h-6 cursor-pointer"
                onClick={() => handleMakeCall("video")}
              />
              <FaEllipsisH className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Messages */}
        {selectedChat ? (
          <div className="flex-1 overflow-y-auto p-4">
            {messages && messages.length > 0 ? (
              messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.sender === sessionStorage.getItem("userId")
                    ? "justify-end"
                    : "justify-start"
                    } mb-4`}
                >
                  {message.content?.type === "file" ? (
                    <div
                      className="bg-blue-50 rounded-lg p-4 max-w-sm"
                      onContextMenu={(e) => handleContextMenu(e, message)}
                    >
                      <div className="flex items-center">
                        <div className="ml-3">
                          <div className="font-medium">
                            {message.content?.content}
                          </div>
                          {message.content?.fileUrl && (
                            <div className="mt-2">
                              {message.content?.fileType?.startsWith(
                                "image/"
                              ) ? (
                                <img
                                  src={`${IMG_URL}${message.content.fileUrl}`}
                                  alt={message.content.content}
                                  className="max-w-xs rounded cursor-pointer"
                                  onClick={() =>
                                    window.open(
                                      `${IMG_URL}${message.content.fileUrl}`,
                                      "_blank"
                                    )
                                  }
                                />
                              ) : message.content?.fileType?.startsWith(
                                "video/"
                              ) ? (
                                <video
                                  controls
                                  className="max-w-xs"
                                  src={`${IMG_URL}${message.content.fileUrl}`}
                                />
                              ) : message.content?.fileType?.startsWith(
                                  "audio/"
                                ) ? (
                                <audio
                                  controls
                                  src={`${IMG_URL}${message.content.fileUrl}`}
                                />
                              ) : (
                                <a
                                  href={`${IMG_URL}${message.content.fileUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                >
                                  Download {message.content.content}
                                </a>
                              )}
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <span>{message.content?.size || "0 KB"}</span>
                            <a
                              href={`${IMG_URL}${message.content.fileUrl}`}
                              download={message.content.content}
                              className="ml-2 text-blue-500 hover:underline"
                            >
                              <FaDownload className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div
                        className="bg-blue-50 rounded-lg py-2 px-4"
                        onContextMenu={(e) => handleContextMenu(e, message)}
                      >
                        <p>{message.content?.content}</p>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(() => {
                          const msgDate = new Date(message.createdAt);
                          const today = new Date();
                          const tomorrow = new Date(today);
                          tomorrow.setDate(tomorrow.getDate() + 1);

                          if (msgDate > tomorrow) {
                            return (
                              msgDate.toLocaleDateString("en-GB") +
                              " " +
                              msgDate.toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })
                            );
                          }
                          return msgDate.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No messages yet
              </div>
            )}
            {selectedChat && typingUsers[selectedChat._id] && (
  <div className="flex items-center space-x-2 text-gray-500 text-sm ml-4 mb-2">
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
    <span>{selectedChat.userName} is typing...</span>
  </div>
)}

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        )}

        {/* Message Input */}
        {selectedChat && (
          <div className="border-t p-4">
            <div className="flex items-center">
              <button onClick={handleStartScreenShare}>Share Screen</button>
              {/* <video ref={remoteVideoRef} autoPlay playsInline /> */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full max-w-lg border rounded-lg"
                style={{ display: remoteVideoRef.current?.srcObject ? 'block' : '' }}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FaPlus className="w-6 h-6" />
              </label>
              {console.log(selectedChat)}
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  console.log(files);
                  if (files) {
                    handleMultipleFileUpload(files);
                  }
                }}
              />

              <div
                className="ml-2 p-2 border-2 border-dashed rounded-lg cursor-pointer"
                onDrop={(e) => {
                  e.preventDefault();
                  const files = e.dataTransfer.files;
                  if (files) {
                    handleMultipleFileUpload(files);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                Drag files here
              </div>

              <input
                ref={inputRef}
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                placeholder={
                  editingMessage ? "Edit message..." : "Type a message"
                }
                className="ml-4 flex-1 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage({
                      type: "text",
                      content: messageInput,
                    });
                  } else if (e.key === "Escape" && editingMessage) {
                    setEditingMessage(null);
                    setMessageInput("");
                  }
                }}
              />
              {editingMessage && (
                <button
                  onClick={() => {
                    setEditingMessage(null);
                    setMessageInput("");
                  }}
                  className="ml-2 text-gray-500"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {currentCall?.status === "calling" ? "Calling..." : "In Call"}
              </h3>
              <button
                onClick={() => {
                  endCall();
                  setShowCallModal(false);
                }}
                className="text-red-500"
              >
                End Call
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg"
                />
                <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                  You
                </span>
              </div>
              <div className="relative">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                  {selectedChat?.userName}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Modal */}
      {currentCall?.status === "incoming" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">
              Incoming {currentCall.type} call from{" "}
              {allUsers.find((u) => u._id === currentCall.from)?.userName}
            </h3>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  endCall();
                  setShowCallModal(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Decline
              </button>
              <button
                onClick={() => {
                  handleAnswerCall();
                  setShowCallModal(true);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Answer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add the context menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white shadow-lg rounded-lg py-2 px-4 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => handleEditMessage(contextMenu.message)}
            className="text-blue-500 hover:bg-gray-100 py-1 px-2 rounded w-full text-left"
          >
            Edit Message
          </button>
          <button
            onClick={() => handleDeleteMessage(contextMenu.messageId)}
            className="text-red-500 hover:bg-gray-100 py-1 px-2 rounded w-full text-left"
          >
            Delete Message
          </button>
        </div>
      )}
    </div>
  );
};

export default Chat2;
