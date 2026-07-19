import { normalizeRole, ROLES } from '../constants/roles';

export const ROLE_PATH_PREFIX = Object.freeze({
    [ROLES.SYSTEM_ADMIN]: 'system-admin',
    [ROLES.DIRECTOR]: 'director',
    [ROLES.SUPERVISOR]: 'supervisor',
    [ROLES.FINANCE_OFFICER]: 'finance-officer',
    [ROLES.VALET]: 'valet',
});

export const STAFF_PORTAL_PREFIXES = [
    ROLE_PATH_PREFIX[ROLES.SYSTEM_ADMIN],
    ROLE_PATH_PREFIX[ROLES.DIRECTOR],
    ROLE_PATH_PREFIX[ROLES.SUPERVISOR],
    ROLE_PATH_PREFIX[ROLES.FINANCE_OFFICER],
];

const PREFIX_TO_ROLE = Object.fromEntries(
    Object.entries(ROLE_PATH_PREFIX).map(([role, prefix]) => [prefix, role])
);

export const getRolePathPrefix = (userType) => ROLE_PATH_PREFIX[normalizeRole(userType)] || null;

export const getRoleFromPathPrefix = (prefix) => PREFIX_TO_ROLE[prefix] || null;

export const getStaffRoutePath = (userType, ...segments) => {
    const prefix = getRolePathPrefix(userType);
    if (!prefix) return '/';

    const path = segments.filter(Boolean).join('/');
    return path ? `/${prefix}/${path}` : `/${prefix}`;
};

export const getStaffPathSuffix = (pathname) => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length <= 1) return 'dashboard';
    return parts.slice(1).join('/');
};
