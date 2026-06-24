const Joi = require('joi');
const AppError = require('../errors/AppError');
const { sendSms } = require('../services/smsService');

const sendSmsSchema = Joi.object({
    phoneNumber: Joi.string().required().trim(),
    message: Joi.string().required().trim().min(1),
});

const send = async (req, res) => {
    const { phoneNumber, message } = req.validated.body;
    const sent = await sendSms(phoneNumber, message);

    if (!sent) {
        throw new AppError('SMS service is not configured or unavailable', 503);
    }

    res.json({ success: true, message: 'SMS sent successfully' });
};

module.exports = { sendSmsSchema, send };
