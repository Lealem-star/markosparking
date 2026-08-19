import axios from 'axios';
import { BASE_URL, authHeaders, tokenFromStorage } from './client';

export const getAttendanceSession = async (
    token = tokenFromStorage(),
    { date, session } = {}
) => {
    const params = {};
    if (date) params.date = date;
    if (session) params.session = session;

    const result = await axios.get(`${BASE_URL}attendance`, {
        headers: authHeaders(token),
        params,
    });
    return result.data;
};

export const getAttendancePeriodReport = async (
    token = tokenFromStorage(),
    { startDate, endDate, session, zone } = {}
) => {
    const params = { startDate, endDate };
    if (session) params.session = session;
    if (zone) params.zone = zone;

    const result = await axios.get(`${BASE_URL}attendance/report`, {
        headers: authHeaders(token),
        params,
    });
    return result.data;
};

export const updateAttendanceStatus = async (
    officerId,
    { dateKey, session, status },
    token = tokenFromStorage()
) => {
    const result = await axios.put(
        `${BASE_URL}attendance/officer/${officerId}/status`,
        { dateKey, session, status },
        { headers: authHeaders(token) }
    );
    return result.data;
};

export const finishAttendanceSession = async (
    { dateKey, session, markRemainingAbsent },
    token = tokenFromStorage()
) => {
    const result = await axios.post(
        `${BASE_URL}attendance/finish`,
        { dateKey, session, markRemainingAbsent },
        { headers: authHeaders(token) }
    );
    return result.data;
};
