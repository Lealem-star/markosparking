const mongoose = require('mongoose');
const { ATTENDANCE_SESSIONS } = require('../constants/attendanceSessions');

const ATTENDANCE_STATUSES = ['present', 'late', 'leave', 'excused', 'absent'];

const attendanceRecordSchema = new mongoose.Schema({
    officerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    dateKey: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}-\d{2}$/,
    },
    session: {
        type: String,
        enum: ATTENDANCE_SESSIONS,
        required: true,
        default: 'morning',
    },
    parkZoneCode: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ATTENDANCE_STATUSES,
        required: true,
    },
}, {
    timestamps: true,
});

attendanceRecordSchema.index({ officerId: 1, dateKey: 1, session: 1 }, { unique: true });
attendanceRecordSchema.index({ supervisorId: 1, dateKey: 1, session: 1 });
attendanceRecordSchema.index({ dateKey: 1, session: 1, parkZoneCode: 1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
module.exports.ATTENDANCE_STATUSES = ATTENDANCE_STATUSES;
