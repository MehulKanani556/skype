import EmojiPicker from "emoji-picker-react";
import { FaMicrophone, FaPaperclip, FaPlusCircle, FaRegSmile } from "react-icons/fa";
import { LuSendHorizontal } from "react-icons/lu";

const MessageInputForm = ({
    handleSubmit,
    messageInput,
    handleInputChange,
    editingMessage,
    setEditingMessage,
    selectedFiles,
    setSelectedFiles,
    handleMultipleFileUpload,
    handleVoiceMessage,
    isEmojiPickerOpen,
    setIsEmojiPickerOpen,
    emojiPickerRef,
    onEmojiClick,
    inputRef,
    isRecording,
    setMessageInput,
}) => {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 rounded-lg ">
        <form
          onSubmit={handleSubmit}
          className={`flex items-center gap-2 rounded-${editingMessage ? "b-" : ""}xl px-4 py-2 shadow w-full max-w-full`}
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
            <input
              ref={inputRef}
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder={editingMessage ? "Edit message..." : "Type a message"}
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
              <FaMicrophone
                className={`w-5 h-5 ${isRecording ? "text-red-500" : "text-gray-500"}`}
              />
            </button>
            {(messageInput !== "" || selectedFiles.length > 0) && (
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
    );
  };

  export default MessageInputForm;