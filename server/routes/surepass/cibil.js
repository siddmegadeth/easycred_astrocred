(function() {
    /**
     * SurePass CIBIL Integration Service — PRODUCTION ONLY
     * Handles credit score fetching via SurePass API (PAID / LIVE)
     *
     * Fetch rules:
     * - PAN: fetch only once per user; if profile.kyc.pan_number exists, skip getMobileToPAN.
     * - CIBIL: fetch at most once per month per user; return cached if same-month data exists.
     *
     * ⚠️  NO MOCK / SANDBOX DATA — all calls go to the real SurePass API.
     *     Ensure SUREPASS_TOKEN and SUREPASS_URL are set in your .env before using.
     */

    const mongoose = require('mongoose');
    const ProfileModel = require('../../schema/profile/profile-schema');
    const CibilDataModel = require('../../schema/cibil/cibil-data-schema.js');

    const CibilFetchCacheSchema = new mongoose.Schema({
        mobile: { type: String, required: true, index: true },
        pan: String,
        name: String,
        response: mongoose.Schema.Types.Mixed,
        fetched_at: { type: Date, default: Date.now }
    });
    const CibilFetchCache = mongoose.models.CibilFetchCache || mongoose.model('CibilFetchCache', CibilFetchCacheSchema);

    function isSameMonth(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
    }

    function getSurePassHeaders() {
        return {
            "accept": 'application/json',
            "Authorization": 'Bearer ' + process.env.SUREPASS_TOKEN,
            "content-type": 'application/json'
        };
    }

    // Strip mobile country code prefix if present and ensure 10 digits
    function sanitizeMobile(mobile) {
        mobile = (mobile || '').toString().trim();
        if (mobile.charAt(0) === '+') mobile = mobile.replace(/^\+\d{1,3}/, '').trim();
        if (mobile.length > 10) mobile = mobile.slice(-10);
        return mobile;
    }

    // ─── PAN from Mobile ──────────────────────────────────────────────────────────

    async function getMobileToPAN(fullname, mobile) {
        return new Promise(function(approve, reject) {
            try {
                log('getMobileToPAN [PRODUCTION]');

                if (!mobile || !fullname) {
                    return reject({ status: false, message: 'Mobile and fullname are required' });
                }

                if (!process.env.SUREPASS_TOKEN) {
                    return reject({ status: false, message: 'SurePass token not configured. Set SUREPASS_TOKEN in .env' });
                }

                var URL = process.env.SUREPASS_URL + '/api/v1/pan/mobile-to-pan';
                log('getMobileToPAN URL: ' + URL);

                var options = {
                    method: 'POST',
                    url: URL,
                    headers: getSurePassHeaders(),
                    data: { name: fullname, mobile_no: mobile }
                };

                axios(options)
                    .then(function(response) {
                        log('✅ getMobileToPAN Success');
                        approve(response.data);
                    })
                    .catch(function(errorResp) {
                        var status = errorResp.response && errorResp.response.status;
                        var errData = errorResp.response && errorResp.response.data;
                        log('❌ getMobileToPAN Error: ' + (status || errorResp.message));
                        reject({
                            status: false,
                            message: 'SurePass API error: getMobileToPAN failed',
                            error: errData || errorResp.message,
                            http_status: status
                        });
                    });

            } catch (catchError) {
                log('❌ getMobileToPAN Exception: ' + catchError.message);
                reject(catchError);
            }
        });
    }

    // ─── PAN Comprehensive ────────────────────────────────────────────────────────

    async function getPANComprehensive(pan_number) {
        return new Promise(function(approve, reject) {
            try {
                log('getPANComprehensive [PRODUCTION]');

                if (!pan_number) {
                    return reject({ status: false, message: 'PAN number is required' });
                }

                if (!process.env.SUREPASS_TOKEN) {
                    return reject({ status: false, message: 'SurePass token not configured. Set SUREPASS_TOKEN in .env' });
                }

                var URL = process.env.SUREPASS_URL + '/api/v1/pan/pan-comprehensive-plus';
                log('getPANComprehensive URL: ' + URL);

                var options = {
                    method: 'POST',
                    url: URL,
                    headers: getSurePassHeaders(),
                    data: { id_number: pan_number }
                };

                axios(options)
                    .then(function(response) {
                        log('✅ getPANComprehensive Success');
                        approve(response.data);
                    })
                    .catch(function(errorResp) {
                        var status = errorResp.response && errorResp.response.status;
                        var errData = errorResp.response && errorResp.response.data;
                        log('❌ getPANComprehensive Error: ' + (status || errorResp.message));
                        reject({
                            status: false,
                            message: 'SurePass API error: getPANComprehensive failed',
                            error: errData || errorResp.message,
                            http_status: status
                        });
                    });

            } catch (catchError) {
                log('❌ getPANComprehensive Exception: ' + catchError.message);
                reject(catchError);
            }
        });
    }

    // ─── Fetch CIBIL Report ───────────────────────────────────────────────────────

    async function fetchCIBIL(params) {
        return new Promise(function(approve, reject) {
            try {
                log('fetchCIBIL [PRODUCTION]');
                log('Params: ' + JSON.stringify({ mobile: params.mobile, pan: params.pan, name: params.name }));

                if (!process.env.SUREPASS_TOKEN) {
                    return reject({ status: false, message: 'SurePass token not configured. Set SUREPASS_TOKEN in .env' });
                }

                var URL = process.env.SUREPASS_URL + '/api/v1/credit-report-cibil/fetch-report';
                log('fetchCIBIL URL: ' + URL);

                var options = {
                    method: 'POST',
                    url: URL,
                    headers: getSurePassHeaders(),
                    data: {
                        mobile: params.mobile,
                        pan: params.pan,
                        name: params.name,
                        gender: params.gender,
                        consent: 'Y'
                    }
                };

                axios(options)
                    .then(function(response) {
                        log('✅ fetchCIBIL Success');
                        approve(response.data);
                    })
                    .catch(function(errorResp) {
                        var status = errorResp.response && errorResp.response.status;
                        var errData = errorResp.response && errorResp.response.data;
                        log('❌ fetchCIBIL Error: ' + (status || errorResp.message));
                        reject({
                            status: false,
                            message: 'SurePass API error: fetchCIBIL failed',
                            error: errData || errorResp.message,
                            http_status: status
                        });
                    });

            } catch (catchError) {
                log('❌ fetchCIBIL Exception: ' + catchError.message);
                reject(catchError);
            }
        });
    }

    // ─── Helper: persist CIBIL data to CibilDataModel ────────────────────────────

    async function persistToCibilDataModel(mobile, panNumber, fullname, cibilResp, panDetails) {
        try {
            var cibilDataResolver = require('../cibil/api/cibil-data-resolver.js');
            var raw = (cibilResp && cibilResp.data) ? cibilResp.data : cibilResp || {};

            var normalized = cibilDataResolver.normalizeCreditReportAndScore(raw);
            var creditReport = normalized.credit_report;
            var creditScore = normalized.credit_score;

            // Get email and DOB from profile
            var profileDoc = await ProfileModel.findOne({ mobile }).select('profile_info.email profile_info.date_of_birth').lean();
            var userEmail = profileDoc && (profileDoc.profile_info || {}).email;
            if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
                userEmail = mobile + '@users.astrocred.in';
            }

            var genderSchema = (panDetails && panDetails.pan_details && panDetails.pan_details.gender === 'F') ? 'Female' : 'Male';
            var dob = new Date('1990-01-01');
            if (profileDoc && profileDoc.profile_info && profileDoc.profile_info.date_of_birth) {
                var d = new Date(profileDoc.profile_info.date_of_birth);
                if (!isNaN(d.getTime())) dob = d;
            }
            var dobStr = panDetails && panDetails.pan_details && (panDetails.pan_details.dob || panDetails.pan_details.input_dob);
            if (dobStr) {
                var d2 = new Date(dobStr);
                if (!isNaN(d2.getTime())) dob = d2;
            }

            var panUp = (panNumber || '').toString().trim().toUpperCase();
            if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panUp)) {
                log('⚠️ persistToCibilDataModel: invalid PAN format, skipping save:', panUp);
                return null;
            }

            var savedDoc = await CibilDataModel.findOneAndUpdate(
                { mobile },
                {
                    $set: {
                        client_id: raw.client_id || 'CLIENT_' + mobile + '_' + Date.now(),
                        mobile,
                        email: userEmail.toLowerCase().trim(),
                        pan: panUp,
                        name: ((panDetails && panDetails.pan_details && panDetails.pan_details.full_name) || fullname || 'User').trim(),
                        gender: genderSchema,
                        credit_score: creditScore || undefined,
                        credit_report: creditReport.length ? creditReport : undefined,
                        date_of_birth: dob,
                        updatedAt: new Date()
                    }
                },
                { upsert: true, runValidators: true, new: true }
            );
            log('✅ CibilDataModel persisted for mobile', mobile);
            return savedDoc;
        } catch (dbErr) {
            log('⚠️ CibilDataModel save failed:', dbErr.message);
            if (dbErr.code) log('   DB error code:', dbErr.code);
            if (dbErr.errors) log('   Validation errors:', Object.keys(dbErr.errors));
            return null;
        }
    }

    // ─── GET /get/check/credit/report/cibil ──────────────────────────────────────

    app.get('/get/check/credit/report/cibil', async function(req, resp) {
        log('/get/check/credit/report/cibil');

        var mobile = sanitizeMobile(req.params.mobile || req.query.mobile || '');
        var fullname = (req.params.fullname || req.query.fullname || '').toString().trim();

        if (!mobile || !fullname) {
            return resp.status(400).json({
                status: false,
                message: 'Missing required parameters: mobile and fullname'
            });
        }

        if (!process.env.SUREPASS_TOKEN) {
            return resp.status(503).json({
                status: false,
                message: 'CIBIL service not configured. Contact administrator.'
            });
        }

        try {
            // Return cached result if fetched this month
            var cached = await CibilFetchCache.findOne({ mobile }).sort({ fetched_at: -1 }).lean();
            if (cached && cached.fetched_at && isSameMonth(new Date(cached.fetched_at), new Date()) && cached.response) {
                log('✅ CIBIL GET: returning cached report (same month)');
                // Ensure CibilDataModel is up-to-date asynchronously
                var hydrateFromCache = require('../cibil/api/cibil-data-resolver.js').hydrateFromCache;
                hydrateFromCache(mobile)
                    .then(function(h) { if (h) log('[GET cibil] CibilDataModel synced from cache for', mobile); })
                    .catch(function(e) { log('[GET cibil] CibilDataModel sync err:', e.message); });
                return resp.json(Object.assign({}, cached.response, { cached: true }));
            }

            // Resolve PAN
            var panNumber = null;
            var profile = null;
            if (ProfileModel) {
                profile = await ProfileModel.findOne({ mobile }).select('kyc.pan_number kyc.pan_advance').lean();
                if (profile && profile.kyc && profile.kyc.pan_number) {
                    panNumber = profile.kyc.pan_number;
                    log('✅ PAN GET: using stored PAN from profile');
                }
            }
            if (!panNumber) {
                var panMobile = await getMobileToPAN(fullname, mobile);
                if (!panMobile.success || panMobile.status_code !== 200) {
                    return resp.json({ status: false, message: 'Unable to fetch PAN from mobile number', step: 'getMobileToPAN' });
                }
                panNumber = panMobile.data.pan_number;
                if (ProfileModel) {
                    await ProfileModel.updateOne({ mobile }, { $set: { 'kyc.pan_number': panNumber, 'kyc.isPanVerified': true } }, { upsert: false });
                    log('✅ PAN GET: stored to profile');
                }
            }

            // Resolve PAN Comprehensive
            var panComp = null;
            if (profile && profile.kyc && profile.kyc.pan_advance &&
                String((profile.kyc.pan_advance.pan_number || '')).toUpperCase() === String(panNumber).toUpperCase()) {
                panComp = { success: true, status_code: 200, data: profile.kyc.pan_advance };
                log('✅ PAN Comprehensive GET: using cached from profile');
            }
            if (!panComp || !panComp.success) {
                panComp = await getPANComprehensive(panNumber);
                log('getPANComprehensive result:', panComp.success);
                if (ProfileModel && panComp.success && panComp.data) {
                    await ProfileModel.updateOne({ mobile }, { $set: { 'kyc.pan_advance': panComp.data } }, { upsert: false });
                }
            }
            if (!panComp.success || panComp.status_code !== 200) {
                return resp.json({ status: false, message: 'Unable to fetch PAN comprehensive details', step: 'getPANComprehensive' });
            }

            var panDetails = panComp.data;
            var gender = (panDetails.pan_details && panDetails.pan_details.gender === 'F') ? 'female' : 'male';

            var cibilParams = {
                mobile: mobile,
                pan: panDetails.pan_number || panNumber,
                name: (panDetails.pan_details && panDetails.pan_details.full_name) || fullname,
                gender: gender,
                consent: 'Y'
            };

            var cibilResp = await fetchCIBIL(cibilParams);
            log('fetchCIBIL result:', cibilResp.success);

            if (cibilResp.success && (cibilResp.status_code === 200 || cibilResp.status_code === 422)) {
                var payload = {
                    data: cibilResp.data,
                    pan_comprehensive: panDetails,
                    status: true,
                    mode: 'production'
                };
                await CibilFetchCache.updateOne(
                    { mobile },
                    { $set: { mobile, pan: panNumber, name: fullname, response: payload, fetched_at: new Date() } },
                    { upsert: true }
                );
                // Persist full record to CibilDataModel
                await persistToCibilDataModel(mobile, panNumber, fullname, cibilResp, panDetails);
                resp.json(payload);
            } else {
                resp.json({
                    status: false,
                    message: 'Unable to fetch CIBIL report',
                    step: 'fetchCIBIL',
                    pan_comprehensive: panDetails,
                    params: Object.assign({}, cibilParams, { pan: '***redacted***' })
                });
            }

        } catch (error) {
            log('❌ CIBIL GET error:', error);
            resp.status(500).json({ status: false, message: 'Internal server error', error: error.message });
        }
    });

    // ─── POST /post/api/cibil/fetch ───────────────────────────────────────────────

    app.post('/post/api/cibil/fetch', async function(req, resp) {
        log('/post/api/cibil/fetch');

        var mobile = sanitizeMobile(req.body.mobile || '');
        var fullname = ((req.body.fullname || req.body.name || '')).toString().trim();
        var pan = (req.body.pan || '').toString().trim();
        var consent = req.body.consent || 'Y';

        if (!mobile || !fullname) {
            return resp.status(400).json({
                status: false,
                message: 'Missing required parameters: mobile and fullname/name'
            });
        }

        if (!process.env.SUREPASS_TOKEN) {
            return resp.status(503).json({
                status: false,
                message: 'CIBIL service not configured. Contact administrator.'
            });
        }

        try {
            // Return cached if fetched this month
            var cachedPost = await CibilFetchCache.findOne({ mobile }).sort({ fetched_at: -1 }).lean();
            if (cachedPost && cachedPost.fetched_at && isSameMonth(new Date(cachedPost.fetched_at), new Date()) && cachedPost.response) {
                log('✅ CIBIL POST: returning cached report (same month)');
                var hydrateFromCache = require('../cibil/api/cibil-data-resolver.js').hydrateFromCache;
                var hydrated = await hydrateFromCache(mobile);
                if (hydrated) log('✅ CIBIL POST: CibilDataModel synced from cache for', mobile);
                else log('⚠️ CIBIL POST: CibilDataModel sync failed for', mobile);
                return resp.json(Object.assign({}, cachedPost.response, { cached: true }));
            }

            // Resolve PAN
            var panNumber = pan || null;
            var profilePost = null;
            if (!panNumber) {
                profilePost = await ProfileModel.findOne({ mobile }).select('kyc.pan_number kyc.pan_advance').lean();
                if (profilePost && profilePost.kyc && profilePost.kyc.pan_number) {
                    panNumber = profilePost.kyc.pan_number;
                    log('✅ PAN POST: using stored PAN from profile');
                }
            }
            if (!panNumber) {
                var panMobilePOST = await getMobileToPAN(fullname, mobile);
                if (!panMobilePOST.success) {
                    return resp.json({ status: false, message: 'Unable to fetch PAN', step: 'getMobileToPAN' });
                }
                panNumber = panMobilePOST.data.pan_number;
                await ProfileModel.updateOne({ mobile }, { $set: { 'kyc.pan_number': panNumber, 'kyc.isPanVerified': true } }, { upsert: false });
                log('✅ PAN POST: stored to profile');
            }

            // Resolve PAN Comprehensive
            if (!profilePost) profilePost = await ProfileModel.findOne({ mobile }).select('kyc.pan_advance').lean();
            var panCompPost = null;
            if (profilePost && profilePost.kyc && profilePost.kyc.pan_advance &&
                String((profilePost.kyc.pan_advance.pan_number || '')).toUpperCase() === String(panNumber).toUpperCase()) {
                panCompPost = { success: true, status_code: 200, data: profilePost.kyc.pan_advance };
                log('✅ PAN Comprehensive POST: using cached from profile');
            }
            if (!panCompPost || !panCompPost.success) {
                panCompPost = await getPANComprehensive(panNumber);
                if (panCompPost.success && panCompPost.data) {
                    await ProfileModel.updateOne({ mobile }, { $set: { 'kyc.pan_advance': panCompPost.data } }, { upsert: false });
                }
            }
            if (!panCompPost.success) {
                return resp.json({ status: false, message: 'Unable to verify PAN', step: 'getPANComprehensive' });
            }
            var panDetailsPost = panCompPost.data;
            var genderPost = (panDetailsPost.pan_details && panDetailsPost.pan_details.gender === 'F') ? 'female' : 'male';

            // Fetch CIBIL
            var cibilRespPost = await fetchCIBIL({
                mobile: mobile,
                pan: panNumber,
                name: (panDetailsPost.pan_details && panDetailsPost.pan_details.full_name) || fullname,
                gender: genderPost,
                consent: consent
            });

            if (cibilRespPost.success) {
                var payloadPost = {
                    status: true,
                    data: cibilRespPost.data,
                    pan_comprehensive: panDetailsPost,
                    mode: 'production'
                };

                // Save to cache
                await CibilFetchCache.updateOne(
                    { mobile },
                    { $set: { mobile, pan: panNumber, name: fullname, response: payloadPost, fetched_at: new Date() } },
                    { upsert: true }
                );

                // Persist to CibilDataModel
                await persistToCibilDataModel(mobile, panNumber, fullname, cibilRespPost, panDetailsPost);

                // Update ProfileModel.cibil summary
                try {
                    var cibilDataResolver = require('../cibil/api/cibil-data-resolver.js');
                    var normPost = cibilDataResolver.normalizeCreditReportAndScore(cibilRespPost.data || {});
                    await ProfileModel.updateOne(
                        { mobile },
                        { $set: { cibil: { credit_score: normPost.credit_score || undefined, fetchedAt: new Date(), mode: 'production' } } }
                    );
                    log('✅ CIBIL POST: ProfileModel.cibil updated');
                } catch (e) {
                    log('⚠️ CIBIL POST: ProfileModel.cibil update failed:', e.message);
                }

                resp.json(payloadPost);
            } else {
                resp.json({ status: false, message: 'Unable to fetch CIBIL report', data: cibilRespPost });
            }

        } catch (error) {
            log('❌ CIBIL POST error:', error);
            resp.status(500).json({ status: false, message: 'Server error', error: error.message });
        }
    });

    // ─── POST /post/api/cibil/cache/clear — force re-fetch next time ─────────────
    // Clears CibilFetchCache for a mobile so the next CIBIL call hits the real API.

    app.post('/post/api/cibil/cache/clear', async function(req, resp) {
        log('/post/api/cibil/cache/clear');
        var mobile = sanitizeMobile(req.body.mobile || req.query.mobile || '');
        if (!mobile) return resp.status(400).json({ success: false, error: 'mobile required' });

        try {
            var result = await CibilFetchCache.deleteMany({ mobile });
            log('✅ Cleared CibilFetchCache for mobile', mobile, '— deleted:', result.deletedCount);
            resp.json({ success: true, message: 'Cache cleared. Next fetch will call the real SurePass API.', deleted: result.deletedCount });
        } catch (e) {
            resp.status(500).json({ success: false, error: e.message });
        }
    });

    // ─── POST /post/api/cibil/sandbox/purge — remove all sandbox DB records ──────
    // Deletes every CibilDataModel document whose client_id starts with 'SANDBOX_'.
    // Run this ONCE after going production to wipe fake data.

    app.post('/post/api/cibil/sandbox/purge', async function(req, resp) {
        log('/post/api/cibil/sandbox/purge');
        try {
            var cibilPurge = await CibilDataModel.deleteMany({ client_id: /^SANDBOX_/ });
            var cachePurge = await CibilFetchCache.deleteMany({});          // wipe entire fetch cache so everyone re-fetches live
            log('✅ Sandbox purge: CibilDataModel deleted:', cibilPurge.deletedCount, '| CibilFetchCache cleared:', cachePurge.deletedCount);
            resp.json({
                success: true,
                message: 'All sandbox CIBIL records purged. Users will get real data on next fetch.',
                cibil_records_deleted: cibilPurge.deletedCount,
                fetch_cache_cleared: cachePurge.deletedCount
            });
        } catch (e) {
            resp.status(500).json({ success: false, error: e.message });
        }
    });

})();