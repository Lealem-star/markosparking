import { API_BASE_URL_RAW } from '../config/env';

const BASE_URL_RAW = API_BASE_URL_RAW;
export const BASE_URL = BASE_URL_RAW.endsWith('/') ? BASE_URL_RAW : `${BASE_URL_RAW}/`;

export const authHeaders = (token) => {
    const headers = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
};

export const tokenFromStorage = () => localStorage.getItem('token');

export const buildQuery = (params) => {
    const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
    return entries.length ? `?${entries.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')}` : '';
};

export const getApiError = (error, fallback = 'Request failed') =>
    error?.response?.data?.error || error?.message || fallback;
