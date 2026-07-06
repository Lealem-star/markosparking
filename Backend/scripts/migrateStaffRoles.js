/**
 * Migrates legacy staff roles to the new role model:
 *   manager -> director (Bahir Dar City Administration)
 *   admin   -> finance_officer
 *
 * Run from repo root: node Backend/scripts/migrateStaffRoles.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/db.config');
const User = require('../models/userSchema');
const { LEGACY_ROLE_MAP } = require('../constants/roles');

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

    for (const [legacyType, newType] of Object.entries(LEGACY_ROLE_MAP)) {
        const result = await User.updateMany({ type: legacyType }, { $set: { type: newType } });
        console.log(`Updated ${result.modifiedCount} user(s): ${legacyType} -> ${newType}`);
    }

    await mongoose.disconnect();
    console.log('Migration complete');
}

migrate().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
});
