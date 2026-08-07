import axios from 'axios';
import { BASE_URL, authHeaders, buildQuery } from './client';

export const getShiftReconciliationPreview = async (token, { date, session, parkZoneCode }) => {
    const query = buildQuery({ date, session, parkZoneCode });
    const result = await axios.get(`${BASE_URL}shift-reconciliations/preview${query}`, {
        headers: authHeaders(token),
    });
    return result.data;
};

export const submitShiftReconciliation = async (body, token) => {
    const result = await axios.post(`${BASE_URL}shift-reconciliations`, body, {
        headers: {
            ...authHeaders(token),
            'Content-Type': 'application/json',
        },
    });
    return result.data;
};

export const getShiftReconciliations = async (token, filters = {}) => {
    const query = buildQuery({
        status: filters.status,
        zone: filters.zone,
        date: filters.date,
        session: filters.session,
        page: filters.page,
        limit: filters.limit,
    });
    const result = await axios.get(`${BASE_URL}shift-reconciliations${query}`, {
        headers: authHeaders(token),
    });
    return result.data || { items: [], total: 0, page: 1, limit: 50, totalPages: 1 };
};

export const reviewShiftReconciliation = async (id, body, token) => {
    const result = await axios.patch(`${BASE_URL}shift-reconciliations/${id}/review`, body, {
        headers: {
            ...authHeaders(token),
            'Content-Type': 'application/json',
        },
    });
    return result.data;
};
