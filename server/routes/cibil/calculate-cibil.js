(function() {
    // Import required modules
    const GradingEngine = require("./api/grading-engine");
    const AdvancedAnalytics = require("./api/analytics-engine-advance.js");
    const RiskAssessment = require("./api/risk-assessment.js");
    const AdvancedRiskAssessment = require("./api/advance-risk-assessement.js");
    const EconomicDataService = require("./api/economic-data-services.js");
    const AnalysisCacheHelper = require("./api/analysis-cache.js");
    
    // Helper function to validate Indian mobile number
    function validateIndianMobile(mobile) {
        if (!mobile) return false;
        // Remove +91 if present
        var cleaned = mobile.replace('+91', '');
        // Indian mobile validation: 10 digits starting with 6-9
        return /^[6-9]\d{9}$/.test(cleaned);
    }
    
    // Helper function to validate PAN
    function validatePAN(pan) {
        if (!pan) return false;
        // PAN format: ABCDE1234F (5 letters, 4 digits, 1 letter)
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
    }
    
    // Helper function to validate email
    function validateEmail(email) {
        if (!email) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase());
    }
    
    /**
     * Get PAN from mobile number using SurePass API
     */
    async function getMobileToPAN(fullname, mobile) {
        return new Promise(function(resolve, reject) {
            try {
                log("getMobileToPAN called with:", { fullname: fullname, mobile: mobile });
                
                if (!mobile || !fullname) {
                    return reject({ 
                        status: false, 
                        error: 'Mobile number and full name are required' 
                    });
                }
                
                // Clean mobile number
                var cleanedMobile = mobile.replace('+91', '');
                if (!validateIndianMobile(cleanedMobile)) {
                    return reject({ 
                        status: false, 
                        error: 'Invalid Indian mobile number format' 
                    });
                }
                
                var URL = process.env.SUREPASS_URL + "/api/v1/pan/mobile-to-pan";
                log('SurePass API URL:', URL);
                
                const options = {
                    method: 'POST',
                    url: URL,
                    headers: {
                        "accept": 'application/json',
                        "Authorization": 'Bearer ' + process.env.SUREPASS_TOKEN,
                        "content-type": 'application/json'
                    },
                    data: {
                        "name": fullname,
                        "mobile_no": cleanedMobile
                    },
                    timeout: 30000 // 30 second timeout
                };
                
                axios(options)
                    .then(function(response) {
                        log(response.data);
                        log('SurePass Mobile-to-PAN API Success:', response.status);
                        
                        if (!response.data || !response.data.data.pan_number) {
                            return reject({ 
                                status: false, 
                                error: 'No PAN found for the provided mobile number and name' 
                            });
                        }
                        
                        // Validate PAN format
                        if (!validatePAN(response.data.data.pan_number)) {
                            return reject({ 
                                status: false, 
                                error: 'Invalid PAN format received from API' 
                            });
                        }
                        
                        resolve({
                            status: true,
                            data: response.data,
                            pan_number: response.data.data.pan_number,
                            pan_details: response.data.pan_details || {},
                            metadata: {
                                source: 'SurePass API',
                                timestamp: new Date().toISOString(),
                                api_version: 'v1'
                            }
                        });
                    })
                    .catch(function(errorResp) {
                        log('SurePass Mobile-to-PAN API Error:', {
                            status: errorResp.response ? errorResp.response.status : 'No response',
                            message: errorResp.message,
                            data: errorResp.response ? errorResp.response.data : 'No data'
                        });
                        
                        var errorMsg = 'Failed to fetch PAN from mobile';
                        if (errorResp.response) {
                            if (errorResp.response.status === 404) {
                                errorMsg = 'No PAN found for the provided mobile number and name';
                            } else if (errorResp.response.status === 400) {
                                errorMsg = 'Invalid request parameters';
                            } else if (errorResp.response.status === 401) {
                                errorMsg = 'API authentication failed';
                            } else if (errorResp.response.status === 429) {
                                errorMsg = 'API rate limit exceeded';
                            }
                        }
                        
                        reject({ 
                            status: false, 
                            error: errorMsg,
                            details: errorResp.message 
                        });
                    });
                    
            } catch (catchError) {
                log('Exception in getMobileToPAN:', catchError);
                reject({ 
                    status: false, 
                    error: 'Internal server error in PAN lookup',
                    details: catchError.message 
                });
            }
        });
    }
    
    /**
     * Fetch CIBIL report using SurePass API
     */
    async function fetchCIBILReport(params) {
        return new Promise(function(resolve, reject) {
            try {
                log("fetchCIBILReport called with params:", params);
                
                // Validate required parameters
                if (!params.mobile || !params.pan || !params.name) {
                    return reject({ 
                        status: false, 
                        error: 'Missing required parameters: mobile, pan, or name' 
                    });
                }
                
                // Clean mobile number
                params.mobile = params.mobile.replace('+91', '');
                
                if (!validateIndianMobile(params.mobile)) {
                    return reject({ 
                        status: false, 
                        error: 'Invalid Indian mobile number format' 
                    });
                }
                
                if (!validatePAN(params.pan)) {
                    return reject({ 
                        status: false, 
                        error: 'Invalid PAN format' 
                    });
                }
                
                // Validate gender (if provided)
                if (params.gender && !['male', 'female', 'Other'].includes(params.gender)) {
                    params.gender = 'male'; // Default to Other if invalid
                }
                
                var URL = process.env.SUREPASS_URL + "/api/v1/credit-report-cibil/fetch-report";
                log('SurePass CIBIL API URL:', URL);
                
                const options = {
                    method: 'POST',
                    url: URL,
                    headers: {
                        "accept": 'application/json',
                        "Authorization": 'Bearer ' + process.env.SUREPASS_TOKEN,
                        "content-type": 'application/json'
                    },
                    data: {
                        "mobile": params.mobile,
                        "pan": params.pan,
                        "name": params.name,
                        "gender": params.gender || 'male',
                        "consent": params.consent || "Y"
                    },
                    timeout: 60000 // 60 second timeout for CIBIL report
                };
                
                axios(options)
                    .then(function(response) {
                        log('SurePass CIBIL API Success:', response.status);
                        
                        if (!response.data) {
                            return reject({ 
                                status: false, 
                                error: 'Empty response from CIBIL API' 
                            });
                        }
                        
                        // Transform data to match our updated schema
                        var transformedData = transformCIBILData(response.data, params);
                        
                        resolve({
                            status: true,
                            data: transformedData,
                            raw_data: response.data, // Keep raw data for reference
                            metadata: {
                                source: 'SurePass CIBIL API',
                                timestamp: new Date().toISOString(),
                                api_version: 'v1',
                                params_used: params
                            }
                        });
                    })
                    .catch(function(errorResp) {
                        log('SurePass CIBIL API Error:', {
                            status: errorResp.response ? errorResp.response.status : 'No response',
                            message: errorResp.message,
                            data: errorResp.response ? errorResp.response.data : 'No data'
                        });
                        
                        var errorMsg = 'Failed to fetch CIBIL report';
                        if (errorResp.response) {
                            if (errorResp.response.status === 404) {
                                errorMsg = 'No CIBIL report found for the provided details';
                            } else if (errorResp.response.status === 400) {
                                errorMsg = 'Invalid request parameters for CIBIL report';
                            } else if (errorResp.response.status === 401) {
                                errorMsg = 'API authentication failed';
                            } else if (errorResp.response.status === 429) {
                                errorMsg = 'API rate limit exceeded';
                            } else if (errorResp.response.status === 500) {
                                errorMsg = 'CIBIL server error, please try again later';
                            }
                        }
                        
                        reject({ 
                            status: false, 
                            error: errorMsg,
                            details: errorResp.message,
                            status_code: errorResp.response ? errorResp.response.status : 500
                        });
                    });
                    
            } catch (catchError) {
                log('Exception in fetchCIBILReport:', catchError);
                reject({ 
                    status: false, 
                    error: 'Internal server error in CIBIL report fetch',
                    details: catchError.message 
                });
            }
        });
    }
    
    /**
     * Transform CIBIL API data to match our updated schema structure
     */
    function transformCIBILData(apiData, params) {
        try {
            var transformed = {
                // Primary identifiers (from updated schema)
                mobile: params.mobile,
                email: null, // Will be extracted if available
                pan: params.pan,
                name: params.name,
                gender: params.gender || 'male',
                
                // Credit score from API
                credit_score: apiData.credit_score || null,
                
                // Credit report data (maintain existing structure)
                credit_report: apiData.credit_report || [],
                
                // PAN comprehensive data if available
                pan_comprehensive: apiData.pan_comprehensive || {
                    data: {
                        pan_number: params.pan,
                        pan_details: {
                            full_name: params.name,
                            gender: params.gender || 'male'
                        }
                    },
                    success: true,
                    message: 'PAN details included'
                },
                
                // Original parameters
                params: {
                    mobile: params.mobile,
                    pan: params.pan,
                    name: params.name,
                    gender: params.gender || 'male',
                    consent: params.consent || "Y"
                },
                
                // Status flags from API
                status: apiData.status || false,
                status_code: apiData.status_code || 200,
                success: apiData.success || false,
                message: apiData.message || 'CIBIL report fetched successfully',
                message_code: apiData.message_code || 'SUCCESS',
                
                // Additional fields from updated schema
                date_of_birth: extractDateOfBirth(apiData),
                
                // Timestamps
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            // Extract email from PAN comprehensive data if available
            if (apiData.pan_comprehensive && apiData.pan_comprehensive.data && apiData.pan_comprehensive.data.pan_details) {
                transformed.email = apiData.pan_comprehensive.data.pan_details.email || null;
                transformed.date_of_birth = apiData.pan_comprehensive.data.pan_details.dob || transformed.date_of_birth;
            }
            
            // Extract email from credit report if available
            if (!transformed.email && apiData.credit_report && apiData.credit_report[0] && apiData.credit_report[0].emails) {
                var emails = apiData.credit_report[0].emails;
                if (emails.length > 0 && emails[0].emailID) {
                    transformed.email = emails[0].emailID;
                }
            }
            
            // Extract Aadhaar if available
            if (apiData.pan_comprehensive && apiData.pan_comprehensive.data && apiData.pan_comprehensive.data.pan_details) {
                var maskedAadhaar = apiData.pan_comprehensive.data.pan_details.masked_aadhaar;
                if (maskedAadhaar && /^\d{4}\s?\d{4}\s?\d{4}$/.test(maskedAadhaar.replace(/\s/g, ''))) {
                    transformed.aadhaar_number = maskedAadhaar.replace(/\s/g, '');
                }
            }
            
            return transformed;
            
        } catch (error) {
            log('Error transforming CIBIL data:', error);
            // Return minimal valid structure
            return {
                mobile: params.mobile,
                pan: params.pan,
                name: params.name,
                gender: params.gender || 'male',
                credit_report: apiData.credit_report || [],
                success: apiData.success || false,
                message: apiData.message || 'Data transformation error'
            };
        }
    }
    
    /**
     * Extract date of birth from various sources in the API data
     */
    function extractDateOfBirth(apiData) {
        try {
            // Try PAN comprehensive data first
            if (apiData.pan_comprehensive && apiData.pan_comprehensive.data && apiData.pan_comprehensive.data.pan_details) {
                var dob = apiData.pan_comprehensive.data.pan_details.dob;
                if (dob) return new Date(dob);
            }
            
            // Try credit report names
            if (apiData.credit_report && apiData.credit_report[0] && apiData.credit_report[0].names) {
                var names = apiData.credit_report[0].names;
                for (var i = 0; i < names.length; i++) {
                    if (names[i].birthDate) {
                        return new Date(names[i].birthDate);
                    }
                }
            }
            
            return null;
            
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Check if CIBIL data already exists in database
     */
    async function checkExistingCIBILData(mobile, pan, email) {
        return new Promise(async function(resolve, reject) {
            try {
               
                
                var query = {};
                
                // Build query with available identifiers
                if (mobile) query.mobile = mobile;
                else if (pan) query.pan = pan;
                else if (email) query.email = email;
                else {
                    return resolve({ exists: false, data: null });
                }
                
                CibilDataModel.findOne(query, function(err, existingData) {
                    if (err) {
                        log('Error checking existing CIBIL data:', err);
                        return resolve({ exists: false, data: null, error: err.message });
                    }
                    
                    if (existingData) {
                        // Check if data is recent (within 30 days)
                        var dataAge = Date.now() - new Date(existingData.updatedAt).getTime();
                        var maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
                        
                        return resolve({
                            exists: true,
                            data: existingData,
                            isRecent: dataAge < maxAge,
                            ageDays: Math.round(dataAge / (24 * 60 * 60 * 1000))
                        });
                    } else {
                        return resolve({ exists: false, data: null });
                    }
                });
                
            } catch (error) {
                log('Exception in checkExistingCIBILData:', error);
                resolve({ exists: false, data: null, error: error.message });
            }
        });
    }
    
    /**
     * Save CIBIL data to database
     */
    async function saveCIBILData(cibilData) {
        return new Promise(async function(resolve, reject) {
            try {
               
                
                // Build query based on available identifiers
                var query = {};
                if (cibilData.mobile) query.mobile = cibilData.mobile;
                else if (cibilData.pan) query.pan = cibilData.pan;
                else if (cibilData.email) query.email = cibilData.email;
                else {
                    return reject({ error: 'No valid identifier found for saving data' });
                }
                
                // Update or create record
                CibilDataModel.findOneAndUpdate(
                    query,
                    {
                        $set: cibilData,
                        $setOnInsert: { createdAt: new Date() }
                    },
                    {
                        new: true,
                        upsert: true,
                        runValidators: true
                    },
                    function(err, savedData) {
                        if (err) {
                            log('Error saving CIBIL data:', err);
                            return reject({ 
                                error: 'Failed to save CIBIL data', 
                                details: err.message 
                            });
                        }
                        
                        resolve({
                            success: true,
                            data: savedData,
                            message: 'CIBIL data saved successfully',
                            action: savedData._id ? 'updated' : 'created'
                        });
                    }
                );
                
            } catch (error) {
                log('Exception in saveCIBILData:', error);
                reject({ 
                    error: 'Internal server error saving data', 
                    details: error.message 
                });
            }
        });
    }
    
    /**
     * Main API endpoint for CIBIL data calculation
     */
    app.get('/get/api/cibil/data/calculate', async function(req, res) {
        try {
            log('/get/api/cibil/data/calculate API called');
            
            // Extract parameters from request
            var fullname = req.body.fullname || req.query.fullname || req.params["fullname"];
            var mobile = req.body.mobile || req.query.mobile || req.params["mobile"];
            var email = req.body.email || req.query.email || req.params["email"];
            var pan = req.body.pan || req.query.pan || req.params["pan"];
            var gender = req.body.gender || req.query.gender || req.params["gender"];
            var useCache = req.body.useCache !== false; // Default to true
            
            // Validate required parameters
            if (!fullname || !mobile) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Missing required parameters: fullname and mobile are required' 
                });
            }
            
            // Clean mobile number
            mobile = mobile.replace('+91', '');
            if (!validateIndianMobile(mobile)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid Indian mobile number format' 
                });
            }
            
            // Check if we already have data for this user
            if (useCache) {
                var existingData = await checkExistingCIBILData(mobile, pan, email);
                
                if (existingData.exists && existingData.isRecent && existingData.data.analysis) {
                    log('Using cached analysis for user:', { mobile: mobile, name: fullname });
                    
                    return res.json({
                        success: true,
                        cached: true,
                        message: 'Using cached analysis (data is recent)',
                        data_age_days: existingData.ageDays,
                        user_info: {
                            name: existingData.data.name,
                            mobile: existingData.data.mobile,
                            email: existingData.data.email,
                            pan: existingData.data.pan
                        },
                        analysis: existingData.data.analysis,
                        metadata: {
                            generated_at: existingData.data.analysis.analyzedAt,
                            analysis_version: existingData.data.analysis.analysisVersion,
                            data_freshness: existingData.isRecent ? 'Recent (<30 days)' : 'Stale'
                        }
                    });
                }
            }
            
            var panData;
            var cibilData;
            
            // Step 1: Get PAN if not provided
            if (!pan) {
                log('PAN not provided, fetching from mobile and name...');
                panData = await getMobileToPAN(fullname, mobile);
                
                if (!panData.status) {
                    return res.status(404).json({ 
                        success: false, 
                        error: panData.error || 'Failed to fetch PAN details',
                        details: panData.details 
                    });
                }
                
                pan = panData.pan_number;
                // Update name from PAN data if available (more accurate)
                if (panData.pan_details && panData.pan_details.full_name) {
                    fullname = panData.pan_details.full_name;
                }
                if (panData.pan_details && panData.pan_details.gender) {
                    gender = panData.pan_details.gender;
                }
            }
            
            // Step 2: Fetch CIBIL report
            log('Fetching CIBIL report...');
            var params = {
                mobile: mobile,
                pan: pan,
                name: fullname,
                gender: gender || 'male',
                consent: "Y"
            };
            
            cibilData = await fetchCIBILReport(params);
            
            if (!cibilData.status) {
                return res.status(cibilData.status_code || 500).json({ 
                    success: false, 
                    error: cibilData.error || 'Failed to fetch CIBIL report',
                    details: cibilData.details 
                });
            }
            
            var transformedData = cibilData.data;
            
            // Step 3: Save to database
            log('Saving CIBIL data to database...');
            var saveResult = await saveCIBILData(transformedData);
            if (!saveResult.success) {
                log('Warning: Failed to save CIBIL data:', saveResult.error);
                // Continue with analysis even if save fails
            }
            
            // Step 4: Analyze the data using analysis cache helper
            log('Starting analysis...');
            var analysisHelper = require('./api/analysis-cache.js');
            var analysisResult = await analysisHelper.getOrComputeAnalysis(transformedData, false);
            
            // Step 5: Generate comprehensive reports
            log('Generating comprehensive reports...');
            var analyzer = new GradingEngine(transformedData);
            var advanced = new AdvancedAnalytics(transformedData, analyzer);
            var risk = new RiskAssessment(transformedData, analyzer);
            var advancedRisk = new AdvancedRiskAssessment(transformedData, analyzer, risk);
            
            // Get enhanced risk assessment
            var enhancedAssessment = await new Promise((resolve, reject) => {
                advancedRisk.getEnhancedRiskAssessment(function(err, result) {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            
            // Generate all reports
            var overallGrade = analyzer.calculateOverallGrade();
            var defaulters = analyzer.identifyDefaulters();
            var recommendations = analyzer.generateRecommendations();
            var riskReport = risk.generateRiskReport();
            var creditWorthiness = risk.calculateCreditWorthiness();
            var defaultProbability = risk.calculateDefaultProbability();
            var institutions = risk.getEligibleInstitutions();
            var comprehensiveReport = advanced.generateComprehensiveReport();
            var improvementPlan = advanced.generateImprovementPlan();
            var bankSuggestions = advanced.suggestBanks();
            var componentScores = analyzer.getComponentScores ? analyzer.getComponentScores() : {};
            var creditReportSummary = analyzer.getCreditReportSummary ? analyzer.getCreditReportSummary() : {};
            
            // Step 6: Prepare final response
            var response = {
                success: true,
                cached: analysisResult.cached,
                message: 'CIBIL data analyzed successfully',
                user_info: {
                    name: transformedData.name,
                    mobile: transformedData.mobile,
                    email: transformedData.email,
                    pan: transformedData.pan,
                    gender: transformedData.gender,
                    date_of_birth: transformedData.date_of_birth,
                    credit_score: transformedData.credit_score
                },
                analysis: {
                    overall_grade: overallGrade,
                    component_scores: componentScores,
                    credit_report_summary: creditReportSummary,
                    defaulters: defaulters,
                    recommendations: recommendations,
                    risk_assessment: {
                        credit_worthiness: creditWorthiness,
                        default_probability: defaultProbability,
                        risk_report: riskReport,
                        enhanced_risk_assessment: enhancedAssessment
                    },
                    advanced_analytics: {
                        comprehensive_report: comprehensiveReport,
                        improvement_plan: improvementPlan,
                        bank_suggestions: bankSuggestions,
                        eligible_institutions: institutions
                    }
                },
                metadata: {
                    generated_at: new Date().toISOString(),
                    analysis_version: analysisResult.analysis.analysisVersion || '1.0',
                    data_sources: ['SurePass API', 'CIBIL'],
                    processing_time_ms: Date.now() - req.startTime,
                    cached_analysis: analysisResult.cached
                }
            };
            
            // Add raw data if requested (for debugging)
            if (req.query.include_raw === 'true') {
                response.raw_data = {
                    pan_lookup: panData,
                    cibil_api_response: cibilData.raw_data,
                    transformed_data: transformedData
                };
            }
            
            // Step 7: Update analysis in database if not cached
            if (!analysisResult.cached) {
                try {
                    var updateResult = await saveCIBILData({
                        mobile: transformedData.mobile,
                        analysis: analysisResult.analysis
                    });
                    log('Analysis saved to database:', updateResult.action);
                } catch (updateError) {
                    log('Warning: Failed to save analysis to database:', updateError);
                }
            }
            
            log('CIBIL analysis completed successfully');
            res.json(response);
            
        } catch (error) {
            log('Error in CIBIL data calculation endpoint:', error);
            
            var statusCode = 500;
            var errorMessage = 'Internal server error';
            var errorDetails = error.message;
            
            // Handle specific error types
            if (error.message && error.message.includes('timeout')) {
                statusCode = 504;
                errorMessage = 'Request timeout - external API took too long to respond';
            } else if (error.message && error.message.includes('network')) {
                statusCode = 503;
                errorMessage = 'Network error - unable to reach external services';
            } else if (error.message && error.message.includes('validation')) {
                statusCode = 400;
                errorMessage = 'Validation error';
            }
            
            res.status(statusCode).json({
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
                metadata: {
                    timestamp: new Date().toISOString(),
                    request_id: req.requestId || 'unknown'
                }
            });
        }
    });
    
    /**
     * Alternative endpoint with POST support
     */
    app.post('/api/cibil/analyze', async function(req, res) {
        // Set start time for processing time calculation
        req.startTime = Date.now();
        
        // Generate request ID for tracking
        req.requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        log(`[${req.requestId}] CIBIL analyze request received`);
        
        // Call the main function
        return app._router.handle(req, res, function() {
            // This ensures the GET route is called with POST data
            req.method = 'GET';
            app._router.handle(req, res);
        });
    });
    
    /**
     * Health check endpoint
     */
    app.get('/api/cibil/health', function(req, res) {
        res.json({
            status: 'healthy',
            service: 'CIBIL Analysis API',
            version: '2.0',
            schema_version: 'mobile-email-pan-based',
            timestamp: new Date().toISOString(),
            dependencies: {
                grading_engine: 'loaded',
                advanced_analytics: 'loaded',
                risk_assessment: 'loaded',
                economic_data: 'loaded',
                cache_helper: 'loaded'
            }
        });
    });
    
    /**
     * Clear cache endpoint (admin/development only)
     */
    app.post('/api/cibil/clear-cache', async function(req, res) {
        try {
            // Simple authentication (in production, use proper auth)
            var adminKey = req.headers['x-admin-key'] || req.query.admin_key;
            if (adminKey !== process.env.ADMIN_KEY && process.env.NODE_ENV === 'production') {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            
            var identifier = req.body.identifier || req.query.identifier;
            var identifierType = req.body.identifier_type || req.query.identifier_type || 'mobile';
            
            if (!identifier) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Identifier required' 
                });
            }
            
            var analysisHelper = require('./api/analysis-cache.js');
            var result = await analysisHelper.clearAnalysisCache(identifier, identifierType);
            
            res.json({
                success: true,
                message: 'Cache cleared successfully',
                result: result
            });
            
        } catch (error) {
            log('Error clearing cache:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to clear cache',
                details: error.message 
            });
        }
    });
    
    /**
     * Batch analysis endpoint
     */
    app.post('/api/cibil/batch-analyze', async function(req, res) {
        try {
            // Simple rate limiting check
            var batchSize = req.body.identifiers ? req.body.identifiers.length : 0;
            if (batchSize > 50) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Batch size too large. Maximum 50 identifiers per request.' 
                });
            }
            
            var identifiers = req.body.identifiers || [];
            var identifierType = req.body.identifier_type || 'mobile';
            var forceRecompute = req.body.force_recompute || false;
            
            if (!Array.isArray(identifiers) || identifiers.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Identifiers array is required' 
                });
            }
            
            var analysisHelper = require('./api/analysis-cache.js');
            var results = await analysisHelper.batchAnalyzeUsers(identifiers, identifierType, forceRecompute);
            
            res.json({
                success: true,
                message: `Batch analysis completed for ${results.length} users`,
                results: results,
                summary: {
                    total: results.length,
                    with_cached_data: results.filter(r => r.cached).length,
                    with_fresh_data: results.filter(r => !r.cached).length,
                    errors: results.filter(r => r.error).length
                }
            });
            
        } catch (error) {
            log('Error in batch analysis:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Batch analysis failed',
                details: error.message 
            });
        }
    });
    
    // Export helper functions for testing
    module.exports = {
        validateIndianMobile: validateIndianMobile,
        validatePAN: validatePAN,
        validateEmail: validateEmail,
        getMobileToPAN: getMobileToPAN,
        fetchCIBILReport: fetchCIBILReport,
        transformCIBILData: transformCIBILData,
        checkExistingCIBILData: checkExistingCIBILData,
        saveCIBILData: saveCIBILData
    };
    
})();