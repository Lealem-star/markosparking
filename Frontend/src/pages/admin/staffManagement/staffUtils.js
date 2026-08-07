import {
    OFFICE_STAFF_TYPES,
    ROLES,
    VALET_ROLE,
    normalizeRole,
    isAllZonesCode,
    parseSupervisorZones,
    getSupervisorZoneList,
    supervisorCoversZone,
} from '../../../constants/roles';

export const getActiveParkZones = (parkZones = []) =>
    parkZones.filter((zone) => zone?.code && zone?.isActive !== false);

export const resolveParkZoneCode = (code = '', parkZones = []) => {
    const trimmed = code?.trim();
    if (!trimmed) return '';

    const match = getActiveParkZones(parkZones).find(
        (zone) => zone.code.toUpperCase() === trimmed.toUpperCase()
    );
    return match?.code || trimmed;
};

export const buildValetZoneOptions = (parkZones = []) =>
    getActiveParkZones(parkZones)
        .map((zone) => ({
            code: zone.code,
            name: zone.name,
            priceLevel: zone.priceLevel?.trim() || '',
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

export const getPriceLevelForParkZone = (parkZoneCode = '', parkZones = []) => {
    const resolved = resolveParkZoneCode(parkZoneCode, parkZones);
    if (!resolved) return '';

    const zone = getActiveParkZones(parkZones).find(
        (entry) => entry.code.toUpperCase() === resolved.toUpperCase()
    );
    return zone?.priceLevel?.trim() || '';
};

export const buildSupervisorZoneOptions = (parkZones = [], legacyZones = [], currentCode = '') => {
    const optionsMap = new Map();

    getActiveParkZones(parkZones).forEach((zone) => {
        optionsMap.set(zone.code.toUpperCase(), {
            code: zone.code,
            name: zone.name,
            legacy: false,
        });
    });

    [...legacyZones, ...getSupervisorZoneList(currentCode)].forEach((code) => {
        const trimmed = code?.trim();
        if (!trimmed || isAllZonesCode(trimmed)) return;

        const key = trimmed.toUpperCase();
        if (!optionsMap.has(key)) {
            optionsMap.set(key, {
                code: resolveParkZoneCode(trimmed, parkZones) || trimmed,
                name: trimmed,
                legacy: true,
            });
        }
    });

    return Array.from(optionsMap.values()).sort((a, b) => a.code.localeCompare(b.code));
};

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
        const matchesZone =
            zoneFilter === 'all' ||
            (zoneFilter === 'all_zones' && isManagerial(item)) ||
            supervisorCoversZone(zone, zoneFilter);

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

export const getUniqueZones = (users, parkZones = []) => {
    const fromApi = parkZones
        .filter((zone) => zone?.code && zone?.isActive !== false)
        .map((zone) => zone.code);

    if (fromApi.length > 0) {
        return [...new Set(fromApi)].sort();
    }

    return [...new Set(
        users
            .filter((u) => normalizeRole(u?.type) === ROLES.VALET)
            .map((u) => u?.parkZoneCode)
            .filter(Boolean)
    )].sort();
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

export const getStaffForParkingZone = (users = [], zoneCode = '', parkZones = []) => {
    const resolvedZone = resolveParkZoneCode(zoneCode, parkZones) || zoneCode?.trim();
    if (!resolvedZone) {
        return { supervisors: [], valets: [] };
    }

    const zoneUpper = resolvedZone.toUpperCase();

    const supervisors = users.filter((user) => {
        if (normalizeRole(user?.type) !== ROLES.SUPERVISOR || !isStaffActive(user)) return false;
        return isAllZonesCode(user.parkZoneCode) || supervisorCoversZone(user.parkZoneCode, resolvedZone);
    });

    const valets = users.filter((user) => {
        if (normalizeRole(user?.type) !== ROLES.VALET || !isStaffActive(user)) return false;
        const valetZone = resolveParkZoneCode(user.parkZoneCode, parkZones) || user.parkZoneCode?.trim();
        return valetZone?.toUpperCase() === zoneUpper;
    });

    return { supervisors, valets };
};

export const formatSupervisorNames = (supervisors = [], t) => {
    if (!supervisors.length) {
        return t('settings.noSupervisorAssigned');
    }

    return supervisors
        .map((supervisor) => {
            if (isAllZonesCode(supervisor.parkZoneCode)) {
                return `${supervisor.name} (${t('admin.allZonesLabel')})`;
            }
            return supervisor.name;
        })
        .join(', ');
};
