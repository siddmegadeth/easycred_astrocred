(function() {
    GradingEngine = require("./api/grading-engine");
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
                            log(response);
                            approve(response.data); //send original and new fresh link while updating the same to DB
                        })
                        .catch(function(errorResp) {
                            log('Response Error getMobileToPAN :');
                            log(errorResp.status);
                            reject(errorResp);
                        });

                } else {
                    reject({ status: false });
                }
            } catch (catchError) {
                reject(catchError);
            }

        });
    };


    async function fetchCIBILReport(params) {
        return new Promise(function(approve, reject) {
            try {

                log("fetchCIBIL : ");
                var URL = process.env.SUREPASS_URL + "/api/v1/credit-report-cibil/fetch-report";
                log('URL :' + URL);

                log('Params For CIBIL Report :');
                log(params);

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
                        "gender": params.gender,
                        "consent": "Y"
                    }
                };
                axios(options)
                    .then(function(response) {
                        log('response Success fetchCIBIL : ');
                        approve(response.data); //send original and new fresh link while updating the same to DB
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
    function analyzeCibilData(cibilData, res) {
        try {
            var AnalysisCache = require('./api/analysis-cache');
            
            // Force recompute on upload (data just changed)
            AnalysisCache.getOrComputeAnalysis(cibilData, true)
                .then(function(result) {
                    var analysis = result.analysis;
                    
                    // Get enhanced risk assessment (async, doesn't need to block)
                    var analyzer = new GradingEngine(cibilData);
                    var advanced = new AdvancedAnalytics(cibilData, analyzer);
                    var risk = new RiskAssessment(cibilData, analyzer);
                    var advancedRiskAssessment = new AdvancedRiskAssessment(cibilData, analyzer, risk);
                    var baseRisk = risk.calculateDefaultProbability();
                    
                    advancedRiskAssessment.getEnhancedRiskAssessment(function(err, enhancedAssessment) {
                        if (err) {
                            console.error('Error generating enhanced risk assessment:', err);
                            // Return basic analysis even if enhanced fails
                            return res.json({
                                success: true,
                                client_id: cibilData.client_id,
                                name: cibilData.name,
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
                                message: 'CIBIL data analyzed successfully (basic analysis)'
                            });
                        }
                        
                        res.json({
                            baseRisk: baseRisk,
                            enhancedRisk: enhancedAssessment.enhancedRisk,
                            economicData: enhancedAssessment.economicData,
                            comparison: {
                                probabilityDifference: enhancedAssessment.enhancedRisk.probability - baseRisk.probability,
                                riskLevelChange: baseRisk.riskLevel !== enhancedAssessment.enhancedRisk.riskLevel ?
                                    baseRisk.riskLevel + ' → ' + enhancedAssessment.enhancedRisk.riskLevel : 'No change',
                                factorsConsidered: Object.keys(enhancedAssessment.enhancedRisk.economicAdjustments || {}).length +
                                    Object.keys(enhancedAssessment.enhancedRisk.incomeFactors || {}).length + 1
                            },
                            success: true,
                            client_id: cibilData.client_id,
                            name: cibilData.name,
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
                            message: 'CIBIL data analyzed successfully'
                        });
                    });
                })
                .catch(function(error) {
                    console.error('Analysis error:', error);
                    res.status(500).json({ error: 'Analysis error', details: error.message });
                });
        } catch (analysisError) {
            console.error('Analysis error:', analysisError);
            res.status(500).json({ error: 'Analysis error', details: analysisError.message });
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
            
            res.json({ 
                success: true, 
                message: 'Indexes fixed successfully. You can now use /get/api/cibil/upload' 
            });
        } catch (error) {
            console.error('Error fixing indexes:', error);
            res.status(500).json({ error: 'Error fixing indexes', details: error.message });
        }
    });

    // Upload and analyze CIBIL data
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
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Use findOneAndUpdate with upsert to handle both create and update
            CibilDataModel.findOneAndUpdate(
                { client_id: cibilData.client_id },
                { $set: { ...cibilData, updatedAt: new Date() } },
                { upsert: true, new: true, setDefaultsOnInsert: true },
                function(err, savedData) {
                    if (err) {
                        // Check if it's a duplicate key error on profile field
                        if (err.code === 11000 && err.keyPattern && err.keyPattern.profile) {
                            console.log('Stale profile index detected. Please call /get/api/cibil/fix-indexes first');
                            return res.status(500).json({ 
                                error: 'Database has stale indexes',
                                fix: 'Please call http://localhost:7001/get/api/cibil/fix-indexes first to fix the database',
                                details: err.message
                            });
                        }
                        console.error('Error saving CIBIL data:', err);
                        return res.status(500).json({ error: 'Database error', details: err.message });
                    }

                    log('CIBIL data saved/updated successfully');
                    // Analyze the data
                    analyzeCibilData(cibilData, res);
                }
            );
        } catch (error) {
            console.error('Error processing CIBIL data:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });
})();