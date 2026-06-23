import { formatChatSenderLine, formatChatTime, isOwnChatMessage } from './chatUtils';

const ChatMessageBubble = ({ msg, user, onMessageClick }) => {
    const mine = isOwnChatMessage(msg, user);

    return (
        <div className={`chat-message-row ${mine ? 'mine' : 'theirs'}`}>
            <div
                className={`chat-message-bubble ${mine ? 'mine' : 'theirs'}`}
                onClick={() => onMessageClick(msg)}
            >
                {msg.replyTo && (
                    <div className={`chat-reply-preview ${mine ? 'mine' : 'theirs'}`}>
                        <div className="chat-reply-preview__sender">
                            {msg.replyTo.senderName || 'Unknown'}
                        </div>
                        <div className="chat-reply-preview__text">{msg.replyTo.text}</div>
                    </div>
                )}
                <div className="chat-message-header">{formatChatSenderLine(msg)}</div>
                <div className="chat-message-text">{msg.text}</div>
                <div className="chat-message-time">{formatChatTime(msg.createdAt)}</div>
            </div>
        </div>
    );
};

export default ChatMessageBubble;
