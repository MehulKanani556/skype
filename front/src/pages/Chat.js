import React, { useState, useEffect } from 'react';
import {
    FaSearch, FaCommentDots, FaPhone, FaUsers, FaBell, FaPlus,
    FaVideo, FaEllipsisH, FaDownload, FaShareAlt, FaUserPlus,
    FaBookmark, FaCog, FaQrcode, FaStar, FaSmile, FaPaperclip, FaMicrophone, FaImage
} from 'react-icons/fa';
// import { Smile, Paperclip, Mic, Image, MoreHorizontal } from 'react-icons/your-icon-library'; // Ensure these icons are correctly imported

const Chat = () => {
    const [selectedTab, setSelectedTab] = useState('Chats');
    const [recentChats, setRecentChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [showDialpad, setShowDialpad] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState('');

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
                // { id: 1, text: 'hello', time: '09:14', sender: 'other' },
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

    const handleSendMessage = (text) => {
        if (text.trim() === '') return;
        const newMessage = { id: messages.length + 1, text, time: new Date().toLocaleTimeString(), sender: 'me' };
        setMessages([...messages, newMessage]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSendMessage(message);
        setMessage('');
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
                    <button
                        className={`py-2 ${selectedTab === 'Channels' ? 'border-b-2 border-blue-500' : ''}`}
                        onClick={() => setSelectedTab('Channels')}
                    >
                        Channels
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {recentChats.map((chat) => (
                        <div
                            key={chat.id}
                            className="flex items-center p-3 hover:bg-gray-100 cursor-pointer"
                            onClick={() => setSelectedChat(chat)}
                        >
                            <div className="w-10 h-10 rounded-full font-bold bg-gray-300 flex items-center justify-center relative">
                                {chat.avatar || chat.name.charAt(0)}
                                <span
                                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${chat.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                                        }`}
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
                        <FaSearch className="" />
                        <FaPhone className="" />
                        <FaVideo className="" />
                        <FaEllipsisH className="" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === 'other' ? 'justify-start' : 'justify-end'} mb-4`}>
                            {message.type === 'file' ? (
                                <div className=" rounded-lg p-4 max-w-sm" style={{ maxWidth: '500px', wordWrap: 'break-word', backgroundColor: '#F1F1F1' }}>
                                    <div className="flex items-center">
                                        <FaDownload className="w-6 h-6" />
                                        <div className="ml-3">
                                            <div className="font-medium">{message.content}</div>
                                            <div className="text-sm text-gray-500">{message.size}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-blue-50 rounded-lg py-2 px-4" style={{ backgroundColor: '#CCF7FF' }}>
                                    <p>{message.text}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="w-full max-w-4xl mx-auto p-4 bg-gray-50 rounded-lg">
                    <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm">
                        <button
                            type="button"
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Add emoji"
                        >
                            {/* <Smile className="w-5 h-5 text-gray-500" /> */}
                        </button>

                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message"
                            className="flex-1 px-2 py-1 outline-none text-gray-700 placeholder-gray-400"
                        />

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Attach file"
                            >
                                {/* <Paperclip className="w-5 h-5 text-gray-500" /> */}
                            </button>
                            <button
                                type="button"
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Voice message"
                            >
                                {/* <Mic className="w-5 h-5 text-gray-500" /> */}
                            </button>
                            <button
                                type="button"
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Add image"
                            >
                                {/* <Image className="w-5 h-5 text-gray-500" /> */}
                            </button>
                            <button
                                type="button"
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="More options"
                            >
                                {/* <MoreHorizontal className="w-5 h-5 text-gray-500" /> */}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chat;