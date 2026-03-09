(function() {
    /**
     * SurePass CIBIL Integration Service
     * Handles credit score fetching via SurePass API
     * Supports both Sandbox (FREE) and Production (PAID) modes
     * ⚠️ USES MOCK DATA when SurePass token is expired
     *
     * Fetch rules (high priority):
     * - PAN: fetch only once per user; if we have PAN for mobile (profile.kyc.pan_number), skip getMobileToPAN.
     * - CIBIL: fetch at most once per month per user; if we have CIBIL for mobile in current month, return cached.
     */

    const mockCibilData = require('./mock-cibil-data');
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

    // Helper to get SurePass headers
    function getSurePassHeaders() {
        return {
            "accept": 'application/json',
            "Authorization": 'Bearer ' + process.env.SUREPASS_TOKEN,
            "content-type": 'application/json'
        };
    }

    // Helper to check if in sandbox mode
    function isSandboxMode() {
        return process.env.SUREPASS_MODE === 'sandbox' || 
               process.env.SUREPASS_ENV === 'sandbox' ||
               process.env.NODE_ENV !== 'production';
    }

    // Generate mock CIBIL data for sandbox testing
    function generateSandboxCIBILData(params) {
        const baseScore = Math.floor(Math.random() * 200) + 650; // 650-850 range
        return {
            success: true,
            status_code: 200,
            data: {
                client_id: 'SANDBOX_' + Date.now(),
                credit_score: baseScore.toString(),
                name: params.name || 'Test User',
                pan: params.pan || 'AAAAA0000A',
                report: {
                    accounts: [
                        {
                            index: "T001",
                            memberShortName: "HDFC BANK",
                            accountType: "10",
                            ownershipIndicator: 1,
                            dateOpened: Date.now() - 31536000000,
                            highCreditAmount: 500000,
                            currentBalance: 125000,
                            creditFacilityStatus: "00",
                            paymentHistory: "000000000000"
                        },
                        {
                            index: "T002",
                            memberShortName: "ICICI BANK",
                            accountType: "05",
                            ownershipIndicator: 1,
                            dateOpened: Date.now() - 63072000000,
                            highCreditAmount: 200000,
                            currentBalance: 45000,
                            creditFacilityStatus: "00",
                            paymentHistory: "000000000000"
                        }
                    ],
                    enquiries: [
                        {
                            index: "I001",
                            enquiryDate: Date.now() - 2592000000,
                            memberShortName: "BAJAJ FINANCE",
                            enquiryPurpose: "05",
                            enquiryAmount: 100000
                        }
                    ],
                    summary: {
                        totalAccounts: 2,
                        totalEnquiries: 1,
                        creditUtilization: 25
                    }
                }
            }
        };
    }

    // Generate mock PAN data for sandbox
    function generateSandboxPANData(fullname, mobile) {
        return {
            success: true,
            status_code: 200,
            data: {
                pan_number: 'AAAAA' + mobile.slice(-5) + 'A',
                pan_details: {
                    full_name: fullname,
                    gender: 'M',
                    dob: '1990-01-01',
                    email: mobile + '@sandbox.test'
                }
            }
        };
    }

    async function getMobileToPAN(fullname, mobile) {
        return new Promise(function(approve, reject) {
            try {
                log("getMobileToPAN - Mode: " + (isSandboxMode() ? 'SANDBOX' : 'PRODUCTION'));

                if (!mobile || !fullname) {
                    reject({ status: false, message: 'Mobile and fullname are required' });
                    return;
                }

                // In sandbox mode, return mock data
                if (isSandboxMode() && !process.env.SUREPASS_TOKEN) {
                    log('🧪 Using SANDBOX mock data for getMobileToPAN');
                    approve(generateSandboxPANData(fullname, mobile));
                    return;
                }

                    var URL = process.env.SUREPASS_URL + "/api/v1/pan/mobile-to-pan";
                log('URL: ' + URL);

                    const options = {
                        method: 'POST',
                        url: URL,
                    headers: getSurePassHeaders(),
                        data: {
                            "name": fullname,
                            "mobile_no": mobile
                        }
                    };

                    axios(options)
                        .then(function(response) {
                        log('✅ getMobileToPAN Success');
                        approve(response.data);
                        })
                        .catch(function(errorResp) {
                        log('❌ getMobileToPAN Error: ' + (errorResp.response?.status || errorResp.message));
                        // In sandbox, return mock data on error
                        if (isSandboxMode()) {
                            log('🧪 Falling back to SANDBOX mock data');
                            approve(generateSandboxPANData(fullname, mobile));
                } else {
                            reject({
                                status: false,
                                message: 'API Error',
                                error: errorResp.response?.data || errorResp.message
                            });
                }
                    });

            } catch (catchError) {
                log('❌ getMobileToPAN Exception: ' + catchError.message);
                reject(catchError);
            }
        });
    }

    async function getPANComprehensive(pan_number) {
        return new Promise(function(approve, reject) {
            try {
                log("getPANComprehensive - Mode: " + (isSandboxMode() ? 'SANDBOX' : 'PRODUCTION'));

                if (!pan_number) {
                    reject({ status: false, message: 'PAN number is required' });
                    return;
                }

                // In sandbox mode, return mock data
                if (isSandboxMode() && !process.env.SUREPASS_TOKEN) {
                    log('🧪 Using SANDBOX mock data for getPANComprehensive');
                    approve({
                        success: true,
                        status_code: 200,
                        data: {
                            pan_number: pan_number,
                            pan_details: {
                                full_name: 'Test User',
                                gender: 'M',
                                dob: '1990-01-01'
                            }
                        }
                    });
                    return;
                }

                    var URL = process.env.SUREPASS_URL + "/api/v1/pan/pan-comprehensive-plus";
                log('URL: ' + URL);

                    const options = {
                        method: 'POST',
                        url: URL,
                    headers: getSurePassHeaders(),
                        data: {
                            "id_number": pan_number
                        }
                    };

                    axios(options)
                        .then(function(response) {
                        log('✅ getPANComprehensive Success');
                        approve(response.data);
                        })
                        .catch(function(errorResp) {
                        log('❌ getPANComprehensive Error: ' + (errorResp.response?.status || errorResp.message));
                        if (isSandboxMode()) {
                            log('🧪 Falling back to SANDBOX mock data');
                            approve({
                                success: true,
                                status_code: 200,
                                data: {
                                    pan_number: pan_number,
                                    pan_details: {
                                        full_name: 'Test User',
                                        gender: 'M',
                                        dob: '1990-01-01'
                                    }
                                }
                            });
                } else {
                            reject({
                                status: false,
                                message: 'API Error',
                                error: errorResp.response?.data || errorResp.message
                            });
                }
                    });

            } catch (catchError) {
                log('❌ getPANComprehensive Exception: ' + catchError.message);
                reject(catchError);
            }
        });
    }

    async function fetchCIBIL(params) {
        return new Promise(function(approve, reject) {
            try {
                log("fetchCIBIL - Mode: " + (isSandboxMode() ? 'SANDBOX' : 'PRODUCTION'));
                log('Params: ' + JSON.stringify(params));

                // In sandbox mode, return mock data
                if (isSandboxMode() && !process.env.SUREPASS_TOKEN) {
                    log('🧪 Using SANDBOX mock CIBIL data');
                    approve(generateSandboxCIBILData(params));
                    return;
                }

                var URL = process.env.SUREPASS_URL + "/api/v1/credit-report-cibil/fetch-report";
                log('URL: ' + URL);

                const options = {
                    method: 'POST',
                    url: URL,
                    headers: getSurePassHeaders(),
                    data: {
                        "mobile": params.mobile,
                        "pan": params.pan,
                        "name": params.name,
                        "gender": params.gender,
                        "consent": "Y"
                    }
                };

                axios(options)
                    .then(function(response) {
                        log('✅ fetchCIBIL Success');
                        approve(response.data);
                    })
                    .catch(function(errorResp) {
                        log('❌ fetchCIBIL Error: ' + (errorResp.response?.status || errorResp.message));
                        if (isSandboxMode()) {
                            log('🧪 Falling back to SANDBOX mock data');
                            approve(generateSandboxCIBILData(params));
                        } else {
                            reject({
                                status: false,
                                message: 'CIBIL API Error',
                                error: errorResp.response?.data || errorResp.message
                            });
                        }
                    });

            } catch (catchError) {
                log('❌ fetchCIBIL Exception: ' + catchError.message);
                reject(catchError);
            }
        });
    }

    // GET endpoint for CIBIL report
    app.get("/get/check/credit/report/cibil", async function(req, resp) {
        log("/get/check/credit/report/cibil");

        var mobile = (req.params.mobile || req.query.mobile || '').toString().trim();
        var fullname = (req.params.fullname || req.query.fullname || '').toString().trim();

        if (!mobile || !fullname) {
            return resp.status(400).json({ 
                status: false, 
                message: 'Missing required parameters: mobile and fullname' 
            });
        }

        try {
            // CIBIL: fetch at most once per month – return cached if we have data for this month
            var cached = await CibilFetchCache.findOne({ mobile }).sort({ fetched_at: -1 }).lean();
            if (cached && cached.fetched_at && isSameMonth(new Date(cached.fetched_at), new Date()) && cached.response) {
                log('✅ CIBIL: returning cached report (same month)');
                return resp.json({ ...cached.response, cached: true });
            }

            // PAN: fetch only once – use stored PAN from profile if already fetched
            var panNumber = null;
            var profile = null;
            if (ProfileModel) {
                profile = await ProfileModel.findOne({ mobile }).select('kyc.pan_number kyc.pan_advance').lean();
                if (profile && profile.kyc && profile.kyc.pan_number) {
                    panNumber = profile.kyc.pan_number;
                    log('✅ PAN: using stored PAN for mobile (skip getMobileToPAN)');
                }
            }

            if (!panNumber) {
                var panMobile = await getMobileToPAN(fullname, mobile);
                log('getMobileToPAN result:', panMobile.success);
                if (!panMobile.success || panMobile.status_code !== 200) {
                    return resp.json({ status: false, message: 'Unable to fetch PAN from mobile number', step: 'getMobileToPAN' });
                }
                panNumber = panMobile.data.pan_number;
                if (ProfileModel) {
                    await ProfileModel.updateOne(
                        { mobile },
                        { $set: { 'kyc.pan_number': panNumber, 'kyc.isPanVerified': true } },
                        { upsert: false }
                    );
                    log('✅ PAN: stored for mobile (fetch once)');
                }
            }

            // PAN comprehensive – use cached from profile if same PAN (static data, fetch once)
            var panComp = null;
            if (profile && profile.kyc && profile.kyc.pan_advance && (profile.kyc.pan_advance.pan_number || profile.kyc.pan_advance.pan_details) && String(profile.kyc.pan_advance.pan_number || '').toUpperCase() === String(panNumber).toUpperCase()) {
                panComp = { success: true, status_code: 200, data: profile.kyc.pan_advance };
                log('✅ PAN comprehensive: using cached (skip API)');
            }
            if (!panComp || !panComp.success) {
                panComp = await getPANComprehensive(panNumber);
                log('getPANComprehensive result:', panComp.success);
                if (ProfileModel && panComp.success && panComp.data) {
                    await ProfileModel.updateOne(
                        { mobile },
                        { $set: { 'kyc.pan_advance': panComp.data } },
                        { upsert: false }
                    );
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
                name: panDetails.pan_details?.full_name || fullname,
                gender: gender,
                consent: "Y"
            };

            var cibilResp = await fetchCIBIL(cibilParams);
            log('fetchCIBIL result:', cibilResp.success);

            if (cibilResp.success && (cibilResp.status_code === 200 || cibilResp.status === 422)) {
                var payload = { 
                    data: cibilResp.data, 
                    pan_comprehensive: panDetails, 
                    status: true,
                    mode: isSandboxMode() ? 'sandbox' : 'production'
                };
                await CibilFetchCache.updateOne(
                    { mobile },
                    { $set: { mobile, pan: panNumber, name: fullname, response: payload, fetched_at: new Date() } },
                    { upsert: true }
                );
                resp.json(payload);
            } else {
                resp.json({ 
                    status: false, 
                    message: 'Unable to fetch CIBIL report',
                    step: 'fetchCIBIL',
                    pan_comprehensive: panDetails,
                    params: cibilParams
                });
            }

        } catch (error) {
            log('❌ CIBIL fetch error:', error);
            resp.status(500).json({ status: false, message: 'Internal server error', error: error.message });
        }
    });

    // POST endpoint for CIBIL report (preferred for sensitive data)
    app.post("/post/api/cibil/fetch", async function(req, resp) {
        log("/post/api/cibil/fetch");

        var { mobile, fullname, name, pan, consent } = req.body;
        fullname = (fullname || name || '').toString().trim();
        mobile = (mobile || '').toString().trim();

        if (!mobile || !fullname) {
            return resp.status(400).json({ 
                status: false, 
                message: 'Missing required parameters: mobile and fullname/name' 
            });
        }

        try {
            // CIBIL: at most once per month – return cached if we have data for this month
            var cachedPost = await CibilFetchCache.findOne({ mobile }).sort({ fetched_at: -1 }).lean();
            if (cachedPost && cachedPost.fetched_at && isSameMonth(new Date(cachedPost.fetched_at), new Date()) && cachedPost.response) {
                log('✅ CIBIL POST: returning cached report (same month)');
                var hydrateFromCache = require('../cibil/api/cibil-data-resolver.js').hydrateFromCache;
                var hydrated = await hydrateFromCache(mobile);
                if (hydrated) log('✅ CIBIL POST: persisted cache to CibilDataModel for mobile', mobile);
                else log('⚠️ CIBIL POST: hydrate to CibilDataModel failed for mobile', mobile, '- dashboard may show no data until next fetch');
                return resp.json({ ...cachedPost.response, cached: true });
            }

            var panNumber = (pan || '').toString().trim() || null;
            var profilePost = null;
            if (!panNumber && ProfileModel) {
                profilePost = await ProfileModel.findOne({ mobile }).select('kyc.pan_number kyc.pan_advance').lean();
                if (profilePost && profilePost.kyc && profilePost.kyc.pan_number) {
                    panNumber = profilePost.kyc.pan_number;
                    log('✅ PAN POST: using stored PAN (skip getMobileToPAN)');
                }
            }

            if (!panNumber) {
                var panMobile = await getMobileToPAN(fullname, mobile);
                if (!panMobile.success) {
                    return resp.json({ status: false, message: 'Unable to fetch PAN', step: 'getMobileToPAN' });
                }
                panNumber = panMobile.data.pan_number;
                if (ProfileModel) {
                    await ProfileModel.updateOne(
                        { mobile },
                        { $set: { 'kyc.pan_number': panNumber, 'kyc.isPanVerified': true } },
                        { upsert: false }
                    );
                    log('✅ PAN POST: stored (fetch once)');
                }
            }

            var panComp = null;
            if (profilePost && profilePost.kyc && profilePost.kyc.pan_advance && String((profilePost.kyc.pan_advance.pan_number || '')).toUpperCase() === String(panNumber).toUpperCase()) {
                panComp = { success: true, status_code: 200, data: profilePost.kyc.pan_advance };
                log('✅ PAN comprehensive POST: using cached');
            }
            if (!panComp || !panComp.success) {
                panComp = await getPANComprehensive(panNumber);
                if (ProfileModel && panComp.success && panComp.data) {
                    await ProfileModel.updateOne(
                        { mobile },
                        { $set: { 'kyc.pan_advance': panComp.data } },
                        { upsert: false }
                    );
                }
            }
            if (!panComp.success) {
                return resp.json({ status: false, message: 'Unable to verify PAN', step: 'getPANComprehensive' });
            }
            var panDetails = panComp.data;

            var gender = panDetails.pan_details?.gender === 'F' ? 'female' : 'male';

            var cibilResp = await fetchCIBIL({
                mobile: mobile,
                pan: panNumber,
                name: panDetails.pan_details?.full_name || fullname,
                gender: gender,
                consent: consent || "Y"
            });

            if (cibilResp.success) {
                var payload = { 
                    status: true,
                    data: cibilResp.data, 
                    pan_comprehensive: panDetails,
                    mode: isSandboxMode() ? 'sandbox' : 'production'
                };
                await CibilFetchCache.updateOne(
                    { mobile },
                    { $set: { mobile, pan: panNumber, name: fullname, response: payload, fetched_at: new Date() } },
                    { upsert: true }
                );

                // Always persist to CibilDataModel after a successful (paid) fetch so dashboard/PDF never show wrong user
                var profileForEmail = await ProfileModel.findOne({ mobile }).select('profile_info.email profile_info.date_of_birth').lean();
                var userEmail = profileForEmail && (profileForEmail.profile_info || {}).email;
                if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
                    userEmail = (mobile + '@users.astrocred.in').toLowerCase();
                    log('CIBIL POST: using synthetic email for persist (no profile email)');
                }
                var cibilDataResolver = require('../cibil/api/cibil-data-resolver.js');
                var raw = cibilResp.data || {};
                var normalized = cibilDataResolver.normalizeCreditReportAndScore(raw);
                var creditReport = normalized.credit_report;
                var creditScore = normalized.credit_score;
                var genderSchema = (panDetails.pan_details?.gender === 'F') ? 'Female' : 'Male';
                var dob = new Date('1990-01-01');
                if (profileForEmail && profileForEmail.profile_info && profileForEmail.profile_info.date_of_birth) {
                    var d = new Date(profileForEmail.profile_info.date_of_birth);
                    if (!isNaN(d.getTime())) dob = d;
                }
                var dobStr = panDetails.pan_details?.dob || panDetails.pan_details?.input_dob;
                if (dobStr) {
                    var d2 = new Date(dobStr);
                    if (!isNaN(d2.getTime())) dob = d2;
                }
                var panUp = (panNumber || '').toString().trim().toUpperCase();
                if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panUp)) {
                    try {
                        await CibilDataModel.findOneAndUpdate(
                            { mobile },
                            {
                                $set: {
                                    mobile,
                                    email: userEmail,
                                    pan: panUp,
                                    name: (panDetails.pan_details?.full_name || fullname || 'User').trim(),
                                    gender: genderSchema,
                                    credit_score: creditScore || undefined,
                                    credit_report: creditReport.length ? creditReport : undefined,
                                    date_of_birth: dob,
                                    updatedAt: new Date()
                                }
                            },
                            { upsert: true, runValidators: true }
                        );
                        log('✅ CIBIL POST: persisted to CibilDataModel for mobile', mobile);
                    } catch (dbErr) {
                        log('⚠️ CIBIL POST: CibilDataModel save failed (cache still ok):', dbErr.message);
                        if (dbErr.code) log('   DB code:', dbErr.code);
                        if (dbErr.errors) log('   Validation errors:', Object.keys(dbErr.errors));
                    }
                } else {
                    log('⚠️ CIBIL POST: skip persist - invalid PAN format:', panUp);
                }

                resp.json(payload);
            } else {
                resp.json({ status: false, message: 'Unable to fetch CIBIL report', data: cibilResp });
            }

        } catch (error) {
            log('❌ POST CIBIL fetch error:', error);
            resp.status(500).json({ status: false, message: 'Server error', error: error.message });
        }
    })

})();



