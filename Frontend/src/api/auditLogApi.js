import axios from 'axios';
import { BASE_URL, authHeaders, tokenFromStorage } from './client';

export const getAuditLogs = async (token = tokenFromStorage(), params = {}) => {
    const result = await axios.get(`${BASE_URL}audit-logs`, {
        headers: authHeaders(token),
        params,
    });
    return result.data;
};
