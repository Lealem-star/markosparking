import axios from 'axios';
import { BASE_URL, authHeaders, buildQuery } from './client';

export const getParkedCars = async (token, { status, date } = {}) => {
    const query = buildQuery({ status, date });
    const result = await axios.get(`${BASE_URL}parkedCar${query}`, { headers: authHeaders(token) });
    return result?.data || [];
};

export const createParkedCarRecord = async (body, token) => {
    const result = await axios.post(`${BASE_URL}parkedCar`, { ...body }, { headers: authHeaders(token) });
    if (!result?.data?.car) {
        throw new Error('Failed to register car');
    }
    return result.data;
};

export const updateParkedCarRecord = async (id, body, token) => {
    const result = await axios.put(`${BASE_URL}parkedCar/${id}`, { ...body }, { headers: authHeaders(token) });
    if (!result?.data?.car) {
        throw new Error('Failed to update parked car');
    }
    return result.data;
};

export const deleteParkedCarRecord = async (id, token) => {
    const result = await axios.delete(`${BASE_URL}parkedCar/${id}`, { headers: authHeaders(token) });
    if (!result?.data?.message) {
        throw new Error('Failed to delete parked car');
    }
    return result.data;
};

export const flagParkedCarRecord = async (id, { baseAmount, vatAmount, totalWithVat }, token) => {
    const result = await axios.put(
        `${BASE_URL}parkedCar/${id}/flag`,
        { baseAmount, vatAmount, totalWithVat },
        {
            headers: {
                ...authHeaders(token),
                'Content-Type': 'application/json',
            },
        }
    );
    if (!result?.data?.car) {
        throw new Error('Failed to flag car');
    }
    return result.data;
};

export const getFlaggedCars = async (token) => {
    const result = await axios.get(`${BASE_URL}parkedCar/flagged`, { headers: authHeaders(token) });
    return result?.data || [];
};

export const notifyFlaggedCustomerRecord = async (id, token) => {
    const result = await axios.post(`${BASE_URL}parkedCar/${id}/notify`, {}, {
        headers: {
            ...authHeaders(token),
            'Content-Type': 'application/json',
        },
    });
    if (!result?.data?.message) {
        throw new Error('Failed to send notification');
    }
    return result.data;
};

export const getDailyStats = async (token, date) => {
    const query = buildQuery({ date });
    const response = await axios.get(`${BASE_URL}parkedCar/stats/daily${query}`, { headers: authHeaders(token) });
    return response.data || {
        totalParked: 0,
        checkedOut: 0,
        stillParked: 0,
        manualPayments: 0,
        onlinePayments: 0,
    };
};

export const getDailyStatsHistory = async (token, limit = 10) => {
    const response = await axios.get(`${BASE_URL}parkedCar/stats/daily/history?limit=${limit}`, {
        headers: authHeaders(token),
    });
    return response.data || [];
};
