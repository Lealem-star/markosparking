import axios from 'axios';
import { BASE_URL, authHeaders, getApiError } from './client';

/** Chapa server callback — creates/updates payment records; no frontend redirect needed. */
export const CHAPA_BACKEND_CALLBACK_URL = `${BASE_URL}payment/chapa/callback`;

const postPaymentWithRetry = async (url, body, token) => {
    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
            const result = await axios.post(url, body, {
                headers: {
                    ...authHeaders(token),
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });

            if (result?.data?.success) {
                return result.data;
            }

            throw new Error(result?.data?.error || 'Payment initialization failed');
        } catch (error) {
            const isNetworkError = !error.response && (
                error.code === 'ECONNABORTED'
                || error.code === 'ERR_NETWORK'
                || error.message?.includes('timeout')
            );
            const isServerError = error.response?.status >= 500;

            if ((isNetworkError || isServerError) && attempt < maxRetries) {
                // eslint-disable-next-line no-await-in-loop
                await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
                continue;
            }

            if (error?.response?.data?.error) {
                const apiError = error.response.data.error;
                throw new Error(typeof apiError === 'string' ? apiError : JSON.stringify(apiError));
            }

            throw new Error(getApiError(error, 'Payment service is temporarily unavailable. Please try again.'));
        }
    }

    throw new Error('Payment service is temporarily unavailable. Please try again.');
};

export const initChapaPayment = async ({
    carId,
    amount,
    customerName,
    customerEmail,
    customerPhone,
}, token) =>
    postPaymentWithRetry(
        `${BASE_URL}payment/chapa/initialize`,
        { carId, amount, customerName, customerEmail, customerPhone },
        token
    );

export const initPackagePayment = async ({
    amount,
    packageDuration,
    customerPhone,
    carData,
}, token) =>
    postPaymentWithRetry(
        `${BASE_URL}payment/chapa/initialize-package`,
        { amount, packageDuration, customerPhone, serviceType: 'package', carData },
        token
    );

export const verifyChapaPaymentTx = async (txRef, token, carId) => {
    const url = carId
        ? `${BASE_URL}payment/chapa/verify/${txRef}?carId=${carId}`
        : `${BASE_URL}payment/chapa/verify/${txRef}`;
    const result = await axios.get(url, { headers: authHeaders(token) });

    if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to verify payment');
    }

    return result.data;
};

export const verifyChapaPackagePaymentTx = async (txRef, token) => {
    const result = await axios.get(`${BASE_URL}payment/chapa/verify-package/${txRef}`, {
        headers: authHeaders(token),
    });

    if (!result?.data?.success) {
        throw new Error(result?.data?.error || 'Failed to verify package payment');
    }

    return result.data;
};

export const getPricingSettings = async () => {
    const response = await axios.get(`${BASE_URL}pricingSettings`);
    return response.data || {};
};

export const savePricingSettings = async (settings, token) => {
    const response = await axios.put(
        `${BASE_URL}pricingSettings`,
        { settings },
        { headers: authHeaders(token) }
    );
    return response.data;
};

export const sendSms = async (phoneNumber, message, token) => {
    const result = await axios.post(
        `${BASE_URL}sms/send`,
        { phoneNumber, message },
        { headers: authHeaders(token) }
    );

    if (!result?.data?.success) {
        throw new Error(result?.data?.message || 'Failed to send SMS');
    }

    return result.data;
};
