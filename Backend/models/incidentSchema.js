const mongoose = require('mongoose');

const INCIDENT_TYPES = [
    'customer_complaint',
    'vehicle_damage',
    'wrong_registration',
    'traffic_obstruction',
    'illegal_parking',
    'equipment_failure',
    'payment_issue',
];

const INCIDENT_STATUSES = ['open', 'assigned', 'resolved'];

const incidentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: INCIDENT_TYPES,
        required: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
    },
    parkZoneCode: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: INCIDENT_STATUSES,
        default: 'open',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assignedOfficerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    assignedAt: {
        type: Date,
        default: null,
    },
    resolvedAt: {
        type: Date,
        default: null,
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    resolutionNotes: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: '',
    },
}, {
    timestamps: true,
});

incidentSchema.index({ parkZoneCode: 1, status: 1, createdAt: -1 });
incidentSchema.index({ createdBy: 1, createdAt: -1 });
incidentSchema.index({ assignedOfficerId: 1, status: 1 });

module.exports = mongoose.model('Incident', incidentSchema);
module.exports.INCIDENT_TYPES = INCIDENT_TYPES;
module.exports.INCIDENT_STATUSES = INCIDENT_STATUSES;
