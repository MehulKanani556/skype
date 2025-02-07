// import React, { useState } from 'react';
// import { Search, Phone, Video, Bell, MessageSquare, Users, Plus, MoreVertical, Download, ChevronDown } from 'lucide-react';

// const SkypeClone = () => {
//     const [selectedTab, setSelectedTab] = useState('Chats');

//     const recentChats = [
//         { id: 1, name: 'Copilot', status: 'online', time: '25-06-2024', message: 'Hey, this is Copilot...', isVerified: true },
//         { id: 2, name: 'archit bhuva (You)', time: '', avatar: 'AB' },
//         { id: 3, name: 'Mehul Kanani', status: 'active', time: '17:10', username: 'architbhuva123' },
//         { id: 4, name: 'Vaidik Moradiya', time: '16:47', message: 'ha' },
//         { id: 5, name: 'Akshay Padaliya', time: '15:25', message: 'photo', hasPhoto: true },
//     ];

//     const messages = [
//         { id: 1, text: 'hello', time: '09:14', sender: 'other' },
//         { id: 2, content: 'Baby-project (2).zip', size: '47.3 MB', type: 'file', time: '17:49', sender: 'other' },
//         { id: 3, content: 'grid.zip', size: '30 KB', type: 'file', time: '10:50', sender: 'other' },
//     ];

//     return (
//         <div className="flex h-screen bg-white">
//             {/* Left Sidebar */}
//             <div className="w-80 border-r flex flex-col">
//                 {/* Search Header */}
//                 <div className="p-4 border-b">
//                     <div className="flex items-center bg-gray-100 rounded-md p-2">
//                         <Search className="w-5 h-5 text-gray-500" />
//                         <input
//                             type="text"
//                             placeholder="People, groups, messages"
//                             className="bg-transparent ml-2 outline-none flex-1"
//                         />
//                     </div>
//                 </div>

//                 {/* Navigation */}
//                 <div className="flex justify-around p-4 border-b">
//                     <div className="flex flex-col items-center text-blue-500">
//                         <MessageSquare className="w-6 h-6" />
//                         <span className="text-xs mt-1">Chat</span>
//                     </div>
//                     <div className="flex flex-col items-center text-gray-500">
//                         <Phone className="w-6 h-6" />
//                         <span className="text-xs mt-1">Calls</span>
//                     </div>
//                     <div className="flex flex-col items-center text-gray-500">
//                         <Users className="w-6 h-6" />
//                         <span className="text-xs mt-1">Contacts</span>
//                     </div>
//                     <div className="flex flex-col items-center text-gray-500">
//                         <Bell className="w-6 h-6" />
//                         <span className="text-xs mt-1">Notifications</span>
//                     </div>
//                 </div>

//                 {/* Tabs */}
//                 <div className="flex px-4 space-x-4 border-b">
//                     <button
//                         className={`py-2 ${selectedTab === 'All' ? 'border-b-2 border-blue-500' : ''}`}
//                         onClick={() => setSelectedTab('All')}
//                     >
//                         All
//                     </button>
//                     <button
//                         className={`py-2 ${selectedTab === 'Chats' ? 'border-b-2 border-blue-500' : ''}`}
//                         onClick={() => setSelectedTab('Chats')}
//                     >
//                         Chats
//                     </button>
//                     <button
//                         className={`py-2 ${selectedTab === 'Channels' ? 'border-b-2 border-blue-500' : ''}`}
//                         onClick={() => setSelectedTab('Channels')}
//                     >
//                         Channels
//                     </button>
//                 </div>

//                 {/* Chat List */}
//                 <div className="flex-1 overflow-y-auto">
//                     {recentChats.map((chat) => (
//                         <div key={chat.id} className="flex items-center p-3 hover:bg-gray-100 cursor-pointer">
//                             <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
//                                 {chat.avatar || chat.name.charAt(0)}
//                             </div>
//                             <div className="ml-3 flex-1">
//                                 <div className="flex justify-between">
//                                     <span className="font-medium">{chat.name}</span>
//                                     <span className="text-xs text-gray-500">{chat.time}</span>
//                                 </div>
//                                 <div className="text-sm text-gray-500">
//                                     {chat.message}
//                                     {chat.hasPhoto && <span className="text-xs ml-1">[photo]</span>}
//                                 </div>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </div>

