import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import {
  FaSearch,
  FaRegUser,
  FaCommentDots,
  FaPhone,
  FaUsers,
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
  FaUserPlus,
  FaFile,
  FaFileAudio,
} from "react-icons/fa";
import { PiDotsThreeVerticalBold, PiDotsThreeBold } from "react-icons/pi";
import { VscCallIncoming, VscCallOutgoing, VscCopy } from "react-icons/vsc";
import {
  MdCallEnd,
  MdOutlineModeEdit,
  MdPhoneEnabled,
  MdGroupAdd,
  MdOutlineModeEditOutline,
} from "react-icons/md";
import { CiSquareRemove } from "react-icons/ci";
import { RiShutDownLine } from "react-icons/ri";
import {
  LuScreenShare,
  LuSendHorizontal,
  LuScreenShareOff,
} from "react-icons/lu";
import { IoIosArrowDown, IoIosArrowUp, IoMdSearch } from "react-icons/io";
import { GoDeviceCameraVideo } from "react-icons/go";
import { ImCross } from "react-icons/im";
import { FiCamera, FiCameraOff, FiEdit2 } from "react-icons/fi";
import { BsFillMicFill, BsFillMicMuteFill } from "react-icons/bs";
import { RxCross2 } from "react-icons/rx";
import {
  IoCallOutline,
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
  leaveGroup,
  getUser,
  updateGroup,
  updateUser,
  updateMessage,
  clearChat,
  addParticipants,
  getAllCallUsers,
} from "../redux/slice/user.slice";
import { BASE_URL, IMG_URL } from "../utils/baseUrl";
import axios from "axios";
import Front from "../component/Front";
import { MdOutlineDeleteSweep } from "react-icons/md";
import AudioPlayer from "../component/AudioPlayer";
import ChatItem from "../component/ChatItem"; // Import the new ChatItem component
import { BiReply, BiShare } from "react-icons/bi";
import { SlActionUndo } from "react-icons/sl";
import MessageList from "../component/MessageList";

// Forward Modal Component
const ForwardModal = ({ show, onClose, onSubmit, users }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);

  return (
    show && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 modal_background">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-xl font-semibold mb-4">Forward Message</h2>
            <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
              <ImCross />
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto modal_scroll">
            {users.map((user) => (
              <div key={user._id} className="flex items-center mb-1 p-2 ">
                <input
                  type="checkbox"
                  id={user._id}
                  checked={selectedUsers.includes(user._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers([...selectedUsers, user._id]);
                    } else {
                      setSelectedUsers(
                        selectedUsers.filter((id) => id !== user._id)
                      );
                    }
                  }}
                  className="mr-2 w-4 h-4"
                />
                <label htmlFor={user._id} className="text-gray-700 cursor-pointer">{user.userName}</label>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => onSubmit(selectedUsers)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={selectedUsers.length === 0}
            >
              Forward
            </button>
          </div>
        </div>
      </div>
    )
  );
};

