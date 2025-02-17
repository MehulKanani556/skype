import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import {
  FaSearch,
  FaRegUser,
  FaCommentDots,
  FaPhone,
  FaUsers,
  FaBell,
  FaDownload,
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
  FaPhoneSlash,
} from "react-icons/fa";
import { HiOutlineReply } from "react-icons/hi";
import { PiDotsThreeVerticalBold, PiDotsThreeBold } from "react-icons/pi";
import { VscCopy } from "react-icons/vsc";
import {
  MdCallEnd,
  MdOutlineModeEdit,
  MdPhoneEnabled,
  MdGroupAdd,
} from "react-icons/md";
import { CiSquareRemove } from "react-icons/ci";
import { RiShutDownLine } from "react-icons/ri";
import { LuScreenShare, LuSendHorizontal } from "react-icons/lu";
import { IoIosArrowDown, IoIosArrowUp, IoMdSearch } from "react-icons/io";
import { GoDeviceCameraVideo } from "react-icons/go";
import { ImCross } from "react-icons/im";
import { FiCamera, FiCameraOff } from "react-icons/fi";
import { BsFillMicFill, BsFillMicMuteFill } from "react-icons/bs";
import { RxCross2 } from "react-icons/rx";
import {
  IoCameraOutline,
  IoCheckmarkCircleOutline,
  IoCheckmarkDoneCircle,
  IoCheckmarkDoneCircleOutline,
  IoPersonCircleOutline,
} from "react-icons/io5";
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
  getUser,
  updateGroup,
  updateUser,
  updateMessage,
  clearChat,
  sendAudioMessage,
  addParticipants,
} from "../redux/slice/user.slice";
import { BASE_URL, IMG_URL } from "../utils/baseUrl";
import axios from "axios";
import Front from "../component/Front";
import { MdOutlineDeleteSweep } from "react-icons/md";
import AudioPlayer from "../component/AudioPlayer";

