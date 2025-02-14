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
  FaArrowDown,
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
import { IoIosArrowDown, IoIosArrowUp, IoMdSearch } from "react-icons/io";
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
  leaveGroup,
  updateGroup,
  updateMessage,
} from "../redux/slice/user.slice";
import { BASE_URL, IMG_URL } from "../utils/baseUrl";
import axios from "axios";
import { RxCross2 } from "react-icons/rx";
import { IoCheckmarkCircleOutline, IoCheckmarkDoneCircle, IoCheckmarkDoneCircleOutline, IoCheckmarkDoneCircleSharp, IoCheckmarkDoneSharp, IoCheckmarkSharp } from "react-icons/io5";
import { PiDotsThreeBold } from "react-icons/pi";
import Front from '../component/Front';

const Chat2 = () => {
  const [selectedTab, setSelectedTab] = useState("All");
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
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUserName, setEditedUserName] = useState('');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSearchBoxOpen, setIsSearchBoxOpen] = useState(false);
  const [searchInputbox, setSearchInputbox] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);


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
    if (selectedChat && allMessageUsers) {
      const updatedChat = allMessageUsers.find(chat => chat._id === selectedChat._id);
      console.log("updatedChat", updatedChat);
      if (updatedChat) {
        setSelectedChat(updatedChat);
      }
    }
  }, [allMessageUsers]);

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
        dispatch(getAllMessageUsers());

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
        dispatch(getAllMessageUsers());

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
        dispatch(getAllMessageUsers());
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
      createdBy: userId,
    };

    // console.log(data);
    dispatch(createGroup(data));
    setGroupUsers([]);
    setIsModalOpen(false);
  };

  const handleAddParticipants = () => {
    const data = { groupId: selectedChat._id, members: groupUsers, userName: selectedChat?.userName, createdBy: selectedChat?.createdBy }
    dispatch(updateGroup(data))
    setGroupUsers([]);
    setIsModalOpen(false);
    dispatch(getAllMessageUsers())
  }

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
      setShowScrollToBottom(false);
    }
  };

  // Scroll event listener to show/hide the button
  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        // Show button if user is not at the bottom
        setShowScrollToBottom(scrollTop + clientHeight < scrollHeight);
      }
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [messages]);

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


  const profileDropdown = () => {

    setIsDropdownOpen((prev) => !prev);
  };

  useEffect(() => {
    console.log("Dropdown state:", isDropdownOpen);
  }, [isDropdownOpen]);

  const handleDropdownToggle = (messageId) => {
    setActiveMessageId((prev) => (prev === messageId ? null : messageId));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveMessageId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ================== reply message ==================
  const handleReplyMessage = (message) => {
    console.log("Replying to message:", message);
    // Add your reply logic here
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  // ================== highlight word ==================

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) {
      return text;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} style={{ backgroundColor: 'yellow' }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Function to count occurrences of a word in a message
  const countOccurrences = (text, word) => {
    const regex = new RegExp(`(${word})`, 'gi');
    return (text.match(regex) || []).length;
  };

  useEffect(() => {
    if (!searchInputbox.trim()) {
      setTotalMatches(0);
      return;
    }

    const matches = messages.reduce((count, message) => {
      const content = typeof message?.content?.content === 'string' ? message?.content?.content : '';

      return count + countOccurrences(content, searchInputbox);
    }, 0);

    setTotalMatches(matches);
  }, [searchInputbox, messages]);
  console.log("totalMatches", totalMatches);

  useEffect(() => {
    if (selectedChat) {
      setIsSearchBoxOpen(false); // Close the search box
      setSearchInputbox(''); // Clear the search input
    }
  }, [selectedChat]);

  // Function to scroll to the current search result
  const scrollToSearchResult = (index) => {
    const messageElements = document.querySelectorAll('.message-content');
    if (messageElements[index]) {
      messageElements[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Function to handle search navigation
  const handleSearchNavigation = (direction) => {
    setCurrentSearchIndex((prevIndex) => {
      const newIndex = direction === 'up' ? Math.max(prevIndex - 1, 0) : Math.min(prevIndex + 1, totalMatches - 1);
      scrollToSearchResult(newIndex);
      return newIndex;
    });
  };

  return (
    <div className="flex h-screen bg-white">
      <div className="w-80 border-r flex flex-col">
        <div className="relative profile-dropdown">
          <div
            className="flex items-center p-4 border-b cursor-pointer hover:bg-gray-100"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            {/* <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden"> */}
            <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden mt-4">
              <img src={require('../img/profile.jpg')} alt="Profile" className="" />
            </div>
            {/* </div> */}
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">archit bhuva</span>
                <PiDotsThreeBold />
              </div>
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

              <div className="p-3 hover:bg-gray-100 border-t" onClick={() => setIsLogoutModalOpen(true)}>
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
            onClick={() => setSelectedTab("Unread")}
          >
            Unread
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredUsers
            .slice()
            .sort((a, b) => {
              // Prioritize the current user
              if (a._id === currentUser) return -1;
              if (b._id === currentUser) return 1;

              const lastMessageA = Array.isArray(a.messages) ? [...a.messages].sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt))[0] : null;
              const lastMessageB = Array.isArray(b.messages) ? [...b.messages].sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt))[0] : null;

              if (!lastMessageA && !lastMessageB) return 0;
              if (!lastMessageA) return 1;
              if (!lastMessageB) return -1;

              return new Date(lastMessageB.createdAt) - new Date(lastMessageA.createdAt);
            })
            .map((item) => {
              const lastMessage = Array.isArray(item.messages) ?
                [...item.messages] // Create a shallow copy of the array
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
                    {item.avatar || (item.userName ? item.userName.charAt(0).toUpperCase() : '')}
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
                        }) : ""}
                      </span>
                    </div>
                    {/* {console.log("i", item, item?.messages?.[0]?.content.content)} */}
                    {/* {item.email} */}

                    <div className="flex justify-between">
                      <div className="text-sm text-gray-500">
                        {item?.messages?.[0]?.content.content}
                        {item.hasPhoto && (
                          <span className="text-xs ml-1">[photo]</span>
                        )}
                      </div>
                      <div className="badge">

                        {item.messages?.filter(message => message.receiver === currentUser && message.status !== 'read').length > 0 && (
                          <div className="inline-flex relative w-6 h-6 items-center rounded-full bg-[#1d4fd8b4] text-white text-center text-xs font-medium ring-1 ring-gray-500/10 ring-inset">
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                              {item.messages?.filter(message => message.receiver === currentUser && message.status !== 'read').length > 99 ? '99+' : item.messages?.filter(message => message.receiver === currentUser && message.status !== 'read').length}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      {!(isReceiving || isVideoCalling) && (
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                  <div className="ml-3 cursor-pointer"
                    onClick={() => {
                      console.log("selectedChat", selectedChat);
                      if (selectedChat?.members) {
                        console.log("selectedChat");
                        setIsGroupModalOpen(true);
                      } else {
                        // setIsModalOpen(true);
                      }
                    }}
                  >
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
                  <IoMdSearch
                    className="w-6 h-6 cursor-pointer"
                    onClick={() => setIsSearchBoxOpen((prev) => !prev)}
                  />
                  {isSearchBoxOpen && (
                    <div className="absolute top-12 right-72 bg-white shadow-lg p-4 z-10 flex items-center border-rounded" style={{ padding: "5px 25px", borderRadius: "30px" }}>
                      <FaSearch className="text-gray-500 mr-2" />
                      <input
                        type="text"
                        placeholder="Search..."
                        className="flex-1 p-2 outline-none"
                        value={searchInputbox}
                        onChange={(e) => {
                          setSearchInputbox(e.target.value);
                          setSearchIndex(0); // Reset index on new search
                          setCurrentSearchIndex(0); // Reset current search index
                        }}
                      />
                      <span className="mx-2 text-gray-500">
                        {totalMatches > 0 ? `${currentSearchIndex + 1} / ${totalMatches}` : "0 / 0"}
                      </span>
                      <button
                        className="text-black hover:text-gray-700 ms-5"
                        onClick={() => handleSearchNavigation('up')}
                      >
                        <IoIosArrowUp />
                      </button>
                      <button
                        className="text-black hover:text-gray-700"
                        onClick={() => handleSearchNavigation('down')}
                      >
                        <IoIosArrowDown />
                      </button>
                      <button
                        className="text-black hover:text-gray-700 ms-5"
                        onClick={() => {
                          setIsSearchBoxOpen(false);
                          setSearchInputbox(''); // Clear the input box
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <LuScreenShare
                    className="w-6 h-6 cursor-pointer"
                    onClick={() => handleStartScreenShare()}
                  />
                  <MdGroupAdd
                    className="w-6 h-6 cursor-pointer"
                    onClick={() => {
                      if (selectedChat?.members) {
                        setGroupUsers(selectedChat?.members)
                      } else {
                        setGroupUsers([selectedChat?._id])
                      }
                      setIsModalOpen(true)
                    }}
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

              <div className="flex-1 overflow-y-auto p-4" ref={messagesContainerRef} style={{ height: 'calc(100vh - 280px)' }}>
                {messages && messages.length > 0 ? (
                  Object.entries(groupMessagesByDate(messages)).map(
                    ([date, dateMessages]) => (
                      <div key={date} className="flex flex-col">
                        <div className="flex justify-center my-4 text-gray-500">
                          ------------------------------
                          <span className=" text-gray-600 text-sm px-5 py-1 rounded-full">
                            {date === new Date().toLocaleDateString("en-GB")
                              ? "Today"
                              : date}
                          </span>
                          ------------------------------
                        </div>

                        {dateMessages.map((message, index) => {
                          const currentTime = new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          });

                          // Check if previous message exists and was sent within same minute
                          const prevMessage = index > 0 ? dateMessages[index - 1] : null;
                          const showTime = !prevMessage || new Date(message?.createdAt).getMinutes() - new Date(prevMessage?.createdAt).getMinutes() > 0;

                          // console.log(new Date(message?.createdAt).getMinutes() - new Date(prevMessage?.createdAt).getMinutes());


                          // Check if next message is from same sender to adjust spacing
                          const nextMessage = index < dateMessages.length - 1 ? dateMessages[index + 1] : null;
                          const isConsecutive = nextMessage && nextMessage.sender === message.sender;
                          // console.log("fghfgh",currentTime, prevMessage , nextMessage, showTime,);
                          const isHighlighted = index === currentSearchIndex;
                          return (
                            <div
                              key={message._id}
                              className={`flex flex-col relative ${message.sender === userId
                                ? "justify-end items-end"
                                : "justify-start items-start"
                                } ${isConsecutive ? "mb-1" : "mb-4"} message-content ${isHighlighted ? 'highlighted' : ''}`}
                            >
                              {(showTime || isConsecutive) && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {currentTime}
                                </div>
                              )}
                              {message.content?.type === "file" ? (
                                message.content?.fileType.includes("image/") ? (
                                  <div
                                    className={`rounded-lg p-2 max-w-sm max-h-[500px]  overflow-hidden ${message.sender === userId ? "" : ""
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
                                      className={`w-full object-contain ${message.sender === userId && isConsecutive
                                        ? "rounded-s-lg rounded-tr-lg"
                                        : "rounded-e-lg rounded-tl-lg"
                                        } `}
                                      onClick={() => handleImageClick(`${IMG_URL}${message.content.fileUrl.replace(/\\/g, "/")}`)}
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className={`rounded-lg p-4 max-w-sm ${message.sender === userId
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
                                <div className="flex gap-1">
                                  <div
                                    className={`group rounded-lg py-2 px-2 flex justify-between items-center relative ${message.sender === userId
                                      ? "bg-[#CCF7FF]"
                                      : "bg-[#F1F1F1]"
                                      }`}
                                    onContextMenu={(e) =>
                                      handleContextMenu(e, message)
                                    }
                                  >
                                    <p className="flex-1">{highlightText(message.content?.content, searchInputbox)}</p>
                                    <PiDotsThreeVerticalBold
                                      className="absolute top-1 -right-4 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => handleDropdownToggle(message._id)}
                                    />
                                  </div>
                                  {activeMessageId === message._id && (
                                    <div className="text-gray-500 mt-1" ref={dropdownRef}>
                                      <div className="z-10 absolute bg-white border rounded shadow-lg  py-2 px-4 right-0 mt-2">
                                        <button
                                          onClick={() => handleEditMessage(contextMenu.message)}
                                          className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
                                        >
                                          <MdOutlineModeEdit className="mr-2" /> Edit
                                        </button>
                                        <button
                                          className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
                                        >
                                          <VscCopy className="mr-2" /> Copy
                                        </button>
                                        <button
                                          className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
                                        >
                                          <CiSquareRemove className="mr-2" /> Remove
                                        </button>
                                      </div>
                                    </div>
                                  )}


                                  {message.sender === userId && (
                                    <div
                                      className={`flex items-center mt-1  ${showTime ? "bottom-3" : "-bottom-2"}  right-0`}
                                    >
                                      {message.status === "sent" && (
                                        <IoCheckmarkCircleOutline className="text-xl mr-1 text-gray-600 font-bold" />
                                      )}
                                      {message.status === "delivered" && (
                                        <>
                                          <IoCheckmarkDoneCircleOutline className="text-xl mr-1 text-gray-600 font-bold" />
                                        </>
                                      )}
                                      {message.status === "read" && (
                                        <>
                                          <IoCheckmarkDoneCircle className="text-xl mr-1 text-blue-500 font-bold" />
                                        </>
                                      )}
                                    </div>
                                  )}
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
                {/* {selectedChat && typingUsers[selectedChat._id] && (
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
              )} */}
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

              {/* Show Send to Bottom button only if user has scrolled up */}
              {showScrollToBottom && (
                <button
                  type="button"
                  className="fixed bottom-4 right-4 p-2 bg-blue-500/50 text-white rounded-full shadow-lg"
                  onClick={scrollToBottom}
                  aria-label="Send to Bottom"
                >
                  <FaArrowDown className="w-5 h-5" />
                </button>
              )}
            </>
          ) : (

            <Front />
          )}
        </div>
      )}

      {(isReceiving || isVideoCalling || incomingCall) && (
        <div className="flex-1 flex flex-col">
          {/*========== video call ==========*/}


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
                className={`px-4 py-2 rounded ${isCameraOn ? "bg-green-500" : "bg-red-500"
                  } text-white`}
              >
                {isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
              </button>
              <button
                onClick={toggleMicrophone}
                className={`px-4 py-2 rounded ${isMicrophoneOn ? "bg-green-500" : "bg-red-500"
                  } text-white`}
              >
                {isMicrophoneOn ? "Turn Microphone Off" : "Turn Microphone On"}
              </button>
            </div>
          )}

          {(isSharing || isReceiving || isVideoCalling) && (
            <div className="grid grid-row-2 gap-4">
              {isVideoCalling && (
                <div className="space-y-2">
                  <h4 className="font-medium">
                    {isVideoCalling ? "Your Camera" : "Your Screen"}
                    {isSharing && "(Sharing)"}
                    {isVideoCalling && !isCameraOn && (
                      <div className="text-center">{selectedChat?._id}</div>
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
              )}
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
                  style={{ maxHeight: "90vh", }}
                />
              </div>
            </div>
          )}
        </div>
      )}



      {/* ========= incoming call ========= */}
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
              {selectedChat?.members ? (
                <button
                  onClick={() => handleAddParticipants()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600"
                >
                  Add Participants
                </button>
              ) : (
                <button
                  onClick={() => handleCreateGroup()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600"
                >
                  Done
                </button>
              )}
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
              <div className="relative w-24 h-24 rounded-full bg-gray-300 overflow-hidden mt-4 group">
                <img src={require('../img/profile.jpg')} alt="Profile" className="" />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <MdOutlineModeEdit
                    className="text-white text-3xl cursor-pointer"
                    onClick={profileDropdown} // Ensure this function toggles isDropdownOpen
                  />
                </div>
                {isDropdownOpen && ( // This should be true when the icon is clicked
                  <div className="absolute top-full mt-2 bg-white border rounded shadow-lg z-50">
                    <ul>
                      <li className="p-2 hover:bg-gray-100 cursor-pointer">Edit Profile</li>
                      <li className="p-2 hover:bg-gray-100 cursor-pointer">Change Picture</li>
                      <li className="p-2 hover:bg-gray-100 cursor-pointer">Settings</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <h3 className="mt-2 text-xl font-semibold">archit bhuva</h3><MdOutlineModeEdit className="cursor-pointer" />
              </div>

            </div>
            <div className="mt-4 p-4">
              <div className="flex items-center justify-between p-2 border-b mb-2">
                <span className="text-gray-600 font-bold">Skype Name</span>
                <span className="text-gray-800 ">archit bhuva</span>
              </div>
              <div className="flex items-center justify-between p-2 border-b mb-2">
                <span className="text-gray-600 font-bold">Birthday</span>
                <span className="text-gray-800 ">Add birthday</span>
              </div>
              <div className="flex items-center justify-between p-2 mb-2">
                <span className="text-gray-600 font-bold">Phone Number</span>
                <span className="text-gray-800">+91 9664985679</span>
              </div>
              {/* <div className="flex items-center justify-between p-2">
                <span className="text-gray-600 font-bold">Other ways people can find you</span>
                <span className="text-gray-800">Details</span>
              </div> */}
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Are you sure you want to logout?</h3>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded"
                style={{ backgroundColor: "#3B82F6" }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Add your logout logic here
                  setIsLogoutModalOpen(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 " style={{ background: "#CCF7FF", background: "linear-gradient(180deg, rgba(34,129,195,1) 0%, rgba(189,214,230,1) 48%, rgba(255,255,255,1) 100%)" }}>
            <div className="flex justify-between items-center pb-2 p-4">
              <h2 className="text-lg font-bold">Profile</h2>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ImCross />
              </button>
            </div>
            <div className="flex flex-col items-center" >
              <div className="relative w-24 h-24 rounded-full bg-gray-300 overflow-hidden mt-4 group">
                <img src={require('../img/profile.jpg')} alt="Profile" className="" />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <MdOutlineModeEdit className="text-white text-4xl cursor-pointer" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUserName}
                    onChange={(e) => setEditedUserName(e.target.value)}
                    onBlur={() => {
                      // Dispatch action to update the username
                      dispatch(updateGroup({ groupId: selectedChat._id, userName: editedUserName }));
                      dispatch(getAllMessageUsers())
                      setIsEditing(false);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        // Dispatch action to update the username
                        dispatch(updateGroup({ groupId: selectedChat._id, userName: editedUserName }));
                        dispatch(getAllMessageUsers())
                        setIsEditing(false);
                      }
                    }}
                    className="mt-2 text-xl font-semibold bg-transparent border-none outline-none text-center"
                    autoFocus // This will focus the input when isEditing is true
                  />
                ) : (
                  <>
                    <h3 className="mt-2 text-xl font-semibold cursor-pointer" onClick={() => { setIsEditing(true); setEditedUserName(selectedChat?.userName); }}>{selectedChat?.userName}</h3>
                    <MdOutlineModeEdit className="cursor-pointer" onClick={() => { setIsEditing(true); setEditedUserName(selectedChat?.userName); }} />
                  </>
                )}
              </div>
              <div className="text-gray-500">Created by {allUsers?.find((user) => user._id == selectedChat?.createdBy)?.userName || "Unknown User"}</div>
            </div>
            <div className="mt-4 p-4">
              <div className="flex items-center justify-between p-2 border-b border-gray-400">
                <span className="text-gray-600 font-bold">Participants</span>
                <span className="text-gray-800 ">{selectedChat?.members.length}</span>
              </div>
              <div className="flex flex-col max-h-48 overflow-y-auto">
                {/* <div className="flex items-center justify-between p-2 ">
                  <span className="text-gray-600 font-bold">Add participants</span>
                  <button className="text-blue-500 hover:underline">+</button>
                </div> */}
                <div className="flex items-center p-2 cursor-pointer" onClick={() => {
                  setGroupUsers(selectedChat?.members)
                  setIsGroupModalOpen(false)
                  setIsModalOpen(true)
                }}>
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2 font-bold">
                    +
                  </div>
                  <span className="text-gray-800 font-bold">Add participants</span>
                </div>
                {selectedChat?.members.map((member, index) => {
                  const user = allUsers.find((user) => user._id === member);
                  return (
                    <div key={index} className="flex items-center p-2 group">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                        {user.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-800">{user.userName}</span>
                      <button className="ml-auto text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs border border-red-500 rounded-full px-2 py-1"
                        onClick={() => {
                          dispatch(leaveGroup({ groupId: selectedChat._id, userId: user._id }))
                          dispatch(getAllMessageUsers())
                        }}>
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between p-2">
                <span className="text-red-600 font-bold cursor-pointer"
                  onClick={() => {
                    dispatch(leaveGroup({ groupId: selectedChat._id, userId: userId }))
                    dispatch(getAllMessageUsers())
                    setIsGroupModalOpen(false)
                  }}>
                  Leave Group
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add the context menu */}
      {contextMenu.visible && (
        <div
          className="absolute bg-white border rounded shadow-lg z-50 py-2 px-4"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => handleEditMessage(contextMenu.message)}
            className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
          >
            <MdOutlineModeEdit className="mr-2" /> Edit
          </button>
          <button
            onClick={() => handleDeleteMessage(contextMenu.messageId)}
            className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
          >
            <CiSquareRemove className="mr-2" /> Remove
          </button>
          <button
            onClick={() => handleReplyMessage(contextMenu.message)}
            className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
          >
            <HiOutlineReply className="mr-2" /> Reply
          </button>
        </div>
      )
      }

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center p-8">
            <img src={selectedImage} alt="Full Size" className="w-full h-full object-contain " />
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 text-white text-2xl"
            >
              <ImCross />
            </button>
          </div>
        </div>
      )}
    </div >

);
};

export default Chat2;
