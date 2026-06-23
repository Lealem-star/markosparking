export const ADMIN_ROLES = ['system_admin', 'manager'];
export const REPORT_ROLES = ['system_admin', 'manager', 'admin'];
export const VALET_ROLE = 'valet';

export const isAdminRole = (type) => ADMIN_ROLES.includes(type);
export const isValetRole = (type) => type === VALET_ROLE;