const Chat2 = () => {
  const {
    onlineUser,
    isLoading,
    allUsers,
    messages,
    allMessageUsers,
    groups,
    user,
  } = useSelector((state) => state.user);
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
  const navigate = useNavigate();
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
  const [groupNewUsers, setGroupNewUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [searchInput, setSearchInput] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUserName, setEditedUserName] = useState(user?.userName || "");
  const [editedGroupName, setEditedGroupName] = useState("");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [isGroupCreateModalOpen, setIsGroupCreateModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupPhoto, setGroupPhoto] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSearchBoxOpen, setIsSearchBoxOpen] = useState(false);
  const [searchInputbox, setSearchInputbox] = useState("");
  const [searchIndex, setSearchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);



  const [isEditingUserName, setIsEditingUserName] = useState(false);
  const [isEditingDob, setIsEditingDob] = useState(false);
  const [editedDob, setEditedDob] = useState(user?.dob || "");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editedPhone, setEditedPhone] = useState(user?.phone || "");
  const [visibleDate, setVisibleDate] = useState(null);

  const searchRef = useRef(null); // Define searchRef

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
    rejectVideoCall,
    endVideoCall,
    isSharing,
    setIsSharing,
    isReceiving,
    setIsReceiving,
    toggleCamera,
    toggleMicrophone,
    markMessageAsRead,
  } = useSocket(currentUser, localVideoRef, remoteVideoRef, allUsers);

  // console.log(onlineUsers);

  //===========get all users===========
  useEffect(() => {
    dispatch(getAllUsers());
    // dispatch(getOnlineUsers());
    dispatch(getAllMessageUsers());
    dispatch(getAllGroups());
    dispatch(getUser(currentUser));
  }, [dispatch]);

  // Add this effect to filter users based on search input
  useEffect(() => {
    if (searchInput) {
      setFilteredUsers(
        allUsers.filter((user) =>
          user.userName.toLowerCase().includes(searchInput.toLowerCase())
        )
      );
    } else {
      if (selectedTab === "Unread") {
        setFilteredUsers(
          allMessageUsers.filter((user) => {
            // console.log(user.messages),
            if (user.messages && user.messages.length > 0) {
              return user.messages.some(
                (message) => message.status === "sent" || message.status === "delivered"
              )
            }
          })
        );
      } else {
        setFilteredUsers(allMessageUsers); // Show allMessageUsers when searchInput is empty
      }
    }
  }, [searchInput, allUsers, allMessageUsers, selectedTab]);
  useEffect(() => {
    if (selectedChat && allMessageUsers) {
      const updatedChat = allMessageUsers.find(
        (chat) => chat._id === selectedChat._id
      );
      // console.log("updatedChat", updatedChat);
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
      // console.log("unreadMessages", unreadMessages, messages);
      // Mark these messages as read
      if (unreadMessages.length > 0) {
        markMessageAsRead(unreadMessages);
        // dispatch(getAllMessageUsers());
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
      if (socket) {
        socket.off("user-typing", handleTypingStatus); // Check if socket is not null
      }
    };
  }, [isConnected, selectedChat]);

  const handleInputChange = (e) => {
    const files = e.target.files; // Get the files from the input
    if (files && files.length > 0) {
      const filesArray = Array.from(files); // Convert FileList to an array
      // console.log("setting selected", filesArray);
      setSelectedFiles((prev) => [...prev, ...filesArray]); // Add files to the existing selected files array
      return; // Exit the function early if files are being processed
    }

    setMessageInput(e.target.value);
    // console.log(e.target.value);
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
      // console.log("multiple file upload", file);

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
      const success = await startSharing(selectedChat);
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
      // console.log(success);
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

  // const handleCreateGroup = async () => {
  //   try{
  //   const data = {
  //     userName: groupName,
  //     members: groupUsers,
  //     createdBy: userId,
  //     photo: groupPhoto,
  //   };
  //   // console.log(data);
  //   const result = await dispatch(createGroup(data)).unwrap(); 

  //   console.log(result);
  //      // Wait for the group creation to complete
  //   // socket.emit("create-group",  data );
  //   setGroupUsers([]);
  //   setGroupPhoto(null);
  //   setGroupName("");
  //   setIsGroupCreateModalOpen(false);
  //   dispatch(getAllMessageUsers()); // Call getAllMessageUsers after the socket event
  // };
  const handleCreateGroup = async () => {
    const data = {
      userName: groupName,
      members: groupUsers,
      createdBy: userId,
      photo: groupPhoto,
    };
    try {

      await dispatch(createGroup({ groupData: data, socket }));
      setGroupUsers([]);
      setGroupPhoto(null);
      setGroupName("");
      setIsGroupCreateModalOpen(false);
      dispatch(getAllMessageUsers());
    } catch (error) {
      // Handle any errors that occur during group creation
      console.error("Error creating group:", error);
      // Optionally show error to user via toast/alert
    }
  };

  const handleAddParticipants = () => {
    const data = {
      groupId: selectedChat._id,
      members: groupNewUsers,
      addedBy: userId,
    };
    dispatch(addParticipants(data));
    socket.emit("update-group", data);
    setGroupUsers([]);
    setGroupNewUsers([]);
    setIsModalOpen(false);
    dispatch(getAllMessageUsers());
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
      setShowScrollToBottom(false);
    }
  };

  // Scroll event listener to show/hide the button
  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          messagesContainerRef.current;
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
    setIsDropdownOpen((prevState) => !prevState);
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
        setActiveMessageId(null); // Close the dropdown by setting activeMessageId to null
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // ================== reply message ==================
  const handleReplyMessage = (message) => {
    console.log("Replying to message:", message);
    // Add your reply logic here
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  // console.log("isReceiving", isReceiving);
  // console.log("isVideoCalling", isVideoCalling);
  // console.log("incomingCall", incomingCall);
  // console.log("isSharing", isSharing);
  // console.log("isCameraOn", (!isReceiving || !isVideoCalling));
  // ============================Log out ============================

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
    navigate("/");
  };

  const handleEditClick = () => {
    setIsEditingUserName(true);
  };

  const handleUserNameChange = (e) => {
    setEditedUserName(e.target.value);
  };

  const handleUserNameBlur = () => {
    setIsEditingUserName(false);
    // Optionally, dispatch an action to update the username in the store
    // dispatch(updateUserName(editedUserName));
    dispatch(
      updateUser({ id: currentUser, values: { userName: editedUserName } })
    );
  };
  // ================== highlight word ==================

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) {
      return text;
    }
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="highlight-text">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Function to count occurrences of a word in a message
  const countOccurrences = (text, word) => {
    if (!word.trim() || !text) return 0;
    const regex = new RegExp(word, "gi");
    return (text.match(regex) || []).length;
  };

  useEffect(() => {
    if (!searchInputbox.trim()) {
      setTotalMatches(0);
      return;
    }

    const matches = messages.reduce((count, message) => {
      const content =
        typeof message?.content?.content === "string"
          ? message?.content?.content
          : "";

      return count + countOccurrences(content, searchInputbox);
    }, 0);

    setTotalMatches(matches);
  }, [searchInputbox, messages]);

  useEffect(() => {
    if (selectedChat) {
      setIsSearchBoxOpen(false); // Close the search box
      setSearchInputbox(""); // Clear the search input
    }
  }, [selectedChat]);

  // Function to scroll to the current search result
  // const scrollToSearchResult = (index) => {
  //   if (!searchInputbox.trim()) return;

  //   let currentMatchIndex = 0;
  //   let targetElement = null;

  //   // Find all message elements that contain the search text
  //   const messageElements = document.querySelectorAll(".message-content");
  //   messageElements.forEach((element) => {
  //     const messageText = element.textContent;
  //     if (messageText.toLowerCase().includes(searchInputbox.toLowerCase())) {
  //       if (currentMatchIndex === index) {
  //         targetElement = element;
  //       }
  //       currentMatchIndex++;
  //     }
  //   });

  //   // Scroll to the target element if found
  //   if (targetElement) {
  //     targetElement.scrollIntoView({
  //       behavior: "smooth",
  //       block: "center",
  //     });
  //     // Add temporary highlight effect
  //     targetElement.classList.add("active-search-result");
  //     setTimeout(() => {
  //       targetElement.classList.remove("active-search-result");
  //     }, 2000);
  //   }
  // };
  const scrollToSearchResult = (index) => {
    if (!searchInputbox.trim()) return;

    let currentMatchIndex = 0;
    let targetElement = null;
    let targetSpan = null;

    // Find all highlighted spans containing the search text
    const highlightedSpans = document.querySelectorAll('.highlight-text');
    // console.log("highlightedSpans", highlightedSpans);

    if (highlightedSpans.length > 0) {
      highlightedSpans.forEach((span) => {
        if (currentMatchIndex === index) {
          targetSpan = span;
          targetElement = span.closest('.message-content');
        }
        currentMatchIndex++;
      });
    }
    console.log("targetElement", targetElement, targetSpan);

    // Scroll to the target element if found
    if (targetElement && targetSpan) {
      // Remove previous active highlights
      document.querySelectorAll('.active-search-result').forEach(el => {
        el.classList.remove('active-search-result');
      });

      // Scroll the message into view
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Highlight the specific occurrence
      targetElement.classList.add('active-search-result');
      setTimeout(() => {
        targetElement.classList.remove('active-search-result');
      }, 2000);
    }
  };

  // Function to handle search navigation
  const handleSearchNavigation = (direction) => {
    if (totalMatches === 0) return;

    setCurrentSearchIndex((prevIndex) => {
      let newIndex;
      if (direction === "up") {
        newIndex = prevIndex <= 0 ? totalMatches - 1 : prevIndex - 1;
      } else {
        newIndex = prevIndex >= totalMatches - 1 ? 0 : prevIndex + 1;
      }
      scrollToSearchResult(newIndex);
      return newIndex;
    });
  };

  // Add state to manage recording
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  // Function to handle voice message recording
  const handleVoiceMessage = async () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            // Set audio constraints for better quality
            noiseSuppression: true,
            echoCancellation: true,
            sampleRate: 44100, // Set sample rate for better quality
          },
        });
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' }); // Change to 'audio/webm' for better quality
          console.log("Audio Blob:", audioBlob);

          // Dispatch the audio message
          if (selectedChat) {
            const data = {
              type: "file", // Determine the type based on input
              content: audioBlob, // The actual content of the message
            };
            console.log("add", audioBlob);

            // Use the same upload logic as for other files
            const formData = new FormData();
            formData.append("file", audioBlob);

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
                  content: "Audio Message",
                  fileUrl: fileUrl,
                  fileType: fileType || "audio/webm", // Update file type accordingly
                  size: `${(audioBlob.size / (1024 * 1024)).toFixed(2)} MB`,
                });
              }
            } catch (error) {
              console.error("Error uploading audio message:", error);
            }
          }
          // Reset audio chunks
          setAudioChunks([]);
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    } else {
      // Stop recording
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };



  // Add intersection observer to track date headers
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const date = entry.target.getAttribute('data-date');
            setVisibleDate(date);
          }
        });
      },
      {
        threshold: 0.5, // Trigger when date header is 50% visible
        root: messagesContainerRef.current
      }
    );

    // Observe all date headers
    const dateHeaders = document.querySelectorAll('.date-header');
    dateHeaders.forEach((header) => observer.observe(header));

    return () => {
      dateHeaders.forEach((header) => observer.unobserve(header));
    };
  }, [messages]);

  // Add floating date indicator
  const FloatingDateIndicator = () => (
    <div className="sticky top-0 z-10 flex justify-center my-2 pointer-events-none">
      <span className="bg-white/80 text-gray-600 text-sm px-5 py-1 rounded-full shadow">
        {visibleDate === new Date().toLocaleDateString("en-GB")
          ? "Today"
          : visibleDate}
      </span>
    </div>
  );

  useEffect(() => {
    if (isVideoCalling && !isReceiving) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
        });

      // Cleanup function
      return () => {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          const tracks = localVideoRef.current.srcObject.getTracks();
          tracks.forEach(track => track.stop());
          localVideoRef.current.srcObject = null;
        }
      };
    }
  }, [isVideoCalling, isReceiving]);



  const handleProfileImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsProfileImageModalOpen(true);
  };

  const handleCopyMessage = (messageContent, callback) => {
    navigator.clipboard.writeText(messageContent).then(callback);
  };

  return (
    <div className="flex h-screen bg-white">
      <div className="w-80 border-r flex flex-col">
        <div className="relative profile-dropdown">
          <div
            className="flex items-center p-4 border-b cursor-pointer hover:bg-gray-100  mt-4"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            {/* <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden"> */}
            <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center border border-gray-500">
              {user?.photo && user.photo !== "null" ? (
                <img
                  src={`${IMG_URL}${user.photo.replace(/\\/g, "/")}`}
                  alt="Profile"
                  className="object-fill w-full h-full"
                />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {user?.userName && user?.userName.includes(" ")
                    ? user?.userName.split(" ")[0][0] +
                    user?.userName.split(" ")[1][0]
                    : user?.userName[0]}
                </span>
              )}
            </div>
            {/* </div> */}
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{user?.userName}</span>
                  <p className="mb-0 text-xs">{user?.email}</p>
                </div>
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

              <div
                className="p-3 hover:bg-gray-100 border-t"
                onClick={() => setIsLogoutModalOpen(true)}
              >
                <div className="flex items-center space-x-2 text-gray-600 cursor-pointer">
                  <RiShutDownLine className="w-5 h-5" />
                  <span>Logout</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-b relative" ref={searchRef}>
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
          <div
            className="flex flex-col items-center text-gray-500 cursor-pointer"
            onClick={() => setIsGroupCreateModalOpen(true)}
          >
            <FaUsers className="w-6 h-6" />
            <span className="text-xs mt-1">+Group</span>
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

              const lastMessageA = Array.isArray(a.messages)
                ? [...a.messages].sort(
                  (x, y) => new Date(y.createdAt) - new Date(x.createdAt)
                )[0]
                : null;
              const lastMessageB = Array.isArray(b.messages)
                ? [...b.messages].sort(
                  (x, y) => new Date(y.createdAt) - new Date(x.createdAt)
                )[0]
                : null;

              if (!lastMessageA && !lastMessageB) return 0;
              if (!lastMessageA) return 1;
              if (!lastMessageB) return -1;

              return (
                new Date(lastMessageB.createdAt) -
                new Date(lastMessageA.createdAt)
              );
            })
            .map((item) => {
              const lastMessage = Array.isArray(item.messages)
                ? [...item.messages] // Create a shallow copy of the array
                  .sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                  )[0]
                : null;
              return (
                <div
                  key={item._id}
                  className={`flex items-center p-3 hover:bg-gray-100 cursor-pointer ${selectedChat?._id === item._id ? "bg-gray-100" : ""
                    }`}
                  onClick={() => setSelectedChat(item)}
                >
                  <div className="w-10 h-10 rounded-full font-bold bg-gray-300 flex items-center justify-center relative">
                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center border-[1px] border-gray-400">
                      {item?.photo && item.photo !== "null" ? (
                        <img
                          src={`${IMG_URL}${item.photo.replace(/\\/g, "/")}`}
                          alt="Profile"
                          className="object-cover h-full w-full"
                        />
                      ) : (
                        <span className="text-gray-900 text-lg font-bold">
                          {item?.userName && item?.userName.includes(" ")
                            ? item?.userName.split(" ")[0][0].toUpperCase() +
                            item?.userName.split(" ")[1][0].toUpperCase()
                            : item?.userName[0].toUpperCase()}
                        </span>
                      )}
                    </div>
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
                        {lastMessage
                          ? new Date(lastMessage.createdAt).toLocaleTimeString(
                            [],
                            {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )
                          : ""}
                      </span>
                    </div>
                    {/* {item.email} */}

                    <div className="flex justify-between">
                      <div className="text-sm text-gray-500">
                        {item?.messages?.[0]?.content.content}
                        {item.hasPhoto && (
                          <span className="text-xs ml-1">[photo]</span>
                        )}
                      </div>
                      <div className="badge">
                        {item.messages?.filter(
                          (message) =>
                            message.receiver === currentUser &&
                            message.status !== "read"
                        ).length > 0 && (
                            <div className="inline-flex relative w-6 h-6 items-center rounded-full bg-[#1d4fd8b4] text-white text-center text-xs font-medium ring-1 ring-gray-500/10 ring-inset">
                              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                {item.messages?.filter(
                                  (message) =>
                                    message.receiver === currentUser &&
                                    message.status !== "read"
                                ).length > 99
                                  ? "99+"
                                  : item.messages?.filter(
                                    (message) =>
                                      message.receiver === currentUser &&
                                      message.status !== "read"
                                  ).length}
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
                  <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      if (selectedChat?.photo && selectedChat.photo !== "null") {
                        handleProfileImageClick(`${IMG_URL}${selectedChat.photo.replace(/\\/g, "/")}`);
                      }
                    }}>
                    {selectedChat?.photo && selectedChat.photo !== "null" ? (
                      <img
                        src={`${IMG_URL}${selectedChat.photo.replace(/\\/g, "/")}`}
                        alt="Profile"
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-white text-xl font-bold">
                        {selectedChat?.userName && selectedChat?.userName.includes(' ')
                          ? selectedChat?.userName.split(' ')[0][0] + selectedChat?.userName.split(' ')[1][0]
                          : selectedChat?.userName[0]}
                      </span>
                    )}
                  </div>
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
                    {selectedChat?.members ? (
                      <div className="text-sm text-gray-500">
                        {selectedChat?.members?.length} participants
                      </div>
                    ) : (
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
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <IoMdSearch
                    className="w-6 h-6 cursor-pointer"
                    onClick={() => setIsSearchBoxOpen((prev) => !prev)}
                  />
                  {isSearchBoxOpen && (
                    <div className="absolute top-12 right-[31%] bg-white shadow-lg p-4 z-10 flex items-center border-rounded" style={{ padding: "5px 25px", borderRadius: "30px" }}>
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
                        {totalMatches > 0
                          ? `${currentSearchIndex + 1} / ${totalMatches}`
                          : "0 / 0"}
                      </span>
                      <button
                        className="text-black hover:text-gray-700 ms-5"
                        onClick={() => handleSearchNavigation("up")}
                      >
                        <IoIosArrowUp />
                      </button>
                      <button
                        className="text-black hover:text-gray-700"
                        onClick={() => handleSearchNavigation("down")}
                      >
                        <IoIosArrowDown />
                      </button>
                      <button
                        className="text-black hover:text-gray-700 ms-5"
                        onClick={() => {
                          setIsSearchBoxOpen(false);
                          setSearchInputbox(""); // Clear the input box
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <MdOutlineDeleteSweep
                    className="w-6 h-6 cursor-pointer text-red-500 hover:text-red-600 text-4xl"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to clear this chat?"
                        )
                      ) {
                        dispatch(
                          clearChat({ selectedId: selectedChat._id })
                        ).then(() => {
                          dispatch(
                            getAllMessages({ selectedId: selectedChat._id })
                          );
                        });
                      }
                    }}
                  />
                  <LuScreenShare
                    className="w-6 h-6 cursor-pointer"
                    onClick={() => handleStartScreenShare()}
                  />
                  {selectedChat?.members && (
                    <MdGroupAdd
                      className="w-6 h-6 cursor-pointer"
                      onClick={() => {
                        if (selectedChat?.members) {
                          setGroupUsers(selectedChat?.members);
                        } else {
                          setGroupUsers([selectedChat?._id]);
                        }
                        setIsModalOpen(true);
                      }}
                    />
                  )}
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

              <div
                className="flex-1 overflow-y-auto p-4"
                ref={messagesContainerRef}
                style={{ height: "calc(100vh - 280px)" }}
              >
                {visibleDate && <FloatingDateIndicator />}
                {messages && messages.length > 0 ? (
                  Object.entries(groupMessagesByDate(messages)).map(
                    ([date, dateMessages]) => (
                      <div key={date} className="flex flex-col">
                        <div
                          className="flex justify-center my-4 text-gray-500 date-header"
                          data-date={date}
                        >
                          ------------------------------
                          <span className=" text-gray-600 text-sm px-5 py-1 rounded-full">
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

                          // console.log(new Date(message?.createdAt).getMinutes() - new Date(prevMessage?.createdAt).getMinutes());
                          // Check if next message is from same sender to adjust spacing
                          const nextMessage =
                            index < dateMessages.length - 1
                              ? dateMessages[index + 1]
                              : null;
                          const isConsecutive =
                            nextMessage &&
                            nextMessage.sender === message.sender;
                          const isSameMinute =
                            new Date(message?.createdAt).getMinutes() ===
                            new Date(prevMessage?.createdAt).getMinutes();
                          const issameUser =
                            message.sender === prevMessage?.sender;

                          const showTime =
                            !prevMessage ||
                            new Date(message?.createdAt).getMinutes() -
                            new Date(prevMessage?.createdAt).getMinutes() >
                            0 ||
                            !issameUser;

                          const name = allUsers.find(user => user._id === message.sender)?.userName
                          // console.log("fghfgh",currentTime, prevMessage , nextMessage, showTime,);

                          return (
                            message.content?.type === "system") ? (

                            <div className="flex justify-center my-2">
                              <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
                                {message.content.content.split('**').map((part, index) => {
                                  // Every odd index (1, 3, 5...) should be bold
                                  return index % 2 === 1 ? (
                                    <strong key={index}>{part}</strong>
                                  ) : (
                                    <span key={index}>{part}</span>
                                  );
                                })}
                              </span>
                            </div>

                          ) : message.content?.type === "call" ? (

                            message.content.status === "ended" ? (
                              // Render completed call with duration
                              <div className="flex justify-center my-2">
                                <div className="flex items-center text-gray-600 text-sm px-3 py-2 rounded-md bg-gray-100">
                                  <FaPhone className={message.sender === userId ? "rotate-90" : "-rotate-90"} />
                                  <div className="flex flex-col ml-2">
                                    <span>
                                      {message.sender === userId ? "Outgoing call" : "Incoming call"} • {message.content.duration}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      {new Date(message.content.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true, })}
                                    </span>
                                  </div>
                                  <span className="cursor-pointer ml-12 bg-gray-300 p-2 rounded-full">
                                    {message.content.callType === "audio" ? (
                                      <MdPhoneEnabled
                                        className=" w-5 h-5 cursor-pointer text-black"
                                        onClick={() => handleMakeCall("audio")}
                                      />) : (
                                      <GoDeviceCameraVideo
                                        className="w-5 h-5 cursor-pointer text-black"
                                        onClick={() => handleMakeCall("video")}
                                      />
                                    )}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              // Render missed call
                              <div className="flex justify-center my-2">
                                <div className="flex items-center text-red-500 text-sm px-3 py-2 rounded-md bg-gray-100">
                                  <FaPhone className={message.sender === userId ? "rotate-90" : "-rotate-90"} />
                                  <div className="flex flex-col ml-2">
                                    <span >{message.sender === userId ? "Call not answered" : "Missed call"}</span>
                                    <span className="text-gray-500 text-xs">
                                      {new Date(message.content.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true, })}
                                    </span>
                                  </div>
                                  <span className="cursor-pointer ml-12 bg-gray-300 p-2 rounded-full">
                                    {message.content.callType === "audio" ? (
                                      <MdPhoneEnabled
                                        className=" w-5 h-5 cursor-pointer text-black"
                                        onClick={() => handleMakeCall("audio")}
                                      />) : (
                                      <GoDeviceCameraVideo
                                        className="w-5 h-5 cursor-pointer text-black"
                                        onClick={() => handleMakeCall("video")}
                                      />
                                    )}
                                  </span>
                                </div>
                              </div>
                            )
                          ) : (
                            <div
                              key={message._id}
                              className={`flex relative ${message.sender === userId
                                ? "justify-end items-end"
                                : "justify-start items-start"
                                } ${isConsecutive ? "mb-1" : "mb-4"
                                } message-content`}
                            >
                              <div className="flex flex-col relative group">
                                {showTime && (
                                  <div className="text-xs text-gray-500 mt-3 text-right">
                                    {(selectedChat?.members && message.sender != userId) ? `${name},` : ''} {currentTime}
                                  </div>
                                )}
                                {message.content?.type === "file" ? (
                                  message.content?.fileType.includes(
                                    "image/"
                                  ) ? (
                                    <div
                                      className={` max-w-[300px] max-h-[300px]  overflow-hidden`}
                                      style={{ wordWrap: "break-word" }}
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
                                        className={`w-full object-contain ${message.sender === userId
                                          ? "rounded-s-lg rounded-tr-lg"
                                          : "rounded-e-lg rounded-tl-lg"
                                          } `}
                                        onClick={() =>
                                          handleImageClick(
                                            `${IMG_URL}${message.content.fileUrl.replace(
                                              /\\/g,
                                              "/"
                                            )}`
                                          )
                                        }
                                      />
                                    </div>
                                  ) : message.content?.fileType.includes("audio/") ? (
                                    <div
                                      className={`p-4 max-w-[300px] ${message.sender === userId
                                        ? "bg-[#CCF7FF] rounded-s-lg rounded-tr-lg"
                                        : "bg-[#F1F1F1] rounded-e-lg rounded-tl-lg"
                                        }`}
                                      style={{ wordWrap: "break-word" }}
                                      onContextMenu={(e) =>
                                        handleContextMenu(e, message)
                                      }
                                    >
                                      <AudioPlayer audioUrl={`${IMG_URL}${message.content.fileUrl.replace(/\\/g, "/")}`} />
                                      {/* <audio controls>
                                        <source src={`${IMG_URL}${message.content.fileUrl.replace(/\\/g, "/")}`} type={message.content.fileType} />
                                        Your browser does not support the audio element.
                                      </audio> */}
                                      <div className="ml-3">
                                        <div className="font-medium">
                                          {message.content?.content}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {message.content?.size}
                                        </div>
                                      </div>
                                    </div>
                                  )

                                    : (
                                      <div
                                        className={`p-4 max-w-[300px] ${message.sender === userId
                                          ? "bg-[#CCF7FF] rounded-s-lg rounded-tr-lg"
                                          : "bg-[#F1F1F1] rounded-e-lg rounded-tl-lg"
                                          }`}
                                        style={{ wordWrap: "break-word" }}
                                        onContextMenu={(e) =>
                                          handleContextMenu(e, message)
                                        }
                                      >
                                        <div className="flex items-center">
                                          <a href={`${IMG_URL}${message.content.fileUrl.replace(/\\/g, "/")}`}
                                            download={message.content.content}
                                            className="ml-2 text-blue-500 hover:underline"
                                          >
                                            <FaDownload className="w-6 h-6" />
                                          </a>
                                          <div className="ml-3">
                                            <div className="font-medium">
                                              {message.content?.content}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                              {message.content?.size}
                                            </div>
                                          </div>
                                        </div>

                                      </div>
                                    )
                                ) : (
                                  <div className="flex gap-1">
                                    <div
                                      className={`group flex-1 p-2  flex justify-between items-center relative ${message.sender === userId
                                        ? `bg-[#CCF7FF] rounded-s-lg ${showTime ? "rounded-tr-lg" : ""
                                        } `
                                        : `bg-[#F1F1F1] rounded-e-lg ${showTime ? "rounded-tl-lg" : ""
                                        }`
                                        }`}
                                      onContextMenu={(e) =>
                                        handleContextMenu(e, message)
                                      }
                                    >
                                      <p className="flex-1">{highlightText(message.content?.content, searchInputbox)}</p>

                                      {/* Add three dots icon */}
                                      <PiDotsThreeVerticalBold
                                        className={`absolute  ${showTime ? "top-0" : "top-0"} -right-4 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDropdownToggle(message._id);
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}


                                {/* Context Menu (Right Click) */}
                                {contextMenu.visible && contextMenu.messageId === message._id && (
                                  <div
                                    className="bg-white border rounded shadow-lg z-50"
                                    style={{ top: contextMenu.y, left: contextMenu.x }}
                                  >
                                    <button className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
                                      onClick={() => handleEditMessage(contextMenu.message)}
                                    >
                                      <MdOutlineModeEdit className="mr-2" /> Edit
                                    </button>
                                    <button
                                      className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
                                      onClick={() => handleCopyMessage(
                                        contextMenu.message.content.content,
                                        () => setContextMenu({ visible: false, x: 0, y: 0, messageId: null })
                                      )}
                                    >
                                      <VscCopy className="mr-2" /> Copy
                                    </button>
                                    <button
                                      className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
                                      onClick={() => handleDeleteMessage(contextMenu.messageId)}
                                    >
                                      <CiSquareRemove className="mr-2" /> Remove
                                    </button>
                                  </div>
                                )}
                                {/* Three Dots Dropdown */}
                                {activeMessageId === message._id && (
                                  <div className=" text-gray-500 mt-1" ref={dropdownRef}>
                                    <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg z-50">
                                      <button className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
                                        onClick={() => handleEditMessage(contextMenu.message)}
                                      >
                                        <MdOutlineModeEdit className="mr-2" /> Edit
                                      </button>
                                      <button
                                        className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
                                        onClick={() => handleCopyMessage(
                                          message.content.content,
                                          () => setActiveMessageId(null)
                                        )}
                                      >
                                        <VscCopy className="mr-2" /> Copy
                                      </button>
                                      <button
                                        className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
                                        onClick={() => handleDeleteMessage(message._id)}
                                      >
                                        <CiSquareRemove className="mr-2" /> Remove
                                      </button>
                                    </div>
                                  </div>
                                )}
                                <PiDotsThreeVerticalBold
                                  className={`absolute  ${showTime ? "top-6" : "top-0"
                                    } -right-4 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity`}
                                  onClick={() =>
                                    handleDropdownToggle(message._id)
                                  }
                                />
                              </div>

                              {message.sender === userId && (
                                <div
                                  className={`flex items-end mt-1  ${showTime ? "bottom-3" : "-bottom-2"}  right-0`}
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

                              {activeMessageId === message._id && (
                                <div
                                  className="text-xs text-gray-500 mt-1"
                                  ref={dropdownRef}
                                >
                                  <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg z-50">
                                    <button className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100">
                                      <MdOutlineModeEdit className="mr-2" />{" "}
                                      Edit
                                    </button>
                                    <button className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100">
                                      <VscCopy className="mr-2" /> Copy
                                    </button>
                                    <button className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100">
                                      <CiSquareRemove className="mr-2" /> Remove
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )
                  )
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
                        onClick={handleVoiceMessage}
                      >
                        <FaMicrophone className={`w-5 h-5 ${isRecording ? 'text-red-500' : 'text-gray-500'}`} />
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
            <Front data={user} />
          )}
        </div>
      )}

      {/*========== video call ==========*/}

      {/*========== screen share ==========*/}


      {/* {console.log(isVideoCalling)} */}
      {/* {(isSharing || isReceiving || isVideoCalling || incomingCall) && ( */}
      <div className={`flex-grow flex flex-col ${(isSharing || isReceiving || isVideoCalling || incomingCall) ? '' : 'hidden'}`}>
        <div className="grid grid-row-2 gap-4 relative">
          {/* {isVideoCalling && ( */}
          <div className={`space-y-2 max-w-30 absolute top-1 right-0 ${isVideoCalling ? '' : 'hidden'}`}>
            <h4 className="font-medium">
            </h4>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full bg-gray-100 rounded "
              style={{ maxHeight: "20vh" }}
            />
          </div>
          {/* )} */}
          <div className="space-y-2">
            {/* <h4 className="font-medium">
                    {isVideoCalling ? "Remote Camera" : "Remote Screen"}
                    {isReceiving && "(Receiving)"}
                  </h4> */}

            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full bg-gray-100 rounded"
              style={{ maxHeight: "90vh", }}
            />
          </div>
          {(isSharing || isReceiving || isVideoCalling) && (
            <div className="h-10 flex gap-3 mb-4 absolute bottom-1 left-1/2">

              <button
                onClick={() => {
                  if (isVideoCalling) {
                    endVideoCall();
                  }
                  cleanupConnection();
                }}
                className="bg-red-500 h-10 w-10  text-white  grid place-content-center rounded-full hover:bg-red-600 transition-colors "
              >
                <MdCallEnd className="text-xl " />
                {/* {isSharing ? "Sharing" : isReceiving ? "Receiving" : "Video Call"} */}
              </button>
              {isVideoCalling && (
                <>
                  <button
                    onClick={toggleCamera}
                    className={`w-10 grid place-content-center  rounded-full h-10 ${isCameraOn ? "bg-blue-500" : "bg-gray-400"
                      } text-white`}
                  >
                    {isCameraOn ? <FiCamera className="text-xl " /> : <FiCameraOff className="text-xl " />}
                  </button>
                  <button
                    onClick={toggleMicrophone}
                    className={`w-10 grid place-content-center  rounded-full h-10 ${isMicrophoneOn ? "bg-blue-500" : "bg-gray-400"
                      } text-white`}
                  >
                    {isMicrophoneOn ? <BsFillMicFill className="text-xl " /> : <BsFillMicMuteFill className="text-xl " />}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {/* )} */}

      {/* ========= incoming call ========= */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-black rounded-lg p-6 w-72 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden">
              {/* Profile image or default avatar */}
              {allUsers.find(user => user._id === incomingCall.fromEmail)?.photo && allUsers.find(user => user._id === incomingCall.fromEmail)?.photo !== "null" ? (
                <img
                  src={`${IMG_URL}${allUsers.find(user => user._id === incomingCall.fromEmail)?.photo.replace(/\\/g, "/")}`} // Replace with actual user profile image
                  alt="Caller"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-300 grid place-content-center">
                  <IoPersonCircleOutline className="text-4xl" />
                </div>
              )}
            </div>
            <h3 className="text-2xl text-white mb-2">
              {allUsers.find(user => user._id === incomingCall.fromEmail)?.userName}
            </h3>
            <p className="text-gray-400 mb-8 animate-pulse">Incoming call...</p>
            <div className="flex justify-center gap-8">
              <button
                onClick={acceptVideoCall}
                className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 animate-bounce"
              >
                <FaPhone className="text-xl" />
              </button>
              <button
                onClick={rejectVideoCall}
                className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <MdCallEnd className="text-xl" />
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
                {allUsers
                  .filter((user) => !groupUsers.includes(user._id)) // Filter out already selected users
                  .map((user, index) => {
                    const isChecked = groupNewUsers.includes(user._id); // Check if user is already selected
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 hover:bg-gray-100 rounded"
                        onClick={() => {
                          if (!isChecked) {
                            setGroupNewUsers((prev) => [...prev, user._id]);
                          } else {
                            setGroupNewUsers((prev) =>
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
          <div
            className="bg-white rounded-lg w-96 "
            style={{
              background: "#CCF7FF",
              background:
                "linear-gradient(180deg, rgba(34,129,195,1) 0%, rgba(189,214,230,1) 48%, rgba(255,255,255,1) 100%)",
            }}
          >
            <div className="flex justify-between items-center pb-2 p-4">
              <h2 className="text-lg font-bold">Profilez</h2>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ImCross />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24  rounded-full bg-gray-300 mt-4 group">
                {user?.photo && user.photo !== "null" ? (
                  <img
                    src={`${IMG_URL}${user.photo.replace(/\\/g, "/")}`}
                    alt="Profile"
                    className="object-cover w-24 h-24  rounded-full"
                  />
                ) : (
                  <div
                    className="w-24 h-24 text-center rounded-full text-gray-600 grid place-content-center"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(189,214,230,1) 48%, rgba(34,129,195,1) 100%)",
                    }}
                  >
                    <IoCameraOutline className="text-3xl cursor-pointer" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-full  bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <MdOutlineModeEdit
                    className="text-white text-3xl cursor-pointer"
                    onClick={profileDropdown} // Ensure this function toggles isDropdownOpen
                  />
                </div>

                {isDropdownOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-full mt-2 bg-white border rounded shadow-lg z-50"
                  >
                    <ul>
                      <li
                        className="p-2 px-3 text-nowrap hover:bg-gray-100 cursor-pointer"
                        onClick={() =>
                          document.getElementById("file-input").click()
                        } // Trigger file input click
                      >
                        Upload Photo
                      </li>
                      <li
                        className="p-2 px-3 text-nowrap hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          dispatch(
                            updateUser({
                              id: currentUser,
                              values: { photo: null },
                            })
                          );
                        }}
                      >
                        Remove Photo
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex mt-2 items-center justify-between gap-4">
                {isEditingUserName ? (
                  <input
                    type="text"
                    value={!editedUserName ? user?.userName : editedUserName}
                    onChange={handleUserNameChange}
                    onBlur={handleUserNameBlur}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleUserNameBlur();
                      }
                    }}
                    className="text-xl font-semibold bg-transparent focus:ring-0 focus-visible:outline-none"
                    autoFocus
                  />
                ) : (
                  <h3 className="text-xl font-semibold">{user?.userName}</h3>
                )}
                <MdOutlineModeEdit
                  className="cursor-pointer"
                  onClick={handleEditClick}
                />
              </div>
            </div>
            <div className="mt-4 p-4">
              <div className="flex items-center justify-between p-2 border-b mb-2">
                <span className="text-gray-600 font-bold">Skype Name</span>
                <span className="text-gray-800">{user?.userName}</span>
              </div>
              <div className="flex items-center justify-between p-2 border-b mb-2">
                <span className="text-gray-600 font-bold">Birthday</span>
                {isEditingDob ? (
                  <input
                    type="date"
                    value={!editedDob ? user.dob : editedDob}
                    onChange={(e) => setEditedDob(e.target.value)}
                    onBlur={() => {
                      setIsEditingDob(false);
                      // Optionally, dispatch an action to update the dob in the store
                      dispatch(
                        updateUser({
                          id: currentUser,
                          values: { dob: editedDob },
                        })
                      );
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        setIsEditingDob(false);
                        // Optionally, dispatch an action to update the dob in the store
                        dispatch(
                          updateUser({
                            id: currentUser,
                            values: { dob: editedDob },
                          })
                        );
                      }
                    }}
                    className="text-base text-gray-800 font-semibold bg-transparent focus:ring-0 focus-visible:outline-none"
                    autoFocus
                  />
                ) : (
                  <span
                    className={`text-gray-800 cursor-pointer ${!user?.dob ? "text-sm" : ""
                      } `}
                    onClick={() => setIsEditingDob(true)}
                  >
                    {new Date(user?.dob).toLocaleDateString() || "Add dob"}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between p-2 mb-2">
                <span className="text-gray-600 font-bold">Phone Number</span>
                {isEditingPhone ? (
                  <span>
                    <input
                      type="text"
                      value={!editedPhone ? user.phone : editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                      max={12}
                      onBlur={() => {
                        setIsEditingPhone(false);
                        // Optionally, dispatch an action to update the phone number in the store
                        dispatch(
                          updateUser({
                            id: currentUser,
                            values: { phone: editedPhone },
                          })
                        );
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          setIsEditingPhone(false);
                          // Optionally, dispatch an action to update the phone number in the store
                          dispatch(
                            updateUser({
                              id: currentUser,
                              values: { phone: editedPhone },
                            })
                          );
                        }
                      }}
                      className="text-base text-gray-800 font-semibold bg-transparent focus:ring-0 focus-visible:outline-none"
                      autoFocus
                    />
                  </span>
                ) : (
                  <span
                    className={`text-gray-800 cursor-pointer ${!user?.phone ? "text-sm" : ""
                      } `}
                    onClick={() => setIsEditingPhone(true)}
                  >
                    {user?.phone || "Add phone number"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">
              Are you sure you want to logout?
            </h3>
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
                  handleLogout();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* group Profile Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg w-96 "
            style={{
              background: "#CCF7FF",
              background:
                "linear-gradient(180deg, rgba(34,129,195,1) 0%, rgba(189,214,230,1) 48%, rgba(255,255,255,1) 100%)",
            }}
          >
            <div className="flex justify-between items-center pb-2 p-4">
              <h2 className="text-lg font-bold">Profile</h2>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ImCross />
              </button>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 rounded-full bg-gray-300 overflow-hidden mt-4">
                <img
                  src={
                    selectedChat?.photo
                      ? `${IMG_URL}${selectedChat?.photo}`
                      : require("../img/group.png")
                  }
                  alt="Profile"
                  className="cursor-pointer object-cover w-full h-full rounded-full"
                  onClick={() => document.getElementById("fileInput").click()}
                />
                <input
                  type="file"
                  id="fileInput"
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setGroupPhoto(file);
                      try {
                        await dispatch(
                          updateGroup({
                            groupId: selectedChat._id,
                            photo: file,
                          })
                        ); // Dispatch the update action
                        socket.emit("update-group", {
                          groupId: selectedChat._id,
                          members: selectedChat?.members.filter(
                            (id) => id !== userId
                          ),
                        });
                        await dispatch(getAllMessageUsers());
                      } catch (error) {
                        console.error("Failed to update group photo:", error);
                      }
                    }
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <MdOutlineModeEdit
                    className="text-white text-4xl cursor-pointer"
                    onClick={() => document.getElementById("fileInput").click()}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUserName}
                    onChange={(e) => setEditedUserName(e.target.value)}
                    onBlur={() => {
                      dispatch(
                        updateGroup({
                          groupId: selectedChat._id,
                          userName: editedUserName,
                          members: selectedChat?.members,
                        })
                      );
                      socket.emit("update-group", {
                        groupId: selectedChat._id,
                        members: selectedChat?.members.filter(
                          (id) => id !== userId
                        ),
                      });
                      dispatch(getAllMessageUsers());
                      setIsEditing(false);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        dispatch(
                          updateGroup({
                            groupId: selectedChat._id,
                            userName: editedUserName,
                            members: selectedChat?.members,
                          })
                        );
                        socket.emit("update-group", {
                          groupId: selectedChat._id,
                          members: selectedChat?.members.filter(
                            (id) => id !== userId
                          ),
                        });
                        dispatch(getAllMessageUsers());
                        setIsEditing(false);
                      }
                    }}
                    className="mt-2 text-xl font-semibold bg-transparent border-none outline-none text-center"
                    autoFocus // This will focus the input when isEditing is true
                  />
                ) : (
                  <>
                    <h3
                      className="mt-2 text-xl font-semibold cursor-pointer"
                      onClick={() => {
                        setIsEditing(true);
                        setEditedUserName(selectedChat?.userName);
                      }}
                    >
                      {selectedChat?.userName}
                    </h3>
                    <MdOutlineModeEdit
                      className="cursor-pointer"
                      onClick={() => {
                        setIsEditing(true);
                        setEditedUserName(selectedChat?.userName);
                      }}
                    />
                  </>
                )}
              </div>
              <div className="text-gray-500">
                Created by{" "}
                {allUsers?.find((user) => user._id == selectedChat?.createdBy)
                  ?.userName || "Unknown User"}
              </div>
            </div>
            <div className="mt-4 p-4">
              <div className="flex items-center justify-between p-2 border-b border-gray-400">
                <span className="text-gray-600 font-bold">Participants</span>
                <span className="text-gray-800 ">
                  {selectedChat?.members.length}
                </span>
              </div>
              <div className="flex flex-col max-h-48 overflow-y-auto">
                {/* <div className="flex items-center justify-between p-2 ">
                  <span className="text-gray-600 font-bold">Add participants</span>
                  <button className="text-blue-500 hover:underline">+</button>
                </div> */}
                <div
                  className="flex items-center p-2 cursor-pointer"
                  onClick={() => {
                    setGroupUsers(selectedChat?.members);
                    setIsGroupModalOpen(false);
                    setIsModalOpen(true);
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2 font-bold">
                    +
                  </div>
                  <span className="text-gray-800 font-bold">
                    Add participants
                  </span>
                </div>
                {selectedChat?.members.map((member, index) => {
                  const user = allUsers.find((user) => user._id === member);
                  return (
                    <div key={index} className="flex items-center p-2 group">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                        {user.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-800">{user.userName}</span>
                      <button
                        className="ml-auto text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs border border-red-500 rounded-full px-2 py-1"
                        onClick={() => {
                          dispatch(
                            leaveGroup({
                              groupId: selectedChat._id,
                              userId: user._id,
                              removeId: userId,
                            })
                          );
                          socket.emit("update-group", {
                            groupId: selectedChat._id,
                            members: selectedChat?.members.filter(
                              (id) => id !== user._id
                            ),
                          });
                          dispatch(getAllMessageUsers());
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between p-2">
                <span
                  className="text-red-600 font-bold cursor-pointer"
                  onClick={() => {
                    dispatch(
                      leaveGroup({ groupId: selectedChat._id, userId: userId })
                    );
                    socket.emit("update-group", {
                      groupId: selectedChat._id,
                      members: selectedChat?.members.filter(
                        (id) => id !== userId
                      ),
                    });
                    dispatch(getAllMessageUsers());
                    setIsGroupModalOpen(false);
                  }}
                >
                  Leave Group
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      {isGroupCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg w-96 "
            style={{
              background: "#CCF7FF",
              background:
                "linear-gradient(180deg, rgba(34,129,195,1) 0%, rgba(189,214,230,1) 48%, rgba(255,255,255,1) 100%)",
            }}
          >
            <div className="flex justify-between items-center pb-2 p-4">
              <h2 className="text-lg font-bold">Create Group</h2>
              <button
                onClick={() => setIsGroupCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ImCross />
              </button>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 rounded-full bg-gray-300 overflow-hidden mt-4 group">
                <img
                  src={
                    groupPhoto
                      ? URL.createObjectURL(groupPhoto)
                      : require("../img/group.png")
                  }
                  alt="Profile"
                  className="cursor-pointer object-cover w-full h-full rounded-full"
                  onClick={() => document.getElementById("fileInput").click()}
                />
                <input
                  type="file"
                  id="fileInput"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setGroupPhoto(file);
                    }
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <MdOutlineModeEdit
                    className="text-white text-4xl cursor-pointer"
                    onClick={() => document.getElementById("fileInput").click()}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  placeholder="Group Name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="mt-2 text-xl font-semibold bg-transparent border-none outline-none text-center"
                  autoFocus // This will focus the input when isEditing is true
                />
              </div>
            </div>
            <div className="mt-4 p-4">
              <div className="flex items-center justify-between p-2 border-b border-gray-400">
                <span className="text-gray-600 font-bold">Participants</span>
                <span className="text-gray-800 ">{groupUsers.length || 0}</span>
              </div>
              <div className="flex flex-col max-h-48 overflow-y-auto">
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
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2 font-bold">
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
                {/* <div className="flex items-center p-2 cursor-pointer" onClick={() => {
                  setGroupUsers(selectedChat?.members)
                  setIsGroupModalOpen(false)
                  setIsModalOpen(true)
                }}>
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2 font-bold">
                    +
                  </div>
                  <span className="text-gray-800 font-bold">Add participants</span>
                </div> */}
                {/* {selectedChat?.members.map((member, index) => {
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
                          socket.emit("update-group", { groupId: selectedChat._id, members: selectedChat?.members.filter((id) => id !== user._id) })
                          dispatch(getAllMessageUsers())
                        }}>
                        Remove
                      </button>
                    </div>
                  )
                })} */}
              </div>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => handleCreateGroup()}
                  className="bg-blue-500 text-white px-4 py-1 rounded-full hover:bg-blue-600"
                >
                  Create Group
                </button>
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
      )}

      {/* Add a hidden file input for photo upload */}
      <input
        type="file"
        id="file-input"
        style={{ display: "none" }}
        accept="image/*"
        onChange={(e) => {
          // console.log("aaaa")

          const file = e.target.files[0];
          if (file) {
            // Handle the file upload logic here
            dispatch(updateUser({ id: currentUser, values: { photo: file } }));
            // console.log('Selected file:', file);
            // You can update the profile picture state here
          }
        }}
      />


      {isProfileImageModalOpen && selectedProfileImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center p-8">
            <img
              src={selectedProfileImage}
              alt="Profile"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setIsProfileImageModalOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <ImCross className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {
        isImageModalOpen && (
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
        )
      }
    </div >
  );
};


export default Chat2;
