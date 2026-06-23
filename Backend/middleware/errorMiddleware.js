const AppError = require('../errors/AppError');

const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;
    const message = err.isOperational
        ? err.message
        : (err.message || 'Internal server error');

    if (!err.isOperational) {
        console.error('Error -', err);
    } else if (statusCode >= 500) {
        console.error(`Error ${statusCode} -`, message);
    }

    const payload = { error: message, message };

    if (err.flaggedCar) {
        payload.flaggedCar = err.flaggedCar;
    }

    if (err.extras && typeof err.extras === 'object') {
        Object.assign(payload, err.extras);
    }

    res.status(typeof statusCode === 'number' ? statusCode : 500).json(payload);
};

module.exports = errorMiddleware;
