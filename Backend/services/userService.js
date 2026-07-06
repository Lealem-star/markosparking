const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { Types } = require('mongoose');
const User = require('../models/userSchema');
const AppError = require('../errors/AppError');
const { JWT_SECRET, DOMAIN_NAME } = require('../config/env');
const { normalizePhoneNumber } = require('../utils/phoneUtils');
const { sendSms } = require('./smsService');
const {
    ROLES,
    isStaffManager,
    canCreateRole,
    canManageUser,
    requiresZoneCode,
    requiresPriceLevel,
} = require('../constants/roles');

const sanitizeUser = (user) => {
    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    return userResponse;
};

const stripPhoneFormatting = (phoneNumber) =>
    phoneNumber ? phoneNumber.replace(/[\s\-()]/g, '') : phoneNumber;

const assertObjectId = (id, message = 'Invalid id') => {
    if (!Types.ObjectId.isValid(id)) {
        throw new AppError(message, 400);
    }
};

const assertCanModifyTarget = (currentUser, targetUser, { isSelf }) => {
    if (isSelf) return;
    if (!canManageUser(currentUser, targetUser)) {
        throw new AppError('Not authorized to manage this user', 403);
    }
};

const assertZoneRequirements = (type, parkZoneCode, priceLevel) => {
    if (requiresZoneCode(type) && !parkZoneCode?.trim()) {
        throw new AppError('Park Zone Code is required for this role', 400);
    }
    if (requiresPriceLevel(type) && !priceLevel?.trim()) {
        throw new AppError('Price Level is required for valet users', 400);
    }
};

const createUser = async (actor, data) => {
    if (!actor || ![ROLES.SYSTEM_ADMIN, ROLES.DIRECTOR].includes(actor.type)) {
        throw new AppError('Only system admin or Bahir Dar City Administration can create users', 403);
    }

    let { name, phoneNumber, password, type, parkZoneCode, priceLevel } = data;

    if (!canCreateRole(actor.type, type)) {
        throw new AppError('You are not allowed to create this user role', 403);
    }

    phoneNumber = stripPhoneFormatting(phoneNumber);
    const phoneToUse = normalizePhoneNumber(phoneNumber);

    assertZoneRequirements(type, parkZoneCode, priceLevel);

    const existing = await User.findOne({ phoneNumber: phoneToUse });
    if (existing) {
        throw new AppError('Phone number already in use', 400);
    }

    const rawPassword = password;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await User.create({
        name,
        phoneNumber: phoneToUse,
        password: hashedPassword,
        type,
        parkZoneCode: requiresZoneCode(type) ? parkZoneCode.trim() : '',
        priceLevel: requiresPriceLevel(type) ? priceLevel.trim() : null,
    });

    try {
        const smsMessage = `Welcome to ${DOMAIN_NAME}! Your account has been created.\nPhone Number: ${phoneToUse}\nPassword: ${rawPassword}\nLogin here: ${DOMAIN_NAME}/login`;
        await sendSms(phoneToUse, smsMessage);
    } catch (smsError) {
        console.error('SMS sending failed (user still created):', smsError);
    }

    return { user: sanitizeUser(newUser), message: 'User created successfully' };
};

const buildUserListQuery = (currentUser) => {
    if (currentUser.type === ROLES.SUPERVISOR) {
        return {
            type: ROLES.VALET,
            parkZoneCode: currentUser.parkZoneCode,
        };
    }
    return {};
};

const listUsers = async (currentUser) => {
    if (!currentUser || !isStaffManager(currentUser.type)) {
        throw new AppError('Not authorized to list users', 403);
    }

    return User.find(buildUserListQuery(currentUser)).select('-password');
};

const login = async ({ phoneNumber, password }) => {
    phoneNumber = stripPhoneFormatting(phoneNumber);
    const normalizedPhone = normalizePhoneNumber(phoneNumber.trim());

    let user = await User.findOne({ phoneNumber: phoneNumber.trim() });
    if (!user && normalizedPhone !== phoneNumber.trim()) {
        user = await User.findOne({ phoneNumber: normalizedPhone });
    }

    if (!user) {
        throw new AppError("User doesn't exist", 400);
    }

    if (user.isActive === false) {
        throw new AppError('This account has been deactivated. Please contact your administrator.', 403);
    }

    const result = await bcrypt.compare(password, user.password);
    if (!result) {
        throw new AppError("password doesn't match", 400);
    }

    const token = jwt.sign(
        { phoneNumber: user.phoneNumber, type: user.type, _id: user._id },
        JWT_SECRET
    );

    return { user: sanitizeUser(user), token };
};

const resetPassword = async (currentUser, targetId, password) => {
    assertObjectId(targetId);

    if (!currentUser) {
        throw new AppError('Unauthorized', 401);
    }

    const isSelf = currentUser._id.toString() === targetId;

    const user = await User.findById(targetId);
    if (!user) {
        throw new AppError('Provide correct user id', 400);
    }

    if (!isSelf && !canManageUser(currentUser, user)) {
        throw new AppError('Not authorized to reset this password', 403);
    }

    user.password = bcrypt.hashSync(password, 10);
    await user.save();
    return { user, message: 'Password updated successfully' };
};

