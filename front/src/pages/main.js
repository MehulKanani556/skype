import React, { useState, useEffect } from 'react';
import { FaSearch, FaCommentDots, FaPhone, FaUsers, FaBell, FaPlus, FaVideo, FaEllipsisH, FaDownload } from 'react-icons/fa';

export default SkypeClone = () => {
    const [selectedTab, setSelectedTab] = useState('Chats');
    const [recentChats, setRecentChats] = useState([]);
    const [messages, setMessages] = useState([]);


    useEffect(() => {
        const fetchChats = async () => {
            // Simulate an API call
            const fetchedChats = [
                { id: 1, name: 'Copilot', status: 'online', time: '25-06-2024', message: 'Hey, this is Copilot...', isVerified: true },
                { id: 2, name: 'archit bhuva (You)', time: '', avatar: 'AB' },
                { id: 3, name: 'Mehul Kanani', status: 'active', time: '17:10', username: 'architbhuva123' },
                { id: 4, name: 'Vaidik Moradiya', time: '16:47', message: 'ha' },
                { id: 5, name: 'Akshay Padaliya', time: '15:25', message: 'photo', hasPhoto: true },
            ];
            setRecentChats(fetchedChats);
        };

        const fetchMessages = async () => {
            // Simulate an API call
            const fetchedMessages = [
                { id: 1, text: 'hello', time: '09:14', sender: 'other' },
                { id: 2, content: 'Baby-project (2).zip', size: '47.3 MB', type: 'file', time: '17:49', sender: 'other' },
                { id: 3, content: 'grid.zip', size: '30 KB', type: 'file', time: '10:50', sender: 'other' },
            ];
            setMessages(fetchedMessages);
        };

        fetchChats();
        fetchMessages();
    }, []);

    const handleSendMessage = (text) => {
        if (text.trim() === '') return;
        const newMessage = { id: messages.length + 1, text, time: new Date().toLocaleTimeString(), sender: 'me' };
        setMessages([...messages, newMessage]);
    };

    return (
        <div className="flex h-screen bg-white">
            <div className="w-80 border-r flex flex-col">
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
                        <div key={chat.id} className="flex items-center p-3 hover:bg-gray-100 cursor-pointer">
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                {chat.avatar || chat.name.charAt(0)}
                            </div>
                            <div className="ml-3 flex-1">
                                <div className="flex justify-between">
                                    <span className="font-medium">{chat.name}</span>
                                    <span className="text-xs text-gray-500">{chat.time}</span>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {chat.message}
                                    {chat.hasPhoto && <span className="text-xs ml-1">[photo]</span>}
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
                            <div className="font-medium">Mehul Kanani</div>
                            <div className="text-sm text-green-500">Active now</div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <FaSearch className="w-6 h-6" />
                        <FaPhone className="w-6 h-6" />
                        <FaVideo className="w-6 h-6" />
                        <FaEllipsisH className="w-6 h-6" />
                    </div>
                </div>

          
                <div className="flex-1 overflow-y-auto p-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === 'other' ? 'justify-start' : 'justify-end'} mb-4`}
                        >
                            {message.type === 'file' ? (
                                <div className="bg-blue-50 rounded-lg p-4 max-w-sm">
                                    <div className="flex items-center">
                                        <FaDownload className="w-6 h-6" />
                                        <div className="ml-3">
                                            <div className="font-medium">{message.content}</div>
                                            <div className="text-sm text-gray-500">{message.size}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-blue-50 rounded-lg py-2 px-4">
                                    <p>{message.text}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

              
                <div className="border-t p-4">
                    <div className="flex items-center">
                        <FaPlus className="w-6 h-6" />
                        <input
                            type="text"
                            placeholder="Type a message"
                            className="ml-4 flex-1 outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSendMessage(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

