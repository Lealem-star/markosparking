const Joi = require('joi');
const { sendSms } = require('../services/smsService');

const sendSmsSchema = Joi.object({
    phoneNumber: Joi.string().required().trim(),
    message: Joi.string().required().trim().min(1),
});

const send = async (req, res) => {
    const { phoneNumber, message } = req.validated.body;
    await sendSms(phoneNumber, message);
    res.json({ success: true, message: 'SMS sent successfully' });
};

module.exports = { sendSmsSchema, send };
