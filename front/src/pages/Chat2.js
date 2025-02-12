import React, { useState, useEffect, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import {
  FaSearch,
  FaCommentDots,
  FaPhone,
  FaUsers,
  FaBell,
  FaEllipsisH,
  FaDownload,
  FaShareAlt,
  FaUserPlus,
  FaBookmark,
  FaCog,
  FaQrcode,
  FaStar,
  FaPaperclip,
  FaMicrophone,
  FaRegSmile,
} from "react-icons/fa";
import { HiOutlineReply } from "react-icons/hi";
import { PiDotsThreeVerticalBold } from "react-icons/pi";
import { VscCopy } from "react-icons/vsc";
import { MdOutlineModeEdit } from "react-icons/md";
import { CgMailForward } from "react-icons/cg";
import { CiSquareRemove } from "react-icons/ci";
import { FaRegUser } from "react-icons/fa";
import { RiShutDownLine } from "react-icons/ri";
import { LuScreenShare } from "react-icons/lu";
import { IoMdSearch } from "react-icons/io";
import { MdPhoneEnabled, MdGroupAdd } from "react-icons/md";
import { GoDeviceCameraVideo } from "react-icons/go";
import { LuSendHorizontal } from "react-icons/lu";
import { ImCross } from "react-icons/im";
import { useSocket } from "../hooks/useSocket";
import { useDispatch, useSelector } from "react-redux";
import {
  createGroup,
  deleteMessage,
  getAllGroups,
  getAllMessages,
  getAllMessageUsers,
  getAllUsers,
  getOnlineUsers,
  updateMessage,
} from "../redux/slice/user.slice";
import { BASE_URL, IMG_URL } from "../utils/baseUrl";
import axios from "axios";
import Front from '../component/Front';

const Chat2 = () => {
  const [selectedTab, setSelectedTab] = useState("All");
  const [recentChats, setRecentChats] = useState([]);
  const [messagesA, setMessages] = useState([]);
  const [showDialpad, setShowDialpad] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser] = useState(sessionStorage.getItem("userId")); // Replace with actual user data
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
  const peerConnectionRef = useRef(null);
  const [userId, setUserId] = useState(sessionStorage.getItem("userId"));
  const [groupUsers, setGroupUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  const dispatch = useDispatch();

  const { onlineUser, isLoading, allUsers, messages, allMessageUsers, groups } =
    useSelector((state) => state.user);

  //===========Use the custom socket hook===========
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
    sendGroupMessage,
  } = useSocket(currentUser);

  //   console.log(onlineUsers);

  //===========get all users===========
  useEffect(() => {
    dispatch(getAllUsers());
    dispatch(getOnlineUsers());
    dispatch(getAllMessageUsers());
    dispatch(getAllGroups());
  }, [dispatch]);

  //===========profile dropdown===========
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileDropdownOpen && !event.target.closest(".profile-dropdown")) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileDropdownOpen]);

  //===========Add cleanup effect  localStreamRef remoteVideoRef peerConnectionRef===========
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, []);

  //===========get all messages ===========
  useEffect(() => {
    if (selectedChat) {
      dispatch(getAllMessages({ selectedId: selectedChat._id }));
    }
  }, [selectedChat]);

  // ============Subscribe to messages ===========
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeMessages = subscribeToMessages((message) => {
      if (message.type === "delete") {
        dispatch(getAllMessages({ selectedId: selectedChat._id }));
      } else {
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
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: data.isTyping,
        }));

        // Clear typing indicator after 3 seconds of no updates
        if (data.isTyping) {
          setTimeout(() => {
            setTypingUsers((prev) => ({
              ...prev,
              [data.userId]: false,
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
    }
  };

  //===========handle send message ===========

  // const handleSendMessage = (text) => {
  //     if (text.trim() === '') return;
  //     const newMessage = { id: messages.length + 1, text, time: new Date().toLocaleTimeString(), sender: 'me' };
  //     setMessages([...messages, newMessage]);
  // };
  const handleSendMessage = async (data) => {
    if (editingMessage) {
      try {
        await dispatch(
          updateMessage({
            messageId: editingMessage._id,
            content: data.content,
          })
        );
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
      if (
        (data.type == "text" && data?.content?.trim() === "") ||
        !selectedChat
      )
        return;

      try {
        const status = await sendPrivateMessage(selectedChat._id, data);
        dispatch(getAllMessages({ selectedId: selectedChat._id }));
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
    setMessageInput("");
  };

  //===========handle send group message===========
  const handleSendGroupMessage = async (data) => {
    if (data.content.trim() === "") return;

    try {
      await sendGroupMessage(selectedChat._id, data);
      dispatch(getAllMessages({ selectedId: selectedChat._id })); // Refresh messages if needed
    } catch (error) {
      console.error("Failed to send group message:", error);
    }
  };

  //===========emoji picker===========
  const onEmojiClick = (event, emojiObject) => {
    console.log(emojiObject.emoji);
    setMessage((prevMessage) => prevMessage + event.emoji);
  };

  //===========emoji picker===========
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setIsEmojiPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //===========handle multiple file upload===========

  const handleMultipleFileUpload = async (files) => {
    const filesArray = Array.from(files);
    for (const file of filesArray) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(`${BASE_URL}/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });

        if (response.status === 200) {
          const { fileUrl, fileType } = response.data;

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
      }
    }
  };

  //================screen sharing================
  useEffect(() => {
    const videoElement = remoteVideoRef.current;

    const handleScreenShareOffer = async (data) => {
      try {
        console.log("Received screen share offer:", data);
        const acceptShare = window.confirm(
          `Someone wants to share their screen. Accept?`
        );

        if (acceptShare) {
          const peerConnection = new RTCPeerConnection();

          peerConnection.ontrack = (event) => {
            if (videoElement) {
              videoElement.srcObject = event.streams[0];
              videoElement.play().catch((error) => {
                console.error("Error playing video:", error);
              });
            }
          };

          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );

          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          socket.emit("screenShareAnswer", {
            to: data.senderId,
            answer: peerConnection.localDescription,
          });

          peerConnectionRef.current = peerConnection;
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

  // ==================group chat=================

  const handleCreateGroup = () => {
    const data = {
      userName: `group-${Math.random().toString(36).substring(2, 7)}`,
      members: groupUsers,
    };

    // console.log(data);
    dispatch(createGroup(data));
    setGroupUsers([]);
    setIsModalOpen(false);
  };

  // Subscribe to group messages
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeGroupMessages = subscribeToMessages((message) => {
      if (message.type === "group") {
        dispatch(getAllMessages({ selectedId: selectedChat._id })); // Refresh messages if needed
      }
    });

    return () => {
      unsubscribeGroupMessages?.();
    };
  }, [isConnected, selectedChat]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      type: messageInput instanceof FileList ? "file" : "text",
      content: messageInput,
    };

    if (selectedChat && selectedChat?.members?.length > 0) {
      handleSendGroupMessage(data); // Send group message
    } else if (data.type === "text") {
      handleSendMessage(data); // Send private message
    } else if (data.type === "file") {
      handleMultipleFileUpload(messageInput);
    }
    setMessageInput("");
  };

  const toggleDropdown = (messageId) => {
    setActiveDropdown((prev) => (prev === messageId ? null : messageId));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex h-screen bg-white">
      <div className="w-80 border-r flex flex-col">
        <div className="relative profile-dropdown">
          <div
            className="flex items-center p-4 border-b cursor-pointer hover:bg-gray-100"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden"></div>
            <div className="ml-3 flex-1">
              <div className="flex items-center">
                <span className="font-medium">archit bhuva</span>
              </div>
              <div className="text-sm text-green-500">Set a status</div>
            </div>
          </div>

          {isProfileDropdownOpen && (
            <div className="absolute top-full left-0 w-[85%] bg-white border shadow-lg z-50 ml-5 rounded-[10px]">
              <div
                className="p-3 hover:bg-gray-100 border-t"
                onClick={() => setIsProfileModalOpen(true)}
              >
                <div className="flex items-center space-x-2 text-gray-600 cursor-pointer">
                  <FaRegUser className="w-5 h-5" />
                  <span>Profile</span>
                </div>
              </div>

              <div className="p-3 hover:bg-gray-100 border-t">
                <div className="flex items-center space-x-2 text-gray-600 cursor-pointer">
                  <RiShutDownLine className="w-5 h-5" />
                  <span>Logout</span>
                </div>
              </div>
            </div>
          )}
        </div>

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
            className={`py-2 ${selectedTab === "Unread" ? "border-b-2 border-blue-500" : ""
              }`}
            onClick={() => setSelectedTab("Unreacd")}
          >
            Unread
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {[...allMessageUsers, ...groups]
            .sort((a, b) => {
              if (a._id === currentUser) return -1;
              if (b._id === currentUser) return 1;
              return 0;
            })
            .map((item) => (
              <div
                key={item._id}
                className={`flex items-center p-3 hover:bg-gray-100 cursor-pointer ${selectedChat?._id === item._id ? "bg-gray-100" : ""
                  }`}
                onClick={() => setSelectedChat(item)}
              >
                <div className="w-10 h-10 rounded-full font-bold bg-gray-300 flex items-center justify-center relative">
                  {item.avatar || item.userName.charAt(0).toUpperCase()}
                  {onlineUsers.includes(item._id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full"></div>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {item._id === currentUser
                        ? `${item.userName} (You)`
                        : item.userName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.email}
                    {item.hasPhoto && (
                      <span className="text-xs ml-1">[photo]</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-300"></div>
            <div className="ml-3">
              <div className="font-medium">
                {selectedChat?.userName || "Select a chat"}
              </div>
              <div
                className={`text-sm ${onlineUsers.includes(selectedChat?._id)
                  ? "text-green-500"
                  : "text-gray-500"
                  }`}
              >
                {onlineUsers.includes(selectedChat?._id)
                  ? "Active now"
                  : "Offline"}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <IoMdSearch className="w-6 h-6 cursor-pointer" />
            <LuScreenShare className="w-6 h-6 cursor-pointer" onClick={() => handleStartScreenShare()} />
            <MdGroupAdd
              className="w-6 h-6 cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            />
            <MdPhoneEnabled
              className=" w-6 h-6 cursor-pointer"
              onClick={() => handleMakeCall("audio")}
            />
            <GoDeviceCameraVideo
              className="w-6 h-6 cursor-pointer"
              onClick={() => handleMakeCall("video")}
            />
            {/* <FaEllipsisH className="" /> */}
          </div>
        </div>

        {/*========== Messages ==========*/}
        {selectedChat ? (
          <div className="flex-1 overflow-y-auto p-4">
            {messages && messages.length > 0 ? (
              messages.map((message) => (
                <>
                  <div
                    key={message._id}
                    className={`flex ${message.sender === userId
                      ? "justify-end"
                      : "justify-start"
                      } mb-4`}
                    onMouseEnter={() => setHoveredMessageId(message._id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    {message.content?.type === "file" ? (
                      <div
                        className={`rounded-lg p-4 max-w-sm ${message.sender === userId
                          ? "bg-[#CCF7FF]"
                          : "bg-[#F1F1F1]"
                          }`}
                        style={{ maxWidth: "500px", wordWrap: "break-word" }}
                        onContextMenu={(e) => handleContextMenu(e, message)}
                      >
                        <div className="flex items-center">
                          <FaDownload className="w-6 h-6" />
                          <div className="ml-3">
                            <div className="font-medium">
                              {message.content?.content}
                            </div>
                            <div className="text-sm text-gray-500">
                              {message.content?.size}
                            </div>
                          </div>
                        </div>
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
                    ) : (
                      <div
                        className={`rounded-lg py-2 px-4 me-3 ${message.sender === userId
                          ? "bg-[#CCF7FF]"
                          : "bg-[#F1F1F1]"
                          }`}
                        onContextMenu={(e) => handleContextMenu(e, message)}
                      >
                        <p>{message.content?.content}</p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-1" ref={dropdownRef}>
                      {hoveredMessageId === message._id && (
                        <PiDotsThreeVerticalBold
                          className="w-[15px] h-[15px] cursor-pointer"
                          onClick={() => toggleDropdown(message._id)}
                        />
                      )}
                      {activeDropdown === message._id && (
                        <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg z-50">
                          <button className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100">
                            <MdOutlineModeEdit className="mr-2" /> Edit
                          </button>
                          <button
                            className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100">
                            <VscCopy className="mr-2" /> Copy
                          </button>
                          <button className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100">
                            <HiOutlineReply className="mr-2" /> Reply
                          </button>
                          <button className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100">
                            <CgMailForward className="mr-2" /> Forward
                          </button>
                          {/* <button className="block px-4 py-2 text-left text-black">Select Messages</button> */}
                          <button className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100">
                            <CiSquareRemove className="mr-2" /> Remove
                          </button>
                        </div>
                      )}
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
                  {messages?.length > 0 && (
                    <div ref={messagesEndRef} aria-hidden="true" />
                  )}
                </>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No messages yet
              </div>
            )}
            {selectedChat && typingUsers[selectedChat._id] && (
              <div className="flex items-center space-x-2 text-gray-500 text-sm ml-4 mb-2">
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
                <span>{selectedChat.userName} is typing...</span>
              </div>
            )}
          </div>
        ) : (
          <Front />
        )}

        {/*========== Message Input ==========*/}
        {selectedChat && (
          <div className="w-full max-w-4xl mx-auto p-4 rounded-lg">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 rounded-full px-4 py-2 shadow"
              style={{ backgroundColor: "#e5e7eb" }}
            >
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Add emoji"
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              >
                <FaRegSmile className="w-5 h-5 text-gray-500" />
              </button>

              {isEmojiPickerOpen && (
                <div
                  ref={emojiPickerRef}
                  className="absolute bg-white border rounded shadow-lg p-2 bottom-[70px]"
                >
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
              )}

              {/* <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message"
                            className="flex-1 px-2 py-1 outline-none text-black"
                            style={{ backgroundColor: "#e5e7eb" }}
                        /> */}
              <input
                ref={inputRef}
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                placeholder={
                  editingMessage ? "Edit message..." : "Type a message"
                }
                className="flex-1 px-2 py-1 outline-none text-black"
                style={{ backgroundColor: "#e5e7eb" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e, {
                      type: "text",
                      content: messageInput,
                    });
                  } else if (e.key === "Escape" && editingMessage) {
                    setEditingMessage(null);
                    setMessageInput("");
                  }
                }}
              />
              <div className="flex items-center gap-1">
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleInputChange}
                // onChange={(e) => {
                // e.preventDefault();
                // const files = e.target.files;
                // console.log(files);
                // if (files) {
                //     handleSubmit(e,files);
                // }
                // }}
                />
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Attach file"
                  onClick={() => document.getElementById("file-upload").click()}
                >
                  <FaPaperclip className="w-5 h-5 text-gray-500" />
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Voice message"
                >
                  <FaMicrophone className="w-5 h-5 text-gray-500" />
                </button>
                {messageInput != "" && (
                  <button
                    type="submit"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    style={{ backgroundColor: "#3B82F6", color: "white" }}
                    aria-label="Send message"
                  >
                    <LuSendHorizontal />
                  </button>
                )}
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
            </form>
          </div>
        )}
      </div>

      {/*========== Group Modal ==========*/}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg w-96 p-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-lg font-bold">Add to Group</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                {/* &times; */}
                <ImCross />
              </button>
            </div>
            <div className="mt-4">
              <input
                type="text"
                placeholder="Search"
                className="w-full p-2 border rounded mb-4"
              />
              {/* {console.log(groupUsers)} */}
              <div className="space-y-2 h-80 overflow-y-auto">
                {allUsers.map((user, index) => {
                  const isChecked = groupUsers.includes(user._id); // Check if user is already selected
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 hover:bg-gray-100 rounded"
                      onClick={() => {
                        if (!isChecked) {
                          setGroupUsers((prev) => [...prev, user._id]); // Add user ID to groupUsers state
                        } else {
                          setGroupUsers((prev) =>
                            prev.filter((id) => id !== user._id)
                          ); // Remove user ID from groupUsers state
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center mr-2">
                          {user.userName
                            .split(" ")
                            .map((n) => n[0].toUpperCase())
                            .join("")}
                        </div>
                        <span>{user.userName}</span>
                      </div>
                      <input
                        id={`checkbox-${user._id}`}
                        type="checkbox"
                        checked={isChecked} // Set checkbox state based on selection
                        readOnly // Make checkbox read-only to prevent direct interaction
                        className="form-checkbox rounded-full"
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          border: "2px solid #ccc",
                          backgroundColor: "#fff",
                          cursor: "pointer",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => handleCreateGroup()}
                className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Modal */}
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

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 " style={{ background: "#CCF7FF", background: "linear-gradient(180deg, rgba(34,129,195,1) 0%, rgba(189,214,230,1) 48%, rgba(255,255,255,1) 100%)" }}>
            <div className="flex justify-between items-center pb-2 p-4">
              <h2 className="text-lg font-bold">Profile</h2>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ImCross />
              </button>
            </div>
            <div className="flex flex-col items-center" >
              <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden mt-4">
                <img src={require('../img/profile.jpg')} alt="Profile" className="" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="mt-2 text-xl font-semibold">archit bhuva</h3><MdOutlineModeEdit className="cursor-pointer" />
              </div>
              <div className="text-green-500">Online</div>
            </div>
            <div className="mt-4 p-4">
              <div className="flex items-center justify-between p-2 border-b">
                <span className="text-gray-600 font-bold">Skype Name</span>
                <span className="text-gray-800 ">archit bhuva</span>
              </div>
              <div className="flex items-center justify-between p-2 border-b">
                <span className="text-gray-600 font-bold">Birthday</span>
                <span className="text-gray-800 ">Add birthday</span>
              </div>
              <div className="flex items-center justify-between p-2 border-b">
                <span className="text-gray-600 font-bold">Phone Number</span>
                <span className="text-gray-800">+91 9664985679</span>
              </div>
              <div className="flex items-center justify-between p-2">
                <span className="text-gray-600 font-bold">Other ways people can find you</span>
                <span className="text-gray-800">Details</span>
              </div>
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

