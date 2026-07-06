const ROLES = Object.freeze({
    SYSTEM_ADMIN: 'system_admin',
    DIRECTOR: 'director',
    SUPERVISOR: 'supervisor',
    FINANCE_OFFICER: 'finance_officer',
    VALET: 'valet',
});

const ALL_USER_TYPES = Object.values(ROLES);

const STAFF_SHELL_ROLES = [
    ROLES.SYSTEM_ADMIN,
    ROLES.DIRECTOR,
    ROLES.SUPERVISOR,
    ROLES.FINANCE_OFFICER,
];

const OFFICE_STAFF_TYPES = [...STAFF_SHELL_ROLES];

const ROLE_RANK = Object.freeze({
    [ROLES.SYSTEM_ADMIN]: 100,
    [ROLES.DIRECTOR]: 80,
    [ROLES.SUPERVISOR]: 60,
    [ROLES.FINANCE_OFFICER]: 40,
    [ROLES.VALET]: 20,
});

const STAFF_MANAGEMENT_ROLES = [
    ROLES.SYSTEM_ADMIN,
    ROLES.DIRECTOR,
    ROLES.SUPERVISOR,
];

const REPORT_ACCESS_ROLES = [
    ROLES.SYSTEM_ADMIN,
    ROLES.DIRECTOR,
    ROLES.FINANCE_OFFICER,
];

const OFFICE_WIDE_DATA_ROLES = [
    ROLES.SYSTEM_ADMIN,
    ROLES.DIRECTOR,
    ROLES.FINANCE_OFFICER,
];

const SMS_SENDER_ROLES = [
    ROLES.VALET,
    ROLES.SUPERVISOR,
    ROLES.DIRECTOR,
    ROLES.FINANCE_OFFICER,
    ROLES.SYSTEM_ADMIN,
];

const CREATABLE_BY = Object.freeze({
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

const VALET_ROLE = ROLES.VALET;

/** Wildcard park zone code — supervisors with this value can access all zones */
const ALL_ZONES_CODE = '*';

const ZONE_SEPARATOR = ',';

const parseSupervisorZones = (code = '') => {
    const trimmed = code?.trim();
    if (!trimmed) return [];
    if (trimmed === ALL_ZONES_CODE) return [ALL_ZONES_CODE];
    return trimmed.split(ZONE_SEPARATOR).map((zone) => zone.trim()).filter(Boolean);
};

const serializeSupervisorZones = (zones = []) => {
    const cleaned = [...new Set(zones.map((zone) => zone?.trim()).filter(Boolean))];
    if (cleaned.includes(ALL_ZONES_CODE)) return ALL_ZONES_CODE;
    return cleaned.join(ZONE_SEPARATOR);
};

const getSupervisorZoneList = (code = '') =>
    parseSupervisorZones(code).filter((zone) => zone !== ALL_ZONES_CODE);

const isAllZonesCode = (code) => code?.trim() === ALL_ZONES_CODE;

const supervisorCoversZone = (supervisorZone, targetZone) => {
    const zones = parseSupervisorZones(supervisorZone);
    if (zones.includes(ALL_ZONES_CODE)) return true;
    return zones.includes(targetZone);
};

const LEGACY_ROLE_MAP = Object.freeze({
    manager: ROLES.DIRECTOR,
    admin: ROLES.FINANCE_OFFICER,
});

/** English display names for API errors and logs */
const ROLE_DISPLAY_NAMES = Object.freeze({
    [ROLES.SYSTEM_ADMIN]: 'System Admin',
    [ROLES.DIRECTOR]: 'Bahir Dar City Administration',
    [ROLES.SUPERVISOR]: 'Parking Supervisor',
    [ROLES.FINANCE_OFFICER]: 'Finance Officer',
    [ROLES.VALET]: 'Valet Attendant',
});

const normalizeRole = (type) => LEGACY_ROLE_MAP[type] || type;

const getRoleDisplayName = (type) => {
    const role = normalizeRole(type);
    return ROLE_DISPLAY_NAMES[role] || role || 'Unknown';
};

const isStaffShellRole = (type) => STAFF_SHELL_ROLES.includes(normalizeRole(type));

const isOfficeStaff = (type) => OFFICE_STAFF_TYPES.includes(normalizeRole(type));

const isStaffManager = (type) => STAFF_MANAGEMENT_ROLES.includes(normalizeRole(type));

const hasOfficeWideDataAccess = (type) => OFFICE_WIDE_DATA_ROLES.includes(normalizeRole(type));

const requiresZoneCode = (type) => {
    const role = normalizeRole(type);
    return role === ROLES.VALET || role === ROLES.SUPERVISOR;
};

const requiresPriceLevel = (type) => normalizeRole(type) === ROLES.VALET;

const canCreateRole = (actorType, targetType) => {
    const actor = normalizeRole(actorType);
    const target = normalizeRole(targetType);
    return (CREATABLE_BY[actor] || []).includes(target);
};

const canManageUser = (actor, target) => {
    if (!actor || !target) return false;

    const actorType = normalizeRole(actor.type);
    const targetType = normalizeRole(target.type);

    if (actor._id.toString() === target._id.toString()) {
        return true;
    }

    if (actorType === ROLES.SYSTEM_ADMIN) {
        return true;
    }

    if (actorType === ROLES.DIRECTOR && targetType !== ROLES.SYSTEM_ADMIN) {
        return true;
    }

    if (
        actorType === ROLES.SUPERVISOR
        && targetType === ROLES.VALET
        && actor.parkZoneCode
        && supervisorCoversZone(actor.parkZoneCode, target.parkZoneCode)
    ) {
        return true;
    }

    return false;
};

const assertCanManageUser = (actor, target) => {
    if (!canManageUser(actor, target)) {
        throw new Error('Not authorized to manage this user');
    }
};

module.exports = {
    ROLES,
    ALL_ZONES_CODE,
    parseSupervisorZones,
    serializeSupervisorZones,
    getSupervisorZoneList,
    isAllZonesCode,
    supervisorCoversZone,
    ALL_USER_TYPES,
    STAFF_SHELL_ROLES,
    OFFICE_STAFF_TYPES,
    ROLE_RANK,
    STAFF_MANAGEMENT_ROLES,
    REPORT_ACCESS_ROLES,
    OFFICE_WIDE_DATA_ROLES,
    SMS_SENDER_ROLES,
    CREATABLE_BY,
    LEGACY_ROLE_MAP,
    ROLE_DISPLAY_NAMES,
    normalizeRole,
    getRoleDisplayName,
    isStaffShellRole,
    isOfficeStaff,
    isStaffManager,
    hasOfficeWideDataAccess,
    requiresZoneCode,
    requiresPriceLevel,
    canCreateRole,
    canManageUser,
    assertCanManageUser,
};
