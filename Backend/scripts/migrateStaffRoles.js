/**
 * Migrates legacy staff roles to the current role model:
 *   manager  -> parking_manager
 *   admin    -> finance_officer
 *   director -> parking_manager
 *   valet    -> parking_officer
 *
 * Run from repo root: node Backend/scripts/migrateStaffRoles.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/db.config');
const User = require('../models/userSchema');
const ChatMessage = require('../models/chatMessageSchema');
const { LEGACY_ROLE_MAP } = require('../constants/roles');

async function migrateCollection(Model, field, label) {
    for (const [legacyType, newType] of Object.entries(LEGACY_ROLE_MAP)) {
        const result = await Model.updateMany({ [field]: legacyType }, { $set: { [field]: newType } });
        if (result.modifiedCount > 0) {
            console.log(`Updated ${result.modifiedCount} ${label}(s): ${legacyType} -> ${newType}`);
        }
    }
}

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

    await migrateCollection(User, 'type', 'user');
    await migrateCollection(ChatMessage, 'senderType', 'chat message');

    await mongoose.disconnect();
    console.log('Migration complete');
}

migrate().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
});
