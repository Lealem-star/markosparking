import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../utils/chatSocket';

export const useChatUnread = (chatPath) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const handleNewMessage = () => {
            if (location.pathname === chatPath) return;
            setUnreadCount((prev) => prev + 1);
        };
        socket.on('chat:newMessage', handleNewMessage);
        return () => {
            socket.off('chat:newMessage', handleNewMessage);
        };
    }, [location.pathname, chatPath]);

    const openChat = () => {
        navigate(chatPath);
        setUnreadCount(0);
    };

    return { unreadCount, openChat };
};
