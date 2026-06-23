const User = require('../models/userSchema');
const AppError = require('../errors/AppError');
const asyncHandler = require('../utils/asyncHandler');

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

    if (!roles.includes(req.currentUser.type)) {
        return next(new AppError('Access denied', 403));
    }

    next();
};

module.exports = { attachCurrentUser, requireRoles };
