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

export const LEGACY_ROLE_MAP = Object.freeze({
    manager: ROLES.DIRECTOR,
    admin: ROLES.FINANCE_OFFICER,
});

export const normalizeRole = (type) => LEGACY_ROLE_MAP[type] || type;

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
