import { normalizeRole, ROLES } from '../constants/roles';

export const ROLE_PATH_PREFIX = Object.freeze({
    [ROLES.SYSTEM_ADMIN]: 'system-admin',
    [ROLES.DIRECTOR]: 'parking-manager',
    [ROLES.SUPERVISOR]: 'supervisor',
    [ROLES.FINANCE_OFFICER]: 'finance-officer',
    [ROLES.VALET]: 'parking-officer',
});

/** Legacy URL prefixes kept for redirects from bookmarks and old links */
export const LEGACY_ROLE_PATH_PREFIX = Object.freeze({
    director: ROLE_PATH_PREFIX[ROLES.DIRECTOR],
    valet: ROLE_PATH_PREFIX[ROLES.VALET],
});

export const STAFF_PORTAL_PREFIXES = [
    ROLE_PATH_PREFIX[ROLES.SYSTEM_ADMIN],
    ROLE_PATH_PREFIX[ROLES.DIRECTOR],
    ROLE_PATH_PREFIX[ROLES.SUPERVISOR],
    ROLE_PATH_PREFIX[ROLES.FINANCE_OFFICER],
];

export const PARKING_OFFICER_PORTAL_PREFIX = ROLE_PATH_PREFIX[ROLES.VALET];

const PREFIX_TO_ROLE = Object.fromEntries(
    Object.entries(ROLE_PATH_PREFIX).map(([role, prefix]) => [prefix, role])
);

Object.entries(LEGACY_ROLE_PATH_PREFIX).forEach(([legacyPrefix, currentPrefix]) => {
    PREFIX_TO_ROLE[legacyPrefix] = PREFIX_TO_ROLE[currentPrefix];
});

export const getRolePathPrefix = (userType) => ROLE_PATH_PREFIX[normalizeRole(userType)] || null;

export const getRoleFromPathPrefix = (prefix) => PREFIX_TO_ROLE[prefix] || null;

export const getStaffRoutePath = (userType, ...segments) => {
    const prefix = getRolePathPrefix(userType);
    if (!prefix) return '/';

    const path = segments.filter(Boolean).join('/');
    return path ? `/${prefix}/${path}` : `/${prefix}`;
};

export const getParkingOfficerRoutePath = (...segments) =>
    getStaffRoutePath(ROLES.VALET, ...segments);

export const getStaffPathSuffix = (pathname) => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length <= 1) return 'dashboard';
    return parts.slice(1).join('/');
};

export const mapLegacyStaffSegment = (segment) => {
    if (segment === 'valets') return 'parking-officers';
    return segment;
};
