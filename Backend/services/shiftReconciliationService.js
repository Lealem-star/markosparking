const { Types } = require('mongoose');
const ParkedCar = require('../models/parkedCarSchema');
const ShiftReconciliation = require('../models/shiftReconciliationSchema');
const AppError = require('../errors/AppError');
const { logAudit } = require('./auditLogService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const { getShiftSessionWindow } = require('../constants/shiftSessions');
const { assertValidAttendanceSession } = require('../constants/attendanceSessions');
const {
    ROLES,
    isAllZonesCode,
    getSupervisorZoneList,
    supervisorCoversZone,
    hasOfficeWideDataAccess,
} = require('../constants/roles');

const FINANCE_REVIEW_ROLES = [
    ROLES.SYSTEM_ADMIN,
    ROLES.DIRECTOR,
    ROLES.FINANCE_OFFICER,
];

const populateReconciliation = (query) => query
    .populate('submittedBy', 'name phoneNumber type')
    .populate('reviewedBy', 'name phoneNumber type');

const assertSupervisor = (user) => {
    if (!user || user.type !== ROLES.SUPERVISOR) {
        throw new AppError('Only parking supervisors can submit shift reconciliations', 403);
    }
};

const assertFinanceReviewer = (user) => {
    if (!user || !FINANCE_REVIEW_ROLES.includes(user.type)) {
        throw new AppError('Not authorized to review shift reconciliations', 403);
    }
};

const assertZoneInSupervisorScope = (supervisor, zoneCode) => {
    if (!zoneCode?.trim()) {
        throw new AppError('Park zone is required', 400);
    }
    if (!supervisorCoversZone(supervisor.parkZoneCode, zoneCode)) {
        throw new AppError('Zone is not in your assigned areas', 403);
    }
};

const buildSupervisorZoneFilter = (supervisor, zoneCode) => {
    const code = supervisor?.parkZoneCode?.trim();
    if (!code) return { parkZoneCode: '__none__' };

    if (zoneCode && zoneCode !== 'all') {
        assertZoneInSupervisorScope(supervisor, zoneCode);
        return { parkZoneCode: zoneCode.trim() };
    }

    if (isAllZonesCode(code)) {
        return {};
    }

    const zones = getSupervisorZoneList(code);
    if (zones.length === 1) return { parkZoneCode: zones[0] };
    if (zones.length > 1) return { parkZoneCode: { $in: zones } };
    return { parkZoneCode: '__none__' };
};

const computeSystemTotals = async (parkZoneCode, date, session) => {
    const window = getShiftSessionWindow(date, session);
    if (!window) {
        throw new AppError('Invalid date or session', 400);
    }

    const baseQuery = {
        location: parkZoneCode.trim(),
        status: 'checked_out',
        checkedOutAt: { $gte: window.start, $lt: window.end },
        totalPaidAmount: { $gt: 0 },
    };

    const [manualAgg, onlineAgg] = await Promise.all([
        ParkedCar.aggregate([
            {
                $match: {
                    ...baseQuery,
                    $or: [
                        { paymentMethod: 'manual' },
                        { paymentMethod: { $exists: false } },
                        { paymentMethod: null },
                    ],
                },
            },
            { $group: { _id: null, total: { $sum: '$totalPaidAmount' } } },
        ]),
        ParkedCar.aggregate([
            { $match: { ...baseQuery, paymentMethod: 'online' } },
            { $group: { _id: null, total: { $sum: '$totalPaidAmount' } } },
        ]),
    ]);

    const systemCashAmount = manualAgg[0]?.total || 0;
    const systemOnlineAmount = onlineAgg[0]?.total || 0;

    return {
        systemCashAmount,
        systemOnlineAmount,
        systemTotalAmount: systemCashAmount + systemOnlineAmount,
    };
};

const getReconciliationPreview = async (supervisor, { date, session, parkZoneCode }) => {
    assertSupervisor(supervisor);
    const normalizedSession = assertValidAttendanceSession(session);
    assertZoneInSupervisorScope(supervisor, parkZoneCode);

    const totals = await computeSystemTotals(parkZoneCode, date, normalizedSession);
    const existing = await ShiftReconciliation.findOne({
        date,
        session: normalizedSession,
        parkZoneCode: parkZoneCode.trim(),
    }).lean();

    return {
        date,
        session: normalizedSession,
        parkZoneCode: parkZoneCode.trim(),
        ...totals,
        existingStatus: existing?.status || null,
        existingId: existing?._id || null,
    };
};

const submitReconciliation = async (supervisor, body, req) => {
    assertSupervisor(supervisor);

    const { date, session, parkZoneCode, reportedCashAmount, supervisorNotes = '' } = body;
    const normalizedSession = assertValidAttendanceSession(session);
    assertZoneInSupervisorScope(supervisor, parkZoneCode);

    const reported = Number(reportedCashAmount);
    if (!Number.isFinite(reported) || reported < 0) {
        throw new AppError('Reported cash amount must be zero or greater', 400);
    }

    const totals = await computeSystemTotals(parkZoneCode, date, normalizedSession);
    const varianceAmount = Math.round((reported - totals.systemCashAmount) * 100) / 100;

    const existing = await ShiftReconciliation.findOne({
        date,
        session: normalizedSession,
        parkZoneCode: parkZoneCode.trim(),
    });

    if (existing && existing.status === 'approved') {
        throw new AppError('This shift reconciliation is already approved', 409);
    }

    let record;
    if (existing) {
        existing.status = 'submitted';
        existing.submittedBy = supervisor._id;
        existing.submittedAt = new Date();
        existing.reportedCashAmount = reported;
        existing.supervisorNotes = supervisorNotes?.trim() || '';
        existing.systemCashAmount = totals.systemCashAmount;
        existing.systemOnlineAmount = totals.systemOnlineAmount;
        existing.systemTotalAmount = totals.systemTotalAmount;
        existing.varianceAmount = varianceAmount;
        existing.reviewedBy = null;
        existing.reviewedAt = null;
        existing.reviewNote = '';
        record = await existing.save();
    } else {
        record = await ShiftReconciliation.create({
            date,
            session: normalizedSession,
            parkZoneCode: parkZoneCode.trim(),
            status: 'submitted',
            submittedBy: supervisor._id,
            reportedCashAmount: reported,
            supervisorNotes: supervisorNotes?.trim() || '',
            ...totals,
            varianceAmount,
        });
    }

    await logAudit({
        action: AUDIT_ACTIONS.RECONCILIATION_SUBMITTED,
        actor: supervisor,
        targetType: 'shift_reconciliation',
        targetId: record._id,
        summary: `Shift close submitted for ${parkZoneCode.trim()} (${normalizedSession}, ${date})`,
        metadata: {
            parkZoneCode: parkZoneCode.trim(),
            date,
            session: normalizedSession,
            reportedCashAmount: reported,
            systemCashAmount: totals.systemCashAmount,
            varianceAmount,
        },
        req,
    });

    return populateReconciliation(ShiftReconciliation.findById(record._id)).exec();
};

const listReconciliations = async (currentUser, filters = {}) => {
    const query = {};

    if (currentUser.type === ROLES.SUPERVISOR) {
        Object.assign(query, buildSupervisorZoneFilter(currentUser, filters.zone));
    } else if (!hasOfficeWideDataAccess(currentUser.type)) {
        throw new AppError('Not authorized to view shift reconciliations', 403);
    } else if (filters.zone && filters.zone !== 'all') {
        query.parkZoneCode = filters.zone.trim();
    }

    if (filters.status && filters.status !== 'all') {
        query.status = filters.status;
    }

    if (filters.date) {
        query.date = filters.date;
    }

    if (filters.session && filters.session !== 'all') {
        query.session = assertValidAttendanceSession(filters.session);
    }

    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        populateReconciliation(
            ShiftReconciliation.find(query).sort({ submittedAt: -1 }).skip(skip).limit(limit)
        ),
        ShiftReconciliation.countDocuments(query),
    ]);

    return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
    };
};

