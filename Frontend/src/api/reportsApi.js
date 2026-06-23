import axios from 'axios';
import { BASE_URL, authHeaders, buildQuery } from './client';

const getReport = async (token, path, params = {}) => {
    const query = buildQuery(params);
    const response = await axios.get(`${BASE_URL}reports/${path}${query}`, { headers: authHeaders(token) });
    return response.data;
};

export const getPeriodRevenueReport = (token, { startDate, endDate, period } = {}) =>
    getReport(token, 'financial/period', { startDate, endDate, period });

export const getVehicleHistoryReport = (token, { licensePlate, phoneNumber } = {}) =>
    getReport(token, 'customer/vehicle-history', { licensePlate, phoneNumber });

export const getUsersReport = (token) =>
    getReport(token, 'administrative/users');

export const getDailyRevenueReport = (token, { date } = {}) =>
    getReport(token, 'financial/daily', { date });

export const getPlateCodeRevenueReport = (token, { startDate, endDate } = {}) =>
    getReport(token, 'financial/plate-code', { startDate, endDate });

export const getPaymentMethodsReport = (token, { startDate, endDate } = {}) =>
    getReport(token, 'financial/payment-methods', { startDate, endDate });

export const getActivityReport = (token, { startDate, endDate } = {}) =>
    getReport(token, 'operational/activity', { startDate, endDate });

export const getDurationReport = (token, { startDate, endDate } = {}) =>
    getReport(token, 'operational/duration', { startDate, endDate });

export const getLocationReport = (token, { startDate, endDate } = {}) =>
    getReport(token, 'operational/location', { startDate, endDate });

export const getPeakHoursReport = (token, { startDate, endDate } = {}) =>
    getReport(token, 'operational/peak-hours', { startDate, endDate });

export const getPlateCodeDistributionReport = (token, { startDate, endDate } = {}) =>
    getReport(token, 'operational/plate-code-distribution', { startDate, endDate });

export const getCustomerActivityReport = (token, { startDate, endDate, minVisits } = {}) =>
    getReport(token, 'customer/activity', { startDate, endDate, minVisits });

export const getValetPerformanceReport = (token, { startDate, endDate } = {}) =>
    getReport(token, 'administrative/valet-performance', { startDate, endDate });

export const getTransactionsReport = (token, { startDate, endDate, paymentMethod } = {}) =>
    getReport(token, 'compliance/transactions', { startDate, endDate, paymentMethod });

export const getSystemActivityReport = (token, { startDate, endDate } = {}) =>
    getReport(token, 'compliance/system-activity', { startDate, endDate });
