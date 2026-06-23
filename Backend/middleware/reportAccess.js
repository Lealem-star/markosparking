const { isLoggedIn } = require('./auth');
const { attachCurrentUser, requireRoles } = require('./authorize');

const adminReportAccess = [
    isLoggedIn,
    attachCurrentUser,
    requireRoles('system_admin', 'manager', 'admin'),
];

const systemAdminOnly = [
    isLoggedIn,
    attachCurrentUser,
    requireRoles('system_admin'),
];

const staffManagerAccess = [
    isLoggedIn,
    attachCurrentUser,
    requireRoles('system_admin', 'manager'),
];

const systemAdminOnlyAccess = [
    isLoggedIn,
    attachCurrentUser,
    requireRoles('system_admin'),
];

module.exports = {
    adminReportAccess,
    systemAdminOnly,
    staffManagerAccess,
    systemAdminOnlyAccess,
};
