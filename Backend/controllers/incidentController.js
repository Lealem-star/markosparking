const Joi = require('joi');
const { INCIDENT_TYPES, INCIDENT_STATUSES } = require('../models/incidentSchema');
const incidentService = require('../services/incidentService');

const listSchema = Joi.object({
    status: Joi.string().valid('all', ...INCIDENT_STATUSES).optional(),
    type: Joi.string().valid('all', ...INCIDENT_TYPES).optional(),
    zone: Joi.string().trim().optional(),
    search: Joi.string().trim().allow('').optional(),
});

const createSchema = Joi.object({
    type: Joi.string().valid(...INCIDENT_TYPES).required(),
    description: Joi.string().trim().min(3).max(2000).required(),
    parkZoneCode: Joi.string().trim().required(),
});

const assignSchema = Joi.object({
    officerId: Joi.string().required(),
});

const resolveSchema = Joi.object({
    resolutionNotes: Joi.string().trim().max(2000).allow('').optional(),
});

const list = async (req, res) => {
    const result = await incidentService.listIncidents(req.currentUser, req.validated.query);
    res.json(result);
};

const create = async (req, res) => {
    const incident = await incidentService.createIncident(req.currentUser, req.validated.body);
    res.status(201).json({ incident });
};

const assign = async (req, res) => {
    const incident = await incidentService.assignIncident(
        req.currentUser,
        req.params.id,
        req.validated.body
    );
    res.json({ incident });
};

const resolve = async (req, res) => {
    const incident = await incidentService.resolveIncident(
        req.currentUser,
        req.params.id,
        req.validated.body
    );
    res.json({ incident });
};

module.exports = {
    listSchema,
    createSchema,
    assignSchema,
    resolveSchema,
    list,
    create,
    assign,
    resolve,
};
