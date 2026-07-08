const { Types } = require('mongoose');
const ParkZone = require('../models/parkZoneSchema');
const User = require('../models/userSchema');
const AppError = require('../errors/AppError');
const { ROLES } = require('../constants/roles');

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

const assertSystemAdmin = (user) => {
    if (!user || user.type !== ROLES.SYSTEM_ADMIN) {
        throw new AppError('Only system admin can manage parking zones', 403);
    }
};

const listParkZones = async () =>
    ParkZone.find().sort({ code: 1 });

const createParkZone = async (actor, data) => {
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

    return zone;
};

const updateParkZone = async (actor, zoneId, data) => {
    assertSystemAdmin(actor);

    if (!Types.ObjectId.isValid(zoneId)) {
        throw new AppError('Invalid zone id', 400);
    }

    const zone = await ParkZone.findById(zoneId);
    if (!zone) {
        throw new AppError('Parking zone not found', 404);
    }

    if (data.name?.trim()) zone.name = data.name.trim();
    if (data.location?.trim()) zone.location = data.location.trim();
    if (data.description !== undefined) zone.description = data.description?.trim() || '';
    if (data.priceLevel !== undefined) zone.priceLevel = data.priceLevel?.trim() || '';
    if (typeof data.isActive === 'boolean') zone.isActive = data.isActive;

    await zone.save();
    return zone;
};

const deleteParkZone = async (actor, zoneId) => {
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

    await ParkZone.findByIdAndDelete(zoneId);
    return { message: 'Parking zone deleted successfully' };
};

module.exports = {
    listParkZones,
    createParkZone,
    updateParkZone,
    deleteParkZone,
};
