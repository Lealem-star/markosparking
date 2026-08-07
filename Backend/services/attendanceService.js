const { Types } = require('mongoose');
const User = require('../models/userSchema');
const ParkZone = require('../models/parkZoneSchema');
const AttendanceRecord = require('../models/attendanceRecordSchema');
const AttendanceAuditLog = require('../models/attendanceAuditLogSchema');
const AppError = require('../errors/AppError');
const {
    ROLES,
    isAllZonesCode,
    getSupervisorZoneList,
    supervisorCoversZone,
} = require('../constants/roles');
const {
    ATTENDANCE_SESSIONS,
    normalizeAttendanceSession,
    DEFAULT_ATTENDANCE_SESSION,
} = require('../constants/attendanceSessions');

const NOT_MARKED = 'not_marked';
const ADMIN_EDIT_ROLES = [ROLES.SYSTEM_ADMIN, ROLES.DIRECTOR];
const MARKABLE_STATUSES = ['present', 'late', 'leave', 'excused'];

const ETHIOPIA_UTC_OFFSET_HOURS = 3;

const getTodayDateKey = () => {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const ethiopia = new Date(utcMs + ETHIOPIA_UTC_OFFSET_HOURS * 3600000);
    const year = ethiopia.getFullYear();
    const month = String(ethiopia.getMonth() + 1).padStart(2, '0');
    const day = String(ethiopia.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const normalizeDateKey = (dateKey) => {
    const value = (dateKey || getTodayDateKey()).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new AppError('Invalid date format. Use YYYY-MM-DD.', 400);
    }
    return value;
};

const resolveAttendanceSession = (sessionInput) => {
    const session = normalizeAttendanceSession(sessionInput);
    if (!session) {
        throw new AppError(`Invalid attendance session. Use one of: ${ATTENDANCE_SESSIONS.join(', ')}`, 400);
    }
    return session;
};

const assertSupervisor = (user) => {
    if (!user || user.type !== ROLES.SUPERVISOR) {
        throw new AppError('Only parking supervisors can record attendance', 403);
    }
};

const canEditAttendanceForDate = (user, dateKey) => {
    if (ADMIN_EDIT_ROLES.includes(user.type)) return true;
    if (user.type === ROLES.SUPERVISOR) {
        return dateKey === getTodayDateKey();
    }
    return false;
};

const assertCanRecordAttendance = (user, dateKey) => {
    if (!canEditAttendanceForDate(user, dateKey)) {
        throw new AppError('Attendance can only be edited for today', 403);
    }
};

const getSupervisorZoneCodes = (supervisor) => {
    const code = supervisor?.parkZoneCode?.trim();
    if (!code) return [];
    if (isAllZonesCode(code)) return null;
    return getSupervisorZoneList(code);
};

const buildOfficerQueryForSupervisor = (supervisor) => {
    const query = {
        type: ROLES.VALET,
        isActive: { $ne: false },
    };

    const zones = getSupervisorZoneCodes(supervisor);
    if (zones === null) {
        return query;
    }
    if (zones.length === 1) {
        query.parkZoneCode = zones[0];
    } else if (zones.length > 1) {
        query.parkZoneCode = { $in: zones };
    } else {
        query.parkZoneCode = '__none__';
    }

    return query;
};

const assertOfficerInSupervisorScope = (supervisor, officer) => {
    if (!officer || officer.type !== ROLES.VALET) {
        throw new AppError('Officer not found', 404);
    }
    if (!supervisorCoversZone(supervisor.parkZoneCode, officer.parkZoneCode)) {
        throw new AppError('Officer is not in your assigned zones', 403);
    }
};

const writeAuditLog = async ({
    attendanceRecordId,
    officerId,
    dateKey,
    changedBy,
    previousStatus,
    newStatus,
    action = 'status_update',
}) => {
    await AttendanceAuditLog.create({
        attendanceRecordId,
        officerId,
        dateKey,
        changedBy: changedBy._id,
        previousStatus,
        newStatus,
        action,
    });
};

const resolveZoneLabel = (zoneCode, zoneMap) => {
    const zone = zoneMap.get(zoneCode?.toUpperCase());
    if (zone?.name) return `${zone.name} (${zone.code})`;
    return zoneCode || '—';
};

const computeStats = (officers) => {
    const stats = {
        expected: officers.length,
        present: 0,
        late: 0,
        leave: 0,
        excused: 0,
        absent: 0,
        notMarked: 0,
    };

    officers.forEach((officer) => {
        const status = officer.status || NOT_MARKED;
        if (status === NOT_MARKED) {
            stats.notMarked += 1;
        } else if (status === 'excused') {
            stats.excused += 1;
        } else if (stats[status] !== undefined) {
            stats[status] += 1;
        }
    });

    const marked = stats.expected - stats.notMarked;
    const percent = stats.expected > 0 ? Math.round((marked / stats.expected) * 100) : 0;

    return {
        stats,
        progress: {
            marked,
            total: stats.expected,
            percent,
        },
    };
};

const getAttendanceSession = async (currentUser, dateKeyInput, sessionInput) => {
    assertSupervisor(currentUser);
    const dateKey = normalizeDateKey(dateKeyInput);
    const session = resolveAttendanceSession(sessionInput);

    const officers = await User.find(buildOfficerQueryForSupervisor(currentUser))
        .select('name phoneNumber parkZoneCode profilePhoto')
        .sort({ parkZoneCode: 1, name: 1 });

    const officerIds = officers.map((o) => o._id);
    const records = officerIds.length > 0
        ? await AttendanceRecord.find({ officerId: { $in: officerIds }, dateKey, session })
        : [];

    const recordByOfficer = new Map(
        records.map((record) => [record.officerId.toString(), record])
    );

    const zones = await ParkZone.find({ isActive: { $ne: false } }).select('code name');
    const zoneMap = new Map(zones.map((z) => [z.code.toUpperCase(), z]));

    const supervisorZones = getSupervisorZoneCodes(currentUser);
    const assignedZones = supervisorZones === null
        ? zones.map((z) => ({
            code: z.code,
            name: z.name,
            label: resolveZoneLabel(z.code, zoneMap),
        }))
        : supervisorZones.map((code) => ({
            code,
            name: zoneMap.get(code.toUpperCase())?.name || code,
            label: resolveZoneLabel(code, zoneMap),
        }));

    const enrichedOfficers = officers.map((officer) => {
        const record = recordByOfficer.get(officer._id.toString());
        return {
            _id: officer._id,
            name: officer.name,
            phoneNumber: officer.phoneNumber,
            parkZoneCode: officer.parkZoneCode,
            profilePhoto: officer.profilePhoto,
            status: record?.status || NOT_MARKED,
            recordId: record?._id || null,
        };
    });

    const zoneGroupsMap = new Map();
    assignedZones.forEach((zone) => {
        zoneGroupsMap.set(zone.code.toUpperCase(), {
            code: zone.code,
            name: zone.name,
            label: zone.label,
            officers: [],
        });
    });

    enrichedOfficers.forEach((officer) => {
        const key = (officer.parkZoneCode || '').toUpperCase();
        if (!zoneGroupsMap.has(key)) {
            zoneGroupsMap.set(key, {
                code: officer.parkZoneCode,
                name: zoneMap.get(key)?.name || officer.parkZoneCode,
                label: resolveZoneLabel(officer.parkZoneCode, zoneMap),
                officers: [],
            });
        }
        zoneGroupsMap.get(key).officers.push(officer);
    });

    const zoneGroups = [...zoneGroupsMap.values()]
        .filter((group) => group.officers.length > 0)
        .sort((a, b) => a.code.localeCompare(b.code));

    const { stats, progress } = computeStats(enrichedOfficers);

    return {
        date: dateKey,
        session,
        assignedZones,
        zones: zoneGroups,
        officers: enrichedOfficers,
        stats,
        progress,
        canEdit: canEditAttendanceForDate(currentUser, dateKey),
    };
};

const updateOfficerStatus = async (currentUser, officerId, { dateKey: dateKeyInput, session: sessionInput, status }) => {
    assertSupervisor(currentUser);
    const dateKey = normalizeDateKey(dateKeyInput);
    const session = resolveAttendanceSession(sessionInput);
    assertCanRecordAttendance(currentUser, dateKey);

    if (!MARKABLE_STATUSES.includes(status)) {
        throw new AppError('Invalid attendance status', 400);
    }

    if (!Types.ObjectId.isValid(officerId)) {
        throw new AppError('Invalid officer id', 400);
    }

    const officer = await User.findById(officerId);
    assertOfficerInSupervisorScope(currentUser, officer);

    const existing = await AttendanceRecord.findOne({ officerId, dateKey, session });
    const previousStatus = existing?.status || NOT_MARKED;

    let record;
    if (existing) {
        existing.status = status;
        existing.supervisorId = currentUser._id;
        existing.parkZoneCode = officer.parkZoneCode;
        await existing.save();
        record = existing;
    } else {
        record = await AttendanceRecord.create({
            officerId,
            supervisorId: currentUser._id,
            dateKey,
            session,
            parkZoneCode: officer.parkZoneCode,
            status,
        });
    }

    await writeAuditLog({
        attendanceRecordId: record._id,
        officerId,
        dateKey,
        changedBy: currentUser,
        previousStatus,
        newStatus: status,
        action: 'status_update',
    });

    return {
        officerId,
        dateKey,
        session,
        status,
        recordId: record._id,
    };
};

const finishAttendance = async (currentUser, { dateKey: dateKeyInput, session: sessionInput, markRemainingAbsent }) => {
    assertSupervisor(currentUser);
    const dateKey = normalizeDateKey(dateKeyInput);
    const session = resolveAttendanceSession(sessionInput);
    assertCanRecordAttendance(currentUser, dateKey);

    const attendanceSession = await getAttendanceSession(currentUser, dateKey, session);
    const notMarkedOfficers = attendanceSession.officers.filter((o) => o.status === NOT_MARKED);

    if (notMarkedOfficers.length === 0) {
        return {
            dateKey,
            session,
            updatedCount: 0,
            stats: attendanceSession.stats,
            progress: attendanceSession.progress,
        };
    }

    if (!markRemainingAbsent) {
        throw new AppError('Some officers are still not marked', 400);
    }

    const bulkOps = [];
    for (const officer of notMarkedOfficers) {
        bulkOps.push(
            AttendanceRecord.findOneAndUpdate(
                { officerId: officer._id, dateKey, session },
                {
                    officerId: officer._id,
                    supervisorId: currentUser._id,
                    dateKey,
                    session,
                    parkZoneCode: officer.parkZoneCode,
                    status: 'absent',
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            ).then(async (record) => {
                await writeAuditLog({
                    attendanceRecordId: record._id,
                    officerId: officer._id,
                    dateKey,
                    changedBy: currentUser,
                    previousStatus: NOT_MARKED,
                    newStatus: 'absent',
                    action: 'finish_absent',
                });
            })
        );
    }

    await Promise.all(bulkOps);

    const refreshed = await getAttendanceSession(currentUser, dateKey, session);
    return {
        dateKey,
        session,
        updatedCount: notMarkedOfficers.length,
        stats: refreshed.stats,
        progress: refreshed.progress,
    };
};

module.exports = {
    NOT_MARKED,
    MARKABLE_STATUSES,
    ATTENDANCE_SESSIONS,
    DEFAULT_ATTENDANCE_SESSION,
    getTodayDateKey,
    getAttendanceSession,
    updateOfficerStatus,
    finishAttendance,
};
