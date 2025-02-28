import React, { useEffect, useRef } from "react";
import {
  FaPhone,
  FaRegSmile,
  FaDownload,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileAudio,
  FaFile,
} from "react-icons/fa";
import { MdPhoneEnabled } from "react-icons/md";
import { GoDeviceCameraVideo } from "react-icons/go";
import { BiShare, BiReply } from "react-icons/bi";
import { VscCopy } from "react-icons/vsc";
import { MdOutlineModeEdit } from "react-icons/md";
import { CiSquareRemove } from "react-icons/ci";
import {
  IoCheckmarkCircleOutline,
  IoCheckmarkDoneCircleOutline,
  IoCheckmarkDoneCircle,
} from "react-icons/io5";
import {
  PiDotsThreeCircleVerticalBold,
  PiDotsThreeVerticalBold,
} from "react-icons/pi";
import { FiEdit2 } from "react-icons/fi";
import { SlActionUndo } from "react-icons/sl";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import AudioPlayer from "./AudioPlayer";

const MessageList = ({
  messages,
  groupMessagesByDate,
  userId,
  handleMakeCall,
  handleContextMenu,
  handleDropdownToggle,
  handleEditMessage,
  handleDeleteMessage,
  handleCopyMessage,
  handleReplyMessage,
  handleForwardMessage,
  handleImageClick,
  highlightText,
  searchInputbox,
  activeMessageId,
  contextMenu,
  setContextMenu,
  setActiveMessageId,
  allUsers,
  selectedChat,
  IMG_URL,
  showEmojiPicker,
  setShowEmojiPicker,
  addMessageReaction,
  dropdownRef,
}) => {
  return (
    <>
      {messages && messages.length > 0 ? (
        Object.entries(groupMessagesByDate(messages)).map(
          ([date, dateMessages]) => (
            <div key={date} className="flex flex-col w-full">
              <DateHeader date={date} />
              {dateMessages.map((message, index) => {
                const prevMessage = index > 0 ? dateMessages[index - 1] : null;
                const nextMessage =
                  index < dateMessages.length - 1
                    ? dateMessages[index + 1]
                    : null;
                const isConsecutive =
                  nextMessage && nextMessage.sender === message.sender;
                const isSameMinute =
                  prevMessage &&
                  new Date(message?.createdAt).getMinutes() ===
                    new Date(prevMessage?.createdAt).getMinutes();
                const issameUser = message.sender === prevMessage?.sender;

                const showTime =
                  !prevMessage ||
                  new Date(message?.createdAt).getMinutes() -
                    new Date(prevMessage?.createdAt).getMinutes() >
                    0 ||
                  !issameUser;

                const name = allUsers.find(
                  (user) => user._id === message.sender
                )?.userName;
                const currentTime = new Date(
                  message.createdAt
                ).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });

                if (message.content?.type === "system") {
                  return <SystemMessage key={message._id} message={message} />;
                }

                if (message.content?.type === "call") {
                  return (
                    <CallMessage
                      key={message._id}
                      message={message}
                      userId={userId}
                      handleMakeCall={handleMakeCall}
                    />
                  );
                }

                return (
                  <RegularMessage
                    key={message._id}
                    message={message}
                    userId={userId}
                    showTime={showTime}
                    name={name}
                    currentTime={currentTime}
                    isConsecutive={isConsecutive}
                    handleContextMenu={handleContextMenu}
                    handleDropdownToggle={handleDropdownToggle}
                    handleEditMessage={handleEditMessage}
                    handleDeleteMessage={handleDeleteMessage}
                    handleCopyMessage={handleCopyMessage}
                    handleReplyMessage={handleReplyMessage}
                    handleForwardMessage={handleForwardMessage}
                    handleImageClick={handleImageClick}
                    highlightText={highlightText}
                    searchInputbox={searchInputbox}
                    activeMessageId={activeMessageId}
                    contextMenu={contextMenu}
                    setContextMenu={setContextMenu}
                    setActiveMessageId={setActiveMessageId}
                    allUsers={allUsers}
                    IMG_URL={IMG_URL}
                    showEmojiPicker={showEmojiPicker}
                    setShowEmojiPicker={setShowEmojiPicker}
                    addMessageReaction={addMessageReaction}
                    dropdownRef={dropdownRef}
                    selectedChat={selectedChat}
                    messages={messages}
                  />
                );
              })}
            </div>
          )
        )
      ) : (
        <EmptyMessages />
      )}
    </>
  );
};

const DateHeader = ({ date }) => (
  <div
    className="flex justify-center items-center gap-2 my-4 text-gray-500 date-header px-2"
    data-date={date}
  >
    <div className="sm:block flex-1 h-[1px] bg-gray-400 max-w-[300px]" />
    <span className="text-gray-600 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-5 py-1 rounded-full">
      {date === new Date().toLocaleDateString("en-GB") ? "Today" : date}
    </span>
    <div className="sm:block flex-1 h-[1px] bg-gray-400 max-w-[300px]" />
  </div>
);