const updateProfilePhoto = async (currentUser, targetId, file) => {
    assertObjectId(targetId, 'Invalid user id');

    if (!currentUser) {
        throw new AppError('Unauthorized', 401);
    }

    const isSelf = currentUser._id.toString() === targetId;
    const user = await User.findById(targetId);
    if (!user) {
        if (file?.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        throw new AppError('User not found', 400);
    }

    if (!isSelf && !canManageUser(currentUser, user)) {
        if (file?.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        throw new AppError('Not authorized to upload photo for this user', 403);
    }

    if (!file) {
        throw new AppError('No file uploaded', 400);
    }

    if (user.profilePhoto) {
        const oldPhotoPath = path.join(__dirname, '../uploads/profile-photos', path.basename(user.profilePhoto));
        if (fs.existsSync(oldPhotoPath)) {
            try {
                fs.unlinkSync(oldPhotoPath);
            } catch (unlinkError) {
                console.error('Error deleting old photo:', unlinkError);
            }
        }
    }

    user.profilePhoto = `/uploads/profile-photos/${file.filename}`;
    await user.save();

    return { user: sanitizeUser(user), message: 'Profile photo uploaded successfully' };
};

const updateUser = async (currentUser, targetId, updates) => {
    assertObjectId(targetId);

    if (!currentUser) {
        throw new AppError('User not found', 403);
    }

    const user = await User.findById(targetId);
    if (!user) {
        throw new AppError('Provide correct user id', 400);
    }

    const {
        cash, interac, name, phoneNumber, parkZoneCode, language,
        type, password, priceLevel, isActive,
    } = updates;

    const isSelf = currentUser._id.toString() === targetId;
    const staffManager = isStaffManager(currentUser.type);

    if (!isSelf && !canManageUser(currentUser, user)) {
        throw new AppError('Not authorized to update this user', 403);
    }

    assertCanModifyTarget(currentUser, user, { isSelf });

    const hasStaffFields =
        type !== undefined || password !== undefined || priceLevel !== undefined
        || isActive !== undefined || (phoneNumber !== undefined && !isSelf);

    if (hasStaffFields && !staffManager && !isSelf) {
        throw new AppError('Not authorized to update staff fields', 403);
    }

    if (type !== undefined && !isSelf) {
        if (!canCreateRole(currentUser.type, type) && type !== user.type) {
            throw new AppError('You are not allowed to assign this user role', 403);
        }
    }

    let hasUpdates = false;

    if (typeof cash === 'boolean') { user.cash = cash; hasUpdates = true; }
    if (interac !== undefined) { user.interac = interac; hasUpdates = true; }
    if (name && name.trim() !== '') { user.name = name.trim(); hasUpdates = true; }

    if (phoneNumber && phoneNumber.trim() !== '') {
        const phoneToUse = normalizePhoneNumber(phoneNumber);
        const existingUser = await User.findOne({ phoneNumber: phoneToUse });
        if (existingUser && existingUser._id.toString() !== targetId) {
            throw new AppError('Phone number already in use by another user', 400);
        }
        user.phoneNumber = phoneToUse;
        hasUpdates = true;
    }

    if (parkZoneCode !== undefined && parkZoneCode.trim() !== '') {
        user.parkZoneCode = parkZoneCode.trim();
        hasUpdates = true;
    }

    if (language && ['en', 'am'].includes(language)) {
        user.language = language;
        hasUpdates = true;
    }

    if (staffManager && !isSelf) {
        if (type !== undefined) {
            user.type = type;
            if (!requiresZoneCode(type)) {
                user.parkZoneCode = '';
            }
            if (!requiresPriceLevel(type)) {
                user.priceLevel = null;
            }
            hasUpdates = true;
        }

        if (priceLevel !== undefined) {
            user.priceLevel = priceLevel?.trim() || null;
            hasUpdates = true;
        }

        if (password !== undefined && password !== '') {
            user.password = bcrypt.hashSync(password, 10);
            hasUpdates = true;
        }

        if (typeof isActive === 'boolean') {
            user.isActive = isActive;
            hasUpdates = true;
        }
    } else if (staffManager && isSelf && password !== undefined && password !== '') {
        user.password = bcrypt.hashSync(password, 10);
        hasUpdates = true;
    }

    if (isSelf && typeof isActive === 'boolean' && isActive === false) {
        throw new AppError('You cannot deactivate your own account', 400);
    }

    const effectiveType = type !== undefined ? type : user.type;
    assertZoneRequirements(
        effectiveType,
        parkZoneCode !== undefined ? parkZoneCode : user.parkZoneCode,
        priceLevel !== undefined ? priceLevel : user.priceLevel
    );

    if (!hasUpdates) {
        throw new AppError('Must provide at least one field to update', 400);
    }

    await user.save();
    return { user: sanitizeUser(user), message: 'User updated successfully' };
};

const deactivateUser = async (currentUser, targetId) => {
    assertObjectId(targetId, 'Invalid user id');

    if (!currentUser || !isStaffManager(currentUser.type)) {
        throw new AppError('Only system admin or Bahir Dar City Administration staff can deactivate users', 403);
    }

    if (currentUser._id.toString() === targetId) {
        throw new AppError('You cannot deactivate your own account', 400);
    }

    const user = await User.findById(targetId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (!canManageUser(currentUser, user)) {
        throw new AppError('Not authorized to deactivate this user', 403);
    }

    if (user.isActive === false) {
        throw new AppError('User is already deactivated', 400);
    }

    user.isActive = false;
    await user.save();
    return { message: 'User deactivated successfully' };
};

module.exports = {
    createUser,
    listUsers,
    login,
    resetPassword,
    updateProfilePhoto,
    updateUser,
    deactivateUser,
};
