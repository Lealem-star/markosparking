const mongoose = require('mongoose');
const { ATTENDANCE_SESSIONS } = require('../constants/attendanceSessions');

const RECONCILIATION_STATUSES = ['submitted', 'approved', 'rejected'];

const shiftReconciliationSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
        trim: true,
        match: /^\d{4}-\d{2}-\d{2}$/,
    },
    session: {
        type: String,
        enum: ATTENDANCE_SESSIONS,
        required: true,
    },
    parkZoneCode: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: RECONCILIATION_STATUSES,
        default: 'submitted',
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    reportedCashAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    supervisorNotes: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: '',
    },
    systemCashAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    systemOnlineAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    systemTotalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    varianceAmount: {
        type: Number,
        default: 0,
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    reviewedAt: {
        type: Date,
        default: null,
    },
    reviewNote: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: '',
    },
}, {
    timestamps: true,
});

shiftReconciliationSchema.index({ date: 1, session: 1, parkZoneCode: 1 }, { unique: true });
shiftReconciliationSchema.index({ status: 1, submittedAt: -1 });
shiftReconciliationSchema.index({ parkZoneCode: 1, date: -1 });

module.exports = mongoose.model('ShiftReconciliation', shiftReconciliationSchema);
module.exports.RECONCILIATION_STATUSES = RECONCILIATION_STATUSES;
