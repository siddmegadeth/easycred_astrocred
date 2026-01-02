(function() {
    var GradingEngine = require("./api/grading-engine");
    var AdvancedAnalytics = require("./api/analytics-engine-advance.js");
    var RiskAssessment = require("./api/risk-assessment.js");
    var AdvancedRiskAssessment = require("./api/advance-risk-assessement.js");
    var EconomicDataService = require("./api/economic-data-services.js");

    async function getMobileToPAN(fullname, mobile) {
        return new Promise(function(approve, reject) {
            try {
                log("getMobileToPAN");
                if (mobile && fullname) {
                    var URL = process.env.SUREPASS_URL + "/api/v1/pan/mobile-to-pan";
                    log('URL :' + URL);

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
                            "mobile_no": mobile
                        }
                    };
                    axios(options)
                        .then(function(response) {
                            log('response Success getMobileToPAN : ');
                            approve(response.data);
                        })
                        .catch(function(errorResp) {
                            log('Response Error getMobileToPAN :');
                            log(errorResp.status);
                            reject(errorResp);
                        });
                } else {
                    reject({ status: false, message: 'Missing fullname or mobile' });
                }
            } catch (catchError) {
                reject(catchError);
            }
        });
    }

    async function fetchCIBILReport(params) {
        return new Promise(function(approve, reject) {
            try {
                log("fetchCIBIL : ");
                var URL = process.env.SUREPASS_URL + "/api/v1/credit-report-cibil/fetch-report";
                log('URL :' + URL);

                log('Params For CIBIL Report :');
                log(params);

                // Validate required params
                if (!params.pan || !params.name || !params.mobile) {
                    return reject({ 
                        status: false, 
                        message: 'Missing required parameters: pan, name, mobile are required' 
                    });
                }

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
                        "gender": params.gender || "M",
                        "consent": "Y"
                    }
                };
                axios(options)
                    .then(function(response) {
                        log('response Success fetchCIBIL : ');
                        approve(response.data);
                    })
                    .catch(function(errorResp) {
                        log('Response Error fetchCIBIL :');
                        log(errorResp.status);
                        reject(errorResp);
                    })
            } catch (catchError) {
                reject(catchError);
            }
        });
    }

    // Helper function to analyze CIBIL data and return results
    // Now uses analysis cache for better performance
    async function analyzeCibilData(cibilData, res) {
        try {
            var AnalysisCache = require('./api/analysis-cache');
            
            // Force recompute on upload (data just changed)
            var result = await AnalysisCache.getOrComputeAnalysis(cibilData, true);
            var analysis = result.analysis;
            
            // Get enhanced risk assessment (async, doesn't need to block)
            var analyzer = new GradingEngine(cibilData);
            var advanced = new AdvancedAnalytics(cibilData, analyzer);
            var risk = new RiskAssessment(cibilData, analyzer);
            var advancedRiskAssessment = new AdvancedRiskAssessment(cibilData, analyzer, risk);
            var baseRisk = risk.calculateDefaultProbability();
            
            try {
                var enhancedAssessment = await new Promise(function(resolve, reject) {
                    advancedRiskAssessment.getEnhancedRiskAssessment(function(err, enhanced) {
                        if (err) reject(err);
                        else resolve(enhanced);
                    });
                });
                
                // Add score to history
                try {
                    // Auto-add to score history
                    var ScoreHistoryModel = require('./models/score-history-model');
                    var historyData = {
                        client_id: cibilData.client_id,
                        pan: cibilData.pan_number || cibilData.pan,
                        mobile: cibilData.mobile_number || cibilData.mobile,
                        email: cibilData.email,
                        name: cibilData.name || cibilData.full_name,
                        score: cibilData.credit_score,
                        grade: analysis.overallGrade,
                        source: 'upload'
                    };
                    
                    // Use existing add score endpoint logic or direct save
                    var historyEntry = {
                        score: parseInt(cibilData.credit_score),
                        grade: analysis.overallGrade,
                        date: new Date(),
                        source: 'upload'
                    };
                    
                    await ScoreHistoryModel.findOneAndUpdate(
                        { client_id: cibilData.client_id },
                        { 
                            $set: {
                                pan: historyData.pan,
                                mobile: historyData.mobile,
                                email: historyData.email,
                                name: historyData.name,
                                updatedAt: new Date()
                            },
                            $push: { scores: historyEntry }
                        },
                        { upsert: true, new: true }
                    );
                } catch (historyError) {
                    log('Warning: Could not save to score history:', historyError.message);
                    // Continue with analysis even if history save fails
                }
                
                res.json({
                    success: true,
                    client_id: cibilData.client_id,
                    name: cibilData.name || cibilData.full_name,
                    pan: cibilData.pan_number || cibilData.pan,
                    mobile: cibilData.mobile_number || cibilData.mobile,
                    email: cibilData.email,
                    credit_score: cibilData.credit_score,
                    overallGrade: analysis.overallGrade,
                    defaulters: analysis.defaulters,
                    recommendations: analysis.recommendations,
                    report: analysis.comprehensiveReport,
                    plan: analysis.improvementPlan,
                    bankSuggestions: analysis.bankSuggestions,
                    risk_report: analysis.riskReport,
                    credit_worthy: analysis.riskDetails.creditWorthiness,
                    default_probability: analysis.riskDetails.defaultProbability,
                    institution: analysis.riskDetails.eligibleInstitutions,
                    enhanced_analysis: {
                        baseRisk: baseRisk,
                        enhancedRisk: enhancedAssessment.enhancedRisk,
                        economicData: enhancedAssessment.economicData,
                        comparison: {
                            probabilityDifference: enhancedAssessment.enhancedRisk.probability - baseRisk.probability,
                            riskLevelChange: baseRisk.riskLevel !== enhancedAssessment.enhancedRisk.riskLevel ?
                                baseRisk.riskLevel + ' → ' + enhancedAssessment.enhancedRisk.riskLevel : 'No change',
                            factorsConsidered: Object.keys(enhancedAssessment.enhancedRisk.economicAdjustments || {}).length +
                                Object.keys(enhancedAssessment.enhancedRisk.incomeFactors || {}).length + 1
                        }
                    },
                    cached: result.cached,
                    scoreHistoryUpdated: true,
                    message: 'CIBIL data analyzed and saved to history successfully'
                });
                
            } catch (enhancedError) {
                console.error('Error generating enhanced risk assessment:', enhancedError);
                // Return basic analysis even if enhanced fails
                res.json({
                    success: true,
                    client_id: cibilData.client_id,
                    name: cibilData.name || cibilData.full_name,
                    pan: cibilData.pan_number || cibilData.pan,
                    mobile: cibilData.mobile_number || cibilData.mobile,
                    email: cibilData.email,
                    credit_score: cibilData.credit_score,
                    overallGrade: analysis.overallGrade,
                    defaulters: analysis.defaulters,
                    recommendations: analysis.recommendations,
                    report: analysis.comprehensiveReport,
                    plan: analysis.improvementPlan,
                    bankSuggestions: analysis.bankSuggestions,
                    risk_report: analysis.riskReport,
                    credit_worthy: analysis.riskDetails.creditWorthiness,
                    default_probability: analysis.riskDetails.defaultProbability,
                    institution: analysis.riskDetails.eligibleInstitutions,
                    cached: result.cached,
                    enhanced_analysis: null,
                    message: 'CIBIL data analyzed successfully (basic analysis only)'
                });
            }
        } catch (analysisError) {
            console.error('Analysis error:', analysisError);
            res.status(500).json({ 
                error: 'Analysis error', 
                details: analysisError.message,
                suggestion: 'Try uploading the data again or check the data format'
            });
        }
    }

    // Fix database indexes - removes stale profile index
    app.get('/get/api/cibil/fix-indexes', async function(req, res) {
        try {
            log('/get/api/cibil/fix-indexes');
            
            // Drop all indexes except _id and recreate
            await CibilDataModel.collection.dropIndexes();
            log('Dropped all indexes on CibilDataModel');
            
            // Create the correct index on client_id
            await CibilDataModel.collection.createIndex({ client_id: 1 }, { unique: true });
            log('Created client_id index');
            
            // Create additional indexes for better query performance
            await CibilDataModel.collection.createIndex({ pan_number: 1 }, { sparse: true });
            await CibilDataModel.collection.createIndex({ mobile_number: 1 }, { sparse: true });
            await CibilDataModel.collection.createIndex({ email: 1 }, { sparse: true });
            await CibilDataModel.collection.createIndex({ credit_score: 1 });
            await CibilDataModel.collection.createIndex({ updatedAt: -1 });
            
            log('Created additional indexes for better performance');
            
            res.json({ 
                success: true, 
                message: 'Indexes fixed and optimized successfully.',
                indexes: ['client_id', 'pan_number', 'mobile_number', 'email', 'credit_score', 'updatedAt']
            });
        } catch (error) {
            console.error('Error fixing indexes:', error);
            res.status(500).json({ 
                error: 'Error fixing indexes', 
                details: error.message,
                fix: 'You may need to manually fix indexes in MongoDB: db.cibildatamodels.dropIndexes()'
            });
        }
    });

    // Upload and analyze CIBIL data from file
    app.get('/get/api/cibil/upload', function(req, res) {
        try {
            log('/get/api/cibil/upload');
            
            // Clear require cache to get fresh data
            delete require.cache[require.resolve("./../../../data/cibil/sample-data.json")];
            var cibilData = require("./../../../data/cibil/sample-data.json");
            cibilData = cibilData.data;
            
            log('-------------CIBIL DATA SAMPLE-------------------');
            log(cibilData);
            log('--------------------------------');

            // Validate required fields
            if (!cibilData.client_id || !cibilData.credit_report) {
                return res.status(400).json({ 
                    error: 'Missing required fields',
                    required: ['client_id', 'credit_report'],
                    received: Object.keys(cibilData)
                });
            }

            // Normalize identifiers
            if (!cibilData.pan_number && cibilData.pan) cibilData.pan_number = cibilData.pan;
            if (!cibilData.mobile_number && cibilData.mobile) cibilData.mobile_number = cibilData.mobile;
            if (!cibilData.name && cibilData.full_name) cibilData.name = cibilData.full_name;

            // Use findOneAndUpdate with upsert to handle both create and update
            CibilDataModel.findOneAndUpdate(
                { client_id: cibilData.client_id },
                { 
                    $set: { 
                        ...cibilData, 
                        updatedAt: new Date(),
                        createdAt: { $cond: { if: { $eq: ["$createdAt", null] }, then: new Date(), else: "$createdAt" } }
                    } 
                },
                { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
                function(err, savedData) {
                    if (err) {
                        // Check if it's a duplicate key error on profile field
                        if (err.code === 11000 && err.keyPattern && err.keyPattern.profile) {
                            console.log('Stale profile index detected.');
                            return res.status(500).json({ 
                                error: 'Database has stale indexes',
                                fix: 'Please call http://localhost:7001/get/api/cibil/fix-indexes first to fix the database',
                                details: err.message
                            });
                        }
                        console.error('Error saving CIBIL data:', err);
                        return res.status(500).json({ 
                            error: 'Database error', 
                            details: err.message,
                            code: err.code
                        });
                    }

                    log('CIBIL data saved/updated successfully');
                    log('Document ID:', savedData._id);
                    
                    // Analyze the data
                    analyzeCibilData(savedData.toObject ? savedData.toObject() : savedData, res);
                }
            );
        } catch (error) {
            console.error('Error processing CIBIL data:', error);
            res.status(500).json({ 
                error: 'Internal server error', 
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    });

    // New endpoint: Upload CIBIL data via API call (for external systems)
    app.post('/post/api/cibil/upload', async function(req, res) {
        try {
            log('/post/api/cibil/upload');
            
            var cibilData = req.body;
            
            if (!cibilData) {
                return res.status(400).json({ 
                    error: 'No data provided in request body' 
                });
            }

            // Validate required fields
            if (!cibilData.client_id) {
                return res.status(400).json({ 
                    error: 'client_id is required',
                    received: Object.keys(cibilData)
                });
            }

            // Normalize identifiers
            if (!cibilData.pan_number && cibilData.pan) cibilData.pan_number = cibilData.pan;
            if (!cibilData.mobile_number && cibilData.mobile) cibilData.mobile_number = cibilData.mobile;
            if (!cibilData.name && cibilData.full_name) cibilData.name = cibilData.full_name;

            // Save to database
            var savedData = await CibilDataModel.findOneAndUpdate(
                { client_id: cibilData.client_id },
                { 
                    $set: { 
                        ...cibilData, 
                        updatedAt: new Date(),
                        createdAt: { $cond: { if: { $eq: ["$createdAt", null] }, then: new Date(), else: "$createdAt" } }
                    } 
                },
                { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
            );

            log('CIBIL data saved/updated successfully via POST');
            log('Document ID:', savedData._id);
            
            // Analyze the data
            await analyzeCibilData(savedData.toObject ? savedData.toObject() : savedData, res);
            
        } catch (error) {
            console.error('Error processing CIBIL data upload:', error);
            
            // Handle specific errors
            if (error.code === 11000) {
                return res.status(500).json({ 
                    error: 'Duplicate client_id detected',
                    fix: 'Please call /get/api/cibil/fix-indexes if this is a duplicate key error on profile field',
                    details: error.message
                });
            }
            
            res.status(500).json({ 
                error: 'Internal server error', 
                details: error.message,
                suggestion: 'Check the data format and try again'
            });
        }
    });

})();