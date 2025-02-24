import React from 'react';
import { VscCallIncoming, VscCallOutgoing } from 'react-icons/vsc';

const ChatItem = ({ item, currentUser, onlineUsers, setSelectedChat, setShowLeftSidebar, IMG_URL, selectedChat }) => {
  const lastMessage = Array.isArray(item.messages)
    ? [...item.messages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    : null;
  return (
    <div
      className={`flex items-center p-3 hover:bg-gray-100 cursor-pointer ${selectedChat?._id === item._id ? "bg-gray-100" : ""}`}
      onClick={() => {
        setSelectedChat(item);
        if (window.innerWidth <= 425) {
          setShowLeftSidebar(false);
        }
      }}
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
                ? item?.userName.split(" ")[0][0].toUpperCase() + item?.userName.split(" ")[1][0].toUpperCase()
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
            {item._id === currentUser ? `${item.userName} (You)` : item.userName}
          </span>
          <span className="text-xs text-gray-500">
            {lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }) : ""}
          </span>
        </div>
        <div className="flex justify-between">
          <div className="text-sm text-gray-500">
           
            {item?.messages?.[0]?.deletedFor?.includes(currentUser) ? '' :
              <>
                {item?.messages?.[0]?.content?.type === "call" && item.messages && (
                  <div className="flex gap-1 items-center">
                    {item.messages[item.messages.length - 1].sender !== currentUser ? (
                      <VscCallIncoming className="self-center text-base" />
                    ) : (
                      <VscCallOutgoing className="self-center text-base" />
                    )}
                    &nbsp;
                    {item.messages[item.messages.length - 1].content.status === "missed" ? "No answer" : "Call ended"}
                    {item.messages[item.messages.length - 1].content.duration && (
                      <span>
                        &nbsp;|&nbsp;{item.messages[item.messages.length - 1].content.duration}
                      </span>
                    )}
                  </div>
                )}
                {item?.messages?.[0]?.content.fileType === 'image/jpeg' ? (
                  <>
                    <span className="text-sm ml-1 flex gap-1 items-center"><span><svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf" gradientcolor1="#afafaf" gradientcolor2="#afafaf"><path d="M3.5 21h17c.275 0 .5-.225.5-.5v-17c0-.275-.225-.5-.5-.5h-17c-.275 0-.5.225-.5.5v17c0 .275.225.5.5.5Z" fill="#fff"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M16 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="#FF9810" fill="#fff"></path><path fill-rule="evenodd" clip-rule="evenodd" d="m14.116 12.815-1.162 1.702-2.103-2.9a1 1 0 0 0-1.619 0l-3.115 4.296a1 1 0 0 0 .81 1.587h10.146a1 1 0 0 0 .826-1.564l-2.131-3.121a1 1 0 0 0-1.652 0Z" stroke="#A6CCC3" fill="#fff"></path><path opacity="0.64" fill-rule="evenodd" clip-rule="evenodd" d="M3.5 22h17c.827 0 1.5-.673 1.5-1.5v-17c0-.827-.673-1.5-1.5-1.5h-17C2.673 2 2 2.673 2 3.5v17c0 .827.673 1.5 1.5 1.5ZM3 3.5a.5.5 0 0 1 .5-.5h17a.5.5 0 0 1 .5.5v17a.5.5 0 0 1-.5.5h-17a.5.5 0 0 1-.5-.5v-17Z" fill="#605E5C"></path></svg></span> photo</span>
                  </>
                ) : item?.messages?.[0]?.content.fileType === 'application/pdf' ? (
                  <span className="text-sm ml-1 flex gap-1 items-center" style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                    <span>
                      <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf" gradientcolor1="#afafaf" gradientcolor2="#afafaf">
                        <path d="M5.5 22h13c.275 0 .5-.225.5-.5V7h-3.5c-.827 0-1.5-.673-1.5-1.5V2H5.5c-.275 0-.5.225-.5.5v19c0 .275.225.5.5.5Z" fill="#fff"></path>
                        <path d="M18.293 6 15 2.707V5.5c0 .275.225.5.5.5h2.793Z" fill="#fff"></path>
                        <path opacity="0.64" fill-rule="evenodd" clip-rule="evenodd" d="m19.56 5.854-4.414-4.415A1.51 1.51 0 0 0 14.086 1H5.5C4.673 1 4 1.673 4 2.5v19c0 .827.673 1.5 1.5 1.5h13c.827 0 1.5-.673 1.5-1.5V6.914c0-.4-.156-.777-.44-1.06ZM15 2.707 18.293 6H15.5a.501.501 0 0 1-.5-.5V2.707ZM5.5 22h13c.275 0 .5-.225.5-.5V7h-3.5c-.827 0-1.5-.673-1.5-1.5V2H5.5c-.275 0-.5.225-.5.5v19c0 .276.224.5.5.5Z" fill="#605E5C"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 10h9a.5.5 0 0 0 0-1h-9a.5.5 0 0 0 0 1Zm0 2h9a.5.5 0 0 0 0-1h-9a.5.5 0 0 0 0 1Z" fill="#C8C6C4"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M14.5 20.5h-5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1Z" stroke="#D65532" stroke-linecap="round" stroke-linejoin="round" fill="#fff"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M6.75 20H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h2.75a.25.25 0 0 1 .25.25v4.5a.25.25 0 0 1-.25.25Zm10.5-5H20a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2.75a.25.25 0 0 1-.25-.25v-4.5a.25.25 0 0 1 .25-.25Z" fill="#D65532"></path>
                      </svg>
                    </span>
                    <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                      {item?.messages?.[0]?.content.content}
                    </span>
                  </span>
                ) : item?.messages?.[0]?.content.fileType === 'application/zip' ? ( // New condition for ZIP files
                  <span className="text-sm ml-1 flex gap-1 items-center" style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                    <span>
                      <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf" gradientcolor1="#afafaf" gradientcolor2="#afafaf">
                        <path d="m12 6-1.268-1.268A2.5 2.5 0 0 0 8.964 4H2.5A1.5 1.5 0 0 0 1 5.5v13A1.5 1.5 0 0 0 2.5 20h19a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 21.5 6H12Z" fill="#FFB900"></path>
                        <path d="m12 6-1.268 1.268A2.5 2.5 0 0 1 8.964 8H1v10.5A1.5 1.5 0 0 0 2.5 20h19a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 21.5 6H12Z" fill="#FFD75E"></path>
                        <path d="m12 6-1.268 1.268A2.5 2.5 0 0 1 8.964 8H1v.5h8.007a3 3 0 0 0 2.122-.879Z" fill="#fff"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M2.5 11h8a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5V15h.75a.25.25 0 0 0 .25-.25v-2.5a.25.25 0 0 0-.25-.25H2v-.5a.5.5 0 0 1 .5-.5Zm10 4a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Zm2 0a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Zm1.5-.5a.5.5 0 0 0 1 0v-2a.5.5 0 0 0-1 0v2Zm2.5.5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Zm1.5-.5a.5.5 0 0 0 1 0v-2a.5.5 0 0 0-1 0v2Zm2.5.5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5ZM10 14.75a.25.25 0 0 1-.25.25h-2.5a.25.25 0 0 1-.25-.25v-2.5a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25v2.5ZM1 15h.75a.25.25 0 0 0 .25-.25v-2.5a.25.25 0 0 0-.25-.25H1v3Z" fill="#BF5712"></path>
                      </svg>
                    </span>
                    <span>{item?.messages?.[0]?.content.content}</span>
                  </span>
                ) : item?.messages?.[0]?.content.fileType === 'video/mp4' ? ( // New condition for video files
                  <span className="text-sm ml-1 flex  items-center">
                    <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#afafaf" gradientcolor1="#afafaf" gradientcolor2="#afafaf">
                      <path d="M3.5 21h17c.275 0 .5-.225.5-.5v-17c0-.275-.225-.5-.5-.5h-17c-.275 0-.5.225-.5.5v17c0 .275.225.5.5.5Z" fill="#fff"></path>
                      <path opacity="0.64" fill-rule="evenodd" clip-rule="evenodd" d="M3.5 22h17c.827 0 1.5-.673 1.5-1.5v-17c0-.827-.673-1.5-1.5-1.5h-17C2.673 2 2 2.673 2 3.5v17c0 .827.673 1.5 1.5 1.5ZM3 3.5a.5.5 0 0 1 .5-.5h17a.5.5 0 0 1 .5.5v17a.5.5 0 0 1-.5.5h-17a.5.5 0 0 1-.5-.5v-17Z" fill="#605E5C"></path>
                      <path d="M16 12a.47.47 0 0 1-.24.4l-6 3.53a.48.48 0 0 1-.26.07.5.5 0 0 1-.24-.06.46.46 0 0 1-.26-.41V12h7Z" fill="#BC1948"></path>
                      <path d="M16 12a.47.47 0 0 0-.24-.4l-6-3.536a.52.52 0 0 0-.5 0 .46.46 0 0 0-.26.4V12h7Z" fill="#E8467C"></path>
                    </svg>
                    &nbsp; Video
                  </span>
                ) : (
                  <span>{item?.messages?.[0]?.content.content}</span>
                )}
              </>


            }


          </div>
          <div className="badge">
            {item.messages?.filter((message) => message.receiver === currentUser && message.status !== "read").length > 0 && (
              <div className="inline-flex relative w-6 h-6 items-center rounded-full bg-[#1d4fd8b4] text-white text-center text-xs font-medium ring-1 ring-gray-500/10 ring-inset">
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  {item.messages?.filter((message) => message.receiver === currentUser && message.status !== "read").length > 99
                    ? "99+"
                    : item.messages?.filter((message) => message.receiver === currentUser && message.status !== "read").length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatItem;