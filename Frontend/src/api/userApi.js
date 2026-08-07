import axios from 'axios';
import { BASE_URL, authHeaders, tokenFromStorage } from './client';

export const loginUser = async ({ phoneNumber, password }) => {
    const result = await axios.post(`${BASE_URL}user/login`, { phoneNumber, password });
    if (!result?.data?.token) {
        throw new Error('Failed to login');
    }
    return result.data;
};

export const registerUser = async ({ name, email, password, type }) => {
    const result = await axios.post(`${BASE_URL}user/register`, { name, email, password, type });
    if (!result?.data?.name) {
        throw new Error('Registration failed');
    }
    return result.data;
};

export const resetUserPassword = async (userId, body, token = tokenFromStorage()) => {
    const result = await axios.post(
        `${BASE_URL}user/resetPassword/${userId}`,
        { ...body },
        { headers: authHeaders(token) }
    );
    if (!result?.data?.user) {
        throw new Error('Failed to reset password');
    }
    return result.data;
};

export const updateUserRecord = async (userId, body, token) => {
    const result = await axios.put(`${BASE_URL}user/${userId}`, { ...body }, { headers: authHeaders(token) });
    if (!result?.data?.user) {
        throw new Error('Failed to update user');
    }
    return result.data;
};

export const uploadUserProfilePhoto = async (userId, file, token = tokenFromStorage()) => {
    const formData = new FormData();
    formData.append('profilePhoto', file);

    const result = await axios.post(`${BASE_URL}user/${userId}/upload-photo`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            ...authHeaders(token),
        },
    });

    if (!result?.data?.user) {
        throw new Error('Failed to upload profile photo');
    }
    return result.data;
};

export const getUsers = async (token = tokenFromStorage()) => {
    const result = await axios.get(`${BASE_URL}user`, { headers: authHeaders(token) });
    return Array.isArray(result?.data) ? result.data : [];
};

export const getCurrentUserProfile = async (token = tokenFromStorage()) => {
    const result = await axios.get(`${BASE_URL}user/me`, { headers: authHeaders(token) });
    if (!result?.data?.user) {
        throw new Error('Failed to load profile');
    }
    return result.data.user;
};

export const deactivateUserRecord = async (id, token) => {
    const result = await axios.delete(`${BASE_URL}user/delete/${id}`, { headers: authHeaders(token) });
    if (!result?.data?.message) {
        throw new Error('Failed to deactivate user');
    }
    return result.data;
};

export const createUserRecord = async (body, token) => {
    try {
        const result = await axios.post(`${BASE_URL}user/create`, { ...body }, { headers: authHeaders(token) });
        if (!result?.data?.user) {
            throw new Error('Failed to create user');
        }
        return result.data;
    } catch (error) {
        const status = error?.response?.status;
        if (status === 403) {
            throw new Error('Access denied: you do not have permission to create users.');
        }
        if (status === 401) {
            throw new Error('Session expired. Please log in again.');
        }
        throw error;
    }
};
