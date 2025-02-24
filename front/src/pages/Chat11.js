import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import {
    FaSearch, FaCommentDots, FaPhone, FaUsers, FaBell, FaDownload, FaShareAlt, FaUserPlus, FaBookmark, FaCog, FaQrcode, FaStar, FaPaperclip, FaMicrophone, FaRegSmile
} from 'react-icons/fa';
import { LuScreenShare } from "react-icons/lu";
import { IoMdSearch } from "react-icons/io";
import { MdPhoneEnabled, MdGroupAdd } from "react-icons/md";
import { GoDeviceCameraVideo } from "react-icons/go";
import { LuSendHorizontal } from "react-icons/lu";
import { ImCross } from "react-icons/im";
import { RxCross2 } from "react-icons/rx";

const Chat = () => {
    const [selectedTab, setSelectedTab] = useState('All');
    const [recentChats, setRecentChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [showDialpad, setShowDialpad] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState('');
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const emojiPickerRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);

    useEffect(() => {
        const fetchChats = async () => {
            const fetchedChats = [
                { id: 1, name: 'Copilot', status: 'online', time: '25-06-2024', message: 'Hey, this is Copilot...', isVerified: true },
                { id: 2, name: 'archit bhuva (You)', time: '', avatar: 'AB' },
                { id: 3, name: 'Mehul Kanani', status: 'active', time: '17:10', username: 'architbhuva123' },
                { id: 4, name: 'Akshay Padaliya', status: 'online', time: '16:47', message: 'ha' },
                { id: 5, name: 'jay kalathiya', time: '01:25', message: 'Hello', hasPhoto: true },
                { id: 6, name: 'Dhruvish Sorathiya', time: '19:43', message: 'How are you', hasPhoto: true },
                { id: 7, name: 'Parth Patoliya', status: 'online', time: '09:16', message: '??', hasPhoto: true },
                { id: 8, name: 'Darshit Khichadiya', status: 'online', time: '12:56', message: 'kzsfzkd', hasPhoto: true },
                { id: 9, name: 'Darshan', time: '07:14', message: 'lfsdhl', hasPhoto: true },
                { id: 10, name: 'Keyur Dhameliya', time: '23:25', message: 'sldfh', hasPhoto: true },
                { id: 11, name: 'Vasu gabani', status: 'online', time: '20:37', message: 'mdjhfg', hasPhoto: true },
            ];
            setRecentChats(fetchedChats);
        };

        const fetchMessages = async () => {
            const fetchedMessages = [
                { id: 2, content: 'Baby-project (2).zip', size: '47.3 MB', type: 'file', time: '17:49', sender: 'other' },
                { id: 3, content: 'grid.zip', size: '30 KB', type: 'file', time: '10:50', sender: 'other' },
            ];
            setMessages(fetchedMessages);
        };

        fetchChats();
        fetchMessages();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isProfileDropdownOpen && !event.target.closest('.profile-dropdown')) {
                setIsProfileDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileDropdownOpen]);

    const handleSendMessage = (text, files = []) => {
        if (text.trim() === '' && files.length === 0) return;

        const newMessages = files.map((file, index) => ({
            id: messages.length + index + 1,
            type: 'image',
            content: file,
            time: new Date().toLocaleTimeString(),
            sender: 'me',
        }));

        if (text.trim()) {
            newMessages.push({
                id: messages.length + newMessages.length + 1,
                text,
                time: new Date().toLocaleTimeString(),
                sender: 'me',
            });
        }

        setMessages([...messages, ...newMessages]);
        setSelectedFiles([]); // Clear selected files after sending
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSendMessage(message, selectedFiles);
        setMessage('');
    };

    const onEmojiClick = (event, emojiObject) => {
        console.log(emojiObject.emoji);
        setMessage(prevMessage => prevMessage + event.emoji);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setIsEmojiPickerOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        const filePreviews = files.map(file => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            return new Promise(resolve => {
                reader.onloadend = () => resolve(reader.result);
            });
        });

        Promise.all(filePreviews).then(previews => {
            setSelectedFiles(previews);
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
                        <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden">
                        </div>
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
                                            <div className="text-xs text-gray-500">Reach people anywhere at low rates</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                                    <div className="flex items-center">
                                        <FaPhone className="w-5 h-5 text-gray-600" />
                                        <div className="ml-3">
                                            <div className="text-gray-700">Skype Number</div>
                                            <div className="text-xs text-gray-500">Keep your personal number private</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t">
                                <div className="px-3 py-2 text-xs text-gray-500 font-semibold">
                                    MANAGE
                                </div>
                                {[
                                    { icon: FaUsers, text: 'Skype profile' },
                                    { icon: FaBookmark, text: 'Bookmarks' },
                                    { icon: FaCog, text: 'Settings' },
                                    { icon: FaQrcode, text: 'Sign in with QR code' },
                                    { icon: FaStar, text: 'Skype Insider programme' },
                                    { icon: FaBell, text: "What's new" }
                                ].map((item, index) => (
                                    <div key={index} className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
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
                        className={`py-2 ${selectedTab === 'All' ? 'border-b-2 border-blue-500' : ''}`}
                        onClick={() => setSelectedTab('All')}
                    >
                        All
                    </button>
                    <button
                        className={`py-2 ${selectedTab === 'Chats' ? 'border-b-2 border-blue-500' : ''}`}
                        onClick={() => setSelectedTab('Chats')}
                    >
                        Chats
                    </button>
                    {/* <button
                        className={`py-2 ${selectedTab === 'Channels' ? 'border-b-2 border-blue-500' : ''}`}
                        onClick={() => setSelectedTab('Channels')}
                    >
                        Channels
                    </button> */}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {recentChats
                        .filter(chat => {
                            if (selectedTab === 'All') return true;
                            if (selectedTab === 'Chats') return chat.type === 'chat';
                            // if (selectedTab === 'Channels') return chat.type === 'channel';
                            return false;
                        })
                        .map((chat) => (
                            <div
                                key={chat.id}
                                className="flex items-center p-3 hover:bg-gray-100 cursor-pointer"
                                onClick={() => setSelectedChat(chat)}
                            >
                                <div className="w-10 h-10 rounded-full font-bold bg-gray-300 flex items-center justify-center relative">
                                    {chat.avatar || chat.name.charAt(0)}
                                    <span
                                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${chat.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`}
                                    ></span>
                                </div>
                                <div className="ml-3 flex-1">
                                    <div className="flex justify-between">
                                        <span className="font-medium">{chat.name}</span>
                                        <span className="text-xs text-gray-500">{chat.time}</span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {chat.message}
                                        {chat.hasPhoto && <span className="text-xs ml-1"></span>}
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
                            <div className="font-medium">{selectedChat ? selectedChat.name : ''}</div>
                            <div className="text-sm text-green-500">{selectedChat ? 'Active now' : ''}</div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <IoMdSearch className="w-6 h-6" />
                        <LuScreenShare className="w-6 h-6" />
                        <MdGroupAdd className="w-6 h-6 cursor-pointer" onClick={() => setIsModalOpen(true)} />
                        <MdPhoneEnabled className=" w-6 h-6" />
                        <GoDeviceCameraVideo className="w-6 h-6" />
                        {/* <FaEllipsisH className="" /> */}
                    </div>
                </div>

                <div className="container mx-auto flex-1 overflow-y-auto p-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === 'other' ? 'justify-start' : 'justify-end'} mb-4`}>
                            {message.type === 'file' ? (
                                <div className="rounded-lg p-4 max-w-sm" style={{ maxWidth: '500px', wordWrap: 'break-word', backgroundColor: '#F1F1F1' }}>
                                    <div className="flex items-center">
                                        <FaDownload className="w-6 h-6" />
                                        <div className="ml-3">
                                            <div className="font-medium">{message.content}</div>
                                            <div className="text-sm text-gray-500">{message.size}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : message.type === 'image' ? (
                                <div className="rounded max-w-sm" style={{ maxWidth: '500px', wordWrap: 'break-word', }}>
                                    <img src={message.content} alt="Sent" className="w-full h-auto" style={{ width: '300px', height: 'auto' }} />
                                </div>
                            ) : (
                                <div className="bg-blue-50 rounded-lg py-2 px-4" style={{ backgroundColor: '#CCF7FF' }}>
                                    <p>{message.text}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex w-full max-w-4xl mx-auto p-4 rounded-lg">
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="relative">
                            <img src={file} alt={`Selected ${index}`} className="w-16 h-16 object-cover" />
                            <button
                                className="absolute top-0 right-0 bg-white rounded-full"
                                onClick={() => {
                                    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                                }}
                            >
                                <RxCross2 />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="w-full max-w-4xl mx-auto p-4 rounded-lg">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage(message, selectedFiles);
                        setMessage('');
                    }} className="flex items-center gap-2 rounded-full px-4 py-2 shadow" style={{ backgroundColor: "#e5e7eb" }} >
                        <button
                            type="button"
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Add emoji"
                            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                        >
                            <FaRegSmile className="w-5 h-5 text-gray-500" />
                        </button>

                        {isEmojiPickerOpen && (
                            <div ref={emojiPickerRef} className="absolute bg-white border rounded shadow-lg p-2 bottom-[70px]">
                                <EmojiPicker onEmojiClick={onEmojiClick} />
                            </div>
                        )}

                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message"
                            className="flex-1 px-2 py-1 outline-none text-black"
                            style={{ backgroundColor: "#e5e7eb" }}
                        />

                        <div className="flex items-center gap-1">
                            <input
                                type="file"
                                id="fileInput"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            <button
                                type="button"
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Attach file"
                                onClick={() => document.getElementById('fileInput').click()}
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
                            {(message.trim() || selectedFiles.length > 0) && (
                                <button
                                    type="submit"
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    style={{ backgroundColor: "#3B82F6", color: "white" }}
                                    aria-label="Send message"
                                >
                                    <LuSendHorizontal />
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white rounded-lg w-96 p-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h2 className="text-lg font-bold">Add to Group</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
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
                            <div className="space-y-2 h-80 overflow-y-auto">
                                {['Akshay Padaliya', 'Archit Bhuva', 'Jay Kalathiya', 'Dhruvish Sorathiya', 'Parth Patoliya', 'Darshit Khichadiya', 'Darshan', 'Keyur Dhameliya', 'Vasu Gabani', 'Mehul Kanani'].map((name, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center mr-2">
                                                {name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span>{name}</span>
                                        </div>
                                        <input type="checkbox" className="form-checkbox rounded-full" style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #ccc', backgroundColor: '#fff', cursor: 'pointer' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <button onClick={() => setIsModalOpen(false)} className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;