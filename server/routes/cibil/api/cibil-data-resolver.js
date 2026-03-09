/**
 * Single source of truth for loading CIBIL data for a user.
 * 1. Tries CibilDataModel (by mobile/mobile_number, pan/pan_number, email).
 * 2. If not found and mobile given, hydrates from CibilFetchCache into CibilDataModel (no refetch, no extra charge).
 * Never returns sample/mock data for real user identifiers.
 */

var CibilDataModel = require('../../../schema/cibil/cibil-data-schema.js');
var ProfileModel = require('../../../schema/profile/profile-schema');
var mongoose = require('mongoose');

var CibilFetchCacheSchema = new mongoose.Schema({
    mobile: { type: String, required: true, index: true },
    pan: String,
    name: String,
    response: mongoose.Schema.Types.Mixed,
    fetched_at: { type: Date, default: Date.now }
});
var CibilFetchCache = mongoose.models.CibilFetchCache || mongoose.model('CibilFetchCache', CibilFetchCacheSchema);

function ensureArrayOfObjects(val) {
    if (Array.isArray(val)) {
        return val.every(function (x) { return x && typeof x === 'object' && !Array.isArray(x); })
            ? val
            : val.filter(function (x) { return x && typeof x === 'object' && !Array.isArray(x); });
    }
    if (val && typeof val === 'object' && !Array.isArray(val)) return [val];
    return [];
    }

/** Try to parse a string that may be JS object literal (e.g. util.inspect) into an object. Use only for cache data. */
function parseReportString(str) {
    if (typeof str !== 'string' || str.length < 10) return null;
    try {
        return JSON.parse(str);
    } catch (e) { /* not JSON */ }
    try {
        var vm = require('vm');
        var wrapped = '(function(){ return (' + str + '); })()';
        return vm.runInNewContext(wrapped, Object.create(null), { timeout: 1000 });
    } catch (e) {
        return null;
    }
}

function normalizeCreditReportAndScore(raw) {
    if (!raw) return { credit_report: [], credit_score: '' };
    if (typeof raw === 'string') {
        raw = parseReportString(raw) || {};
    }
    var creditReport = [];
    var rawReport = raw.credit_report;

    if (typeof rawReport === 'string') {
        rawReport = parseReportString(rawReport) || null;
    }
    if (Array.isArray(rawReport)) creditReport = rawReport;
    else if (rawReport && typeof rawReport === 'object') creditReport = [rawReport];
    else if (Array.isArray(raw.report)) creditReport = raw.report;
    else if (raw.report && typeof raw.report === 'object') creditReport = [raw.report];
    else if (raw.data && Array.isArray(raw.data.credit_report)) creditReport = raw.data.credit_report;
    else if (raw.data && typeof raw.data.credit_report === 'string') {
        var parsed = parseReportString(raw.data.credit_report);
        if (parsed) creditReport = Array.isArray(parsed) ? parsed : [parsed];
    } else if (raw.data && raw.data.report) creditReport = Array.isArray(raw.data.report) ? raw.data.report : [raw.data.report];
    else if (raw.control_number && (raw.names || raw.accounts)) creditReport = [raw];

    creditReport = ensureArrayOfObjects(creditReport);

    var creditScore = '';
    if (raw.credit_score != null && raw.credit_score !== '') creditScore = String(raw.credit_score);
    else if (raw.score != null) creditScore = String(raw.score);
    else if (raw.scores && raw.scores[0] && (raw.scores[0].score != null)) creditScore = String(raw.scores[0].score);
    else if (raw.data && (raw.data.credit_score != null || raw.data.score != null)) creditScore = String(raw.data.credit_score || raw.data.score || '');

    return { credit_report: creditReport, credit_score: creditScore };
}

/**
 * Hydrate CibilDataModel from CibilFetchCache for a mobile. Uses profile for email/dob.
 * Returns the saved document or null on failure.
 */
