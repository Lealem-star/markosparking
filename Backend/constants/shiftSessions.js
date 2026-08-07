const { ATTENDANCE_SESSIONS } = require('./attendanceSessions');

const SHIFT_SESSION_WINDOWS = Object.freeze({
    morning: { startHour: 6, endHour: 14 },
    afternoon: { startHour: 14, endHour: 22 },
});

const getShiftSessionWindow = (dateStr, session) => {
    const normalized = (session || '').trim().toLowerCase();
    const window = SHIFT_SESSION_WINDOWS[normalized];
    if (!window || !dateStr) return null;

    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return null;

    const start = new Date(year, month - 1, day, window.startHour, 0, 0, 0);
    const end = new Date(year, month - 1, day, window.endHour, 0, 0, 0);
    return { start, end, session: normalized };
};

module.exports = {
    SHIFT_SESSIONS: ATTENDANCE_SESSIONS,
    SHIFT_SESSION_WINDOWS,
    getShiftSessionWindow,
};
