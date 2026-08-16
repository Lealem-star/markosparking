const ZONE_SORT_OPTIONS = { numeric: true, sensitivity: 'base' };

const getZoneSortKey = (value) => {
    if (typeof value === 'string') return value.trim();
    return (value?.code || value?.name || '').trim();
};

const compareZoneCodes = (a, b) =>
    getZoneSortKey(a).localeCompare(getZoneSortKey(b), undefined, ZONE_SORT_OPTIONS);

const sortByZoneCode = (items) =>
    [...items].sort((a, b) => compareZoneCodes(a, b));

const sortZoneCodeStrings = (codes) =>
    [...codes].sort((a, b) => compareZoneCodes(a, b));

module.exports = {
    compareZoneCodes,
    sortByZoneCode,
    sortZoneCodeStrings,
    getZoneSortKey,
};