const SystemMessage = ({ message }) => (
  <div className="flex justify-center my-2">
    <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
      {message.content.content
        .split("**")
        .map((part, index) =>
          index % 2 === 1 ? (
            <strong key={index}>{part}</strong>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
    </span>
  </div>
);

const CallMessage = ({ message, userId, handleMakeCall }) => {
  const isCompleted = message.content.status === "ended";

  return (
    <div className="flex justify-center my-2">
      <div
        className={`flex items-center ${
          isCompleted ? "text-gray-600" : "text-red-500"
        } text-sm px-3 py-2 rounded-md bg-gray-100`}
      >
        <FaPhone
          className={message.sender === userId ? "rotate-90" : "-rotate-90"}
        />
        <div className="flex flex-col ml-2">
          <span>
            {message.sender === userId
              ? isCompleted
                ? "Outgoing call"
                : "Call not answered"
              : isCompleted
              ? "Incoming call"
              : "Missed call"}
            {isCompleted && ` • ${message.content.duration}`}
          </span>
          <span className="text-gray-500 text-xs">
            {new Date(message.content.timestamp).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        </div>
        <span className="cursor-pointer ml-12 bg-gray-300 p-2 rounded-full">
          {message.content.callType === "voice" ||
          message.content.callType === "audio" ? (
            <MdPhoneEnabled
              className="w-5 h-5 cursor-pointer text-black"
              onClick={() => handleMakeCall("audio")}
            />
          ) : (
            <GoDeviceCameraVideo
              className="w-5 h-5 cursor-pointer text-black"
              onClick={() => handleMakeCall("video")}
            />
          )}
        </span>
      </div>
    </div>
  );
};

const MessageContent = ({
  message,
  userId,
  handleImageClick,
  IMG_URL,
  highlightText,
  searchInputbox,
  allUsers,
  messages,
}) => {
  if (message.replyTo) {
    return (
      <ReplyPreview
        message={message}
        allUsers={allUsers}
        IMG_URL={IMG_URL}
        messages={messages}
        userId={userId}
        highlightText={highlightText}
        searchInputbox={searchInputbox}
      />
    );
  } else {
    if (message.content?.type === "file") {
      if (message.content?.fileType?.includes("image/")) {
        return (
          <ImageMessage
            message={message}
            userId={userId}
            handleImageClick={handleImageClick}
            IMG_URL={IMG_URL}
          />
        );
      }
      if (message.content?.fileType?.includes("audio/")) {
        return (
          <AudioMessage message={message} userId={userId} IMG_URL={IMG_URL} />
        );
      }
      return (
        <FileMessage message={message} userId={userId} IMG_URL={IMG_URL} highlightText={highlightText}
        searchInputbox={searchInputbox} />
      );
    }

    return (
      <TextMessage
        message={message}
        userId={userId}
        highlightText={highlightText}
        searchInputbox={searchInputbox}
      />
    );
  }
};

const ImageMessage = ({ message, userId, handleImageClick, IMG_URL }) => (
  <div className={`max-w-[300px] max-h-[300px] overflow-hidden rounded-lg`}>
    <img
      src={`${IMG_URL}${message.content.fileUrl.replace(/\\/g, "/")}`}
      alt={message.content.content}
      className={`w-full object-contain rounded-lg`}
      onClick={() =>
        handleImageClick(
          `${IMG_URL}${message.content.fileUrl.replace(/\\/g, "/")}`
        )
      }
    />
  </div>
);

const AudioMessage = ({ message, userId, IMG_URL }) => (
  <div className={`max-w-[300px] rounded-lg`}>
    <AudioPlayer
      audioUrl={`${IMG_URL}${message?.content?.fileUrl?.replace(/\\/g, "/")}`}
    />
    <div className="ml-3">
      <div className="font-medium">{message.content?.content}</div>
      <div className="text-sm text-gray-500">{message.content?.size}</div>
    </div>
  </div>
);

const FileMessage = ({ message, userId, IMG_URL, highlightText, searchInputbox }) => (
  <div className={`max-w-[300px]`}>
    <div className="flex items-center">
      <a
        href={`${IMG_URL}${message?.content?.fileUrl?.replace(/\\/g, "/")}`}
        download={message?.content?.content}
        className="ml-2 text-blue-500 hover:underline"
      >
        <FaDownload className="w-6 h-6" />
      </a>
      <div className="ml-3">
        <div className="font-medium">{highlightText(message?.content?.content, searchInputbox)}</div>
        <div className="text-sm text-gray-500">{message?.content?.size}</div>
      </div>
    </div>
  </div>
);

const TextMessage = ({ message, userId, highlightText, searchInputbox }) => {
  const messageContent = message?.content?.content;
  // Check if message contains only a single emoji
  const isSingleEmoji = messageContent?.match(/^\p{Emoji}$/gu);

  return (
    <div
      className={`group flex-1 flex justify-between items-center relative rounded-lg`}
    >
      <div className="flex-1 flex flex-col">
        <p className="flex-1">
          {messageContent.split(/(\p{Emoji})/gu).map((part, index) => {
            // Check if the part is an emoji
            if (part.match(/\p{Emoji}/gu)) {
              return (
                <span key={index} className="inline-block align-middle">
                  <img
                    src={`https://cdn.jsdelivr.net/npm/emoji-datasource-facebook/img/facebook/64/${part.codePointAt(0).toString(16)}.png`}
                    alt={part}
                    className={`inline ${isSingleEmoji ? 'h-14 w-14' : 'h-5 w-5'}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.replaceWith(document.createTextNode(part));
                    }}
                  />
                </span>
              );
            }
            // If not an emoji, apply the highlight text function
            return <span key={index}>{highlightText(part, searchInputbox)}</span>;
          })}
        </p>
      </div>
    </div>
  );
};

const MessageStatus = ({ message, userId }) => (
  <div
    className={`flex items-end mt-1 ${
      message.showTime ? "bottom-3" : "-bottom-2"
    } right-0`}
  >
    {message.status === "sent" && (
      <IoCheckmarkCircleOutline className="text-xl mr-1 text-gray-600 font-bold" />
    )}
    {message.status === "delivered" && (
      <IoCheckmarkDoneCircleOutline className="text-xl mr-1 text-gray-600 font-bold" />
    )}
    {message.status === "read" && (
      <IoCheckmarkDoneCircle className="text-xl mr-1 text-blue-500 font-bold" />
    )}
  </div>
);

const ReplyPreview = ({ message, allUsers, IMG_URL, messages, userId, highlightText, searchInputbox }) => {
  const getReplyContent = () => {
    return (
      <p>
        {message?.replyTo?.content &&
        message.replyTo.content.fileType?.startsWith("image/") ? (
          <img
            src={`${IMG_URL}${message?.replyTo?.content.fileUrl.replace(
              /\\/g,
              "/"
            )}`}
            alt=""
            className="max-w-[300px] max-h-[300px]"
          />
        ) : message?.replyTo?.content &&
          message.replyTo.content.fileType?.startsWith("video/") ? (
          <video
            src={`${IMG_URL}${message?.replyTo?.content.fileUrl.replace(
              /\\/g,
              "/"
            )}`}
            controls
            className="max-w-[300px] max-h-[300px]"
          />
        ) : message?.replyTo?.content &&
          message.replyTo.content.fileType?.startsWith("text/") ? (
          <>
            <span className="text-center grid place-content-center">
              <svg
                width="50"
                height="50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="M5.5 22h13c.275 0 .5-.225.5-.5V7h-3.5c-.827 0-1.5-.673-1.5-1.5V2H5.5c-.275 0-.5.225-.5.5v19c0 .275.225.5.5.5Z"
                  fill="#fff"
                ></path>
                <path
                  d="M18.293 6 15 2.707V5.5c0 .275.225.5.5.5h2.793Z"
                  fill="#fff"
                ></path>
                <path
                  opacity="0.64"
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="m19.56 5.854-4.414-4.415A1.51 1.51 0 0 0 14.086 1H5.5C4.673 1 4 1.673 4 2.5v19c0 .827.673 1.5 1.5 1.5h13c.827 0 1.5-.673 1.5-1.5V6.914c0-.4-.156-.777-.44-1.06ZM15 2.707 18.293 6H15.5a.501.501 0 0 1-.5-.5V2.707ZM5.5 22h13c.275 0 .5-.225.5-.5V7h-3.5c-.827 0-1.5-.673-1.5-1.5V2H5.5c-.275 0-.5.225-.5.5v19c0 .276.224.5.5.5Z"
                  fill="#605E5C"
                ></path>
              </svg>
            </span>
            <span className="flex gap-2">
              <svg
                width="16"
                height="16"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="M5.5 22h13c.275 0 .5-.225.5-.5V7h-3.5c-.827 0-1.5-.673-1.5-1.5V2H5.5c-.275 0-.5.225-.5.5v19c0 .275.225.5.5.5Z"
                  fill="#fff"
                ></path>
                <path
                  d="M18.293 6 15 2.707V5.5c0 .275.225.5.5.5h2.793Z"
                  fill="#fff"
                ></path>
                <path
                  opacity="0.64"
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="m19.56 5.854-4.414-4.415A1.51 1.51 0 0 0 14.086 1H5.5C4.673 1 4 1.673 4 2.5v19c0 .827.673 1.5 1.5 1.5h13c.827 0 1.5-.673 1.5-1.5V6.914c0-.4-.156-.777-.44-1.06ZM15 2.707 18.293 6H15.5a.501.501 0 0 1-.5-.5V2.707ZM5.5 22h13c.275 0 .5-.225.5-.5V7h-3.5c-.827 0-1.5-.673-1.5-1.5V2H5.5c-.275 0-.5.225-.5.5v19c0 .276.224.5.5.5Z"
                  fill="#605E5C"
                ></path>
              </svg>
              <span>{highlightText(message?.replyTo?.content?.content, searchInputbox)}</span>
            </span>
          </>
        ) : message?.replyTo?.content?.fileType == "application/zip" ? (
          <>
            <span className="text-center grid place-content-center">
              <svg
                width="50"
                height="50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="m12 6-1.268-1.268A2.5 2.5 0 0 0 8.964 4H2.5A1.5 1.5 0 0 0 1 5.5v13A1.5 1.5 0 0 0 2.5 20h19a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 21.5 6H12Z"
                  fill="#FFB900"
                ></path>
                <path
                  d="m12 6-1.268 1.268A2.5 2.5 0 0 1 8.964 8H1v10.5A1.5 1.5 0 0 0 2.5 20h19a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 21.5 6H12Z"
                  fill="#FFD75E"
                ></path>
                <path
                  d="m12 6-1.268 1.268A2.5 2.5 0 0 1 8.964 8H1v.5h8.007a3 3 0 0 0 2.122-.879Z"
                  fill="#fff"
                ></path>
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M2.5 11h8a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5V15h.75a.25.25 0 0 0 .25-.25v-2.5a.25.25 0 0 0-.25-.25H2v-.5a.5.5 0 0 1 .5-.5Zm10 4a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Zm2 0a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Zm1.5-.5a.5.5 0 0 0 1 0v-2a.5.5 0 0 0-1 0v2Zm2.5.5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Zm1.5-.5a.5.5 0 0 0 1 0v-2a.5.5 0 0 0-1 0v2Zm2.5.5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5ZM10 14.75a.25.25 0 0 1-.25.25h-2.5a.25.25 0 0 1-.25-.25v-2.5a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25v2.5ZM1 15h.75a.25.25 0 0 0 .25-.25v-2.5a.25.25 0 0 0-.25-.25H1v3Z"
                  fill="#BF5712"
                ></path>
              </svg>
            </span>
            <span className="flex gap-2">
              <svg
                width="16"
                height="16"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="m12 6-1.268-1.268A2.5 2.5 0 0 0 8.964 4H2.5A1.5 1.5 0 0 0 1 5.5v13A1.5 1.5 0 0 0 2.5 20h19a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 21.5 6H12Z"
                  fill="#FFB900"
                ></path>
                <path
                  d="m12 6-1.268 1.268A2.5 2.5 0 0 1 8.964 8H1v10.5A1.5 1.5 0 0 0 2.5 20h19a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 21.5 6H12Z"
                  fill="#FFD75E"
                ></path>
                <path
                  d="m12 6-1.268 1.268A2.5 2.5 0 0 1 8.964 8H1v.5h8.007a3 3 0 0 0 2.122-.879Z"
                  fill="#fff"
                ></path>
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M2.5 11h8a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5V15h.75a.25.25 0 0 0 .25-.25v-2.5a.25.25 0 0 0-.25-.25H2v-.5a.5.5 0 0 1 .5-.5Zm10 4a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Zm2 0a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Zm1.5-.5a.5.5 0 0 0 1 0v-2a.5.5 0 0 0-1 0v2Zm2.5.5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5Zm1.5-.5a.5.5 0 0 0 1 0v-2a.5.5 0 0 0-1 0v2Zm2.5.5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 1-.5.5ZM10 14.75a.25.25 0 0 1-.25.25h-2.5a.25.25 0 0 1-.25-.25v-2.5a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25v2.5ZM1 15h.75a.25.25 0 0 0 .25-.25v-2.5a.25.25 0 0 0-.25-.25H1v3Z"
                  fill="#BF5712"
                ></path>
              </svg>
              <span>{highlightText(message?.replyTo?.content?.content, searchInputbox)}</span>
            </span>
          </>
        ) : message?.replyTo?.content?.fileType ==
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          message?.replyTo?.content?.fileType == "application/vnd.ms-excel" ? (
          <>
            <span className="text-center grid place-content-center">
              <svg
                width="50"
                height="50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="M15 3H7.8c-.442 0-.8.298-.8.667V7l8 5 3.5 1.5L22 12V7l-7-4Z"
                  fill="#21A366"
                ></path>
                <path d="M7 12h8V7H7v5Z" fill="#107C41"></path>
                <path
                  d="M22 3.82V7h-7V3h6.17c.46 0 .83.37.83.82"
                  fill="#33C481"
                ></path>
                <path
                  d="M15 12H7v8.167c0 .46.373.833.833.833h13.334c.46 0 .833-.373.833-.833V17l-7-5Z"
                  fill="#185C37"
                ></path>
                <path d="M15 17h7v-5h-7v5Z" fill="#107C41"></path>
                <path
                  opacity="0.5"
                  d="M13.963 7H7v12h6.759c.63 0 1.241-.611 1.241-1.161V8c0-.55-.467-1-1.037-1"
                ></path>
                <path
                  d="M13 18H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1"
                  fill="#107C41"
                ></path>
                <path
                  d="m4.762 15.625 2.346-3.635-2.15-3.615h1.73l1.173 2.311c.108.219.182.382.223.49h.015c.077-.175.158-.345.242-.511l1.254-2.29h1.588L8.978 11.97l2.26 3.655H9.55l-1.355-2.538a2.07 2.07 0 0 1-.162-.339h-.02a1.612 1.612 0 0 1-.157.329L6.46 15.625h-1.7Z"
                  fill="#fff"
                ></path>
              </svg>
            </span>
            <span className="flex gap-2">
              <svg
                width="16"
                height="16"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="M15 3H7.8c-.442 0-.8.298-.8.667V7l8 5 3.5 1.5L22 12V7l-7-4Z"
                  fill="#21A366"
                ></path>
                <path d="M7 12h8V7H7v5Z" fill="#107C41"></path>
                <path
                  d="M22 3.82V7h-7V3h6.17c.46 0 .83.37.83.82"
                  fill="#33C481"
                ></path>
                <path
                  d="M15 12H7v8.167c0 .46.373.833.833.833h13.334c.46 0 .833-.373.833-.833V17l-7-5Z"
                  fill="#185C37"
                ></path>
                <path d="M15 17h7v-5h-7v5Z" fill="#107C41"></path>
                <path
                  opacity="0.5"
                  d="M13.963 7H7v12h6.759c.63 0 1.241-.611 1.241-1.161V8c0-.55-.467-1-1.037-1"
                ></path>
                <path
                  d="M13 18H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1"
                  fill="#107C41"
                ></path>
                <path
                  d="m4.762 15.625 2.346-3.635-2.15-3.615h1.73l1.173 2.311c.108.219.182.382.223.49h.015c.077-.175.158-.345.242-.511l1.254-2.29h1.588L8.978 11.97l2.26 3.655H9.55l-1.355-2.538a2.07 2.07 0 0 1-.162-.339h-.02a1.612 1.612 0 0 1-.157.329L6.46 15.625h-1.7Z"
                  fill="#fff"
                ></path>
              </svg>

              <span>{highlightText(message?.replyTo?.content?.content, searchInputbox)}</span>
            </span>
          </>
        ) : message?.replyTo?.content?.fileType ==
            "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
          message?.replyTo?.content?.fileType ==
            "application/vnd.ms-powerpoint" ? (
          <>
            <span className="text-center grid place-content-center">
              <svg
                width="50"
                height="50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="M13 3c-4.95 0-9 4.05-9 9l11 1.5L13 3Z"
                  fill="#ED6C47"
                ></path>
                <path
                  d="M13 3c4.95 0 9 4.05 9 9l-4.5 2-4.5-2V3Z"
                  fill="#FF8F6B"
                ></path>
                <path
                  d="M22 12c0 4.95-4.05 9-9 9s-9-4.05-9-9h18Z"
                  fill="#D35230"
                ></path>
                <path
                  opacity="0.5"
                  d="M14.013 7H5.529a8.93 8.93 0 0 0-1.53 5c0 2.821 1.319 5.347 3.367 7h6.453c.599 0 1.18-.611 1.18-1.161V8c0-.55-.443-1-.986-1"
                ></path>
                <path
                  d="M13 18H3c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1"
                  fill="#C43E1C"
                ></path>
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M10.093 8.957c-.46-.388-1.124-.582-1.99-.582H5.216v7.25h1.416v-2.36h1.38c.553 0 1.04-.101 1.46-.306.418-.204.742-.49.97-.857.227-.367.341-.99.341-1.463 0-.733-.23-1.295-.69-1.682ZM7.85 12.008H6.632v-2.51h1.264c.93 0 1.395.399 1.395 1.197 0 .412-.12.778-.364.992-.242.215-.6.322-1.077.322Z"
                  fill="#fff"
                ></path>
              </svg>
            </span>
            <span className="flex gap-2">
              <svg
                width="16"
                height="16"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="M13 3c-4.95 0-9 4.05-9 9l11 1.5L13 3Z"
                  fill="#ED6C47"
                ></path>
                <path
                  d="M13 3c4.95 0 9 4.05 9 9l-4.5 2-4.5-2V3Z"
                  fill="#FF8F6B"
                ></path>
                <path
                  d="M22 12c0 4.95-4.05 9-9 9s-9-4.05-9-9h18Z"
                  fill="#D35230"
                ></path>
                <path
                  opacity="0.5"
                  d="M14.013 7H5.529a8.93 8.93 0 0 0-1.53 5c0 2.821 1.319 5.347 3.367 7h6.453c.599 0 1.18-.611 1.18-1.161V8c0-.55-.443-1-.986-1"
                ></path>
                <path
                  d="M13 18H3c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1"
                  fill="#C43E1C"
                ></path>
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M10.093 8.957c-.46-.388-1.124-.582-1.99-.582H5.216v7.25h1.416v-2.36h1.38c.553 0 1.04-.101 1.46-.306.418-.204.742-.49.97-.857.227-.367.341-.99.341-1.463 0-.733-.23-1.295-.69-1.682ZM7.85 12.008H6.632v-2.51h1.264c.93 0 1.395.399 1.395 1.197 0 .412-.12.778-.364.992-.242.215-.6.322-1.077.322Z"
                  fill="#fff"
                ></path>
              </svg>

              <span>{highlightText(message?.replyTo?.content?.content, searchInputbox)}</span>
            </span>
          </>
        ) : message?.replyTo?.content?.fileType ==
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          message?.replyTo?.content?.fileType == "application/msword" ? (
          <>
            <span className="text-center grid place-content-center">
              <svg
                width="50"
                height="50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="M21.167 3H7.82a.82.82 0 0 0-.82.82v3.17l7.5 2.194L22 6.99V3.833A.836.836 0 0 0 21.167 3"
                  fill="#41A5EE"
                ></path>
                <path d="M22 7H7v5l7.5 2.016L22 12V7Z" fill="#2B7CD3"></path>
                <path d="M22 12H7v5l8 2 7-2v-5Z" fill="#185ABD"></path>
                <path
                  d="M22 17H7v3.177c0 .455.368.823.823.823h13.354a.822.822 0 0 0 .823-.823V17Z"
                  fill="#103F91"
                ></path>
                <path
                  opacity="0.5"
                  d="M13.963 7H7v12h6.759c.63 0 1.241-.611 1.241-1.161V8c0-.55-.467-1-1.037-1"
                ></path>
                <path
                  d="M13 18H3c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1"
                  fill="#185ABD"
                ></path>
                <path
                  d="M6.009 13.86c.021.173.034.323.04.45h.024a8.54 8.54 0 0 1 .133-.875l1.104-5.06h1.427l1.142 4.986c.057.246.105.559.143.94h.019c.016-.263.055-.566.119-.91l.913-5.016h1.299l-1.598 7.25H9.256l-1.09-4.803a13.053 13.053 0 0 1-.107-.541 6.634 6.634 0 0 1-.073-.485h-.019a16.446 16.446 0 0 1-.162 1.042l-1.023 4.787H5.241l-1.613-7.25h1.323l.994 5.07c.022.106.043.244.064.416"
                  fill="#fff"
                ></path>
              </svg>
            </span>
            <span className="flex gap-2">
              <svg
                width="16"
                height="16"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#afafaf"
                gradientcolor1="#afafaf"
                gradientcolor2="#afafaf"
              >
                <path
                  d="M21.167 3H7.82a.82.82 0 0 0-.82.82v3.17l7.5 2.194L22 6.99V3.833A.836.836 0 0 0 21.167 3"
                  fill="#41A5EE"
                ></path>
                <path d="M22 7H7v5l7.5 2.016L22 12V7Z" fill="#2B7CD3"></path>
                <path d="M22 12H7v5l8 2 7-2v-5Z" fill="#185ABD"></path>
                <path
                  d="M22 17H7v3.177c0 .455.368.823.823.823h13.354a.822.822 0 0 0 .823-.823V17Z"
                  fill="#103F91"
                ></path>
                <path
                  opacity="0.5"
                  d="M13.963 7H7v12h6.759c.63 0 1.241-.611 1.241-1.161V8c0-.55-.467-1-1.037-1"
                ></path>
                <path
                  d="M13 18H3c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1"
                  fill="#185ABD"
                ></path>
                <path
                  d="M6.009 13.86c.021.173.034.323.04.45h.024a8.54 8.54 0 0 1 .133-.875l1.104-5.06h1.427l1.142 4.986c.057.246.105.559.143.94h.019c.016-.263.055-.566.119-.91l.913-5.016h1.299l-1.598 7.25H9.256l-1.09-4.803a13.053 13.053 0 0 1-.107-.541 6.634 6.634 0 0 1-.073-.485h-.019a16.446 16.446 0 0 1-.162 1.042l-1.023 4.787H5.241l-1.613-7.25h1.323l.994 5.07c.022.106.043.244.064.416"
                  fill="#fff"
                ></path>
              </svg>

              <span>{highlightText(message?.replyTo?.content?.content, searchInputbox)}</span>
            </span>
          </>
        ) : (
          <span>{highlightText(message?.replyTo?.content?.content, searchInputbox)}</span>
        )}
      </p>
    );
  };

  return (
    <div
      className="flex justify-between rounded-lg flex-col-reverse relative"
      // style={{
      //   backgroundColor: `${message.sender === userId ? "#ccf7ff" : "#f1f1f1"}`,
      // }}
    >
      {/* <div className="flex flex-col-reverse"> */}
      <div
        className="reply-preview bg-gray-50 p-1 rounded mb-1 text-sm order-2 mx-1 my-1 cursor-pointer"
        onClick={() => {
          const originalMessage = messages.find(
            (msg) => msg._id === message.replyTo._id
          );
          console.log(
            "originalMessage",
            originalMessage,
            messages,
            message.replyTo._id
          );
          if (originalMessage) {
            const messageElement = document.getElementById(
              `message-${originalMessage._id}`
            );
            if (messageElement) {
              document.querySelectorAll(".highlight-message").forEach((el) => {
                el.classList.remove("highlight-message");
              });
              messageElement.classList.add("highlight-message");

              messageElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });

              setTimeout(() => {
                messageElement.classList.remove("highlight-message");
              }, 2000);
            }
          }
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-600">
            <SlActionUndo />
          </p>
          <div className="flex">
            <p className="text-blue-600 font-medium">
              {
                allUsers.find((user) => user._id === message.replyTo.sender)
                  ?.userName
              }
            </p>
            <p className="text-gray-600 ml-2">
              {new Date(message.replyTo.createdAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                hour12: false,
              })}
            </p>
          </div>
        </div>
        {getReplyContent()}
      </div>
      <p className="p-2">{highlightText(message.content.content, searchInputbox)}</p>
      {/* </div> */}
    </div>
  );
};

const MessageReactions = ({
  message,
  userId,
  showEmojiPicker,
  setShowEmojiPicker,
  addMessageReaction,
  allUsers,
}) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showEmojiPicker?.messageId &&
        !event.target.closest(".EmojiPickerReact") && 
        !event.target.closest(".emoji-trigger-button")
      ) {
        setShowEmojiPicker(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);
  return (
    <>
      {message.sender !== userId && (
        <>
          <div className="relative">
            <button
              className="hover:scale-125 transition-transform absolute -right-6 -top-0 text-gray-400"
              onClick={(e) => {
                e.stopPropagation();

                const messageElement = document.getElementById(
                  `message-${message._id}`
                );
                const messageRect = messageElement.getBoundingClientRect();
                const windowHeight = window.innerHeight;

                const isInBottomHalf = messageRect.top > windowHeight / 2;

                setShowEmojiPicker({
                  messageId: message._id,
                  position: isInBottomHalf ? "top" : "bottom",
                });
              }}
            >
              <FaRegSmile />
            </button>
            {showEmojiPicker?.messageId === message._id && (
              <div
                className="absolute z-50"
                style={{
                  right: "calc(-290px + 24px)",
                  ...(showEmojiPicker.position === "top"
                    ? { bottom: "24px" }
                    : { top: "24px" }),
                }}
                onMouseLeave={() => setShowEmojiPicker(null)}
              >
                <EmojiPicker
                  onEmojiClick={(event) => {
                    addMessageReaction(message, event.emoji);
                    setShowEmojiPicker(null);
                  }}
                  width={250}
                  height={300}
                  searchDisabled
                  skinTonesDisabled
                  previewConfig={{
                    showPreview: false,
                  }}
                  theme="light"
                  emojiSize={20}
                  emojiStyle="facebook"
                  emojiSet="facebook"
                  lazyLoadEmojis={true}
                />
              </div>
            )}
          </div>
        </>
      )}
      {message.reactions && message.reactions.length > 0 && (
        <div className="absolute -bottom-4 left-1 flex space-x-1">
          {message.reactions.map((reaction, index) => (
            <div
              key={index}
              className="z-40 bg-white rounded-full p-1 w-6 h-6 flex items-center justify-center shadow-md shadow-gray-400"
              title={allUsers.find((u) => u._id === reaction.userId)?.userName}
            >
              <img
                src={`https://cdn.jsdelivr.net/npm/emoji-datasource-facebook/img/facebook/64/${reaction.emoji
                  .codePointAt(0)
                  .toString(16)}.png`}
                alt={reaction.emoji}
                className="w-4 h-4"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.innerHTML = reaction.emoji;
                }}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const MessageContextMenu = ({
  message,
  contextMenu,
  handleEditMessage,
  handleDeleteMessage,
  handleCopyMessage,
  handleReplyMessage,
  handleForwardMessage,
  setContextMenu,
  setActiveMessageId,
  dropdownRef,
  userId,
}) => {
  const getMenuPosition = () => {
    if (!contextMenu.visible) return {};

    const menuWidth = 112; // w-28 = 7rem = 112px
    const menuHeight = 200; // Approximate max height of menu
    const screenPadding = 10; // Minimum padding from screen edges

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = contextMenu.x;
    let y = contextMenu.y;

    // Check horizontal overflow
    if (x + menuWidth > viewportWidth - screenPadding) {
      x = viewportWidth - menuWidth - screenPadding;
    } else if (x < screenPadding) {
      x = screenPadding;
    }

    // Check vertical overflow
    if (y + menuHeight > viewportHeight - screenPadding) {
      y = y - menuHeight; // Show menu above the click position
    }

    return {
      top: `${y}px`,
      left: `${x}px`,
      transform: "translate(-50%, 0)",
    };
  };

  return (
    <>
      {contextMenu.visible && contextMenu.messageId === message._id && (
        <div
          className="fixed bg-white border rounded shadow-lg z-[1000]"
          style={getMenuPosition()}
          onClick={(e) => e.stopPropagation()}
        >
          {!message.content?.fileType?.includes("image/") &&
            !message.content?.fileType?.includes("audio/") &&
            message.receiver !== userId && (
              <>
                <button
                  className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleEditMessage(contextMenu.message);
                  }}
                >
                  <MdOutlineModeEdit className="mr-2" /> Edit
                </button>
                <button
                  className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
                  onClick={() => handleDeleteMessage(message._id)}
                >
                  <CiSquareRemove className="mr-2" /> Remove
                </button>
                
              </>
            )}
          {!message.content?.fileType?.includes("audio/") && (
            <button
              className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
              onClick={() => {
                handleCopyMessage(message.content, () =>
                  setActiveMessageId(null)
                );
                setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
              }}
            >
              <VscCopy className="mr-2" /> Copy
            </button>
          )}
          <button
            className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
            onClick={() => {
              handleReplyMessage(message);
              setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
            }}
          >
            <BiReply className="mr-2" /> Reply
          </button>
          <button
            className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
            onClick={() => handleForwardMessage(message)}
          >
            <BiShare className="mr-2" /> Forward
          </button>

          {message.content?.fileType?.includes("audio/") && (
            <button
            className="w-28 px-4 py-2 text-left text-black flex items-center hover:bg-gray-100"
            onClick={() => handleDeleteMessage(message._id)}
          >
            <CiSquareRemove className="mr-2" /> Remove
          </button>
          )}
        </div>
      )}
    </>
  );
};

const RegularMessage = ({
  message,
  userId,
  showTime,
  name,
  currentTime,
  isConsecutive,
  handleContextMenu,
  handleDropdownToggle,
  handleEditMessage,
  handleDeleteMessage,
  handleCopyMessage,
  handleReplyMessage,
  handleForwardMessage,
  handleImageClick,
  highlightText,
  searchInputbox,
  activeMessageId,
  contextMenu,
  setContextMenu,
  setActiveMessageId,
  allUsers,
  IMG_URL,
  showEmojiPicker,
  setShowEmojiPicker,
  addMessageReaction,
  dropdownRef,
  selectedChat,
  messages,
}) => {

  const messageContent = message?.content?.content; 
  const isSingleEmoji = messageContent?.match(/^\p{Emoji}$/gu);

  return (
    <div
      key={message._id}
      id={`message-${message._id}`}
      className={`flex relative ${
        message.sender === userId
          ? "justify-end items-end"
          : "justify-start items-start"
      }  message-content 
    ${
      message.reactions && message.reactions.length > 0
        ? "mb-8"
        : `${isConsecutive ? "mb-1" : "mb-4"}`
    }
    ${showTime ? "mt-3" : ""}`}
    >
      <div
        className="flex flex-col relative group"
        onContextMenu={(e) => handleContextMenu(e, message)}
      >
        <div className="flex justify-between items-center pr-7">
          <div>
            {message?.forwardedFrom && (
              <div className="forwarded-label text-gray-500 text-sm mb-1">
                <BiShare className="inline mr-1" />
              </div>
            )}
          </div>

          {showTime && (
            <div
              className={`text-xs text-gray-500 bg-white text-right order-1 ${
                message.sender === userId ? "text-right" : "text-start"
              }`}
            >
              {selectedChat?.members && message.sender !== userId
                ? `${name},`
                : ""}{" "}
              {currentTime}
            </div>
          )}
        </div>

        <div className="flex">
          <div
            className={`p-2 relative ${ isSingleEmoji ? 'bg-transparent' :
              message.sender === userId
                ? "bg-[#CCF7FF] rounded-s-lg"
                : "bg-[#F1F1F1] rounded-e-lg "
            }
    ${showTime ? " rounded-tr-lg rounded-tl-lg" : ""}
    ${message.reactions && message.reactions.length > 0 ? "pb-4" : ""}
    `}
          >
            <MessageContent
              message={message}
              userId={userId}
              handleImageClick={handleImageClick}
              highlightText={highlightText}
              searchInputbox={searchInputbox}
              IMG_URL={IMG_URL}
              messages={messages}
              allUsers={allUsers}
            />

            {message.edited && (
              <div
                className={`absolute bottom-0 ${
                  message.sender === userId ? "-left-5" : "-right-5"
                } flex items-center text-xs text-gray-500 mt-1`}
              >
                <FiEdit2 className="w-4 h-4" />
              </div>
            )}

            {/* Add three dots icon */}
            <div
              className={`absolute ${
                message.sender === userId ? "-right-4" : "-left-4"
              } top-0 opacity-0 group-hover:opacity-100 cursor-pointer`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();

                const x =
                  message.sender === userId
                    ? rect.x  + 200 // For right-aligned messages
                    : rect.x + 70; // For left-aligned messages

                setContextMenu({
                  visible: true,
                  x: x,
                  y: rect.y + rect.height,
                  messageId: message._id,
                  message: message,
                });
              }}
            >
              <PiDotsThreeVerticalBold className="text-gray-700 hover:text-gray-900" />
            </div>
          </div>
          {message.sender === userId && (
            <MessageStatus message={message} userId={userId} />
          )}

          {!isSingleEmoji && (
            <MessageReactions
              message={message}
              userId={userId}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              addMessageReaction={addMessageReaction}
            allUsers={allUsers}
          />
          )}
        </div>

        {/* {console.log("contextMenu", contextMenu)} */}

        <MessageContextMenu
          message={message}
          contextMenu={contextMenu}
          handleEditMessage={handleEditMessage}
          handleDeleteMessage={handleDeleteMessage}
          handleCopyMessage={handleCopyMessage}
          handleReplyMessage={handleReplyMessage}
          handleForwardMessage={handleForwardMessage}
          setContextMenu={setContextMenu}
          setActiveMessageId={setActiveMessageId}
          dropdownRef={dropdownRef}
          userId={userId}
        />
      </div>
    </div>
  );
};

const EmptyMessages = () => (
  <div className="h-full flex items-center justify-center text-gray-500">
    No messages yet
  </div>
);

export default MessageList;
