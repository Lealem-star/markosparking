const jwt = require('jsonwebtoken');
const AppError = require('../errors/AppError');
const { JWT_SECRET } = require('../config/env');

const isLoggedIn = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next(new AppError('No authorization header', 401));
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return next(new AppError('Malformed auth header', 401));
    }

    const token = parts[1];
    if (!token) {
        return next(new AppError('Malformed auth header', 401));
    }

    if (!JWT_SECRET) {
        return next(new AppError('JWT secret is not configured', 500));
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        next(new AppError('Token verification failed', 401));
    }
};

module.exports = { isLoggedIn };
