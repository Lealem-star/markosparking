const { Types } = require('mongoose');
const Incident = require('../models/incidentSchema');
const User = require('../models/userSchema');
const ParkZone = require('../models/parkZoneSchema');
const AppError = require('../errors/AppError');
const {
    ROLES,
    isAllZonesCode,
    getSupervisorZoneList,
    supervisorCoversZone,
    normalizeRole,
} = require('../constants/roles');

const INCIDENT_VIEW_ROLES = [
    ROLES.SUPERVISOR,
    ROLES.DIRECTOR,
    ROLES.SYSTEM_ADMIN,
];

const hasOfficeWideIncidentView = (user) => {
    const role = normalizeRole(user?.type);
    return role === ROLES.DIRECTOR || role === ROLES.SYSTEM_ADMIN;
};

const assertCanViewIncidents = (user) => {
    const role = normalizeRole(user?.type);
    if (!INCIDENT_VIEW_ROLES.includes(role)) {
        throw new AppError('Access denied', 403);
    }
};

const populateIncident = (query) => query
    .populate('createdBy', 'name phoneNumber type')
    .populate('assignedOfficerId', 'name phoneNumber parkZoneCode')
    .populate('resolvedBy', 'name phoneNumber type');

const assertSupervisor = (user) => {
    if (!user || user.type !== ROLES.SUPERVISOR) {
        throw new AppError('Only parking supervisors can manage incidents', 403);
    }
};

const getSupervisorZoneCodes = (supervisor) => {
    const code = supervisor?.parkZoneCode?.trim();
    if (!code) return [];
    if (isAllZonesCode(code)) return null;
    return getSupervisorZoneList(code);
};

const assertZoneInSupervisorScope = (supervisor, zoneCode) => {
    if (!zoneCode?.trim()) {
        throw new AppError('Park zone is required', 400);
    }
    if (!supervisorCoversZone(supervisor.parkZoneCode, zoneCode)) {
        throw new AppError('Zone is not in your assigned areas', 403);
    }
};

const buildZoneFilterForUser = (user, zoneCode) => {
    if (hasOfficeWideIncidentView(user)) {
        if (zoneCode && zoneCode !== 'all') {
            return { parkZoneCode: zoneCode.trim() };
        }
        return {};
    }
    return buildZoneFilterForSupervisor(user, zoneCode);
};

const buildZoneFilterForSupervisor = (supervisor, zoneCode) => {
    const zones = getSupervisorZoneCodes(supervisor);

    if (zoneCode && zoneCode !== 'all') {
        assertZoneInSupervisorScope(supervisor, zoneCode);
        return { parkZoneCode: zoneCode.trim() };
    }

    if (zones === null) {
        return {};
    }
    if (zones.length === 1) {
        return { parkZoneCode: zones[0] };
    }
    if (zones.length > 1) {
        return { parkZoneCode: { $in: zones } };
    }
    return { parkZoneCode: '__none__' };
};

const assertOfficerInSupervisorScope = (supervisor, officer, incidentZone) => {
    if (!officer || officer.type !== ROLES.VALET || officer.isActive === false) {
        throw new AppError('Officer not found', 404);
    }
    if (!supervisorCoversZone(supervisor.parkZoneCode, officer.parkZoneCode)) {
        throw new AppError('Officer is not in your assigned zones', 403);
    }
    if (incidentZone && officer.parkZoneCode?.toUpperCase() !== incidentZone.toUpperCase()) {
        throw new AppError('Officer must belong to the incident zone', 400);
    }
};

const serializeIncident = (incident, zoneMap) => {
    const obj = incident.toObject ? incident.toObject() : incident;
    const zone = zoneMap.get(obj.parkZoneCode?.toUpperCase());
    return {
        ...obj,
        zoneLabel: zone?.name ? `${zone.name} (${zone.code})` : obj.parkZoneCode,
    };
};

const getZoneMap = async () => {
    const zones = await ParkZone.find({ isActive: { $ne: false } }).select('code name');
    return new Map(zones.map((z) => [z.code.toUpperCase(), z]));
};

