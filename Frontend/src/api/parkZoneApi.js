import axios from 'axios';
import { BASE_URL, authHeaders, getApiError } from './client';

export const getParkZones = async (token) => {
    try {
        const { data } = await axios.get(`${BASE_URL}parkZone`, {
            headers: authHeaders(token),
        });
        return data?.zones || [];
    } catch (error) {
        throw getApiError(error);
    }
};

export const createParkZone = async (body, token) => {
    try {
        const { data } = await axios.post(`${BASE_URL}parkZone`, body, {
            headers: authHeaders(token),
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const updateParkZone = async (id, body, token) => {
    try {
        const { data } = await axios.put(`${BASE_URL}parkZone/${id}`, body, {
            headers: authHeaders(token),
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};

export const deleteParkZone = async (id, token) => {
    try {
        const { data } = await axios.delete(`${BASE_URL}parkZone/${id}`, {
            headers: authHeaders(token),
        });
        return data;
    } catch (error) {
        throw getApiError(error);
    }
};
