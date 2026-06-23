require('dotenv').config();

const JWT_SECRET = process.env.SECRET_JWT_CODE || process.env.SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('Warning: JWT secret is not set (SECRET_JWT_CODE or SECRET)');
}

module.exports = {
    JWT_SECRET,
    MONGODB_URI: process.env.MONGODB_URI || process.env.MONODB_URI,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    CHAPA_SECRET_KEY: process.env.CHAPA_SECRET_KEY,
    CHAPA_PUBLIC_KEY: (process.env.CHAPA_PUBLIC_KEY || '').trim(),
    FRONTEND_URL: process.env.FRONTEND_URL,
    DOMAIN_NAME: process.env.DOMAIN_NAME,
    PORT: process.env.PORT || 4000,
    NODE_ENV: process.env.NODE_ENV || 'development',
};
