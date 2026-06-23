const multer = require('multer');
const Joi = require('joi');
const User = require('../models/userSchema');
const AppError = require('../errors/AppError');
const upload = require('../config/multer.config');
const userService = require('../services/userService');

const phonePattern = /^(\+?251|0)?[0-9]{9}$|^(\+)?[0-9]{10,15}$/;
const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,1024}$/;

const createUserSchema = Joi.object({
    name: Joi.string().trim().required(),
    phoneNumber: Joi.string().trim().required().pattern(phonePattern),
    password: Joi.string().min(8).required().max(20).regex(passwordPattern),
    type: Joi.string().valid('system_admin', 'manager', 'admin', 'valet').required(),
    parkZoneCode: Joi.string().trim().when('type', {
        is: Joi.string().valid('valet'),
        then: Joi.string().required().min(1),
        otherwise: Joi.string().optional().allow('', null),
    }),
    priceLevel: Joi.string().trim().optional().allow('', null),
});

const loginSchema = Joi.object({
    phoneNumber: Joi.string().required().pattern(phonePattern),
    password: Joi.string().min(6).required().max(20),
});

const resetPasswordSchema = Joi.object({
    password: Joi.string().required().min(8).max(20).regex(passwordPattern),
});

const updateUserSchema = Joi.object({
    cash: Joi.boolean().optional(),
    interac: Joi.any().optional(),
    name: Joi.string().trim().optional().allow(''),
    phoneNumber: Joi.string().trim().optional().allow(''),
    parkZoneCode: Joi.string().trim().optional().allow(''),
    language: Joi.string().valid('en', 'am').optional(),
    type: Joi.string().valid('system_admin', 'manager', 'admin', 'valet').optional(),
    password: Joi.string().min(8).max(20).regex(passwordPattern).optional().allow(''),
    priceLevel: Joi.string().trim().optional().allow('', null),
    isActive: Joi.boolean().optional(),
}).min(1);

const loadCurrentUser = (req) =>
    req.currentUser || User.findOne({ phoneNumber: req.user?.phoneNumber });

const registerDisabled = (req, res) => {
    throw new AppError('Public registration is disabled. Please contact system administrator.', 403);
};

const createUser = async (req, res) => {
    const currentUser = await loadCurrentUser(req);
    const result = await userService.createUser(currentUser, req.validated.body);
    res.json(result);
};

const listUsers = async (req, res) => {
    const users = await userService.listUsers();
    res.json(users);
};

const login = async (req, res) => {
    const result = await userService.login(req.validated.body);
    res.json(result);
};

const resetPassword = async (req, res) => {
    const currentUser = await loadCurrentUser(req);
    const result = await userService.resetPassword(currentUser, req.params.id, req.validated.body.password);
    res.json(result);
};

const uploadPhotoMiddleware = (req, res, next) => {
    upload.single('profilePhoto')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new AppError('File size too large. Maximum size is 20MB', 400));
                }
                return next(new AppError(err.message || 'File upload error', 400));
            }
            return next(new AppError(err.message || 'File upload failed', 400));
        }
        next();
    });
};

const uploadPhoto = async (req, res) => {
    const currentUser = await loadCurrentUser(req);
    const result = await userService.updateProfilePhoto(currentUser, req.params.id, req.file);
    res.json(result);
};

const updateUser = async (req, res) => {
    const currentUser = await loadCurrentUser(req);
    const result = await userService.updateUser(currentUser, req.params.id, req.validated.body);
    res.json(result);
};

const deactivateUser = async (req, res) => {
    const currentUser = await loadCurrentUser(req);
    const result = await userService.deactivateUser(currentUser, req.params.id);
    res.json(result);
};

module.exports = {
    createUserSchema,
    loginSchema,
    resetPasswordSchema,
    updateUserSchema,
    registerDisabled,
    createUser,
    listUsers,
    login,
    resetPassword,
    uploadPhotoMiddleware,
    uploadPhoto,
    updateUser,
    deactivateUser,
};
