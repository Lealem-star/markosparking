const { isLoggedIn } = require('./auth');
const { attachCurrentUser, requireRoles } = require('./authorize');
const validate = require('./validate');
const notFound = require('./notFound');
const errorMiddleware = require('./errorMiddleware');

module.exports = {
    isLoggedIn,
    attachCurrentUser,
    requireRoles,
    validate,
    notFound,
    errorMiddleware,
};
