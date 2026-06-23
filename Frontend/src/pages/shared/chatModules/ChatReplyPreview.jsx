import { useTranslation } from 'react-i18next';

const ChatReplyPreview = ({ replyingTo, onCancel }) => {
    const { t } = useTranslation();

    if (!replyingTo) return null;

    return (
        <div className="chat-reply-bar">
            <div className="chat-reply-bar__content">
                <div className="chat-reply-bar__label">
                    {t('valet.replyingTo')} {replyingTo.senderName || 'Unknown'}
                </div>
                <div className="chat-reply-bar__text">{replyingTo.text}</div>
            </div>
            <button type="button" className="chat-reply-bar__cancel" onClick={onCancel} title="Cancel reply">
                ×
            </button>
        </div>
    );
};

export default ChatReplyPreview;
