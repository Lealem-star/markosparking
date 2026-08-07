const ATTENDANCE_SESSIONS = Object.freeze(['morning', 'afternoon']);
const DEFAULT_ATTENDANCE_SESSION = 'morning';

const normalizeAttendanceSession = (session) => {
    const value = (session || DEFAULT_ATTENDANCE_SESSION).trim().toLowerCase();
    if (!ATTENDANCE_SESSIONS.includes(value)) {
        return null;
    }
    return value;
};

const assertValidAttendanceSession = (session) => {
    const normalized = normalizeAttendanceSession(session);
    if (!normalized) {
        throw new Error(`Invalid attendance session. Use one of: ${ATTENDANCE_SESSIONS.join(', ')}`);
    }
    return normalized;
};

module.exports = {
    ATTENDANCE_SESSIONS,
    DEFAULT_ATTENDANCE_SESSION,
    normalizeAttendanceSession,
    assertValidAttendanceSession,
};
