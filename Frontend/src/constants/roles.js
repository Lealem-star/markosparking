export const ROLES = Object.freeze({
    SYSTEM_ADMIN: 'system_admin',
    DIRECTOR: 'director',
    SUPERVISOR: 'supervisor',
    FINANCE_OFFICER: 'finance_officer',
    VALET: 'valet',
});

export const STAFF_SHELL_ROLES = [
    ROLES.SYSTEM_ADMIN,
    ROLES.DIRECTOR,
    ROLES.SUPERVISOR,
    ROLES.FINANCE_OFFICER,
];

export const OFFICE_STAFF_TYPES = [...STAFF_SHELL_ROLES];

export const VALET_ROLE = ROLES.VALET;

/** Wildcard park zone code — supervisors with this value can access all zones */
export const ALL_ZONES_CODE = '*';

const ZONE_SEPARATOR = ',';

export const parseSupervisorZones = (code = '') => {
    const trimmed = code?.trim();
    if (!trimmed) return [];
    if (trimmed === ALL_ZONES_CODE) return [ALL_ZONES_CODE];
    return trimmed.split(ZONE_SEPARATOR).map((zone) => zone.trim()).filter(Boolean);
};

export const serializeSupervisorZones = (zones = []) => {
    const cleaned = [...new Set(zones.map((zone) => zone?.trim()).filter(Boolean))];
    if (cleaned.includes(ALL_ZONES_CODE)) return ALL_ZONES_CODE;
    return cleaned.join(ZONE_SEPARATOR);
};

export const getSupervisorZoneList = (code = '') =>
    parseSupervisorZones(code).filter((zone) => zone !== ALL_ZONES_CODE);

export const isAllZonesCode = (code) => code?.trim() === ALL_ZONES_CODE;

export const supervisorCoversZone = (supervisorZone, targetZone) => {
    const zones = parseSupervisorZones(supervisorZone);
    if (zones.includes(ALL_ZONES_CODE)) return true;
    return zones.includes(targetZone);
};

export const LEGACY_ROLE_MAP = Object.freeze({
    manager: ROLES.DIRECTOR,
    admin: ROLES.FINANCE_OFFICER,
});

/** English display names for reports, PDFs, and non-i18n contexts */
export const ROLE_DISPLAY_NAMES = Object.freeze({
    [ROLES.SYSTEM_ADMIN]: 'System Admin',
    [ROLES.DIRECTOR]: 'Bahir Dar City Administration',
    [ROLES.SUPERVISOR]: 'Parking Supervisor',
    [ROLES.FINANCE_OFFICER]: 'Finance Officer',
    [ROLES.VALET]: 'Valet Attendant',
});

export const normalizeRole = (type) => LEGACY_ROLE_MAP[type] || type;

export const getRoleDisplayName = (type) => {
    const role = normalizeRole(type);
    return ROLE_DISPLAY_NAMES[role] || role || '—';
};

export const isStaffShellRole = (type) => STAFF_SHELL_ROLES.includes(normalizeRole(type));
export const isValetRole = (type) => normalizeRole(type) === ROLES.VALET;

/** @deprecated use isStaffShellRole */
export const isAdminRole = (type) => isStaffShellRole(type);

export const STAFF_MANAGEMENT_ROLES = [
    ROLES.SYSTEM_ADMIN,
    ROLES.DIRECTOR,
    ROLES.SUPERVISOR,
];

export const REPORT_ROLES = [
    ROLES.SYSTEM_ADMIN,
    ROLES.DIRECTOR,
    ROLES.FINANCE_OFFICER,
];

export const CREATABLE_BY = Object.freeze({
    [ROLES.SYSTEM_ADMIN]: [
        ROLES.DIRECTOR,
        ROLES.SUPERVISOR,
        ROLES.FINANCE_OFFICER,
        ROLES.VALET,
    ],
    [ROLES.DIRECTOR]: [
        ROLES.SUPERVISOR,
        ROLES.FINANCE_OFFICER,
        ROLES.VALET,
    ],
});

export const canCreateRole = (actorType, targetType) =>
    (CREATABLE_BY[normalizeRole(actorType)] || []).includes(normalizeRole(targetType));

export const canAccessStaffManagement = (type) =>
    STAFF_MANAGEMENT_ROLES.includes(normalizeRole(type));

export const canCreateUsers = (type) =>
    [ROLES.SYSTEM_ADMIN, ROLES.DIRECTOR].includes(normalizeRole(type));

export const requiresZoneCode = (type) => {
    const role = normalizeRole(type);
    return role === ROLES.VALET || role === ROLES.SUPERVISOR;
};

export const requiresPriceLevel = (type) => normalizeRole(type) === ROLES.VALET;
