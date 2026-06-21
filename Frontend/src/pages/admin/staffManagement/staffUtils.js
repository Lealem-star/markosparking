export const MANAGERIAL_TYPES = ['system_admin', 'manager', 'admin'];
export const VALET_TYPE = 'valet';

export const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const getRoleLabel = (type, t) => {
    switch (type) {
        case 'system_admin':
            return t('admin.systemAdmin');
        case 'manager':
            return t('admin.manager');
        case 'admin':
            return t('admin.admin');
        case 'valet':
            return t('admin.valet');
        default:
            return type || '—';
    }
};

export const getRoleSubtitle = (type, t) => {
    switch (type) {
        case 'system_admin':
            return t('admin.systemAdminSubtitle');
        case 'manager':
            return t('admin.managerSubtitle');
        case 'admin':
            return t('admin.adminSubtitle');
        case 'valet':
            return t('admin.valetSubtitle');
        default:
            return '';
    }
};

export const getZoneLabel = (staffMember, t) => {
    if (staffMember?.type === VALET_TYPE) {
        return staffMember?.parkZoneCode || t('admin.unknownZone');
    }
    return t('admin.allZonesLabel');
};

export const isManagerial = (user) => MANAGERIAL_TYPES.includes(user?.type);

export const filterStaff = (users, { searchQuery, roleFilter, zoneFilter, statusFilter }) => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((item) => {
        const matchesSearch =
            !query ||
            (item?.name || '').toLowerCase().includes(query) ||
            (item?.phoneNumber || '').toLowerCase().includes(query);

        const matchesRole = roleFilter === 'all' || item?.type === roleFilter;

        const zone = item?.parkZoneCode || '';
        const matchesZone =
            zoneFilter === 'all' ||
            (zoneFilter === 'all_zones' && isManagerial(item)) ||
            zone === zoneFilter;

        const matchesStatus = statusFilter === 'all' || statusFilter === 'active';

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

    return Object.keys(grouped)
        .sort((a, b) => a.localeCompare(b))
        .map((zoneCode) => ({ zoneCode, staff: grouped[zoneCode] }));
};

export const getStaffStats = (users) => {
    const valets = users.filter((u) => u?.type === VALET_TYPE);
    const managers = users.filter((u) => MANAGERIAL_TYPES.includes(u?.type));
    const zoneSet = new Set(
        valets.map((v) => v?.parkZoneCode).filter(Boolean)
    );

    return {
        totalStaff: users.length,
        managers: managers.length,
        valets: valets.length,
        activeZones: zoneSet.size,
    };
};

export const getUniqueZones = (users) => {
    return [...new Set(
        users
            .filter((u) => u?.type === VALET_TYPE && u?.parkZoneCode)
            .map((u) => u.parkZoneCode)
    )].sort();
};
