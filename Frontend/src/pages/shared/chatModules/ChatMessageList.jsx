import { useTranslation } from 'react-i18next';
import ChatMessageBubble from './ChatMessageBubble';

const ChatMessageList = ({
    messages,
    user,
    loading,
    messagesEndRef,
    onMessageClick,
    chatBackground,
}) => {
    const { t } = useTranslation();

    return (
        <div
            className="chat-messages"
            style={{
                backgroundImage: chatBackground ? `url(${chatBackground})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            {loading ? (
                <div className="loading">{t('valet.loadingMessages')}</div>
            ) : messages.length === 0 ? (
                <div className="no-data">{t('valet.noMessagesYet')}</div>
            ) : (
                messages.map((msg) => (
                    <ChatMessageBubble
                        key={msg._id}
                        msg={msg}
                        user={user}
                        onMessageClick={onMessageClick}
                    />
                ))
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatMessageList;
