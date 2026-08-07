const AuditLog = require('../models/auditLogSchema');
const AppError = require('../errors/AppError');
const { ROLES } = require('../constants/roles');
const { ACTION_CATEGORY_MAP } = require('../constants/auditActions');

const getClientIp = (req) => {
    if (!req) return '';
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
        return String(forwarded).split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || '';
};

const actorFromUser = (user) => ({
    actorId: user?._id || null,
    actorName: user?.name || '',
    actorRole: user?.type || '',
    actorPhone: user?.phoneNumber || '',
});

const logAudit = async ({
    action,
    category,
    actor,
    actorName,
    actorPhone,
    actorRole,
    targetType = '',
    targetId = '',
    summary,
    metadata = {},
    status = 'success',
    req,
}) => {
    if (!action || !summary) return;

    const resolvedCategory = category || ACTION_CATEGORY_MAP[action];
    if (!resolvedCategory) return;

    const actorFields = actor
        ? actorFromUser(actor)
        : {
            actorId: null,
            actorName: actorName || '',
            actorRole: actorRole || '',
            actorPhone: actorPhone || '',
        };

    try {
        await AuditLog.create({
            action,
            category: resolvedCategory,
            status,
            ...actorFields,
            targetType,
            targetId: targetId ? String(targetId) : '',
            summary,
            metadata,
            ipAddress: getClientIp(req),
        });
    } catch (error) {
        console.error('Failed to write audit log:', error.message);
    }
};

const assertSystemAdmin = (user) => {
    if (!user || user.type !== ROLES.SYSTEM_ADMIN) {
        throw new AppError('Only system admin can view audit logs', 403);
    }
};

const listAuditLogs = async (currentUser, filters = {}) => {
    assertSystemAdmin(currentUser);

    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 50));
    const query = {};

    if (filters.category && filters.category !== 'all') {
        query.category = filters.category;
    }

    if (filters.action && filters.action !== 'all') {
        query.action = filters.action;
    }

    if (filters.search?.trim()) {
        const term = filters.search.trim();
        query.$or = [
            { summary: { $regex: term, $options: 'i' } },
            { actorName: { $regex: term, $options: 'i' } },
            { actorPhone: { $regex: term, $options: 'i' } },
            { targetId: { $regex: term, $options: 'i' } },
        ];
    }

    if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
            const start = new Date(filters.startDate);
            if (!Number.isNaN(start.getTime())) {
                start.setHours(0, 0, 0, 0);
                query.createdAt.$gte = start;
            }
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            if (!Number.isNaN(end.getTime())) {
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }
        if (!Object.keys(query.createdAt).length) {
            delete query.createdAt;
        }
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
        AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        AuditLog.countDocuments(query),
    ]);

    return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
    };
};

module.exports = {
    logAudit,
    listAuditLogs,
    actorFromUser,
    getClientIp,
};
