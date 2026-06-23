import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChatMessages, postChatMessage } from '../../../api/chatApi';
import { getApiError } from '../../../api/client';
import { socket } from '../../../utils/chatSocket';

export const useGroupChat = (user) => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const messagesEndRef = useRef(null);
    const emojiPickerRef = useRef(null);

    useEffect(() => {
        if (!user?.token) {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!user?.token) return undefined;

        let cancelled = false;
        setLoading(true);

        getChatMessages(user.token, { limit: 50 })
            .then((data) => {
                if (!cancelled) {
                    setMessages(data);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(getApiError(err, 'Failed to load chat messages'));
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [user]);

    useEffect(() => {
        const handler = (msg) => setMessages((prev) => [...prev, msg]);
        socket.on('chat:newMessage', handler);
        return () => socket.off('chat:newMessage', handler);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                const emojiButton = event.target.closest('button[title="Add emoji"]');
                if (!emojiButton) {
                    setShowEmojiPicker(false);
                }
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker]);

    const handleSend = useCallback(async (e) => {
        e.preventDefault();
        if (!input.trim() || !user?.token) return;

        setSending(true);
        setError('');

        try {
            await postChatMessage(user.token, {
                text: input.trim(),
                replyTo: replyingTo?._id || null,
            });
            setInput('');
            setReplyingTo(null);
        } catch (err) {
            setError(getApiError(err, 'Failed to send message'));
        } finally {
            setSending(false);
        }
    }, [input, user, replyingTo]);

    const handleMessageClick = useCallback((msg) => {
        setReplyingTo(msg);
        document.querySelector('.chat-input-bar input')?.focus();
    }, []);

    const cancelReply = useCallback(() => setReplyingTo(null), []);

    const onEmojiClick = useCallback((emojiData) => {
        setInput((prev) => prev + emojiData.emoji);
    }, []);

    return {
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
    };
};