//             {/* Main Chat Area */}
//             <div className="flex-1 flex flex-col">
//                 {/* Chat Header */}
//                 <div className="flex items-center justify-between p-4 border-b">
//                     <div className="flex items-center">
//                         <div className="w-10 h-10 rounded-full bg-gray-300"></div>
//                         <div className="ml-3">
//                             <div className="font-medium">Mehul Kanani</div>
//                             <div className="text-sm text-green-500">Active now</div>
//                         </div>
//                     </div>
//                     <div className="flex items-center space-x-4">
//                         <Search className="w-6 h-6 text-gray-500" />
//                         <Phone className="w-6 h-6 text-gray-500" />
//                         <Video className="w-6 h-6 text-gray-500" />
//                         <MoreVertical className="w-6 h-6 text-gray-500" />
//                     </div>
//                 </div>

//                 {/* Messages */}
//                 <div className="flex-1 overflow-y-auto p-4">
//                     {messages.map((message) => (
//                         <div
//                             key={message.id}
//                             className={`flex ${message.sender === 'other' ? 'justify-start' : 'justify-end'} mb-4`}
//                         >
//                             {message.type === 'file' ? (
//                                 <div className="bg-blue-50 rounded-lg p-4 max-w-sm">
//                                     <div className="flex items-center">
//                                         <Download className="w-6 h-6 text-gray-500" />
//                                         <div className="ml-3">
//                                             <div className="font-medium">{message.content}</div>
//                                             <div className="text-sm text-gray-500">{message.size}</div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             ) : (
//                                 <div className="bg-blue-50 rounded-lg py-2 px-4">
//                                     <p>{message.text}</p>
//                                 </div>
//                             )}
//                         </div>
//                     ))}
//                 </div>

//                 {/* Message Input */}
//                 <div className="border-t p-4">
//                     <div className="flex items-center">
//                         <Plus className="w-6 h-6 text-gray-500" />
//                         <input
//                             type="text"
//                             placeholder="Type a message"
//                             className="ml-4 flex-1 outline-none"
//                         />
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default SkypeClone;









import React, { useState } from 'react';

// SVG Icon components
const IconSearch = () => (
    <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
    </svg>
);

const IconMessage = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const IconPhone = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const IconUsers = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const IconBell = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

const IconPlus = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const IconVideo = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);

const IconMore = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
    </svg>
);

const IconDownload = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const SkypeClone = () => {
    const [selectedTab, setSelectedTab] = useState('Chats');

    const recentChats = [
        { id: 1, name: 'Copilot', status: 'online', time: '25-06-2024', message: 'Hey, this is Copilot...', isVerified: true },
        { id: 2, name: 'archit bhuva (You)', time: '', avatar: 'AB' },
        { id: 3, name: 'Mehul Kanani', status: 'active', time: '17:10', username: 'architbhuva123' },
        { id: 4, name: 'Vaidik Moradiya', time: '16:47', message: 'ha' },
        { id: 5, name: 'Akshay Padaliya', time: '15:25', message: 'photo', hasPhoto: true },
    ];

    const messages = [
        { id: 1, text: 'hello', time: '09:14', sender: 'other' },
        { id: 2, content: 'Baby-project (2).zip', size: '47.3 MB', type: 'file', time: '17:49', sender: 'other' },
        { id: 3, content: 'grid.zip', size: '30 KB', type: 'file', time: '10:50', sender: 'other' },
    ];

    return (
        <div className="flex h-screen bg-white">
            {/* Left Sidebar */}
            <div className="w-80 border-r flex flex-col">
                {/* Search Header */}
                <div className="p-4 border-b">
                    <div className="flex items-center bg-gray-100 rounded-md p-2">
                        <IconSearch />
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
                        <IconMessage />
                        <span className="text-xs mt-1">Chat</span>
                    </div>
                    <div className="flex flex-col items-center text-gray-500">
                        <IconPhone />
                        <span className="text-xs mt-1">Calls</span>
                    </div>
                    <div className="flex flex-col items-center text-gray-500">
                        <IconUsers />
                        <span className="text-xs mt-1">Contacts</span>
                    </div>
                    <div className="flex flex-col items-center text-gray-500">
                        <IconBell />
                        <span className="text-xs mt-1">Notifications</span>
                    </div>
                </div>

                {/* Tabs */}
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

                {/* Chat List */}
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

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                        <div className="ml-3">
                            <div className="font-medium">Mehul Kanani</div>
                            <div className="text-sm text-green-500">Active now</div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <IconSearch />
                        <IconPhone />
                        <IconVideo />
                        <IconMore />
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === 'other' ? 'justify-start' : 'justify-end'} mb-4`}
                        >
                            {message.type === 'file' ? (
                                <div className="bg-blue-50 rounded-lg p-4 max-w-sm">
                                    <div className="flex items-center">
                                        <IconDownload />
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

                {/* Message Input */}
                <div className="border-t p-4">
                    <div className="flex items-center">
                        <IconPlus />
                        <input
                            type="text"
                            placeholder="Type a message"
                            className="ml-4 flex-1 outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkypeClone;