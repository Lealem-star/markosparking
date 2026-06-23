const axios = require('axios');
const { CHAPA_SECRET_KEY, CHAPA_PUBLIC_KEY } = require('../config/env');

const CHAPA_BASE_URL = 'https://api.chapa.co/v1/transaction';

if (!CHAPA_PUBLIC_KEY) {
    console.warn('⚠️  WARNING: CHAPA_PUBLIC_KEY is not set in environment variables!');
    console.warn('⚠️  Payment initialization will fail. Please set CHAPA_PUBLIC_KEY in your .env file.');
}

const isChapaConfigured = () => Boolean(CHAPA_PUBLIC_KEY && CHAPA_PUBLIC_KEY.trim());

const verifyTransaction = async (txRef) => {
    try {
        const response = await axios.get(`${CHAPA_BASE_URL}/verify/${txRef}`, {
            headers: {
                Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
            },
        });
        return { ok: true, data: response.data };
    } catch (error) {
        return {
            ok: false,
            statusCode: error.response?.status,
            message: error.response?.data?.message || error.message || 'Payment verification failed',
            responseData: error.response?.data,
        };
    }
};

const extractChapaErrorMessage = (error) => {
    let errorMessage = 'Failed to initialize payment';

    if (error.response?.data) {
        const chapaError = error.response.data;

        if (typeof chapaError.message === 'string') {
            errorMessage = chapaError.message;
        } else if (typeof chapaError.message === 'object') {
            if (chapaError.message.message) {
                errorMessage = chapaError.message.message;
            } else if (chapaError.message.error) {
                errorMessage = typeof chapaError.message.error === 'string'
                    ? chapaError.message.error
                    : JSON.stringify(chapaError.message.error);
            } else {
                errorMessage = JSON.stringify(chapaError.message);
            }
        } else if (chapaError.error) {
            errorMessage = typeof chapaError.error === 'string'
                ? chapaError.error
                : JSON.stringify(chapaError.error);
        }
    } else if (error.message) {
        errorMessage = error.message;
    }

    return errorMessage;
};

const isPendingVerificationError = (statusCode, errorMessage) => {
    const message = (errorMessage || '').toLowerCase();
    return statusCode === 404
        || message.includes('not found')
        || message.includes('processing')
        || message.includes('pending')
        || message.includes('not available');
};

module.exports = {
    CHAPA_PUBLIC_KEY,
    isChapaConfigured,
    verifyTransaction,
    extractChapaErrorMessage,
    isPendingVerificationError,
};
