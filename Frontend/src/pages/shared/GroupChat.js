import React from 'react';
import { useCurrentUser } from '../../hooks/useAuth';
import chatBack from '../../assets/chatBack.jpg';
import {
    ChatInputBar,
    ChatMessageList,
    ChatReplyPreview,
    useGroupChat,
} from './chatModules';
import '../../styles/reports.scss';
import '../../styles/groupChat.scss';

const GroupChat = () => {
    const user = useCurrentUser();
    const {
        messages,
        input,
        setInput,
        loading,
        sending,
        error,
        replyingTo,
        showEmojiPicker,
        setShowEmojiPicker,
        isMobile,
        messagesEndRef,
        emojiPickerRef,
        handleSend,
        handleMessageClick,
        cancelReply,
        onEmojiClick,
    } = useGroupChat(user);

    return (
        <div className={`reports-container ${isMobile ? 'chat-mobile' : ''}`}>
            <div className="reports-content">
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="chat-container">
                    <ChatMessageList
                        messages={messages}
                        user={user}
                        loading={loading}
                        messagesEndRef={messagesEndRef}
                        onMessageClick={handleMessageClick}
                        chatBackground={chatBack}
                    />

                    <ChatReplyPreview replyingTo={replyingTo} onCancel={cancelReply} />

                    <ChatInputBar
                        input={input}
                        setInput={setInput}
                        sending={sending}
                        replyingTo={replyingTo}
                        showEmojiPicker={showEmojiPicker}
                        setShowEmojiPicker={setShowEmojiPicker}
                        isMobile={isMobile}
                        emojiPickerRef={emojiPickerRef}
                        onSend={handleSend}
                        onEmojiClick={onEmojiClick}
                    />
                </div>
            </div>
        </div>
    );
};

export default GroupChat;