const Chat2 = () => {
  const { allUsers, messages, allMessageUsers, groups, user, allCallUsers } =
    useSelector((state) => state.user);
  const [selectedTab, setSelectedTab] = useState("All");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser] = useState(sessionStorage.getItem("userId")); // Replace with actual user data
  const [typingUsers, setTypingUsers] = useState({});
  const localVideoRef = useRef(null);
  const [callUsers, setCallUsers] = useState([]);
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
  const [userId, setUserId] = useState(sessionStorage.getItem("userId"));
  const [groupUsers, setGroupUsers] = useState([]);
  const [groupNewUsers, setGroupNewUsers] = useState([]);
  const messagesContainerRef = useRef(null);
  const [searchInput, setSearchInput] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUserName, setEditedUserName] = useState(user?.userName || "");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [isGroupCreateModalOpen, setIsGroupCreateModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupPhoto, setGroupPhoto] = useState(null);
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSearchBoxOpen, setIsSearchBoxOpen] = useState(false);
  const [searchInputbox, setSearchInputbox] = useState("");
  const [totalMatches, setTotalMatches] = useState(0);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  //changes
  const [activeSearchTab, setActiveSearchTab] = useState("All");
  const [filteredGroups, setFilteredGroups] = useState([]);
  //changes end
  const [isClearChatModalOpen, setIsClearChatModalOpen] = useState(false);

  const [participantOpen, setParticipantOpen] = useState(false);
  const [isEditingUserName, setIsEditingUserName] = useState(false);
  const [isEditingDob, setIsEditingDob] = useState(false);
  const [editedDob, setEditedDob] = useState(user?.dob || "");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editedPhone, setEditedPhone] = useState(user?.phone || "");
  const [visibleDate, setVisibleDate] = useState(null);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
    cleanupConnection,
    isCameraOn,
    isMicrophoneOn,
    startSharing,
    startVideoCall,
    acceptVideoCall,
    rejectVideoCall,
    rejectVoiceCall,
    endVideoCall,
    isSharing,
    isReceiving,
    toggleCamera,
    toggleMicrophone,
    markMessageAsRead,
    incomingShare,
    setIncomingShare,
    acceptScreenShare,
    isVoiceCalling,
    startVoiceCall,
    acceptVoiceCall,
    endVoiceCall,
    callAccept,
    remoteStreams,
    inviteToCall,
    callParticipants,
    voiceCallData,
    forwardMessage,
    addMessageReaction,
  } = useSocket(currentUser, localVideoRef, remoteVideoRef, allUsers);

  //===========get all users===========
  useEffect(() => {
    dispatch(getAllUsers());
    // dispatch(getOnlineUsers());
    dispatch(getAllMessageUsers());
    dispatch(getAllGroups());
    dispatch(getUser(currentUser));
    dispatch(getAllCallUsers());
  }, [dispatch]);

  // Add this effect to filter users based on search input
  useEffect(() => {
    if (searchInput) {
      // Filter people
      const matchingPeople = allUsers.filter((user) =>
        user.userName.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredUsers(matchingPeople);

      // Filter groups
      const matchingGroups = groups.filter(
        (group) =>
          group.userName.toLowerCase().includes(searchInput.toLowerCase()) &&
          group.members?.includes(currentUser)
      );

      //changes
      setFilteredGroups(matchingGroups);
      //changes end
    } else {
      if (selectedTab === "Unread") {
        setFilteredUsers(
          allMessageUsers.filter((user) => {
            // console.log(user.messages),
            if (user.messages && user.messages.length > 0) {
              return user.messages.some(
                (message) =>
                  message.status === "sent" || message.status === "delivered"
              );
            }
          })
        );
      } else {
        setFilteredUsers(allMessageUsers); // Show allMessageUsers when searchInput is empty
      }
    }
  }, [
    searchInput,
    allUsers,
    groups,
    selectedTab,
    currentUser,
    allMessageUsers,
  ]);
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

      // console.log("data", data);

      try {
        const messageData = {
          data,
          replyTo: replyingTo,
        };
        const status = await sendPrivateMessage(selectedChat._id, messageData);
        dispatch(getAllMessages({ selectedId: selectedChat._id }));
        dispatch(getAllMessageUsers());
        setReplyingTo(null);
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
    setMessageInput("");
  };

  //===========reply  preview===========
  const ReplyPreview = ({ replyData, onCancel }) => {
    const repliedUser = allUsers.find((user) => user._id === replyData.sender);

    return (
      <div className="reply-preview bg-gray-100 dark:bg-gray-700 p-2 rounded-t-lg flex items-start">
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-500 dark:text-blue-400">
            Replying to {repliedUser?.userName || "User"}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {replyData.content}
          </div>
        </div>
        <button
          onClick={onCancel}
          className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <RxCross2 size={20} />
        </button>
      </div>
    );
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
    } else if (type == "voice") {
      const success = await startVoiceCall(selectedChat._id);
      // console.log(success);
      if (!success) {
        console.error("Failed to start voice call");
      }
    }
  };

  // ===========================context menu=============================
  const handleContextMenu = (e, message) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      messageId: message._id,
      message: message,
    });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu.visible) {
        if (e.target.closest('.context-menu')) return;
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu.visible, setContextMenu]);

  // ===========================delete message=============================
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
    // console.log("message", message);
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

  const handleCreateGroup = async () => {
    const data = {
      userName: groupName,
      members: [...groupUsers, userId],
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
        if (selectedChat) {
          dispatch(getAllMessages({ selectedId: selectedChat._id })); // Refresh messages if needed
        }
      } else if (message.type === "reaction") {
        if (selectedChat) {
          dispatch(getAllMessages({ selectedId: selectedChat._id })); // Refresh messages if needed
        }
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
    scrollToBottom();
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
    // console.log("Dropdown state:", isDropdownOpen);
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

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

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

  const scrollToSearchResult = (index) => {
    if (!searchInputbox.trim()) return;

    let currentMatchIndex = 0;
    let targetElement = null;
    let targetSpan = null;

    // Find all highlighted spans containing the search text
    const highlightedSpans = document.querySelectorAll(".highlight-text");
    // console.log("highlightedSpans", highlightedSpans);

    if (highlightedSpans.length > 0) {
      highlightedSpans.forEach((span) => {
        if (currentMatchIndex === index) {
          targetSpan = span;
          targetElement = span.closest(".message-content");
        }
        currentMatchIndex++;
      });
    }
    // console.log("targetElement", targetElement, targetSpan);

    // Scroll to the target element if found
    if (targetElement && targetSpan) {
      // Remove previous active highlights
      document.querySelectorAll(".active-search-result").forEach((el) => {
        el.classList.remove("active-search-result");
      });

      // Scroll the message into view
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Highlight the specific occurrence
      targetElement.classList.add("active-search-result");
      setTimeout(() => {
        targetElement.classList.remove("active-search-result");
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
          const audioBlob = new Blob(chunks, { type: "audio/webm" }); // Change to 'audio/webm' for better quality
          // console.log("Audio Blob:", audioBlob);

          // Dispatch the audio message
          if (selectedChat) {
            const data = {
              type: "file", // Determine the type based on input
              content: audioBlob, // The actual content of the message
            };
            // console.log("add", audioBlob);

            // Use the same upload logic as for other files
            const formData = new FormData();
            formData.append("file", audioBlob);

            try {
              const response = await axios.post(
                `${BASE_URL}/upload`,
                formData,
                {
                  headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                  },
                }
              );

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
          // Stop the audio stream to release the microphone
          stream.getTracks().forEach((track) => track.stop());
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
            const date = entry.target.getAttribute("data-date");
            setVisibleDate(date);
          }
        });
      },
      {
        threshold: 0.5, // Trigger when date header is 50% visible
        root: messagesContainerRef.current,
      }
    );

    // Observe all date headers
    const dateHeaders = document.querySelectorAll(".date-header");
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
          tracks.forEach((track) => track.stop());
          localVideoRef.current.srcObject = null;
        }
      };
    }
  }, [isVideoCalling, isReceiving]);

  const handleProfileImageClick = (imageUrl) => {
    setSelectedProfileImage(imageUrl);
    setIsProfileImageModalOpen(true);
  };

  // Update the handleCopyMessage function to handle both text and images
  const handleCopyMessage = async (message, callback) => {
    if (message.type === "file" && message.fileType?.includes("image/")) {
      try {
        const response = await fetch(
          `${IMG_URL}${message.fileUrl.replace(/\\/g, "/")}`
        );
        const blob = await response.blob();
        const item = new ClipboardItem({
          [blob.type]: blob,
        });

        await navigator.clipboard.write([item]);
        callback();
      } catch (error) {
        console.error("Error copying image:", error);
      }
    } else {
      // Handle text and emoji copying
      const content = message.content || message;
      navigator.clipboard.writeText(content).then(callback);
    }
  };

  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // Add this useEffect to handle clicking outside the search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add this useEffect to handle paste events
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItems = Array.from(items).filter(
        (item) => item.type.indexOf("image") !== -1
      );

      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          // Add the pasted file to selectedFiles
          setSelectedFiles((prev) => [...prev, file]);
        }
      }
    };

    // Add paste event listener to the document
    document.addEventListener("paste", handlePaste);

    // Cleanup
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

  // Add state to manage sidebar visibility
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);

  // Add useEffect to handle initial sidebar state based on screen width and selected chat
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 425) {
        setShowLeftSidebar(!selectedChat);
      } else {
        setShowLeftSidebar(true);
      }
    };

    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedChat]);

  const handleFilter = (text) => {
    if (text == "chat") {
      setFilteredUsers(allMessageUsers);
      setCallUsers([]);
    } else {
      setFilteredUsers([]);
      setCallUsers(allCallUsers);
    }
  };
  // console.log("aaaaaa-------", callUsers);
  // clear chat
  const handleClearChat = () => {
    dispatch(clearChat({ selectedId: selectedChat._id })).then(() => {
      dispatch(getAllMessages({ selectedId: selectedChat._id }));
      setIsClearChatModalOpen(false);
    });
  };

  // Add useEffect to handle input focus when chat is selected
  useEffect(() => {
    if (selectedChat && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedChat]); // Dependency on selectedChat

  const getGridColumns = (count) => {
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1";
    if (count === 3) return "grid-cols-2";
    if (count === 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-2 md:grid-cols-3";
    if (count <= 8) return "grid-cols-2 md:grid-cols-4";
    return "grid-cols-3 md:grid-cols-4";
  };

  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);

  const handleReplyMessage = (message) => {
    setReplyingTo(message);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleForwardMessage = (message) => {
    setForwardingMessage(message);
    setShowForwardModal(true);
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
  };

  const handleForwardSubmit = async (selectedUsers) => {
    try {
      for (const userId of selectedUsers) {
        await forwardMessage(userId, forwardingMessage);
      }
      setShowForwardModal(false);
      setForwardingMessage(null);
    } catch (error) {
      console.error("Error forwarding message:", error);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar */}
      <div
        className={`${showLeftSidebar ? "block" : "hidden"
          } w-full md:w-80 border-r flex flex-col`}
      >
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
              placeholder="People, groups"
              className="bg-transparent ml-2 outline-none flex-1"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => setIsSearchDropdownOpen(true)}
            />
          </div>

          {/* ********************************** Search Dropdown ********************************** */}
          {isSearchDropdownOpen && (
            <div className="absolute left-0 top-[65px] right-0 bg-white mt-2 shadow-lg z-50 min-h-[782px]">
              {/* Tabs */}
              <div className="flex border-b">
                <button
                  className={`flex-1 py-2 px-4 text-sm font-medium ${activeSearchTab === "All"
                      ? "text-gray-700 border-b-2 border-blue-500"
                      : "text-gray-500 hover:text-gray-700"
                    }`}
                  onClick={() => setActiveSearchTab("All")}
                >
                  All
                </button>
                <button
                  className={`flex-1 py-2 px-4 text-sm font-medium ${activeSearchTab === "People"
                      ? "text-gray-700 border-b-2 border-blue-500"
                      : "text-gray-500 hover:text-gray-700"
                    }`}
                  onClick={() => setActiveSearchTab("People")}
                >
                  People
                </button>
                <button
                  className={`flex-1 py-2 px-4 text-sm font-medium ${activeSearchTab === "Groups"
                      ? "text-gray-700 border-b-2 border-blue-500"
                      : "text-gray-500 hover:text-gray-700"
                    }`}
                  onClick={() => setActiveSearchTab("Groups")}
                >
                  Groups
                </button>
              </div>

              {/* Search hint */}
              <div className="p-4 text-center text-gray-500 text-sm">
                Quickly search for people, messages and groups.
              </div>

              {/* Content based on active tab */}
              {(activeSearchTab === "All" || activeSearchTab === "People") && (
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 px-2 mb-2">
                    People
                  </div>
                  {filteredUsers.length > 0 ? (
                    <>
                      {/* Show only first 4 users in All tab, or all users in People tab */}
                      {filteredUsers
                        .filter((user) => !user.members)
                        .slice(0, activeSearchTab === "All" ? 4 : undefined)
                        .map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer font-semibold"
                            onClick={() => {
                              setSelectedChat(user);
                              setIsSearchDropdownOpen(false);
                              setSearchInput("");
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                              {user?.photo ? (
                                <img
                                  src={`${IMG_URL}${user.photo.replace(
                                    /\\/g,
                                    "/"
                                  )}`}
                                  alt="Profile"
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <span className="text-sm font-medium">
                                  {user.userName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="text-sm">{user.userName}</span>
                            {onlineUsers.includes(user._id) && (
                              <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                            )}
                          </div>
                        ))}

                      {/* Show View All button only in All tab and if there are more than 4 users */}
                      {activeSearchTab === "All" &&
                        filteredUsers.filter((user) => !user.members).length >
                        4 && (
                          <div
                            className="p-2 text-center text-blue-500 hover:text-blue-600 cursor-pointer font-medium"
                            onClick={() => {
                              setActiveSearchTab("People");
                            }}
                          >
                            View All People (
                            {
                              filteredUsers.filter((user) => !user.members)
                                .length
                            }
                            )
                          </div>
                        )}
                    </>
                  ) : (
                    <div className="p-2 text-center text-gray-500">
                      No matching people found
                    </div>
                  )}
                </div>
              )}

              {(activeSearchTab === "All" || activeSearchTab === "Groups") && (
                <div className="p-2 border-t">
                  <div className="text-xs font-medium text-gray-500 px-2 mb-2">
                    Groups
                  </div>
                  {/* Create New Group Button */}
                  <div
                    className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                    onClick={() => {
                      setIsGroupCreateModalOpen(true);
                      setIsSearchDropdownOpen(false);
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-300 flex items-center justify-center mr-2">
                      <FaUserPlus className="text-gray-600" />
                    </div>
                    <span className="text-sm font-semibold">
                      Create New Group
                    </span>
                  </div>

                  {/* List of Groups */}
                  {groups.length > 0 ? (
                    <>
                      {/* Show only first 4 groups in All tab, or all groups in Groups tab */}
                      {groups
                        .slice(0, activeSearchTab === "All" ? 4 : undefined)
                        .map((group) => (
                          <div
                            key={group._id}
                            className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                            onClick={() => {
                              if (group.members?.includes(currentUser)) {
                                setSelectedChat(group);
                                setIsSearchDropdownOpen(false);
                                setSearchInput("");
                              } else {
                                // Handle non-member click - maybe show a join request dialog
                                alert("You are not a member of this group");
                              }
                            }}
                          >
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mr-2">
                              {group?.photo ? (
                                <img
                                  src={`${IMG_URL}${group.photo.replace(
                                    /\\/g,
                                    "/"
                                  )}`}
                                  alt="Group"
                                  className="w-8 h-8 rounded-lg object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium">
                                  {group.userName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium">
                                {group.userName}
                              </span>
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500">
                                  {group.members?.length} members
                                </span>
                                {!group.members?.includes(currentUser) && (
                                  <span className="ml-2 text-xs text-blue-500">
                                    • Not a member
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                      {/* Show View All button only in All tab and if there are more than 4 groups */}
                      {activeSearchTab === "All" && groups.length > 4 && (
                        <div
                          className="p-2 text-center text-blue-500 hover:text-blue-600 cursor-pointer font-medium"
                          onClick={() => {
                            setActiveSearchTab("Groups");
                          }}
                        >
                          View All Groups ({groups.length})
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-2 text-center text-gray-500">
                      No groups found
                    </div>
                  )}
                </div>
              )}

              {/* Add a "No results" message when neither people nor groups are found */}
              {searchInput &&
                filteredUsers.length === 0 &&
                filteredGroups.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No results found for "{searchInput}"
                  </div>
                )}
            </div>
          )}
        </div>

        <div className="flex justify-around p-4 border-b">
          <div
            className={`${filteredUsers.length > 0 ? "text-blue-500  " : "text-gray-500 "
              } flex flex-col items-center cursor-pointer`}
            onClick={() => handleFilter("chat")}
          >
            <FaCommentDots className="w-6 h-6" />
            <span className="text-xs mt-1">Chat</span>
          </div>
          <div
            className={`${callUsers.length > 0 ? "text-blue-500  " : "text-gray-500 "
              } flex flex-col items-center  cursor-pointer`}
            onClick={() => handleFilter("call")}
          >
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
          {/* <div className="flex flex-col items-center text-gray-500">
            <FaBell className="w-6 h-6" />
            <span className="text-xs mt-1">Notifications</span>
          </div> */}
        </div>

        {callUsers.length == 0 && (
          <div className="flex px-10 space-x-4 border-b justify-between">
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
        )}

        <div className="flex-1 overflow-y-auto modal_scroll cursor-pointer">
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

              // New sorting logic for no messages
              if (!lastMessageA && !lastMessageB) {
                return new Date(b.createdAt) - new Date(a.createdAt); // Sort by createdAt if both have no messages
              }
              if (!lastMessageA) return 1; // If A has no messages, B comes first
              if (!lastMessageB) return -1; // If B has no messages, A comes first

              return (
                new Date(lastMessageB.createdAt) -
                new Date(lastMessageA.createdAt)
              );
            })
            .map((item) => (
              <ChatItem
                key={item._id}
                item={item}
                currentUser={currentUser}
                onlineUsers={onlineUsers}
                setSelectedChat={setSelectedChat}
                setShowLeftSidebar={setShowLeftSidebar}
                IMG_URL={IMG_URL}
                selectedChat={selectedChat} // Pass selectedChat as a prop
              />
            ))}

          {callUsers &&
            callUsers
              .map((item) => ({
                ...item,
                lastMessageTimestamp:
                  item.messages.length > 0
                    ? new Date(
                      item.messages[
                        item.messages.length - 1
                      ].content.timestamp
                    )
                    : null,
              }))
              .filter((item) => item.lastMessageTimestamp) // Filter out users without messages
              .sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp) // Sort by last message timestamp
              .map((item) => (
                <ChatItem
                  key={item._id}
                  item={item}
                  currentUser={currentUser}
                  onlineUsers={onlineUsers}
                  setSelectedChat={setSelectedChat}
                  setShowLeftSidebar={setShowLeftSidebar}
                  IMG_URL={IMG_URL}
                  selectedChat={selectedChat} // Pass selectedChat as a prop
                />
              ))}
        </div>
      </div>

      {/* Right Sidebar */}
      {!(isReceiving || isVideoCalling || isVoiceCalling) && (
        <div
          className={`${showLeftSidebar ? "hidden md:block" : "block"
            } flex-1 flex flex-col`}
        >
          {selectedChat ? (
            <>
              {/* Add back button for mobile */}
              {window.innerWidth <= 425 && (
                <button
                  className="p-2 text-gray-600 hover:text-gray-800 absolute top-[17px] left-[-11px]"
                  onClick={() => setShowLeftSidebar(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}

              <div className="flex items-center justify-between p-4 relative border-b">
                <div className="flex items-center">
                  <div
                    className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      if (
                        selectedChat?.photo &&
                        selectedChat.photo !== "null"
                      ) {
                        handleProfileImageClick(
                          `${IMG_URL}${selectedChat.photo.replace(/\\/g, "/")}`
                        );
                      }
                    }}
                  >
                    {selectedChat?.photo && selectedChat.photo !== "null" ? (
                      <img
                        src={`${IMG_URL}${selectedChat.photo.replace(
                          /\\/g,
                          "/"
                        )}`}
                        alt="Profile"
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-white text-xl font-bold">
                        {selectedChat?.userName &&
                          selectedChat?.userName.includes(" ")
                          ? selectedChat?.userName.split(" ")[0][0] +
                          selectedChat?.userName.split(" ")[1][0]
                          : selectedChat?.userName[0]}
                      </span>
                    )}
                  </div>
                  <div
                    className="ml-3 cursor-pointer"
                    onClick={() => {
                      // console.log("selectedChat", selectedChat);
                      if (selectedChat?.members) {
                        // console.log("selectedChat");
                        setIsGroupModalOpen(true);
                      } else {
                        setIsUserProfileModalOpen(true);
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
                    title="Find"
                    data-tooltip="Find"
                    data-tooltip-delay="0"
                    data-tooltip-duration="0"
                  />

                  {/* <MdOutlineDeleteSweep
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
                  /> */}

                  <MdOutlineDeleteSweep
                    onClick={() => setIsClearChatModalOpen(true)}
                    title="Clear chat"
                    data-tooltip="Clear chat"
                    data-tooltip-delay="0"
                    data-tooltip-duration="0"
                    className="w-7 h-7 cursor-pointer  hover:text-red-600 text-4xl"
                  />
                  {isSharing ? (
                    <LuScreenShareOff
                      title="Stop sharing"
                      data-tooltip="Stop sharing"
                      data-tooltip-delay="0"
                      data-tooltip-duration="0"
                      className="w-6 h-6 cursor-pointer text-red-500 hover:text-red-600 animate-bounce"
                      onClick={() => cleanupConnection()}
                    />
                  ) : (
                    <LuScreenShare
                      title="Screen sharing"
                      data-tooltip="Screen sharing"
                      data-tooltip-delay="0"
                      data-tooltip-duration="0"
                      className="w-6 h-6 cursor-pointer"
                      onClick={() => handleStartScreenShare()}
                    />
                  )}
                  {selectedChat?.members && (
                    <MdGroupAdd
                      title="Add to group"
                      data-tooltip="Add to group"
                      data-tooltip-delay="0"
                      data-tooltip-duration="0"
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
                  <GoDeviceCameraVideo
                    className="w-6 h-6 cursor-pointer"
                    onClick={() => handleMakeCall("video")}
                    title="Video Call"
                    data-tooltip="Video Call"
                    data-tooltip-delay="0"
                    data-tooltip-duration="0"
                  />
                  <IoCallOutline
                    className=" w-6 h-6 cursor-pointer"
                    onClick={() => handleMakeCall("voice")}
                    title="Voice Call"
                    data-tooltip="Voice Call"
                    data-tooltip-delay="0"
                    data-tooltip-duration="0"
                  />
                  {/* <FaEllipsisH className="" /> */}
                </div>
                {isSearchBoxOpen && (
                  <div
                    className="absolute top-24 right-0 left-[50%] max-w-[500px] w-full bg-white shadow-lg p-4 z-50 flex items-center border-rounded"
                    style={{ padding: "5px 25px", borderRadius: "30px", transform: "translate(-50%, -50%)" }}
                  >
                    <FaSearch className="text-gray-500 mr-2" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="flex-1 p-2 outline-none min-w-[20px]"
                      value={searchInputbox}
                      onChange={(e) => {
                        setSearchInputbox(e.target.value);
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
              </div>
              {/*========== Messages ==========*/}


              <div
                className="flex-1 overflow-y-auto p-4 modal_scroll h-[calc(100vh-10rem)] px-14"
                ref={messagesContainerRef}
              >
                {visibleDate && <FloatingDateIndicator />}
                <MessageList
                  messages={messages}
                  groupMessagesByDate={groupMessagesByDate}
                  userId={userId}
                  handleMakeCall={handleMakeCall}
                  handleContextMenu={handleContextMenu}
                  handleDropdownToggle={handleDropdownToggle}
                  handleEditMessage={handleEditMessage}
                  handleDeleteMessage={handleDeleteMessage}
                  handleCopyMessage={handleCopyMessage}
                  handleReplyMessage={handleReplyMessage}
                  handleForwardMessage={handleForwardMessage}
                  highlightText={highlightText}
                  searchInputbox={searchInputbox}
                  activeMessageId={activeMessageId}
                  contextMenu={contextMenu}
                  setContextMenu={setContextMenu}
                  setActiveMessageId={setActiveMessageId}
                  allUsers={allUsers}
                  selectedChat={selectedChat}
                  IMG_URL={IMG_URL}
                  showEmojiPicker={showEmojiPicker}
                  setShowEmojiPicker={setShowEmojiPicker}
                  addMessageReaction={addMessageReaction}
                />
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
                      fileIcon = (
                        <FaFilePdf className="w-20 h-20 text-gray-500" />
                      ); // PDF file icon
                    } else if (
                      file.type === "application/vnd.ms-excel" ||
                      file.type ===
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    ) {
                      fileIcon = (
                        <FaFileExcel className="w-20 h-20 text-gray-500" />
                      ); // Excel file icon
                    } else if (
                      file.type === "application/msword" ||
                      file.type ===
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    ) {
                      fileIcon = (
                        <FaFileWord className="w-20 h-20 text-gray-500" />
                      ); // Word file icon
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
                      fileIcon = (
                        <FaPaperclip className="w-20 h-20 text-gray-500" />
                      ); // Generic file icon
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

              {replyingTo && (
                <div className="w-full max-w-4xl mx-auto px-4">
                  <div className="bg-gray-100 p-3 rounded-t-lg flex justify-between items-start border-l-4 border-blue-500">
                    <div>
                      <div className="text-sm text-blue-500 font-medium">
                        Replying to{" "}
                        {
                          allUsers.find(
                            (user) => user._id === replyingTo.sender
                          )?.userName
                        }
                      </div>
                      <div className="text-gray-600 text-sm line-clamp-2">
                        {/* {console.log(
                          replyingTo.content.fileType === "image/jpeg"
                        )} */}
                        {replyingTo.content.content}
                        {replyingTo.content.fileType === "image/jpeg" && (
                          <img
                            src={`${IMG_URL}${replyingTo.content.fileUrl.replace(
                              /\\/g,
                              "/"
                            )}`}
                            alt=""
                            className="h-10"
                          />
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <RxCross2 size={20} />
                    </button>
                  </div>
                </div>
              )}
              {/*========== Message Input ==========*/}
              {selectedChat && (
                <div className="w-full max-w-4xl mx-auto px-4 rounded-lg ">
                  <form
                    onSubmit={handleSubmit}
                    className={`flex items-center gap-2 rounded-${replyingTo ? "b-" : ""
                      }xl px-4 py-2 shadow w-full max-w-full`}
                    style={{ backgroundColor: "#e5e7eb" }}
                  >
                    <button
                      type="button"
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
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
                    <div className="flex-1 min-w-0">
                      {" "}
                      {/* Add container with min-width */}
                      <input
                        ref={inputRef}
                        type="text"
                        value={messageInput}
                        onChange={handleInputChange}
                        placeholder={
                          editingMessage ? "Edit message..." : "Type a message"
                        }
                        className="w-full px-2 py-1 outline-none text-black bg-transparent"
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
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept="*/*"
                        className="hidden"
                        onChange={handleInputChange}
                      />
                      <button
                        type="button"
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Attach file"
                        onClick={() =>
                          document.getElementById("file-upload").click()
                        }
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
                        <FaMicrophone
                          className={`w-5 h-5 ${isRecording ? "text-red-500" : "text-gray-500"
                            }`}
                        />
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
                  className="fixed bottom-10 right-4 p-2 bg-blue-500/50 text-white rounded-full shadow-lg"
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

      {/*========== screen share ==========*/}
      <div
        className={`flex-grow flex flex-col max-h-screen ${isReceiving || isVideoCalling || isVoiceCalling ? "" : "hidden"
          }`}
      >
        <div
          className={`flex-1 relative ${isReceiving
              ? "flex items-center justify-center"
              : `grid gap-4 ${getGridColumns(
                parseInt(remoteStreams.size) + (isVideoCalling ? 1 : 0)
              )}`
            }`}
        >
          {/* Local video */}
          <div
            className={` ${isVideoCalling || isVoiceCalling ? "" : "hidden"} ${isReceiving ? "hidden" : ""
              } ${remoteStreams.size === 1
                ? "max-w-30 absolute top-2 right-2 z-10"
                : "relative"
              }`}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
              style={{
                maxHeight: `${remoteStreams.size === 1 ? "20vh" : "100%"}`,
              }}
            />
            <div className="absolute bottom-2 left-2 text-white text-xl bg-blue-500  px-3 py-1 rounded-full text-center">
              You
            </div>
          </div>

          {/* Remote videos */}
          {isReceiving ? (
            <div className="w-full h-full">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full max-h-[80vh] object-contain"
              />
            </div>
          ) : (
            <>
              {Array.from(remoteStreams).map(([participantId, stream]) => (
                <div key={participantId} className="relative w-full">
                  <video
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain  max-h-[80vh]"
                    ref={(el) => {
                      if (el) {
                        el.srcObject = stream;
                      }
                    }}
                  />
                  <div className="absolute bottom-2 left-2 text-white text-xl bg-blue-500  px-3 py-1 rounded-full text-center">
                    {allUsers
                      .find((user) => user._id === participantId)
                      ?.userName.charAt(0)
                      .toUpperCase() +
                      allUsers
                        .find((user) => user._id === participantId)
                        ?.userName.slice(1) || "Participant"}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Controls */}
          {(isSharing || isReceiving || isVideoCalling || isVoiceCalling) && (
            <div className="h-10 flex gap-3 mb-4 absolute bottom-1 left-1/2">
              <button
                onClick={() => {
                  if (!callAccept && selectedChat) {
                    if (isVideoCalling || isVoiceCalling) {
                      isVideoCalling
                        ? rejectVoiceCall(selectedChat._id, "video")
                        : rejectVoiceCall(selectedChat._id, "voice");
                    }
                  } else {
                    if (isVideoCalling || isVoiceCalling) {
                      isVideoCalling ? endVideoCall() : endVoiceCall();
                    }
                  }
                  cleanupConnection();
                }}
                className="bg-red-500 h-10 w-10  text-white  grid place-content-center rounded-full hover:bg-red-600 transition-colors "
              >
                <MdCallEnd className="text-xl " />
              </button>
              {(isVideoCalling || isVoiceCalling) && (
                <>
                  <button
                    onClick={toggleCamera}
                    className={`w-10 grid place-content-center  rounded-full h-10 ${isCameraOn ? "bg-blue-500" : "bg-gray-400"
                      } text-white ${isVideoCalling ? "" : "hidden"}`}
                  >
                    {isCameraOn ? (
                      <FiCamera className="text-xl " />
                    ) : (
                      <FiCameraOff className="text-xl " />
                    )}
                  </button>
                  <button
                    onClick={toggleMicrophone}
                    className={`w-10 grid place-content-center  rounded-full h-10 ${isMicrophoneOn ? "bg-blue-500" : "bg-gray-400"
                      } text-white`}
                  >
                    {isMicrophoneOn ? (
                      <BsFillMicFill className="text-xl " />
                    ) : (
                      <BsFillMicMuteFill className="text-xl " />
                    )}
                  </button>
                  <button
                    onClick={() => setParticipantOpen(true)}
                    className="w-10 grid place-content-center rounded-full h-10 bg-blue-500 text-white hover:bg-blue-600"
                  >
                    <MdGroupAdd className="text-xl" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========= incoming call ========= */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-black rounded-lg p-6 w-72 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden">
              {/* Profile image or default avatar */}
              {allUsers.find((user) => user._id === incomingCall.fromEmail)
                ?.photo &&
                allUsers.find((user) => user._id === incomingCall.fromEmail)
                  ?.photo !== "null" ? (
                <img
                  src={`${IMG_URL}${allUsers
                    .find((user) => user._id === incomingCall.fromEmail)
                    ?.photo.replace(/\\/g, "/")}`} // Replace with actual user profile image
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
              {
                allUsers.find((user) => user._id === incomingCall.fromEmail)
                  ?.userName
              }
            </h3>
            <p className="text-gray-400 mb-8 animate-pulse">
              Incoming {incomingCall.type} call...
            </p>
            <div className="flex justify-center gap-8">
              {/* {console.log(incomingCall.type)} */}

              <button
                onClick={
                  incomingCall.type === "video"
                    ? acceptVideoCall
                    : acceptVoiceCall
                }
                className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 animate-bounce"
              >
                <FaPhone className="text-xl" />
              </button>
              <button
                onClick={() => rejectVideoCall(incomingCall.type)}
                className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <MdCallEnd className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      )}

      {incomingShare && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-black rounded-lg p-6 w-72 text-center">
            <h3 className="text-2xl text-gray-300 mb-2 ">
              Incoming Screen <br /> Request...
            </h3>
            <p className="text-gray-400 mb-8">
              {
                allUsers.find((user) => user._id === incomingShare.fromEmail)
                  ?.userName
              }
            </p>
            <div className="flex justify-center gap-8">
              <button
                onClick={() => acceptScreenShare()}
                className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 animate-bounce"
              >
                <LuScreenShare className="w-6 h-6 cursor-pointer" />
              </button>
              <button
                onClick={() => {
                  setIncomingShare(null);
                  cleanupConnection();
                }}
                className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <LuScreenShareOff className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/*========== Group Modal ==========*/}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg w-96 p-4 modal_background">
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
              {/* <input
                type="text"
                placeholder="Search"
                className="w-full p-2 border rounded mb-4"
              /> */}
              {/* {console.log(groupUsers)} */}
              <div className=" flex flex-col cursor-pointer space-y-2 h-80 overflow-y-auto modal_scroll">
                {allUsers
                  .filter((user) => !groupUsers.includes(user._id)) // Filter out already selected users
                  .map((user, index) => {
                    const isChecked = groupNewUsers.includes(user._id); // Check if user is already selected
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-2 mx-1 hover:bg-gray-100 rounded ${isChecked ? "order-first" : ""
                          }`}
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
                          <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 overflow-hidden flex items-center justify-center ">
                            {user?.photo && user.photo !== "null" ? (
                              <img
                                src={`${IMG_URL}${user.photo.replace(
                                  /\\/g,
                                  "/"
                                )}`}
                                alt={`${user.userName}`}
                                className="object-cover h-full w-full"
                              />
                            ) : (
                              <span className="text-gray-900 text-lg font-bold">
                                {user.userName
                                  .split(" ")
                                  .map((n) => n[0].toUpperCase())
                                  .join("")}
                              </span>
                            )}
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
          <div className="bg-white rounded-lg w-96 modal_background">
            <div className="flex justify-between items-center pb-2 p-4">
              <h2 className="text-lg font-bold">Profile</h2>
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

      {/*Other User Profile Modal */}
      {isUserProfileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 modal_background">
            <div className="flex justify-between items-center pb-2 p-4">
              <h2 className="text-lg font-bold">{selectedChat?.userName}</h2>
              <button
                onClick={() => setIsUserProfileModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ImCross />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24  rounded-full bg-gray-300 mt-4 group">
                {selectedChat?.photo && selectedChat.photo !== "null" ? (
                  <img
                    src={`${IMG_URL}${selectedChat?.photo}`}
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
              </div>
              <div className="flex mt-2 items-center justify-between gap-4">
                <h3 className="text-xl font-semibold">
                  {selectedChat?.userName}
                </h3>
              </div>
            </div>
            <div className="mt-4 px-4 py-2">
              <div className="flex items-center justify-between p-2 border-b ">
                <span className="text-gray-600 font-bold">Skype Name</span>
                <span className="text-gray-800">{selectedChat?.userName}</span>
              </div>
              <div className="flex items-center justify-between p-2 border-b ">
                <span className="text-gray-600 font-bold">Email</span>
                <span className="text-gray-800">{selectedChat?.email}</span>
              </div>
              <div className="flex items-center justify-between p-2 border-b ">
                <span className="text-gray-600 font-bold">Phone Number</span>
                <span className="text-gray-800">
                  {selectedChat?.phone || "--"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 border-b ">
                <span className="text-gray-600 font-bold">Birthday</span>
                <span className="text-gray-800">
                  {selectedChat?.dob
                    ? new Date(selectedChat?.dob).toLocaleDateString()
                    : "--"}
                </span>
              </div>
            </div>
            <div className="px-4 py-2">
              <h3 className="text-md text-gray-600 font-bold mb-4 ml-2">
                Shared Media
              </h3>
              <div className="max-h-[250px] justify-center overflow-y-auto pr-2 modal_scroll">
                <div className="grid grid-cols-3 gap-2 items-center">
                  {messages.filter(
                    (message) => message.content?.type === "file"
                  ).length > 0 ? (
                    messages
                      .filter((message) => message.content?.type === "file")
                      .map((message, index) => {
                        if (message.content?.fileType?.includes("image/")) {
                          // Display images in square format
                          return (
                            <div
                              key={index}
                              className="relative group aspect-square"
                            >
                              <img
                                src={`${IMG_URL}${message.content.fileUrl.replace(
                                  /\\/g,
                                  "/"
                                )}`}
                                alt={message.content.content}
                                className="w-full h-full object-cover rounded-lg cursor-pointer"
                                onClick={() =>
                                  handleImageClick(
                                    `${IMG_URL}${message.content.fileUrl.replace(
                                      /\\/g,
                                      "/"
                                    )}`
                                  )
                                }
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                {message.content.content}
                              </div>
                            </div>
                          );
                        } else {
                          // Display other file types in square format
                          return (
                            <div
                              key={index}
                              className="relative bg-gray-100 rounded-lg aspect-square p-3 flex flex-col items-center justify-center group"
                            >
                              {/* File type icon based on extension */}
                              <div className="flex-1 flex items-center justify-center">
                                {message.content.fileType.includes("pdf") ? (
                                  <FaFilePdf className="w-12 h-12 text-red-500" />
                                ) : message.content.fileType.includes(
                                  "word"
                                ) ? (
                                  <FaFileWord className="w-12 h-12 text-blue-500" />
                                ) : message.content.fileType.includes(
                                  "excel"
                                ) ? (
                                  <FaFileExcel className="w-12 h-12 text-green-500" />
                                ) : message.content.fileType.includes(
                                  "audio"
                                ) ? (
                                  <FaFileAudio className="w-12 h-12 text-purple-500" />
                                ) : (
                                  <FaFile className="w-12 h-12 text-gray-500" />
                                )}
                              </div>

                              <div className="w-full px-2 text-center">
                                <p className="text-xs font-medium break-words line-clamp-2 hover:line-clamp-none group-hover:text-blue-600">
                                  {message.content.content}
                                </p>
                              </div>

                              <a
                                href={`${IMG_URL}${message.content.fileUrl.replace(
                                  /\\/g,
                                  "/"
                                )}`}
                                download={message.content.content}
                                className="absolute top-2 right-2 text-blue-500 hover:text-blue-600 bg-white rounded-full p-1 shadow-sm"
                              >
                                <FaDownload className="w-4 h-4" />
                              </a>
                            </div>
                          );
                        }
                      })
                  ) : (
                    <div className="col-span-3 text-center text-gray-600">
                      No media
                    </div>
                  )}
                </div>
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
          <div className="bg-white rounded-lg w-96 modal_background ">
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
                {selectedChat?.photo && selectedChat.photo !== "null" ? (
                  <img
                    src={`${IMG_URL}${selectedChat?.photo}`}
                    alt="Profile"
                    className="cursor-pointer object-cover w-full h-full rounded-full"
                    onClick={() => document.getElementById("fileInput").click()}
                  />
                ) : (
                  <div className="text-gray-900 text-lg font-bold flex w-24 h-24 justify-center items-center">
                    {selectedChat.userName
                      .split(" ")
                      .map((n) => n[0].toUpperCase())
                      .join("")}
                  </div>
                )}

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
              <div className="text-gray-500 mt-1">
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
              <div className="flex flex-col max-h-48 overflow-y-auto modal_scroll">
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
                      <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 overflow-hidden flex items-center justify-center border-[1px] border-gray-400">
                        {user?.photo && user.photo !== "null" ? (
                          <img
                            src={`${IMG_URL}${user.photo.replace(/\\/g, "/")}`}
                            alt={`${user.userName}`}
                            className="object-cover h-full w-full"
                          />
                        ) : (
                          <span className="text-gray-900 text-lg font-bold">
                            {user.userName
                              .split(" ")
                              .map((n) => n[0].toUpperCase())
                              .join("")}
                          </span>
                        )}
                      </div>
                      <span className="text-gray-800">{user?.userName}</span>
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
          <div className="bg-white rounded-lg w-96 modal_background">
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
              <div className="flex flex-col max-h-48 overflow-y-auto cursor-pointer modal_scroll">
                {allUsers
                  .filter((user) => user._id !== currentUser)
                  .map((user, index) => {
                    const isChecked = groupUsers.includes(user._id); // Check if user is already selected
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-2 hover:bg-gray-100 rounded ${isChecked ? "order-first" : ""
                          }`}
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
                          <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 overflow-hidden flex items-center justify-center border-[1px] border-gray-400">
                            {user?.photo && user.photo !== "null" ? (
                              <img
                                src={`${IMG_URL}${user.photo.replace(
                                  /\\/g,
                                  "/"
                                )}`}
                                alt={`${user.userName}`}
                                className="object-cover h-full w-full"
                              />
                            ) : (
                              <span className="text-gray-900 text-lg font-bold">
                                {user.userName
                                  .split(" ")
                                  .map((n) => n[0].toUpperCase())
                                  .join("")}
                              </span>
                            )}
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
      {/* Add Participant to call Modal */}
      {participantOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-96 modal_background">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-bold">Add Participants</h2>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setParticipantOpen(false)}>
                <ImCross />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto mt-4 modal_scroll">
              {allUsers
                .filter(
                  (user) =>
                    !callParticipants.has(user._id) && user._id !== userId
                )
                .map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => {
                      // console.log("user", user);
                      inviteToCall(user._id);
                      setParticipantOpen(false);
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 overflow-hidden flex items-center justify-center ">
                        {user?.photo && user.photo !== "null" ? (
                          <img
                            src={`${IMG_URL}${user.photo.replace(
                              /\\/g,
                              "/"
                            )}`}
                            alt={`${user.userName}`}
                            className="object-cover h-full w-full"
                          />
                        ) : (
                          <span className="text-gray-900 text-lg font-bold">
                            {user.userName
                              .split(" ")
                              .map((n) => n[0].toUpperCase())
                              .join("")}
                          </span>
                        )}
                      </div>
                      <span className="ml-2">{user.userName}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Add a hidden file input for photo upload */}
      <input
        type="file"
        id="file-input"
        style={{ display: "none" }}
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            // Handle the file upload logic here
            dispatch(updateUser({ id: currentUser, values: { photo: file } }));
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
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center p-8">
            <img
              src={selectedImage}
              alt="Full Size"
              className="w-full h-full object-contain "
            />
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 text-white text-2xl"
            >
              <ImCross />
            </button>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {showForwardModal && (
        <ForwardModal
          show={showForwardModal}
          onClose={() => setShowForwardModal(false)}
          onSubmit={handleForwardSubmit} // Corrected the onSubmit prop
          users={allUsers}
        />
      )}

      {/* delete message modal */}
      {isClearChatModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-semibold mb-4">Clear Chat</h3>
            <p className="text-gray-600 mb-6 font-semibold">
              Are you sure you want to clear this chat?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setIsClearChatModalOpen(false)}
                className="px-4 py-2 bg-blue-500 text-white hover:text-gray-800 rounded font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleClearChat}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat2;