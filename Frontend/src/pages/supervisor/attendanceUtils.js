import { compareZoneCodes } from '../../utils/zoneSort';

export const ATTENDANCE_SESSIONS = Object.freeze(['morning', 'afternoon']);
export const DEFAULT_ATTENDANCE_SESSION = 'morning';

export const ATTENDANCE_STATUS = Object.freeze({
    NOT_MARKED: 'not_marked',
    PRESENT: 'present',
    LATE: 'late',
    LEAVE: 'leave',
    EXCUSED: 'excused',
    ABSENT: 'absent',
});

export const MARKABLE_ATTENDANCE_STATUSES = [
    ATTENDANCE_STATUS.PRESENT,
    ATTENDANCE_STATUS.LATE,
    ATTENDANCE_STATUS.LEAVE,
    ATTENDANCE_STATUS.EXCUSED,
];

export const STATUS_FILTER_OPTIONS = [
    ATTENDANCE_STATUS.NOT_MARKED,
    ...MARKABLE_ATTENDANCE_STATUSES,
    ATTENDANCE_STATUS.ABSENT,
];

export const STATUS_BADGE_CLASS = Object.freeze({
    [ATTENDANCE_STATUS.PRESENT]: 'attendance-badge--present',
    [ATTENDANCE_STATUS.LATE]: 'attendance-badge--late',
    [ATTENDANCE_STATUS.LEAVE]: 'attendance-badge--leave',
    [ATTENDANCE_STATUS.NOT_MARKED]: 'attendance-badge--not-marked',
    [ATTENDANCE_STATUS.ABSENT]: 'attendance-badge--absent',
    [ATTENDANCE_STATUS.EXCUSED]: 'attendance-badge--excused',
});

const ETHIOPIA_UTC_OFFSET_HOURS = 3;

export const getTodayDateKey = () => {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const ethiopia = new Date(utcMs + ETHIOPIA_UTC_OFFSET_HOURS * 3600000);
    const year = ethiopia.getFullYear();
    const month = String(ethiopia.getMonth() + 1).padStart(2, '0');
    const day = String(ethiopia.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (dateKey, locale = undefined) => {
    if (!dateKey) return '';
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });
};

export const filterAttendanceOfficers = (
    officers = [],
    { searchQuery = '', zoneFilter = 'all', statusFilter = 'all' } = {}
) => {
    const query = searchQuery.trim().toLowerCase();

    return officers.filter((officer) => {
        const matchesSearch =
            !query
            || (officer?.name || '').toLowerCase().includes(query)
            || (officer?.phoneNumber || '').toLowerCase().includes(query);

        const matchesZone =
            zoneFilter === 'all'
            || (officer?.parkZoneCode || '').toUpperCase() === zoneFilter.toUpperCase();

        const matchesStatus =
            statusFilter === 'all'
            || (officer?.status || ATTENDANCE_STATUS.NOT_MARKED) === statusFilter;

        return matchesSearch && matchesZone && matchesStatus;
    });
};

export const groupOfficersByZone = (officers = [], zones = []) => {
    const zoneOrder = new Map(zones.map((zone, index) => [zone.code.toUpperCase(), index]));
    const labelByCode = new Map(zones.map((zone) => [zone.code.toUpperCase(), zone.label]));
    const groups = new Map();

    officers.forEach((officer) => {
        const code = (officer.parkZoneCode || '').toUpperCase();
        if (!groups.has(code)) {
            groups.set(code, {
                code: officer.parkZoneCode,
                label: officer.zoneLabel || labelByCode.get(code) || officer.parkZoneCode,
                officers: [],
            });
        }
        groups.get(code).officers.push(officer);
    });

    return [...groups.values()].sort((a, b) => {
        const orderA = zoneOrder.get((a.code || '').toUpperCase()) ?? 999;
        const orderB = zoneOrder.get((b.code || '').toUpperCase()) ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return compareZoneCodes(a.code, b.code);
    });
};

export const attachZoneLabels = (session) => {
    if (!session) return [];

    const zoneLabelByCode = new Map(
        (session.assignedZones || []).map((zone) => [zone.code.toUpperCase(), zone.label])
    );

    (session.zones || []).forEach((zone) => {
        zoneLabelByCode.set(zone.code.toUpperCase(), zone.label);
    });

    return (session.officers || []).map((officer) => ({
        ...officer,
        zoneLabel: zoneLabelByCode.get((officer.parkZoneCode || '').toUpperCase()) || officer.parkZoneCode,
    }));
};

export const getZoneMetaFromSession = (session) => {
    if (session?.zones?.length) {
        return session.zones.map((zone) => ({ code: zone.code, label: zone.label }));
    }
    return session?.assignedZones || [];
};

export const recomputeSessionStats = (officers = []) => {
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
        const status = officer.status || ATTENDANCE_STATUS.NOT_MARKED;
        if (status === ATTENDANCE_STATUS.NOT_MARKED) {
            stats.notMarked += 1;
        } else if (status === ATTENDANCE_STATUS.EXCUSED) {
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

export const applyOfficerStatusUpdate = (session, officerId, status) => {
    if (!session) return session;

    const officers = session.officers.map((officer) =>
        (String(officer._id) === String(officerId) ? { ...officer, status } : officer)
    );
    const { stats, progress } = recomputeSessionStats(officers);

    const zones = (session.zones || []).map((zone) => ({
        ...zone,
        officers: zone.officers.map((officer) =>
            (String(officer._id) === String(officerId) ? { ...officer, status } : officer)
        ),
    }));

    return {
        ...session,
        officers,
        zones,
        stats,
        progress,
    };
};

const ATTENDED_DASHBOARD_STATUSES = new Set([
    ATTENDANCE_STATUS.PRESENT,
    ATTENDANCE_STATUS.LATE,
    ATTENDANCE_STATUS.LEAVE,
    ATTENDANCE_STATUS.EXCUSED,
]);

export const partitionOfficersByAttendance = (officers = []) =>
    officers.reduce(
        (result, officer) => {
            const status = officer?.status || ATTENDANCE_STATUS.NOT_MARKED;
            if (ATTENDED_DASHBOARD_STATUSES.has(status)) {
                result.attended.push(officer);
            } else if (status === ATTENDANCE_STATUS.ABSENT) {
                result.absent.push(officer);
            } else {
                result.notMarked.push(officer);
            }
            return result;
        },
        { attended: [], absent: [], notMarked: [] }
    );
