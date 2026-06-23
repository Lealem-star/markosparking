const Joi = require('joi');
const { Types } = require('mongoose');
const AppError = require('../errors/AppError');
const PaymentMethod = require('../models/paymentMethodSchema');

const createSchema = Joi.object({
    cash: Joi.boolean().required(),
});

const updateSchema = Joi.object({
    cash: Joi.boolean().required(),
    interac: Joi.any().optional(),
});

const create = async (req, res) => {
    const { cash } = req.validated.body;
    const { interac } = req.body;
    const paymentMethod = await PaymentMethod.create({ cash, interac });
    res.json({ message: 'PaymentMethod created', paymentMethod });
};

const list = async (req, res) => {
    const paymentMethods = await PaymentMethod.find({});
    res.json(paymentMethods);
};

const update = async (req, res) => {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid id', 400);
    }

    const paymentMethod = await PaymentMethod.findById(id);
    if (!paymentMethod) {
        throw new AppError('Provide correct paymentMethod id', 400);
    }

    const { cash, interac = paymentMethod.interac } = req.validated.body;
    const updatedPaymentMethodObj = { cash, interac };

    const updatedPaymentMethod = await PaymentMethod.updateOne({ _id: id }, updatedPaymentMethodObj);
    if (!updatedPaymentMethod.modifiedCount && !updatedPaymentMethod.matchedCount) {
        throw new AppError('PaymentMethod not updated', 400);
    }

    res.json({ message: 'PaymentMethod updated successfully' });
};

const remove = async (req, res) => {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid paymentMethod id', 400);
    }

    const paymentMethod = await PaymentMethod.findByIdAndDelete(id);
    if (!paymentMethod) {
        throw new AppError('PaymentMethod not found', 404);
    }

    res.json({ message: 'PaymentMethod deleted successfully' });
};

module.exports = { createSchema, updateSchema, create, list, update, remove };
