import axios from 'axios';
import { BASE_URL, authHeaders, buildQuery } from './client';

export const getChatMessages = async (token, { limit = 50, before } = {}) => {
    const query = buildQuery({ limit, before });
    const response = await axios.get(`${BASE_URL}chat/messages${query}`, { headers: authHeaders(token) });
    return Array.isArray(response.data) ? response.data : [];
};

export const postChatMessage = async (token, { text, replyTo }) => {
    const body = { text };
    if (replyTo) body.replyTo = replyTo;

    const response = await axios.post(`${BASE_URL}chat/messages`, body, {
        headers: {
            ...authHeaders(token),
            'Content-Type': 'application/json',
        },
    });
    return response.data;
};