const findIncidentForSupervisor = async (supervisor, incidentId) => {
    if (!Types.ObjectId.isValid(incidentId)) {
        throw new AppError('Invalid incident id', 400);
    }

    const incident = await populateIncident(Incident.findById(incidentId));
    if (!incident) {
        throw new AppError('Incident not found', 404);
    }

    assertZoneInSupervisorScope(supervisor, incident.parkZoneCode);
    return incident;
};

const listIncidents = async (user, { status, type, zone, search } = {}) => {
    assertCanViewIncidents(user);

    const query = buildZoneFilterForUser(user, zone);

    if (status && status !== 'all') {
        query.status = status;
    }
    if (type && type !== 'all') {
        query.type = type;
    }

    let incidents = await populateIncident(
        Incident.find(query).sort({ createdAt: -1 })
    );

    const searchTerm = search?.trim().toLowerCase();
    if (searchTerm) {
        incidents = incidents.filter((incident) => {
            const haystack = [
                incident.description,
                incident.resolutionNotes,
                incident.assignedOfficerId?.name,
                incident.parkZoneCode,
            ].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(searchTerm);
        });
    }

    const zoneMap = await getZoneMap();
    const serialized = incidents.map((incident) => serializeIncident(incident, zoneMap));

    const stats = serialized.reduce(
        (acc, incident) => {
            acc.total += 1;
            if (acc[incident.status] !== undefined) {
                acc[incident.status] += 1;
            }
            return acc;
        },
        { total: 0, open: 0, assigned: 0, resolved: 0 }
    );

    const supervisorZones = hasOfficeWideIncidentView(user)
        ? null
        : getSupervisorZoneCodes(user);
    const allZones = await ParkZone.find({ isActive: { $ne: false } }).select('code name');
    const assignedZones = supervisorZones === null
        ? allZones.map((z) => ({
            code: z.code,
            name: z.name,
            label: z.name ? `${z.name} (${z.code})` : z.code,
        }))
        : supervisorZones.map((code) => {
            const zone = allZones.find((z) => z.code.toUpperCase() === code.toUpperCase());
            return {
                code,
                name: zone?.name || code,
                label: zone?.name ? `${zone.name} (${code})` : code,
            };
        });

    return { incidents: serialized, stats, assignedZones };
};

const createIncident = async (supervisor, { type, description, parkZoneCode }) => {
    assertSupervisor(supervisor);
    assertZoneInSupervisorScope(supervisor, parkZoneCode);

    const incident = await Incident.create({
        type,
        description: description.trim(),
        parkZoneCode: parkZoneCode.trim(),
        status: 'open',
        createdBy: supervisor._id,
    });

    const zoneMap = await getZoneMap();
    const populated = await populateIncident(Incident.findById(incident._id));
    return serializeIncident(populated, zoneMap);
};

const assignIncident = async (supervisor, incidentId, { officerId }) => {
    assertSupervisor(supervisor);

    if (!Types.ObjectId.isValid(officerId)) {
        throw new AppError('Invalid officer id', 400);
    }

    const incident = await findIncidentForSupervisor(supervisor, incidentId);
    if (incident.status === 'resolved') {
        throw new AppError('Resolved incidents cannot be reassigned', 400);
    }

    const officer = await User.findById(officerId);
    assertOfficerInSupervisorScope(supervisor, officer, incident.parkZoneCode);

    incident.assignedOfficerId = officer._id;
    incident.assignedAt = new Date();
    incident.status = 'assigned';
    await incident.save();

    const zoneMap = await getZoneMap();
    const populated = await populateIncident(Incident.findById(incident._id));
    return serializeIncident(populated, zoneMap);
};

const resolveIncident = async (supervisor, incidentId, { resolutionNotes }) => {
    assertSupervisor(supervisor);

    const incident = await findIncidentForSupervisor(supervisor, incidentId);
    if (incident.status === 'resolved') {
        throw new AppError('Incident is already resolved', 400);
    }

    incident.status = 'resolved';
    incident.resolvedAt = new Date();
    incident.resolvedBy = supervisor._id;
    incident.resolutionNotes = (resolutionNotes || '').trim();
    await incident.save();

    const zoneMap = await getZoneMap();
    const populated = await populateIncident(Incident.findById(incident._id));
    return serializeIncident(populated, zoneMap);
};

module.exports = {
    listIncidents,
    createIncident,
    assignIncident,
    resolveIncident,
};
