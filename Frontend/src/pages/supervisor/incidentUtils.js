export const INCIDENT_TYPES = [
    'customer_complaint',
    'vehicle_damage',
    'wrong_registration',
    'traffic_obstruction',
    'illegal_parking',
    'equipment_failure',
    'payment_issue',
];

export const INCIDENT_STATUSES = ['open', 'assigned', 'resolved'];

export const INCIDENT_STATUS_BADGE = Object.freeze({
    open: 'incident-badge--open',
    assigned: 'incident-badge--assigned',
    resolved: 'incident-badge--resolved',
});

export const formatIncidentDate = (value, locale) => {
    if (!value) return '—';
    return new Date(value).toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const filterOfficersForZone = (officers = [], zoneCode) => {
    if (!zoneCode) return officers;
    return officers.filter(
        (officer) => (officer?.parkZoneCode || '').toUpperCase() === zoneCode.toUpperCase()
    );
};

export const getDefaultIncidentZone = (assignedZones = []) => {
    if (assignedZones.length === 1) return assignedZones[0].code;
    return '';
};
