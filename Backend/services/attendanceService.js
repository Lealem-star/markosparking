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
    normalizeRole,
} = require('../constants/roles');
const {
    ATTENDANCE_SESSIONS,
    normalizeAttendanceSession,
    DEFAULT_ATTENDANCE_SESSION,
} = require('../constants/attendanceSessions');
const { compareZoneCodes } = require('../utils/zoneSort');

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

const ATTENDANCE_VIEW_ROLES = [
    ROLES.SUPERVISOR,
    ROLES.DIRECTOR,
    ROLES.FINANCE_OFFICER,
    ROLES.SYSTEM_ADMIN,
];

const hasOfficeWideAttendanceView = (user) => {
    const role = normalizeRole(user?.type);
    return role === ROLES.DIRECTOR
        || role === ROLES.FINANCE_OFFICER
        || role === ROLES.SYSTEM_ADMIN;
};

const assertCanViewAttendance = (user) => {
    const role = normalizeRole(user?.type);
    if (!ATTENDANCE_VIEW_ROLES.includes(role)) {
        throw new AppError('Access denied', 403);
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

const assertSupervisor = (user) => {
    if (!user || normalizeRole(user.type) !== ROLES.SUPERVISOR) {
        throw new AppError('Only parking supervisors can record attendance', 403);
    }
};

const buildOfficerQueryForUser = (user) => {
    if (hasOfficeWideAttendanceView(user)) {
        return {
            type: ROLES.VALET,
            isActive: { $ne: false },
        };
    }
    return buildOfficerQueryForSupervisor(user);
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
    assertCanViewAttendance(currentUser);
    const dateKey = normalizeDateKey(dateKeyInput);
    const session = resolveAttendanceSession(sessionInput);

    const officers = await User.find(buildOfficerQueryForUser(currentUser))
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

    const supervisorZones = hasOfficeWideAttendanceView(currentUser)
        ? null
        : getSupervisorZoneCodes(currentUser);
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
        .sort((a, b) => compareZoneCodes(a.code, b.code));

    const { stats, progress } = computeStats(enrichedOfficers);

    return {
        date: dateKey,
        session,
        assignedZones,
        zones: zoneGroups,
        officers: enrichedOfficers,
        stats,
        progress,
        canEdit: normalizeRole(currentUser.type) === ROLES.SUPERVISOR
            && canEditAttendanceForDate(currentUser, dateKey),
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

const MAX_PERIOD_DAYS = 92;

const enumerateDateKeys = (startKey, endKey) => {
    const [sy, sm, sd] = startKey.split('-').map(Number);
    const [ey, em, ed] = endKey.split('-').map(Number);
    const dates = [];
    const cursor = new Date(Date.UTC(sy, sm - 1, sd));
    const end = new Date(Date.UTC(ey, em - 1, ed));

    while (cursor <= end) {
        dates.push(
            `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}-${String(cursor.getUTCDate()).padStart(2, '0')}`
        );
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return dates;
};

const resolvePeriodSessions = (sessionFilter) => {
    if (!sessionFilter || sessionFilter === 'all') {
        return [...ATTENDANCE_SESSIONS];
    }
    const session = resolveAttendanceSession(sessionFilter);
    return [session];
};

const buildRecordKey = (officerId, dateKey, session) =>
    `${officerId.toString()}|${dateKey}|${session}`;

const ATTENDANCE_POLICY_THRESHOLDS = Object.freeze({
    minAttendanceRatePercent: 80,
    maxLateSlotsBeforeReview: 3,
    maxAbsentSlotsBeforeReview: 2,
    maxNotMarkedSlotsBeforeReview: 2,
});

const emptyStatusCounts = () => ({
    present: 0,
    late: 0,
    leave: 0,
    excused: 0,
    absent: 0,
    notMarked: 0,
});

const incrementStatusCount = (bucket, status) => {
    if (status === NOT_MARKED) {
        bucket.notMarked += 1;
    } else if (bucket[status] !== undefined) {
        bucket[status] += 1;
    }
};

const addStatusCount = incrementStatusCount;

const buildOfficerFollowUp = (officer, thresholds = ATTENDANCE_POLICY_THRESHOLDS) => {
    const flags = [];
    const reasons = [];

    if (officer.late >= thresholds.maxLateSlotsBeforeReview) {
        flags.push('chronic_lateness');
        reasons.push(`Late ${officer.late} session(s) (review threshold: ${thresholds.maxLateSlotsBeforeReview})`);
    }
    if (officer.absent >= thresholds.maxAbsentSlotsBeforeReview) {
        flags.push('repeat_absence');
        reasons.push(`Unexcused absent ${officer.absent} session(s) (review threshold: ${thresholds.maxAbsentSlotsBeforeReview})`);
    }
    if (officer.notMarked >= thresholds.maxNotMarkedSlotsBeforeReview) {
        flags.push('unmarked_sessions');
        reasons.push(`Not marked ${officer.notMarked} session(s) (review threshold: ${thresholds.maxNotMarkedSlotsBeforeReview})`);
    }
    if (officer.attendanceRate < thresholds.minAttendanceRatePercent) {
        flags.push('low_attendance');
        reasons.push(`Attendance rate ${officer.attendanceRate}% (minimum target: ${thresholds.minAttendanceRatePercent}%)`);
    }

    if (officer.excusedAway >= thresholds.maxAbsentSlotsBeforeReview) {
        flags.push('frequent_approved_absence');
        reasons.push(`Approved away ${officer.excusedAway} session(s) — verify leave documentation`);
    }

    if (flags.length === 0) {
        return null;
    }

    const severity = flags.includes('repeat_absence') || flags.includes('low_attendance')
        ? 'high'
        : 'medium';

    return { flags, reasons, severity };
};

const getAttendancePeriodReport = async (
    currentUser,
    { startDate, endDate, session: sessionFilter = 'all', zone: zoneFilter = 'all' } = {}
) => {
    assertCanViewAttendance(currentUser);

    const startKey = normalizeDateKey(startDate);
    const endKey = normalizeDateKey(endDate);

    if (startKey > endKey) {
        throw new AppError('Start date must be on or before end date', 400);
    }

    const dateKeys = enumerateDateKeys(startKey, endKey);
    if (dateKeys.length > MAX_PERIOD_DAYS) {
        throw new AppError(`Date range cannot exceed ${MAX_PERIOD_DAYS} days`, 400);
    }

    const sessions = resolvePeriodSessions(sessionFilter);
    const expectedSlotsPerOfficer = dateKeys.length * sessions.length;

    const officerQuery = buildOfficerQueryForUser(currentUser);
    if (zoneFilter && zoneFilter !== 'all') {
        officerQuery.parkZoneCode = zoneFilter.trim();
    }

    const officers = await User.find(officerQuery)
        .select('name phoneNumber parkZoneCode profilePhoto isActive')
        .sort({ parkZoneCode: 1, name: 1 });

    const officerIds = officers.map((o) => o._id);
    const records = officerIds.length > 0
        ? await AttendanceRecord.find({
            officerId: { $in: officerIds },
            dateKey: { $gte: startKey, $lte: endKey },
            session: { $in: sessions },
        })
        : [];

    const recordMap = new Map(
        records.map((record) => [
            buildRecordKey(record.officerId, record.dateKey, record.session),
            record.status,
        ])
    );

    const zones = await ParkZone.find({ isActive: { $ne: false } }).select('code name');
    const zoneMap = new Map(zones.map((z) => [z.code.toUpperCase(), z]));

    const dailyTrendMap = new Map(
        dateKeys.map((dateKey) => [dateKey, { dateKey, ...emptyStatusCounts(), expectedSlots: 0 }])
    );
    const sessionTrendMap = new Map(
        ATTENDANCE_SESSIONS.map((session) => [session, { session, ...emptyStatusCounts(), expectedSlots: 0 }])
    );

    const summary = {
        officerCount: officers.length,
        periodDays: dateKeys.length,
        sessionsPerDay: sessions.length,
        expectedSlots: 0,
        present: 0,
        late: 0,
        leave: 0,
        excused: 0,
        absent: 0,
        notMarked: 0,
        attended: 0,
        onTime: 0,
        excusedAway: 0,
        unexcusedAbsent: 0,
        absenceRate: 0,
        punctualityRate: 0,
        attendanceRate: 0,
    };

    const officerRows = officers.map((officer) => {
        const counts = emptyStatusCounts();
        const sessionHistory = [];

        dateKeys.forEach((dateKey) => {
            sessions.forEach((session) => {
                const status = recordMap.get(buildRecordKey(officer._id, dateKey, session)) || NOT_MARKED;
                sessionHistory.push({ dateKey, session, status });
                addStatusCount(counts, status);

                const daily = dailyTrendMap.get(dateKey);
                daily.expectedSlots += 1;
                addStatusCount(daily, status);

                const sessionTrend = sessionTrendMap.get(session);
                if (sessionTrend) {
                    sessionTrend.expectedSlots += 1;
                    addStatusCount(sessionTrend, status);
                }
            });
        });

        const attended = counts.present + counts.late;
        const attendanceRate = expectedSlotsPerOfficer > 0
            ? Math.round((attended / expectedSlotsPerOfficer) * 100)
            : 0;
        const punctualityRate = attended > 0
            ? Math.round((counts.present / attended) * 100)
            : 0;

        summary.expectedSlots += expectedSlotsPerOfficer;
        summary.present += counts.present;
        summary.late += counts.late;
        summary.leave += counts.leave;
        summary.excused += counts.excused;
        summary.absent += counts.absent;
        summary.notMarked += counts.notMarked;
        summary.attended += attended;
        summary.onTime += counts.present;

        const zone = zoneMap.get(officer.parkZoneCode?.toUpperCase());

        const row = {
            _id: officer._id,
            name: officer.name,
            phoneNumber: officer.phoneNumber,
            profilePhoto: officer.profilePhoto,
            parkZoneCode: officer.parkZoneCode,
            zoneLabel: zone?.name ? `${zone.name} (${zone.code})` : officer.parkZoneCode,
            expectedSlots: expectedSlotsPerOfficer,
            ...counts,
            attended,
            onTime: counts.present,
            excusedAway: counts.excused + counts.leave,
            unexcusedAbsent: counts.absent,
            attendanceRate,
            punctualityRate,
        };

        const followUpMeta = buildOfficerFollowUp(row, ATTENDANCE_POLICY_THRESHOLDS);
        return {
            ...row,
            sessionHistory,
            needsFollowUp: Boolean(followUpMeta),
            flags: followUpMeta?.flags || [],
            reasons: followUpMeta?.reasons || [],
            severity: followUpMeta?.severity || 'none',
        };
    });

    summary.excusedAway = summary.excused + summary.leave;
    summary.unexcusedAbsent = summary.absent;
    summary.attendanceRate = summary.expectedSlots > 0
        ? Math.round((summary.attended / summary.expectedSlots) * 100)
        : 0;
    summary.absenceRate = summary.expectedSlots > 0
        ? Math.round(((summary.absent + summary.notMarked) / summary.expectedSlots) * 100)
        : 0;
    summary.punctualityRate = summary.attended > 0
        ? Math.round((summary.onTime / summary.attended) * 100)
        : 0;

    const dailyTrends = [...dailyTrendMap.values()].map((day) => {
        const absenceSlots = day.absent + day.notMarked;
        const absenceRate = day.expectedSlots > 0
            ? Math.round((absenceSlots / day.expectedSlots) * 100)
            : 0;
        const attendanceRate = day.expectedSlots > 0
            ? Math.round(((day.present + day.late) / day.expectedSlots) * 100)
            : 0;
        return { ...day, absenceSlots, absenceRate, attendanceRate };
    });

    const peakAbsenceDays = [...dailyTrends]
        .sort((a, b) => b.absenceSlots - a.absenceSlots || b.absent - a.absent)
        .slice(0, 5)
        .filter((day) => day.absenceSlots > 0);

    const sessionTrends = [...sessionTrendMap.values()]
        .filter((entry) => sessions.includes(entry.session))
        .map((entry) => {
            const absenceSlots = entry.absent + entry.notMarked;
            const absenceRate = entry.expectedSlots > 0
                ? Math.round((absenceSlots / entry.expectedSlots) * 100)
                : 0;
            return { ...entry, absenceSlots, absenceRate };
        })
        .sort((a, b) => b.absenceSlots - a.absenceSlots);

    const followUps = officerRows
        .filter((officer) => officer.needsFollowUp)
        .sort((a, b) => {
            const severityRank = { high: 0, medium: 1, none: 2 };
            return severityRank[a.severity] - severityRank[b.severity] || b.late - a.late;
        })
        .map((officer) => ({
            officerId: officer._id,
            name: officer.name,
            phoneNumber: officer.phoneNumber,
            zoneLabel: officer.zoneLabel,
            flags: officer.flags,
            reasons: officer.reasons,
            severity: officer.severity,
            attendanceRate: officer.attendanceRate,
            late: officer.late,
            absent: officer.absent,
            excusedAway: officer.excusedAway,
        }));

    const chronicPatterns = officerRows
        .filter((officer) =>
            officer.flags.includes('chronic_lateness') || officer.flags.includes('repeat_absence'))
        .map((officer) => ({
            officerId: officer._id,
            name: officer.name,
            zoneLabel: officer.zoneLabel,
            late: officer.late,
            absent: officer.absent,
            notMarked: officer.notMarked,
            pattern: officer.flags.includes('chronic_lateness') && officer.flags.includes('repeat_absence')
                ? 'late_and_absent'
                : officer.flags.includes('chronic_lateness')
                    ? 'chronic_lateness'
                    : 'repeat_absence',
        }));

    const presenceOverview = {
        officersWithOnTime: officerRows.filter((o) => o.onTime > 0).length,
        officersWithLate: officerRows.filter((o) => o.late > 0).length,
        officersWithUnexcusedAbsent: officerRows.filter((o) => o.unexcusedAbsent > 0).length,
        officersWithExcusedAway: officerRows.filter((o) => o.excusedAway > 0).length,
        officersFullyPresent: officerRows.filter((o) => o.attendanceRate === 100 && o.late === 0).length,
        officersNeverMarked: officerRows.filter((o) => o.attended === 0 && o.excusedAway === 0 && o.unexcusedAbsent === 0).length,
    };

    const absenceReasons = {
        approvedLeave: summary.leave,
        excusedAbsence: summary.excused,
        unexcusedAbsent: summary.absent,
        notMarked: summary.notMarked,
        note: 'Leave and excused are treated as approved away. Absent is unexcused. Detailed sick/personal/travel reasons are not captured in the system yet.',
    };

    const policyAlerts = [];
    if (summary.attendanceRate < ATTENDANCE_POLICY_THRESHOLDS.minAttendanceRatePercent) {
        policyAlerts.push({
            level: 'warning',
            message: `Group attendance rate ${summary.attendanceRate}% is below the ${ATTENDANCE_POLICY_THRESHOLDS.minAttendanceRatePercent}% policy threshold.`,
        });
    }
    if (followUps.filter((f) => f.severity === 'high').length > 0) {
        policyAlerts.push({
            level: 'critical',
            message: `${followUps.filter((f) => f.severity === 'high').length} officer(s) require immediate follow-up.`,
        });
    }
    if (summary.notMarked > summary.expectedSlots * 0.1) {
        policyAlerts.push({
            level: 'info',
            message: 'More than 10% of session slots were not marked — supervisors should close attendance sessions consistently.',
        });
    }

    const dataLimitations = [
        'early_departure',
        'detailed_absence_reason',
        'external_factors',
    ];

    const zoneOptions = zones
        .map((z) => ({
            code: z.code,
            name: z.name,
            label: z.name ? `${z.name} (${z.code})` : z.code,
        }))
        .sort((a, b) => compareZoneCodes(a.code, b.code));

    return {
        startDate: startKey,
        endDate: endKey,
        sessionFilter: sessionFilter === 'all' ? 'all' : sessions[0],
        zoneFilter: zoneFilter || 'all',
        periodDays: dateKeys.length,
        sessionsPerDay: sessions.length,
        expectedSlotsPerOfficer,
        policyThresholds: ATTENDANCE_POLICY_THRESHOLDS,
        summary,
        presenceOverview,
        absenceReasons,
        dailyTrends,
        peakAbsenceDays,
        sessionTrends,
        chronicPatterns,
        followUps,
        policyAlerts,
        dataLimitations,
        zones: zoneOptions,
        officers: officerRows,
    };
};

module.exports = {
    NOT_MARKED,
    MARKABLE_STATUSES,
    ATTENDANCE_SESSIONS,
    DEFAULT_ATTENDANCE_SESSION,
    getTodayDateKey,
    getAttendanceSession,
    getAttendancePeriodReport,
    ATTENDANCE_POLICY_THRESHOLDS,
    updateOfficerStatus,
    finishAttendance,
};
