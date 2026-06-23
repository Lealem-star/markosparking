const twilio = require('twilio');
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = require('../config/env');
const { normalizePhoneNumber } = require('../utils/phoneUtils');

let twilioClient = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

const sendSms = async (phoneNumber, message) => {
    if (!twilioClient || !TWILIO_PHONE_NUMBER) {
        console.warn('SMS not configured: missing Twilio credentials');
        return false;
    }

    const to = normalizePhoneNumber(phoneNumber);

    try {
        await twilioClient.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to,
        });
        console.log(`SMS sent to ${to}`);
        return true;
    } catch (error) {
        console.error(`Error sending SMS to ${to}:`, error.message);
        throw error;
    }
};

module.exports = { sendSms };
