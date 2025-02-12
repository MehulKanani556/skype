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
  FaPlusCircle,
  FaFilePdf,
  FaFileExcel,
  FaFileWord,
  FaFilePowerpoint,
  FaFileArchive,
} from "react-icons/fa";
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
import { RxCross2 } from "react-icons/rx";
import { IoCheckmarkDoneSharp, IoCheckmarkSharp } from "react-icons/io5";

const Chat2 = () => {
  const [selectedTab, setSelectedTab] = useState("Chats");
  const [recentChats, setRecentChats] = useState([]);
  const [messagesA, setMessages] = useState([]);
  const [showDialpad, setShowDialpad] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
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
  const messagesContainerRef = useRef(null);
  const [searchInput, setSearchInput] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

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
  } = useSocket(currentUser, localVideoRef, remoteVideoRef);

  //   console.log(onlineUsers);

  //===========get all users===========
  useEffect(() => {
    dispatch(getAllUsers());
    dispatch(getOnlineUsers());
    dispatch(getAllMessageUsers());
    dispatch(getAllGroups());
  }, [dispatch]);

  // Add this effect to filter users based on search input
  useEffect(() => {
    if (searchInput) {
      setFilteredUsers(allUsers.filter(user =>
        user.userName.toLowerCase().includes(searchInput.toLowerCase())
      ));
    } else {
      setFilteredUsers(allMessageUsers); // Show allMessageUsers when searchInput is empty
    }
  }, [searchInput, allUsers, allMessageUsers]);
  useEffect(() => {
    if (selectedChat) {
      // Get unread messages for this conversation
      const unreadMessages = messages
        .filter(
          (msg) =>
            msg.sender === selectedChat._id &&
            (msg.status === "sent" || msg.status === "delivered")
        )
        .map((msg) => msg._id);
      console.log("unreadMessages", unreadMessages, messages);
      // Mark these messages as read
      if (unreadMessages.length > 0) {
        markMessageAsRead(unreadMessages);
      }
    }
  }, [selectedChat, messages]);

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
  // useEffect(() => {
  //   return () => {
  //     if (localStreamRef.current) {
  //       localStreamRef.current.getTracks().forEach((track) => track.stop());
  //     }
  //     if (remoteVideoRef.current) {
  //       remoteVideoRef.current.srcObject = null;
  //     }
  //     if (peerConnectionRef.current) {
  //       peerConnectionRef.current.close();
  //       peerConnectionRef.current = null;
  //     }
  //   };
  // }, []);

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
    const files = e.target.files; // Get the files from the input
    if (files && files.length > 0) {
      const filesArray = Array.from(files); // Convert FileList to an array
      console.log("setting selected", filesArray);
      setSelectedFiles((prev) => [...prev, ...filesArray]); // Add files to the existing selected files array
      return; // Exit the function early if files are being processed
    }

    setMessageInput(e.target.value);
    console.log(e.target.value);
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
    setMessageInput((prevMessage) => prevMessage + event.emoji);
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
    const filesArray = Array.from(files); // Convert FileList to an array
    for (const file of filesArray) {
      const formData = new FormData();
      formData.append("file", file);
      console.log("multiple file upload", file);

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

  const handleStartScreenShare = async () => {
    // console.log(selectedChat);
    if (selectedChat) {
      const success = await startSharing(selectedChat._id);
      // console.log(success);
      if (!success) {
        console.error("Failed to start screen sharing");
      }
    }
  };

  // =========================== video call=============================

  // Add call handling functions
  const handleMakeCall = async (type) => {
    if (!selectedChat) return;

    if (type == "video") {
      const success = await startVideoCall(selectedChat._id);
      console.log(success);
      if (!success) {
        console.error("Failed to start screen sharing");
      }
    }
  };

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

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const element = messagesContainerRef.current;
      element.scrollTop = element.scrollHeight;
    }
  };

  // Scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll when chat is selected
  useEffect(() => {
    if (selectedChat) {
      scrollToBottom();
    }
  }, [selectedChat]);

  // Add this effect to ensure scrolling works after the component mounts
  useEffect(() => {
    scrollToBottom();
  }, []);

  // Ensure scroll happens after messages are loaded
  useEffect(() => {
    if (messages.length > 0) {
      const timeoutId = setTimeout(scrollToBottom, 100); // Delay to ensure DOM updates
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length]);

  // Scroll after component updates
  useEffect(() => {
    const messageContainer = messagesContainerRef.current;
    if (messageContainer) {
      const config = { childList: true, subtree: true };

      const observer = new MutationObserver(() => {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      });

      observer.observe(messageContainer, config);
      return () => observer.disconnect();
    }
  }, []);

  //===========group messages by date===========
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach((message) => {
      const date = new Date(message.createdAt).toLocaleDateString("en-GB");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

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
            <div className="absolute top-full left-0 w-full bg-white border shadow-lg z-50 ml-5 rounded-[10px]">
              <div className="p-3 hover:bg-gray-100 border-t">
                <div className="flex items-center space-x-2 text-gray-600 cursor-pointer">
                  <FaShareAlt className="w-5 h-5" />
                  <span>Share what you're up to</span>
                </div>
              </div>

              <div className="p-3 hover:bg-gray-100 border-t">
                <div className="flex items-center space-x-2 text-gray-600 cursor-pointer">
                  <FaUserPlus className="w-5 h-5" />
                  <span>Invite Friends</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="px-3 py-2 text-xs text-gray-500 font-semibold">
                  SKYPE PHONE
                </div>
                <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                  <div className="flex items-center">
                    <FaPhone className="w-5 h-5 text-gray-600" />
                    <div className="ml-3">
                      <div className="text-gray-700">Skype to Phone</div>
                      <div className="text-xs text-gray-500">
                        Reach people anywhere at low rates
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                  <div className="flex items-center">
                    <FaPhone className="w-5 h-5 text-gray-600" />
                    <div className="ml-3">
                      <div className="text-gray-700">Skype Number</div>
                      <div className="text-xs text-gray-500">
                        Keep your personal number private
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="px-3 py-2 text-xs text-gray-500 font-semibold">
                  MANAGE
                </div>
                {[
                  { icon: FaUsers, text: "Skype profile" },
                  { icon: FaBookmark, text: "Bookmarks" },
                  { icon: FaCog, text: "Settings" },
                  { icon: FaQrcode, text: "Sign in with QR code" },
                  { icon: FaStar, text: "Skype Insider programme" },
                  { icon: FaBell, text: "What's new" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5 text-gray-600" />
                      <span className="ml-3 text-gray-700">{item.text}</span>
                    </div>
                  </div>
                ))}
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}

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
            className={`py-2 ${
              selectedTab === "All" ? "border-b-2 border-blue-500" : ""
            }`}
            onClick={() => setSelectedTab("All")}
          >
            All
          </button>
          <button
            className={`py-2 ${
              selectedTab === "Chats" ? "border-b-2 border-blue-500" : ""
            }`}
            onClick={() => setSelectedTab("Chats")}
          >
            Chats
          </button>
          <button
            className={`py-2 ${
              selectedTab === "Channels" ? "border-b-2 border-blue-500" : ""
            }`}
            onClick={() => setSelectedTab("Channels")}
          >
            Channels
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {console.log(filteredUsers)}
          {filteredUsers
            .slice()
            .sort((a, b) => {
              if (a._id === currentUser) return -1;
              if (b._id === currentUser) return 1;
              return 0;
            })
            .map((item) => {
              // Ensure messages is defined and is an array
              const lastMessage = Array.isArray(item.messages) ?
                item.messages
                  .filter(message => message.sender === item._id)
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
                : null;



              return (
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
                        {lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        }) : "No messages"}
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
              );
            })}
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
                className={`text-sm ${
                  onlineUsers.includes(selectedChat?._id)
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
            <LuScreenShare
              className="w-6 h-6 cursor-pointer"
              onClick={() => handleStartScreenShare()}
            />
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
          <div className="flex-1 overflow-y-auto p-4" ref={messagesContainerRef}  style={{ height: 'calc(100vh - 280px)' }}>
            {messages && messages.length > 0 ? (
              Object.entries(groupMessagesByDate(messages)).map(
                ([date, dateMessages]) => (
                  <div key={date} className="flex flex-col">
                    <div className="flex justify-center my-4 text-gray-500">
                      ------------------------------
                      <span className="bg-gray-200 text-gray-600 text-xs px-7 py-1 rounded-full">
                        {date === new Date().toLocaleDateString("en-GB")
                          ? "Today"
                          : date}
                      </span>
                      ------------------------------
                    </div>

                    {dateMessages.map((message, index) => {
                      const currentTime = new Date(
                        message.createdAt
                      ).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      });

                      // Check if previous message exists and was sent within same minute
                      const prevMessage =
                        index > 0 ? dateMessages[index - 1] : null;
                      const showTime =
                        !prevMessage ||
                        new Date(message.createdAt).getTime() -
                          new Date(prevMessage.createdAt).getTime() >
                          60000;

                      // Check if next message is from same sender to adjust spacing
                      const nextMessage =
                        index < dateMessages.length - 1
                          ? dateMessages[index + 1]
                          : null;
                      const isConsecutive =
                        nextMessage && nextMessage.sender === message.sender;

                      return (
                        <div
                          key={message._id}
                          className={`flex flex-col relative ${
                            message.sender === userId
                              ? "justify-end items-end"
                              : "justify-start items-start"
                          } ${isConsecutive ? "mb-2" : "mb-4"}`}
                        >
                          {message.content?.type === "file" ? (
                            message.content?.fileType.includes("image/") ? (
                              <div
                                className={`rounded-lg p-2 max-w-sm max-h-[500px]  overflow-hidden${
                                  message.sender === userId ? "" : ""
                                }`}
                                style={{
                                  maxWidth: "500px",
                                  wordWrap: "break-word",
                                }}
                                onContextMenu={(e) =>
                                  handleContextMenu(e, message)
                                }
                              >
                                <img
                                  src={`${IMG_URL}${message.content.fileUrl.replace(
                                    /\\/g,
                                    "/"
                                  )}`}
                                  alt={message.content.content}
                                  className={`w-full object-contain ${
                                    message.sender === userId
                                      ? "rounded-s-lg rounded-tr-lg"
                                      : "rounded-e-lg rounded-tl-lg"
                                  } `}
                                />
                              </div>
                            ) : (
                              <div
                                className={`rounded-lg p-4 max-w-sm ${
                                  message.sender === userId
                                    ? "bg-[#CCF7FF]"
                                    : "bg-[#F1F1F1]"
                                }`}
                                style={{
                                  maxWidth: "500px",
                                  wordWrap: "break-word",
                                }}
                                onContextMenu={(e) =>
                                  handleContextMenu(e, message)
                                }
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
                                    href={`${IMG_URL}${message.content.fileUrl.replace(
                                      /\\/g,
                                      "/"
                                    )}`}
                                    download={message.content.content}
                                    className="ml-2 text-blue-500 hover:underline"
                                  >
                                    <FaDownload className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                            )
                          ) : (
                            <div
                              className={`rounded-lg py-2 px-4 ${
                                message.sender === userId
                                  ? "bg-[#CCF7FF]"
                                  : "bg-[#F1F1F1]"
                              }`}
                              onContextMenu={(e) =>
                                handleContextMenu(e, message)
                              }
                            >
                              <p>{message.content?.content}</p>
                            </div>
                          )}
                          {message.sender === userId && (
                            <div
                              className={`flex items-center mt-1 absolute ${showTime ? "bottom-3" : "-bottom-2"}  right-0`}
                            >
                              {message.status === "sent" && (
                                <IoCheckmarkSharp className="text-base mr-1 text-gray-600 font-bold" />
                              )}
                              {message.status === "delivered" && (
                                <>
                                  <IoCheckmarkDoneSharp className="text-base mr-1 text-gray-600 font-bold" />
                                </>
                              )}
                              {message.status === "read" && (
                                <>
                                  <IoCheckmarkDoneSharp className="text-base mr-1 text-green-500 font-bold" />
                                </>
                              )}
                            </div>
                          )}
                          {showTime && (
                            <div className="text-xs text-gray-500 mt-1">
                              {currentTime}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        )}
        {selectedFiles && selectedFiles.length > 0 && (
          <div className="flex w-full max-w-4xl mx-auto p-4 rounded-lg bg-[#e5e7eb]">
            {selectedFiles.map((file, index) => {
              const fileUrl = URL.createObjectURL(file); // Create a URL for the file
              let fileIcon;
              if (file.type.startsWith("image/")) {
                fileIcon = (
                  <img
                    src={fileUrl}
                    alt={`Selected ${index}`}
                    className="w-20 h-20 object-cover mb-1"
                  />
                );
              } else if (file.type === "application/pdf") {
                fileIcon = <FaFilePdf className="w-20 h-20 text-gray-500" />; // PDF file icon
              } else if (
                file.type === "application/vnd.ms-excel" ||
                file.type ===
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              ) {
                fileIcon = <FaFileExcel className="w-20 h-20 text-gray-500" />; // Excel file icon
              } else if (
                file.type === "application/msword" ||
                file.type ===
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              ) {
                fileIcon = <FaFileWord className="w-20 h-20 text-gray-500" />; // Word file icon
              } else if (
                file.type === "application/vnd.ms-powerpoint" ||
                file.type ===
                  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
              ) {
                fileIcon = (
                  <FaFilePowerpoint className="w-20 h-20 text-gray-500" />
                ); // PowerPoint file icon
              } else if (file.type === "application/zip") {
                fileIcon = (
                  <FaFileArchive className="w-20 h-20 text-gray-500" />
                ); // ZIP file icon
              } else {
                fileIcon = <FaPaperclip className="w-20 h-20 text-gray-500" />; // Generic file icon
              }
              return (
                <div
                  key={index}
                  className="relative mx-1 flex flex-col items-center w-20 h-20 p-1 overflow-hidden bg-[#b7babe]"
                >
                  {fileIcon}
                  <div className="w-20 text-sm text-ellipsis  text-nowrap ">
                    {file.name}
                  </div>{" "}
                  {/* Display file name */}
                  <span className="text-xs text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>{" "}
                  {/* Display file size */}
                  <button
                    className="absolute top-1 right-1 bg-white rounded-full"
                    onClick={() => {
                      setSelectedFiles(
                        selectedFiles.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    <RxCross2 />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/*========== video call ==========*/}
        {incomingCall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4">
                Incoming video call from {incomingCall.fromEmail}
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={acceptVideoCall}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Accept
                </button>
                <button
                  onClick={() => setIncomingCall(null)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}

        {/*========== screen share ==========*/}
        {(isSharing || isReceiving || isVideoCalling) && (
          <button
            onClick={cleanupConnection}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Stop{" "}
            {isSharing ? "Sharing" : isReceiving ? "Receiving" : "Video Call"}
          </button>
        )}

        {isVideoCalling && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={toggleCamera}
              className={`px-4 py-2 rounded ${
                isCameraOn ? "bg-green-500" : "bg-red-500"
              } text-white`}
            >
              {isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
            </button>
            <button
              onClick={toggleMicrophone}
              className={`px-4 py-2 rounded ${
                isMicrophoneOn ? "bg-green-500" : "bg-red-500"
              } text-white`}
            >
              {isMicrophoneOn ? "Turn Microphone Off" : "Turn Microphone On"}
            </button>
          </div>
        )}

        {/* <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">
              {isVideoCalling ? "Your Camera" : "Your Screen"}
              {isSharing && "(Sharing)"}
              {isVideoCalling && !isCameraOn && (
                <div className="text-center">{selectedChat._id}</div>
              )}
            </h4>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full bg-gray-100 rounded"
              style={{ maxHeight: "40vh" }}
            />
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">
              {isVideoCalling ? "Remote Camera" : "Remote Screen"}
              {isReceiving && "(Receiving)"}
            </h4>

            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full bg-gray-100 rounded"
              style={{ maxHeight: "40vh" }}
            />
          </div>
        </div> */}

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
                  {selectedFiles && selectedFiles.length > 0 ? (
                    <FaPlusCircle className="w-5 h-5 text-gray-500" />
                  ) : (
                    <FaPaperclip className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Voice message"
                >
                  <FaMicrophone className="w-5 h-5 text-gray-500" />
                </button>
                {(messageInput != "" || selectedFiles.length > 0) && (
                  <button
                    type="submit"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    style={{ backgroundColor: "#3B82F6", color: "white" }}
                    aria-label="Send message"
                    onClick={() => {
                      if (selectedFiles.length > 0) {
                        handleMultipleFileUpload(selectedFiles); // Upload selected files
                        setSelectedFiles([]); // Clear selected files after sending
                      }
                    }}
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
