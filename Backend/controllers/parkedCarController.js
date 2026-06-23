const Joi = require('joi');
const User = require('../models/userSchema');
const {
    registerParkedCar,
    listParkedCars,
    getFlaggedCars,
    getParkedCarById,
    updateParkedCar,
    deleteParkedCar,
    getDailyStats,
    getDailyStatsHistory,
    flagCar,
    notifyFlaggedCustomer,
} = require('../services/parkingService');

const createParkedCarSchema = Joi.object({
    plateCode: Joi.string().required().trim(),
    region: Joi.string().required().trim(),
    licensePlateNumber: Joi.string().required().trim(),
    carType: Joi.string().valid('tripod', 'automobile', 'truck', 'trailer', 'special_vehicles').required(),
    model: Joi.string().allow('').optional(),
    color: Joi.string().allow('').optional(),
    phoneNumber: Joi.string().required().trim(),
    notes: Joi.string().allow('').optional(),
    serviceType: Joi.string().valid('hourly', 'package').default('hourly'),
    packageDuration: Joi.when('serviceType', {
        is: 'package',
        then: Joi.string().valid('weekly', 'monthly', 'yearly').required(),
        otherwise: Joi.string().valid('weekly', 'monthly', 'yearly').allow(null).optional(),
    }),
});

const updateParkedCarSchema = Joi.object({
    status: Joi.string().valid('parked', 'checked_out', 'violation').optional(),
    notes: Joi.string().allow('').optional(),
    totalPaidAmount: Joi.number().min(0).optional(),
    paymentMethod: Joi.string().valid('manual', 'online').optional(),
    isFlagged: Joi.boolean().optional(),
    flaggedAt: Joi.date().allow(null).optional(),
    flaggedBy: Joi.string().allow(null).optional(),
    baseAmount: Joi.number().min(0).optional(),
    vatAmount: Joi.number().min(0).optional(),
    notificationSent: Joi.boolean().optional(),
    lastNotificationSentAt: Joi.date().allow(null).optional(),
});

const loadCurrentUser = (req) => User.findOne({ phoneNumber: req.user?.phoneNumber });

const create = async (req, res) => {
    const valetUser = await loadCurrentUser(req);
    const car = await registerParkedCar(valetUser, req.validated.body);
    res.json({ message: 'Parked car registered successfully', car });
};

const list = async (req, res) => {
    const currentUser = await loadCurrentUser(req);
    const cars = await listParkedCars(currentUser, req.query);
    res.json(cars);
};

const listFlagged = async (req, res) => {
    const cars = await getFlaggedCars();
    res.json(cars);
};

const getDaily = async (req, res) => {
    const currentUser = await loadCurrentUser(req);
    const stats = await getDailyStats(currentUser, req.query.date);
    res.json(stats);
};

const getDailyHistory = async (req, res) => {
    const currentUser = await loadCurrentUser(req);
    const stats = await getDailyStatsHistory(currentUser, req.query.limit);
    res.json(stats);
};

const getById = async (req, res) => {
    const car = await getParkedCarById(req.params.id);
    res.json(car);
};

const update = async (req, res) => {
    const currentUser = await loadCurrentUser(req);
    const result = await updateParkedCar(req.params.id, currentUser, req.validated.body);
    res.json(result);
};

const remove = async (req, res) => {
    const currentUser = await loadCurrentUser(req);
    const result = await deleteParkedCar(req.params.id, currentUser);
    res.json(result);
};

const flag = async (req, res) => {
    const currentUser = await loadCurrentUser(req);
    const { baseAmount, vatAmount, totalWithVat } = req.body;
    const result = await flagCar(req.params.id, currentUser, { baseAmount, vatAmount, totalWithVat });
    res.json(result);
};

const notify = async (req, res) => {
    const result = await notifyFlaggedCustomer(req.params.id);
    res.json(result);
};

module.exports = {
    createParkedCarSchema,
    updateParkedCarSchema,
    create,
    list,
    listFlagged,
    getDaily,
    getDailyHistory,
    getById,
    update,
    remove,
    flag,
    notify,
};
