const { isLoggedIn } = require('./auth');
const { attachCurrentUser, requireRoles } = require('./authorize');
const {
    ROLES,
    REPORT_ACCESS_ROLES,
    STAFF_MANAGEMENT_ROLES,
} = require('../constants/roles');

const adminReportAccess = [
    isLoggedIn,
    attachCurrentUser,
    requireRoles(...REPORT_ACCESS_ROLES),
];

const systemAdminOnly = [
    isLoggedIn,
    attachCurrentUser,
    requireRoles(ROLES.SYSTEM_ADMIN),
];

const staffManagerAccess = [
    isLoggedIn,
    attachCurrentUser,
    requireRoles(...STAFF_MANAGEMENT_ROLES),
];

const systemAdminOnlyAccess = [
    isLoggedIn,
    attachCurrentUser,
    requireRoles(ROLES.SYSTEM_ADMIN),
];

module.exports = {
    adminReportAccess,
    systemAdminOnly,
    staffManagerAccess,
    systemAdminOnlyAccess,
};
