const { Types } = require('mongoose');
const ParkZone = require('../models/parkZoneSchema');
const User = require('../models/userSchema');
const AppError = require('../errors/AppError');
const { ROLES } = require('../constants/roles');
const { logAudit } = require('./auditLogService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');

const normalizeCode = (code) => code?.trim().toUpperCase() || '';

const slugifyZoneCode = (name = '') => {
    const slug = name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 32);

    return slug || 'ZONE';
};

const generateUniqueZoneCode = async (name) => {
    const base = slugifyZoneCode(name);
    let code = base;
    let counter = 2;

    while (await ParkZone.findOne({ code })) {
        const suffix = `_${counter}`;
        code = `${base.slice(0, Math.max(1, 32 - suffix.length))}${suffix}`;
        counter += 1;
    }

    return code;
};

const syncValetPriceLevelsForZone = async (zoneCode, priceLevel) => {
    if (!zoneCode?.trim() || !priceLevel?.trim()) return;

    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const zonePattern = new RegExp(`^${escapeRegex(zoneCode.trim())}$`, 'i');

    await User.updateMany(
        { type: ROLES.VALET, parkZoneCode: zonePattern },
        { $set: { priceLevel: priceLevel.trim(), parkZoneCode: zoneCode.trim().toUpperCase() } }
    );
};

const assertSystemAdmin = (user) => {
    if (!user || user.type !== ROLES.SYSTEM_ADMIN) {
        throw new AppError('Only system admin can manage parking zones', 403);
    }
};

const listParkZones = async () =>
    ParkZone.find().sort({ code: 1 });

const createParkZone = async (actor, data, req) => {
    assertSystemAdmin(actor);

    const name = data.name?.trim();
    const location = data.location?.trim();
    const priceLevel = data.priceLevel?.trim();

    if (!name) {
        throw new AppError('Zone name is required', 400);
    }
    if (!location) {
        throw new AppError('Zone location is required', 400);
    }
    if (!priceLevel) {
        throw new AppError('Price level is required', 400);
    }

    const code = normalizeCode(data.code) || await generateUniqueZoneCode(name);

    const existing = await ParkZone.findOne({ code });
    if (existing) {
        throw new AppError('A parking zone with this code already exists', 400);
    }

    const zone = await ParkZone.create({
        code,
        name,
        location,
        priceLevel,
        description: data.description?.trim() || '',
        isActive: data.isActive !== false,
    });

    await logAudit({
        action: AUDIT_ACTIONS.ZONE_CREATED,
        actor,
        targetType: 'zone',
        targetId: zone._id,
        summary: `Created parking zone ${zone.name} (${zone.code})`,
        metadata: { code: zone.code, name: zone.name, priceLevel: zone.priceLevel },
        req,
    });

    return zone;
};

const updateParkZone = async (actor, zoneId, data, req) => {
    assertSystemAdmin(actor);

    if (!Types.ObjectId.isValid(zoneId)) {
        throw new AppError('Invalid zone id', 400);
    }

    const zone = await ParkZone.findById(zoneId);
    if (!zone) {
        throw new AppError('Parking zone not found', 404);
    }

    const beforeSnapshot = {
        name: zone.name,
        location: zone.location,
        priceLevel: zone.priceLevel,
        isActive: zone.isActive,
    };

    const previousPriceLevel = zone.priceLevel?.trim() || '';

    if (data.name?.trim()) zone.name = data.name.trim();
    if (data.location?.trim()) zone.location = data.location.trim();
    if (data.description !== undefined) zone.description = data.description?.trim() || '';
    if (data.priceLevel !== undefined) zone.priceLevel = data.priceLevel?.trim() || '';
    if (typeof data.isActive === 'boolean') zone.isActive = data.isActive;

    await zone.save();

    const nextPriceLevel = zone.priceLevel?.trim() || '';
    if (nextPriceLevel && nextPriceLevel !== previousPriceLevel) {
        await syncValetPriceLevelsForZone(zone.code, nextPriceLevel);
    }

    await logAudit({
        action: AUDIT_ACTIONS.ZONE_UPDATED,
        actor,
        targetType: 'zone',
        targetId: zone._id,
        summary: `Updated parking zone ${zone.name} (${zone.code})`,
        metadata: {
            before: beforeSnapshot,
            after: {
                name: zone.name,
                location: zone.location,
                priceLevel: zone.priceLevel,
                isActive: zone.isActive,
            },
        },
        req,
    });

    return zone;
};

const deleteParkZone = async (actor, zoneId, req) => {
    assertSystemAdmin(actor);

    if (!Types.ObjectId.isValid(zoneId)) {
        throw new AppError('Invalid zone id', 400);
    }

    const zone = await ParkZone.findById(zoneId);
    if (!zone) {
        throw new AppError('Parking zone not found', 404);
    }

    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const zonePattern = new RegExp(`(^|,)\\s*${escapeRegex(zone.code)}\\s*(,|$)`);

    const assignedCount = await User.countDocuments({
        $or: [
            { parkZoneCode: zone.code },
            { parkZoneCode: zonePattern },
        ],
    });
    if (assignedCount > 0) {
        throw new AppError('Cannot delete a zone that is assigned to staff. Reassign staff first.', 400);
    }

    await logAudit({
        action: AUDIT_ACTIONS.ZONE_DELETED,
        actor,
        targetType: 'zone',
        targetId: zone._id,
        summary: `Deleted parking zone ${zone.name} (${zone.code})`,
        metadata: { code: zone.code, name: zone.name },
        req,
    });

    await ParkZone.findByIdAndDelete(zoneId);
    return { message: 'Parking zone deleted successfully' };
};

module.exports = {
    listParkZones,
    createParkZone,
    updateParkZone,
    deleteParkZone,
};
