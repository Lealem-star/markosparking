import axios from 'axios';
import { BASE_URL, authHeaders, tokenFromStorage } from './client';

export const getIncidents = async (token = tokenFromStorage(), params = {}) => {
    const result = await axios.get(`${BASE_URL}incidents`, {
        headers: authHeaders(token),
        params,
    });
    return result.data;
};

export const createIncident = async (body, token = tokenFromStorage()) => {
    const result = await axios.post(`${BASE_URL}incidents`, body, {
        headers: authHeaders(token),
    });
    return result.data;
};

export const assignIncident = async (incidentId, body, token = tokenFromStorage()) => {
    const result = await axios.patch(
        `${BASE_URL}incidents/${incidentId}/assign`,
        body,
        { headers: authHeaders(token) }
    );
    return result.data;
};

export const resolveIncident = async (incidentId, body, token = tokenFromStorage()) => {
    const result = await axios.patch(
        `${BASE_URL}incidents/${incidentId}/resolve`,
        body,
        { headers: authHeaders(token) }
    );
    return result.data;
};
