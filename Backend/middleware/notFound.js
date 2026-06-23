const AppError = require('../errors/AppError');

const notFound = (req, res, next) => {
    next(new AppError('Not Found', 404));
};

module.exports = notFound;
