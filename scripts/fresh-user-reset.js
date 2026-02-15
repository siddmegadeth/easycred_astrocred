#!/usr/bin/env node
/**
 * Fresh user reset – deletes all data for a given mobile so the user can log in
 * as a new user (OTP will create a new profile). See plan: fresh_user_reset_and_cibil_flow.
 *
 * Usage:
 *   node scripts/fresh-user-reset.js <mobile>
 *   FRESH_RESET_MOBILE=7764056669 node scripts/fresh-user-reset.js
 *
 * Requires: MONGODB_URI_DEVELOPMENT or MONGODB_URI in .env (load from project root).
 */

const path = require('path');
const mongoose = require('mongoose');

// Load .env from project root (easycred_astrocred)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mobile = process.argv[2] || process.env.FRESH_RESET_MOBILE;

if (!mobile || !/^[6-9]\d{9}$/.test(mobile.replace(/\D/g, ''))) {
    console.error('Usage: node scripts/fresh-user-reset.js <10-digit-mobile>');
    console.error('   or: FRESH_RESET_MOBILE=7764056669 node scripts/fresh-user-reset.js');
    process.exit(1);
}

const uri = process.env.MONGODB_URI_DEVELOPMENT || process.env.MONGODB_URI;
if (!uri) {
    console.error('Set MONGODB_URI_DEVELOPMENT or MONGODB_URI in .env');
    process.exit(1);
}

const collections = [
    { name: 'profilemodels', query: { mobile } },
    { name: 'cibildatamodels', query: { $or: [{ mobile }, { mobile_number: mobile }] } },
    { name: 'scorehistorymodels', query: { mobile } },
    { name: 'linkedaccountmodels', query: { mobile } },
    { name: 'finvudashboardcachemodels', query: { mobile } },
    { name: 'subscriptions', query: { mobile } }
];

async function run() {
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        const db = mongoose.connection.db;
        console.log('Connected. Deleting data for mobile:', mobile);

        for (const { name, query } of collections) {
            try {
                const col = db.collection(name);
                const result = name === 'profilemodels' || name === 'finvudashboardcachemodels'
                    ? await col.deleteOne(query)
                    : await col.deleteMany(query);
                const count = result.deletedCount ?? 0;
                console.log('  %s: deleted %s', name, count);
            } catch (err) {
                if (err.code === 26) {
                    console.log('  %s: (collection does not exist)', name);
                } else {
                    console.error('  %s: error', name, err.message);
                }
            }
        }

        console.log('Done. Log out, then use Send OTP for', mobile, 'to log in as a fresh user.');
    } catch (err) {
        console.error('Connection error:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

run();
