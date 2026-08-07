const mongoose = require('mongoose');
const { AUDIT_CATEGORIES, AUDIT_ACTIONS } = require('../constants/auditActions');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        enum: Object.values(AUDIT_ACTIONS),
        required: true,
        index: true,
    },
    category: {
        type: String,
        enum: AUDIT_CATEGORIES,
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success',
    },
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    actorName: {
        type: String,
        default: '',
        trim: true,
    },
    actorRole: {
        type: String,
        default: '',
        trim: true,
    },
    actorPhone: {
        type: String,
        default: '',
        trim: true,
    },
    targetType: {
        type: String,
        default: '',
        trim: true,
    },
    targetId: {
        type: String,
        default: '',
        trim: true,
    },
    summary: {
        type: String,
        required: true,
        trim: true,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    ipAddress: {
        type: String,
        default: '',
        trim: true,
    },
}, {
    timestamps: true,
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ summary: 'text', actorName: 'text', actorPhone: 'text' });

module.exports = mongoose.model('AuditLog', auditLogSchema);
