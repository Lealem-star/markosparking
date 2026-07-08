/**
 * Imports legacy parking zone codes into the ParkZone collection.
 *
 * Sources:
 *   - User.parkZoneCode (valets + supervisors, including comma-separated codes)
 *   - ParkedCar.location
 *
 * Skips: empty values, "*", and placeholder locations.
 *
 * Run from repo root: node Backend/scripts/migrateParkZones.js
 * Or from Backend:    node scripts/migrateParkZones.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/db.config');
const User = require('../models/userSchema');
const ParkedCar = require('../models/parkedCarSchema');
const ParkZone = require('../models/parkZoneSchema');
const { getSupervisorZoneList, isAllZonesCode } = require('../constants/roles');

const SKIP_ZONE_VALUES = new Set([
    '',
    '*',
    'UNKNOWN ZONE',
    'NO ZONE',
    'N/A',
]);

const normalizeCode = (code) => code?.trim().toUpperCase() || '';

const isValidZoneCode = (code) => {
    const normalized = normalizeCode(code);
    return normalized && !SKIP_ZONE_VALUES.has(normalized) && !isAllZonesCode(normalized);
};

const collectZoneCodesFromUsers = async () => {
    const users = await User.find({
        parkZoneCode: { $exists: true, $nin: ['', null] },
    }).select('parkZoneCode type');

    const codes = new Set();

    users.forEach((user) => {
        getSupervisorZoneList(user.parkZoneCode).forEach((zone) => {
            if (isValidZoneCode(zone)) {
                codes.add(normalizeCode(zone));
            }
        });
    });

    return codes;
};

const collectZoneCodesFromCars = async () => {
    const locations = await ParkedCar.distinct('location');
    const codes = new Set();

    locations.forEach((location) => {
        if (isValidZoneCode(location)) {
            codes.add(normalizeCode(location));
        }
    });

    return codes;
};

async function migrate() {
    await connectDB();

    await new Promise((resolve, reject) => {
        if (mongoose.connection.readyState === 1) {
            resolve();
            return;
        }
        mongoose.connection.once('open', resolve);
        mongoose.connection.once('error', reject);
    });

    console.log('Connected to database');

    const userCodes = await collectZoneCodesFromUsers();
    const carCodes = await collectZoneCodesFromCars();
    const allCodes = new Set([...userCodes, ...carCodes]);

    console.log(`Found ${allCodes.size} unique legacy zone code(s) to evaluate`);

    let created = 0;
    let skipped = 0;

    for (const code of [...allCodes].sort()) {
        const existing = await ParkZone.findOne({ code });
        if (existing) {
            console.log(`Skipped (already exists): ${code}`);
            skipped += 1;
            continue;
        }

        await ParkZone.create({
            code,
            name: `${code} Zone`,
            location: 'Imported from existing records — update in Settings',
            description: 'Auto-migrated from legacy staff/car zone codes',
            isActive: true,
        });

        console.log(`Created: ${code}`);
        created += 1;
    }

    console.log(`Migration complete. Created ${created}, skipped ${skipped}.`);
    await mongoose.disconnect();
}

migrate().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
});
