const AppError = require('../errors/AppError');

const validate = (schema, source = 'body') => (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: true });

    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }

    if (!req.validated) {
        req.validated = {};
    }
    req.validated[source] = value;
    next();
};

module.exports = validate;
