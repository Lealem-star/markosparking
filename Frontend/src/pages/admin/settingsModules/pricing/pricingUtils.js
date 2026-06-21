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

export const buildPricingGroups = (priceLevels, users = []) => {
    const zoneMap = {};

    users
        .filter((u) => u?.type === 'valet' && u?.parkZoneCode)
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

export const getPricingStats = (priceLevels, users = [], lastUpdated) => {
    const zones = new Set(
        users.filter((u) => u?.type === 'valet' && u?.parkZoneCode).map((u) => u.parkZoneCode)
    );

    return {
        totalZones: zones.size || Object.keys(priceLevels).length,
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

export const getUniqueZones = (users) => [
    ...new Set(users.filter((u) => u?.type === 'valet' && u?.parkZoneCode).map((u) => u.parkZoneCode)),
].sort();

export const formatPricingValue = (value) => {
    const num = parseFloat(value);
    if (Number.isNaN(num)) return '0.00';
    return num.toFixed(2);
};