async function hydrateFromCache(mobile) {
    if (!mobile) return null;
    var cache = await CibilFetchCache.findOne({ mobile }).sort({ fetched_at: -1 }).lean();
    if (!cache || !cache.response || !cache.response.data) return null;

    var profile = await ProfileModel.findOne({ mobile }).select('profile_info.email profile_info.date_of_birth kyc.pan_number').lean();
    var userEmail = profile && (profile.profile_info || {}).email;
    if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
        userEmail = (mobile + '@users.astrocred.in').toLowerCase();
    }

    var raw = cache.response.data || {};
    var panDetails = cache.response.pan_comprehensive || {};
    var panNumber = (cache.pan || raw.pan || '').toString().trim().toUpperCase();
    if (!panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
        var profilePan = profile && profile.kyc && profile.kyc.pan_number;
        if (profilePan) panNumber = (profilePan + '').trim().toUpperCase();
    }
    if (!panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) return null;

    var name = (panDetails.pan_details && panDetails.pan_details.full_name) ? panDetails.pan_details.full_name : (cache.name || raw.name || 'User');
    var gender = (panDetails.pan_details && panDetails.pan_details.gender === 'F') ? 'Female' : 'Male';

    var _normal = normalizeCreditReportAndScore(raw);
    var creditReport = _normal.credit_report;
    var creditScore = _normal.credit_score;

    var dob = new Date('1990-01-01');
    if (profile && profile.profile_info && profile.profile_info.date_of_birth) {
        var d = new Date(profile.profile_info.date_of_birth);
        if (!isNaN(d.getTime())) dob = d;
    }
    var dobStr = panDetails.pan_details && (panDetails.pan_details.dob || panDetails.pan_details.input_dob);
    if (dobStr) {
        var d2 = new Date(dobStr);
        if (!isNaN(d2.getTime())) dob = d2;
    }

    var doc = {
        mobile: mobile,
        email: userEmail.toLowerCase().trim(),
        pan: panNumber,
        name: (name || 'User').trim(),
        gender: gender,
        credit_score: creditScore || undefined,
        credit_report: creditReport,
        date_of_birth: dob,
        updatedAt: new Date()
    };

    try {
        var saved = await CibilDataModel.findOneAndUpdate(
            { mobile },
            { $set: doc },
            { upsert: true, runValidators: true, new: true }
        ).lean();
        if (saved) console.log('[cibil-resolver] Hydrated CibilDataModel for mobile', mobile);
        return saved;
    } catch (err) {
        console.error('[cibil-resolver] hydrateFromCache failed for mobile', mobile, err.message);
        return null;
    }
}

/**
 * Get CIBIL data for user by mobile, email, or pan.
 * If only cache exists, hydrates DB and returns doc so no refetch is needed.
 * @param {Object} opts - { mobile, email, pan }
 * @returns {Object|null} - CibilDataModel document (with client_id, pan_number, mobile_number normalized) or null
 */
async function getCibilForUser(opts) {
    var mobile = (opts.mobile || '').toString().trim();
    var email = (opts.email || '').toString().trim().toLowerCase();
    var pan = (opts.pan || '').toString().trim().toUpperCase();

    var query = {};
    var andParts = [];
    if (mobile) andParts.push({ $or: [{ mobile_number: mobile }, { mobile: mobile }] });
    if (pan) andParts.push({ $or: [{ pan_number: pan }, { pan: pan }] });
    if (email) andParts.push({ email: email });
    if (andParts.length) query.$and = andParts;
    if (Object.keys(query).length === 0) return null;

    var cibilData = await CibilDataModel.findOne(query)
        .select('client_id name pan_number pan mobile_number mobile email credit_score credit_report analysis updatedAt date_of_birth')
        .lean();

    if (cibilData) {
        cibilData.client_id = cibilData.client_id || ('credit_report_cibil_' + (cibilData.updatedAt ? cibilData.updatedAt.getTime() : Date.now()));
        cibilData.name = cibilData.name || 'User';
        cibilData.pan_number = cibilData.pan_number || cibilData.pan;
        cibilData.mobile_number = cibilData.mobile_number || cibilData.mobile;
        return cibilData;
    }

    var hydrateMobile = mobile || null;
    if (!hydrateMobile && (email || pan)) {
        var profile = await ProfileModel.findOne(
            email ? { 'profile_info.email': email } : { 'kyc.pan_number': pan }
        ).select('mobile').lean();
        if (profile && profile.mobile) hydrateMobile = profile.mobile;
    }

    if (hydrateMobile) {
        var hydrated = await hydrateFromCache(hydrateMobile);
        if (hydrated) {
            hydrated.client_id = hydrated.client_id || ('credit_report_cibil_' + (hydrated.updatedAt ? hydrated.updatedAt.getTime() : Date.now()));
            hydrated.name = hydrated.name || 'User';
            hydrated.pan_number = hydrated.pan_number || hydrated.pan;
            hydrated.mobile_number = hydrated.mobile_number || hydrated.mobile;
            return hydrated;
        }
    }

    return null;
}

module.exports = {
    getCibilForUser,
    hydrateFromCache,
    normalizeCreditReportAndScore
};
