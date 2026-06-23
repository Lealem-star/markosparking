class AppError extends Error {
    constructor(message, statusCode = 500, extras = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        if (extras && typeof extras === 'object') {
            this.extras = extras;
            Object.assign(this, extras);
        }
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
