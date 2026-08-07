const mongoose = require('mongoose');

const attendanceAuditLogSchema = new mongoose.Schema({
    attendanceRecordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AttendanceRecord',
        default: null,
    },
    officerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    dateKey: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}-\d{2}$/,
    },
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    previousStatus: {
        type: String,
        default: null,
    },
    newStatus: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        enum: ['status_update', 'finish_absent', 'bulk_absent'],
        default: 'status_update',
    },
}, {
    timestamps: true,
});

attendanceAuditLogSchema.index({ officerId: 1, dateKey: 1, createdAt: -1 });
attendanceAuditLogSchema.index({ changedBy: 1, createdAt: -1 });

module.exports = mongoose.model('AttendanceAuditLog', attendanceAuditLogSchema);
