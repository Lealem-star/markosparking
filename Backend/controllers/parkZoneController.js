const Joi = require('joi');
const parkZoneService = require('../services/parkZoneService');
const User = require('../models/userSchema');

const createParkZoneSchema = Joi.object({
    code: Joi.string().trim().max(32).optional(),
    name: Joi.string().trim().required().min(1).max(120),
    location: Joi.string().trim().required().min(1).max(200),
    priceLevel: Joi.string().trim().required().min(1).max(120),
    description: Joi.string().trim().allow('').max(500).optional(),
    isActive: Joi.boolean().optional(),
});

const updateParkZoneSchema = Joi.object({
    name: Joi.string().trim().min(1).max(120).optional(),
    location: Joi.string().trim().min(1).max(200).optional(),
    priceLevel: Joi.string().trim().min(1).max(120).optional(),
    description: Joi.string().trim().allow('').max(500).optional(),
    isActive: Joi.boolean().optional(),
}).min(1);

const loadCurrentUser = async (req) =>
    req.currentUser || User.findOne({ phoneNumber: req.user?.phoneNumber });

const listParkZones = async (req, res) => {
    const zones = await parkZoneService.listParkZones();
    res.json({ zones });
};

const createParkZone = async (req, res) => {
    const currentUser = await loadCurrentUser(req);
    const zone = await parkZoneService.createParkZone(currentUser, req.validated.body, req);
    res.status(201).json({ message: 'Parking zone created successfully', zone });
};

const updateParkZone = async (req, res) => {
    const currentUser = await loadCurrentUser(req);
    const zone = await parkZoneService.updateParkZone(currentUser, req.params.id, req.validated.body, req);
    res.json({ message: 'Parking zone updated successfully', zone });
};

const deleteParkZone = async (req, res) => {
    const currentUser = await loadCurrentUser(req);
    const result = await parkZoneService.deleteParkZone(currentUser, req.params.id, req);
    res.json(result);
};

module.exports = {
    createParkZoneSchema,
    updateParkZoneSchema,
    listParkZones,
    createParkZone,
    updateParkZone,
    deleteParkZone,
};
