const ZONE_SORT_OPTIONS = { numeric: true, sensitivity: 'base' };

export const getZoneSortKey = (value) => {
    if (typeof value === 'string') return value.trim();
    return (value?.code || value?.name || '').trim();
};

export const compareZoneCodes = (a, b) =>
    getZoneSortKey(a).localeCompare(getZoneSortKey(b), undefined, ZONE_SORT_OPTIONS);

export const sortByZoneCode = (items) =>
    [...items].sort((a, b) => compareZoneCodes(a, b));

export const sortZoneCodeStrings = (codes) =>
    [...codes].sort((a, b) => compareZoneCodes(a, b));
