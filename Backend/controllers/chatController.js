const Joi = require('joi');
const AppError = require('../errors/AppError');
const ChatMessage = require('../models/chatMessageSchema');
const User = require('../models/userSchema');

const sendMessageSchema = Joi.object({
    text: Joi.string().trim().required().min(1),
    replyTo: Joi.string().optional().allow(null, ''),
});

const getMessages = async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 50;
    const before = req.query.before ? new Date(req.query.before) : null;

    const query = {};
    if (before && !isNaN(before.getTime())) {
        query.createdAt = { $lt: before };
    }

    const messages = await ChatMessage.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('sender', 'name parkZoneCode type')
        .populate('replyTo', 'text senderName senderType senderParkZoneCode createdAt');

    res.json(messages.reverse());
};

const sendMessage = async (req, res) => {
    const { text, replyTo } = req.validated.body;
    const sender = await User.findOne({ phoneNumber: req.user?.phoneNumber });
    if (!sender) {
        throw new AppError('Sender not found', 400);
    }

    if (replyTo) {
        const replyToMessage = await ChatMessage.findById(replyTo);
        if (!replyToMessage) {
            throw new AppError('Reply to message not found', 400);
        }
    }

    const message = await ChatMessage.create({
        text: text.trim(),
        sender: sender._id,
        senderName: sender.name,
        senderType: sender.type,
        senderParkZoneCode: sender.parkZoneCode || '',
        replyTo: replyTo || null,
    });

    const populated = await ChatMessage.findById(message._id)
        .populate('sender', 'name parkZoneCode type')
        .populate('replyTo', 'text senderName senderType senderParkZoneCode createdAt');

    const io = req.app.get('io');
    if (io) {
        io.emit('chat:newMessage', populated);
    }

    res.status(201).json(populated);
};

module.exports = { sendMessageSchema, getMessages, sendMessage };
