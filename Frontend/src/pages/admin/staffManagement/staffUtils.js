import {
    OFFICE_STAFF_TYPES,
    ROLES,
    VALET_ROLE,
    normalizeRole,
    isAllZonesCode,
    parseSupervisorZones,
    supervisorCoversZone,
} from '../../../constants/roles';

export const isStaffActive = (staffMember) => staffMember?.isActive !== false;

export const MANAGERIAL_TYPES = [...OFFICE_STAFF_TYPES];
export const VALET_TYPE = VALET_ROLE;

export const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const getRoleLabel = (type, t) => {
    switch (normalizeRole(type)) {
        case ROLES.SYSTEM_ADMIN:
            return t('admin.systemAdmin');
        case ROLES.DIRECTOR:
            return t('admin.director');
        case ROLES.SUPERVISOR:
            return t('admin.supervisor');
        case ROLES.FINANCE_OFFICER:
            return t('admin.financeOfficer');
        case ROLES.VALET:
            return t('admin.valet');
        default:
            return type || '—';
    }
};

export const getRoleSubtitle = (type, t) => {
    switch (normalizeRole(type)) {
        case ROLES.SYSTEM_ADMIN:
            return t('admin.systemAdminResponsibility');
        case ROLES.DIRECTOR:
            return t('admin.directorResponsibility');
        case ROLES.SUPERVISOR:
            return t('admin.supervisorResponsibility');
        case ROLES.FINANCE_OFFICER:
            return t('admin.financeOfficerResponsibility');
        case ROLES.VALET:
            return t('admin.valetSubtitle');
        default:
            return '';
    }
};

export const getZoneLabel = (staffMember, t) => {
    const role = normalizeRole(staffMember?.type);
    if (role === ROLES.VALET || role === ROLES.SUPERVISOR) {
        const zones = parseSupervisorZones(staffMember?.parkZoneCode);
        if (isAllZonesCode(staffMember?.parkZoneCode)) {
            return t('admin.allZonesLabel');
        }
        if (zones.length > 1) {
            return zones.join(', ');
        }
        return zones[0] || staffMember?.parkZoneCode || t('admin.unknownZone');
    }
    return t('admin.allZonesLabel');
};

export const isManagerial = (user) => MANAGERIAL_TYPES.includes(normalizeRole(user?.type));

export const filterStaff = (users, { searchQuery, roleFilter, zoneFilter, statusFilter }) => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((item) => {
        const matchesSearch =
            !query ||
            (item?.name || '').toLowerCase().includes(query) ||
            (item?.phoneNumber || '').toLowerCase().includes(query);

        const matchesRole = roleFilter === 'all' || normalizeRole(item?.type) === roleFilter;

        const zone = item?.parkZoneCode || '';
        const itemZones = parseSupervisorZones(zone);
        const matchesZone =
            zoneFilter === 'all' ||
            (zoneFilter === 'all_zones' && isManagerial(item)) ||
            zone === zoneFilter ||
            itemZones.includes(zoneFilter);

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && isStaffActive(item)) ||
            (statusFilter === 'inactive' && !isStaffActive(item));

        return matchesSearch && matchesRole && matchesZone && matchesStatus;
    });
};

export const groupValetsByZone = (valets) => {
    const grouped = valets.reduce((acc, valet) => {
        const zoneCode = valet?.parkZoneCode || 'No Zone';
        if (!acc[zoneCode]) acc[zoneCode] = [];
        acc[zoneCode].push(valet);
        return acc;
    }, {});

    return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([zoneCode, zoneValets]) => ({ zoneCode, staff: zoneValets }));
};

export const getUniqueZones = (users) => {
    const zones = new Set(
        users
            .filter((u) => normalizeRole(u?.type) === ROLES.VALET)
            .map((u) => u?.parkZoneCode)
            .filter(Boolean)
    );
    return Array.from(zones).sort();
};

export const getStaffStats = (users) => {
    const activeUsers = users.filter(isStaffActive);
    const officeStaff = activeUsers.filter((u) => isManagerial(u));
    const valets = activeUsers.filter((u) => normalizeRole(u?.type) === ROLES.VALET);
    const zones = new Set(valets.map((v) => v?.parkZoneCode).filter(Boolean));

    return {
        total: activeUsers.length,
        officeStaff: officeStaff.length,
        valets: valets.length,
        zones: zones.size,
    };
};

export const filterUsersForStaffMode = (users, currentUser, mode) => {
    if (mode === 'supervisor') {
        const supervisorZones = currentUser?.parkZoneCode;
        return users.filter((u) => {
            if (normalizeRole(u?.type) !== ROLES.VALET) return false;
            return supervisorCoversZone(supervisorZones, u?.parkZoneCode);
        });
    }
    return users;
};
