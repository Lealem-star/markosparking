import { isAllZonesCode, supervisorCoversZone } from '../../../../constants/roles';

export const CAR_TYPES = ['tripod', 'automobile', 'truck', 'trailer', 'special_vehicles'];

export const getPriceLevelColor = (index) => {
    const colors = [
        { bg: '#ede9fe', text: '#7c3aed', border: '#ddd6fe' },
        { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
        { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' },
        { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' },
    ];
    return colors[index % colors.length];
};

export const normalizeZoneCodeKey = (code = '') => code?.trim().toUpperCase() || '';

export const buildZonePriceLevelMappings = (users = [], parkZones = []) => {
    const activeZones = parkZones.filter((zone) => zone?.code && zone?.isActive !== false);
    const map = {};

    activeZones.forEach((zone) => {
        map[normalizeZoneCodeKey(zone.code)] = {
            zoneCode: zone.code,
            zoneName: zone.name,
            location: zone.location,
            priceLevelName: zone.priceLevel || null,
            valetCount: 0,
        };
    });

    users
        .filter((u) => u?.type === 'valet' && u?.parkZoneCode && u?.isActive !== false)
        .forEach((u) => {
            const zoneKey = normalizeZoneCodeKey(u.parkZoneCode);
            const entry = map[zoneKey];
            if (!entry) return;

            entry.valetCount += 1;
            if (
                u.priceLevel
                && entry.priceLevelName
                && entry.priceLevelName !== u.priceLevel
            ) {
                entry.hasConflict = true;
            } else if (!entry.priceLevelName && u.priceLevel) {
                entry.priceLevelName = u.priceLevel;
            }
        });

    return Object.values(map).sort((a, b) => a.zoneName.localeCompare(b.zoneName));
};

export const buildPricingGroups = (priceLevels, users = []) => {
    const zoneMap = {};

    users
        .filter((u) => u?.type === 'valet' && u?.parkZoneCode && u?.isActive !== false)
        .forEach((u) => {
            if (!zoneMap[u.parkZoneCode]) {
                zoneMap[u.parkZoneCode] = u.priceLevel || null;
            }
        });

    const zoneGroups = Object.entries(zoneMap).map(([zoneCode, priceLevelName]) => ({
        id: `zone-${zoneCode}`,
        zoneCode,
        priceLevelName: priceLevelName || 'Unassigned',
        pricing: priceLevelName ? priceLevels[priceLevelName] || {} : {},
        groupType: 'zone',
    }));

    if (zoneGroups.length > 0) {
        return zoneGroups;
    }

    return Object.keys(priceLevels).map((priceLevelName) => ({
        id: `level-${priceLevelName}`,
        zoneCode: priceLevelName,
        priceLevelName,
        pricing: priceLevels[priceLevelName] || {},
        groupType: 'level',
    }));
};

export const getPricingStats = (priceLevels, users = [], lastUpdated, parkZones = []) => {
    const activeZones = parkZones.filter((zone) => zone?.isActive !== false);

    return {
        totalZones: activeZones.length,
        priceLevelCount: Object.keys(priceLevels).length,
        carTypeCount: CAR_TYPES.length,
        lastUpdated,
    };
};

export const filterPricingGroups = (groups, { searchQuery, zoneFilter, priceLevelFilter }) => {
    const query = searchQuery.trim().toLowerCase();

    return groups.filter((group) => {
        const matchesSearch =
            !query ||
            group.zoneCode.toLowerCase().includes(query) ||
            group.priceLevelName.toLowerCase().includes(query) ||
            CAR_TYPES.some((type) => type.includes(query));

        const matchesZone = zoneFilter === 'all' || group.zoneCode === zoneFilter;
        const matchesLevel = priceLevelFilter === 'all' || group.priceLevelName === priceLevelFilter;

        return matchesSearch && matchesZone && matchesLevel;
    });
};

export const getUniquePriceLevels = (priceLevels) => Object.keys(priceLevels).sort();

export const getUniqueZones = (users, parkZones = []) => {
    const fromApi = parkZones
        .filter((zone) => zone?.code && zone?.isActive !== false)
        .map((zone) => zone.code);

    if (fromApi.length > 0) {
        return [...new Set(fromApi)].sort();
    }

    return [...new Set(
        users
            .filter((u) => u?.type === 'valet' && u?.parkZoneCode && u?.isActive !== false)
            .map((u) => u.parkZoneCode)
            .filter(Boolean)
    )].sort();
};

export const formatPricingValue = (value) => {
    const num = parseFloat(value);
    if (Number.isNaN(num)) return '0.00';
    return num.toFixed(2);
};

export const getStaffForParkingZone = (users = [], zoneCode = '') => {
    const normalized = zoneCode?.trim();
    if (!normalized) {
        return { supervisors: [], valets: [] };
    }

    const normalizedUpper = normalized.toUpperCase();

    const supervisors = users.filter((user) => {
        if (user?.type !== 'supervisor' || user?.isActive === false) return false;
        return isAllZonesCode(user.parkZoneCode) || supervisorCoversZone(user.parkZoneCode, normalized);
    });

    const valets = users.filter((user) => {
        if (user?.type !== 'valet' || user?.isActive === false) return false;
        return user.parkZoneCode?.trim().toUpperCase() === normalizedUpper;
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
