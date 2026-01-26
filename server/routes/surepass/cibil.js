(function() {
    /**
     * SurePass CIBIL Integration Service
     * Handles credit score fetching via SurePass API
     * Supports both Sandbox (FREE) and Production (PAID) modes
     * ⚠️ USES MOCK DATA when SurePass token is expired
     */

    // Load mock data module
    const mockCibilData = require('./mock-cibil-data');

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

        var mobile = req.params.mobile || req.query.mobile;
        var fullname = req.params.fullname || req.query.fullname;

        if (!mobile || !fullname) {
            return resp.status(400).json({ 
                status: false, 
                message: 'Missing required parameters: mobile and fullname' 
            });
        }

        try {
            // Step 1: Get PAN from mobile
            var panMobile = await getMobileToPAN(fullname, mobile);
            log('getMobileToPAN result:', panMobile.success);

            if (!panMobile.success || panMobile.status_code !== 200) {
                return resp.json({ 
                    status: false, 
                    message: 'Unable to fetch PAN from mobile number',
                    step: 'getMobileToPAN'
                });
            }

            // Step 2: Get comprehensive PAN details
            var panComp = await getPANComprehensive(panMobile.data.pan_number);
            log('getPANComprehensive result:', panComp.success);

            if (!panComp.success || panComp.status_code !== 200) {
                return resp.json({ 
                    status: false, 
                    message: 'Unable to fetch PAN comprehensive details',
                    step: 'getPANComprehensive'
                });
            }

            // Step 3: Determine gender
            var gender = 'male';
            if (panComp.data.pan_details && panComp.data.pan_details.gender) {
                gender = panComp.data.pan_details.gender === 'F' ? 'female' : 'male';
                    }

            // Step 4: Fetch CIBIL report
                    var cibilParams = {
                        mobile: mobile,
                        pan: panComp.data.pan_number,
                name: panComp.data.pan_details?.full_name || fullname,
                        gender: gender,
                        consent: "Y"
                    };

            var cibilResp = await fetchCIBIL(cibilParams);
            log('fetchCIBIL result:', cibilResp.success);

            if (cibilResp.success && (cibilResp.status_code === 200 || cibilResp.status === 422)) {
                resp.json({ 
                    data: cibilResp.data, 
                    pan_comprehensive: panComp.data, 
                    status: true,
                    mode: isSandboxMode() ? 'sandbox' : 'production'
                });
                    } else {
                resp.json({ 
                    status: false, 
                    message: 'Unable to fetch CIBIL report',
                    step: 'fetchCIBIL',
                    pan_comprehensive: panComp.data,
                    params: cibilParams
                });
            }

        } catch (error) {
            log('❌ CIBIL fetch error:', error);
            resp.status(500).json({ 
                status: false, 
                message: 'Internal server error',
                error: error.message
            });
        }
    });

    // POST endpoint for CIBIL report (preferred for sensitive data)
    app.post("/post/api/cibil/fetch", async function(req, resp) {
        log("/post/api/cibil/fetch");

        var { mobile, fullname, name, pan, consent } = req.body;
        fullname = fullname || name;

        if (!mobile || !fullname) {
            return resp.status(400).json({ 
                status: false, 
                message: 'Missing required parameters: mobile and fullname/name' 
            });
        }

        try {
            // If PAN provided directly, skip mobile-to-PAN step
            var panNumber = pan;
            var panDetails = null;

            if (!panNumber) {
                var panMobile = await getMobileToPAN(fullname, mobile);
                if (!panMobile.success) {
                    return resp.json({ status: false, message: 'Unable to fetch PAN', step: 'getMobileToPAN' });
                }
                panNumber = panMobile.data.pan_number;
            }

            var panComp = await getPANComprehensive(panNumber);
            if (!panComp.success) {
                return resp.json({ status: false, message: 'Unable to verify PAN', step: 'getPANComprehensive' });
            }
            panDetails = panComp.data;

            var gender = panDetails.pan_details?.gender === 'F' ? 'female' : 'male';

            var cibilResp = await fetchCIBIL({
                mobile: mobile,
                pan: panNumber,
                name: panDetails.pan_details?.full_name || fullname,
                gender: gender,
                consent: consent || "Y"
            });

            if (cibilResp.success) {
                resp.json({ 
                    status: true,
                    data: cibilResp.data, 
                    pan_comprehensive: panDetails,
                    mode: isSandboxMode() ? 'sandbox' : 'production'
                });
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