const reviewReconciliation = async (reviewer, id, { decision, reviewNote = '' }, req) => {
    assertFinanceReviewer(reviewer);

    if (!Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid reconciliation id', 400);
    }

    const normalizedDecision = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : null;
    if (!normalizedDecision) {
        throw new AppError('Decision must be approve or reject', 400);
    }

    const record = await ShiftReconciliation.findById(id);
    if (!record) {
        throw new AppError('Shift reconciliation not found', 404);
    }

    if (record.status !== 'submitted') {
        throw new AppError('Only submitted reconciliations can be reviewed', 409);
    }

    record.status = normalizedDecision;
    record.reviewedBy = reviewer._id;
    record.reviewedAt = new Date();
    record.reviewNote = reviewNote?.trim() || '';
    await record.save();

    const action = normalizedDecision === 'approved'
        ? AUDIT_ACTIONS.RECONCILIATION_APPROVED
        : AUDIT_ACTIONS.RECONCILIATION_REJECTED;

    await logAudit({
        action,
        actor: reviewer,
        targetType: 'shift_reconciliation',
        targetId: record._id,
        summary: `Shift close ${normalizedDecision} for ${record.parkZoneCode} (${record.session}, ${record.date})`,
        metadata: {
            parkZoneCode: record.parkZoneCode,
            date: record.date,
            session: record.session,
            varianceAmount: record.varianceAmount,
            reviewNote: record.reviewNote,
        },
        req,
    });

    return populateReconciliation(ShiftReconciliation.findById(record._id)).exec();
};

module.exports = {
    getReconciliationPreview,
    submitReconciliation,
    listReconciliations,
    reviewReconciliation,
    computeSystemTotals,
};
