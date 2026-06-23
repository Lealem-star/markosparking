const Joi = require('joi');
const User = require('../models/userSchema');
const AppError = require('../errors/AppError');
const { extractChapaErrorMessage } = require('../services/chapaClient');
const {
    initializeParkingPayment,
    initializePackagePayment,
    verifyParkingPayment,
    verifyPackagePayment,
    handleCallbackPost,
    handleCallbackGet,
    handleWebhook,
} = require('../services/paymentService');

const initializeParkingSchema = Joi.object({
    carId: Joi.string().required(),
    amount: Joi.number().positive().required(),
    customerName: Joi.string().optional().allow(''),
    customerEmail: Joi.string().email().optional().allow('').strip(),
    customerPhone: Joi.string().required(),
});

const initializePackageSchema = Joi.object({
    amount: Joi.number().positive().required(),
    packageDuration: Joi.string().valid('weekly', 'monthly', 'yearly').required(),
    customerPhone: Joi.string().required(),
    serviceType: Joi.string().valid('package').required(),
    carData: Joi.object({
        plateCode: Joi.string().required().trim(),
        region: Joi.string().required().trim(),
        licensePlateNumber: Joi.string().required().trim(),
        carType: Joi.string().valid('tripod', 'automobile', 'truck', 'trailer', 'special_vehicles').required(),
        model: Joi.string().allow('').optional(),
        color: Joi.string().allow('').optional(),
        phoneNumber: Joi.string().required().trim(),
        notes: Joi.string().allow('').optional(),
        priceLevel: Joi.string().optional().allow('', null),
    }).required(),
});

const initializeParking = async (req, res) => {
    const result = await initializeParkingPayment(req.validated.body.carId);
    res.json({
        success: true,
        txRef: result.txRef,
        publicKey: result.publicKey,
        message: 'Payment reference generated successfully',
    });
};

const initializePackage = async (req, res) => {
    const valetUser = await User.findOne({ phoneNumber: req.user?.phoneNumber });
    const body = req.validated.body;

    const result = await initializePackagePayment({
        valetUser,
        amount: body.amount,
        packageDuration: body.packageDuration,
        customerPhone: body.customerPhone,
        carData: body.carData,
    });

    res.json({
        success: true,
        txRef: result.txRef,
        publicKey: result.publicKey,
        message: 'Package payment reference generated successfully',
    });
};

const verifyParking = async (req, res) => {
    const { txRef } = req.params;
    if (!txRef) {
        throw new AppError('Transaction reference is required', 400);
    }

    const { httpStatus, body } = await verifyParkingPayment(txRef, req.query.carId);
    res.status(httpStatus).json(body);
};

const verifyPackage = async (req, res) => {
    const { txRef } = req.params;
    if (!txRef) {
        throw new AppError('Transaction reference is required', 400);
    }

    const { httpStatus, body } = await verifyPackagePayment(txRef);
    res.status(httpStatus).json(body);
};

const callbackPost = async (req, res) => {
    try {
        const result = await handleCallbackPost(req.body, req.query);
        res.status(200).json(result);
    } catch (error) {
        console.error('Chapa callback error:', error);
        res.status(200).json({ received: true });
    }
};

const callbackGet = async (req, res) => {
    try {
        const result = await handleCallbackGet(req.query);
        res.status(200).json(result);
    } catch (error) {
        console.error('Chapa callback error (GET):', error);
        res.status(200).json({ received: true });
    }
};

const webhook = async (req, res) => {
    try {
        const result = await handleWebhook(req.body);
        res.status(200).json(result);
    } catch (error) {
        console.error('Chapa webhook error:', error);
        res.status(200).json({ received: true });
    }
};

module.exports = {
    initializeParkingSchema,
    initializePackageSchema,
    initializeParking,
    initializePackage,
    verifyParking,
    verifyPackage,
    callbackPost,
    callbackGet,
    webhook,
    extractChapaErrorMessage,
};
