import { io } from 'socket.io-client';
import { BASE_URL } from '../api/client';

// Create a single shared Socket.IO client
export const socket = io(BASE_URL, {
    withCredentials: true,
    autoConnect: true,
});

// Optional helper to subscribe to new chat messages
export const subscribeToNewMessages = (handler) => {
    if (!socket) return;
    socket.on('chat:newMessage', handler);
    return () => {
        socket.off('chat:newMessage', handler);
    };
};


