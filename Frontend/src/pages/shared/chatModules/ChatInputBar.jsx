import EmojiPicker from 'emoji-picker-react';
import { Paperclip, Smile, Mic, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ChatInputBar = ({
    input,
    setInput,
    sending,
    replyingTo,
    showEmojiPicker,
    setShowEmojiPicker,
    isMobile,
    emojiPickerRef,
    onSend,
    onEmojiClick,
}) => {
    const { t } = useTranslation();

    return (
        <div className="chat-input-wrapper">
            {showEmojiPicker && (
                <div ref={emojiPickerRef} className="chat-emoji-picker">
                    <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        width={isMobile ? 280 : 350}
                        height={isMobile ? 320 : 400}
                        previewConfig={{ showPreview: false }}
                        searchPlaceHolder="Search"
                        theme="light"
                    />
                </div>
            )}

            <form onSubmit={onSend} className="chat-input-bar">
                <button type="button" className="chat-icon-btn" title={t('valet.attachFile')}>
                    <Paperclip size={isMobile ? 18 : 20} />
                </button>

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                        replyingTo
                            ? `${t('valet.replyingTo')} ${replyingTo.senderName}...`
                            : t('valet.writeMessage')
                    }
                />

                <button
                    type="button"
                    className={`chat-icon-btn ${showEmojiPicker ? 'active' : ''}`}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title={t('valet.addEmoji')}
                >
                    <Smile size={isMobile ? 18 : 20} />
                </button>

                {input.trim() ? (
                    <button type="submit" className="chat-send-btn" disabled={sending} title={t('valet.sendMessage')}>
                        {sending ? <span className="chat-send-spinner" /> : <Send size={isMobile ? 16 : 18} />}
                    </button>
                ) : (
                    <button type="button" className="chat-icon-btn" title={t('valet.voiceMessage')}>
                        <Mic size={isMobile ? 18 : 20} />
                    </button>
                )}
            </form>
        </div>
    );
};

export default ChatInputBar;