// http://localhost:5001/get/check/credit/report/cibil?fullname=Siddharth%20Chandra&mobile=8600869205

// "accounts": [
//             {
//                 "index": "T001",
//                 "memberShortName": "NOT DISCLOSED",
//                 "accountType": "08",
//                 "ownershipIndicator": 1,
//                 "dateOpened": "1751794151234",
//                 "lastPaymentDate": "1751794153837",
//                 "dateReported": "1751794151234",
//                 "highCreditAmount": 11111111,
//                 "currentBalance": 79926,
//                 "paymentHistory": "DSFSDFSDFSDFNSDKFHSJKDBNFJSHIDUFBSDIBFIUSDBFUIBCSDBCSUIHZDFIOESBF",
//                 "paymentStartDate": "1751794151012",
//                 "paymentEndDate": "1751794153837",
//                 "creditFacilityStatus": "00",
//                 "collateralType": "00",
//                 "interestRate": 13.5,
//                 "paymentTenure": 24,
//                 "emiAmount": 3182,
//                 "paymentFrequency": "03",
//                 "actualPaymentAmount": 73557
//             }],
//             "enquiries": [
//             {
//                 "index": "I001",
//                 "enquiryDate": "1751794155674",
//                 "memberShortName": "FINTELLIGENCE",
//                 "enquiryPurpose": "05",
//                 "enquiryAmount": 49500
//             }]