const User = require('../models/userSchema');
const AppError = require('../errors/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { normalizeRole } = require('../constants/roles');

const attachCurrentUser = asyncHandler(async (req, res, next) => {
    if (!req.user?.phoneNumber) {
        throw new AppError('Unauthorized', 401);
    }

    const currentUser = await User.findOne({ phoneNumber: req.user.phoneNumber });

    if (!currentUser || currentUser.isActive === false) {
        throw new AppError('Unauthorized', 401);
    }

    req.currentUser = currentUser;
    next();
});

const requireRoles = (...roles) => (req, res, next) => {
    if (!req.currentUser) {
        return next(new AppError('Unauthorized', 401));
    }

    const userRole = normalizeRole(req.currentUser.type);
    const allowedRoles = roles.map((role) => normalizeRole(role));

    if (!allowedRoles.includes(userRole)) {
        return next(new AppError('Access denied', 403));
    }

    next();
};

module.exports = { attachCurrentUser, requireRoles };
