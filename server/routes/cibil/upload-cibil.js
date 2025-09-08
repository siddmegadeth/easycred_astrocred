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

    // Upload and analyze CIBIL data
    app.get('/get/api/cibil/upload', function(req, res) {
        try {
            log('/get/api/cibil/upload');
            var cibilData = require("./../../../data/cibil/sample-data.json");
            cibilData = cibilData.data;
            log('-------------CIBIL DATA SAMPLE-------------------');
            log(cibilData);
            log('--------------------------------');

            // Validate required fields
            if (!cibilData.client_id || !cibilData.credit_report) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Check if data already exists for this client
            CibilDataModel.findOne({ client_id: cibilData.client_id }, function(err, existingData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (existingData) {
                    // Update existing record
                    CibilDataModel.findByIdAndUpdate(existingData._id, {
                        $set: {
                            ...cibilData,
                            updatedAt: new Date()
                        }
                    }, function(err) {
                        if (err) {
                            console.error('Error updating CIBIL data:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }

                        // Analyze the data
                        var analyzer = new GradingEngine(cibilData);
                        var overallGrade = analyzer.calculateOverallGrade();
                        var defaulters = analyzer.identifyDefaulters();
                        var recommendations = analyzer.generateRecommendations();
                        var advanced = new AdvancedAnalytics(cibilData, analyzer);
                        var risk = new RiskAssessment(cibilData, analyzer);
                        var risk_report = risk.generateRiskReport();
                        var creditWorthiness = risk.calculateCreditWorthiness();
                        var defaultProbability = risk.calculateDefaultProbability();
                        var institutions = risk.getEligibleInstitutions();



                        // Generate comprehensive report
                        var report = advanced.generateComprehensiveReport();
                        console.log('Comprehensive Report:', report);

                        // Generate improvement plan
                        var plan = advanced.generateImprovementPlan();
                        console.log('Improvement Plan:', plan);

                        // Get bank suggestions
                        var bankSuggestions = advanced.suggestBanks();
                        console.log('Bank Suggestions:', bankSuggestions);

                        var riskAssessment = new RiskAssessment(cibilData, analyzer);
                        var advancedRiskAssessment = new AdvancedRiskAssessment(cibilData, analyzer, riskAssessment);

                        var baseRisk = riskAssessment.calculateDefaultProbability();

                        advancedRiskAssessment.getEnhancedRiskAssessment(function(err, enhancedAssessment) {
                            if (err) {
                                console.error('Error generating enhanced risk assessment:', err);
                                return res.status(500).json({ error: 'Risk assessment error' });
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
                                        Object.keys(enhancedAssessment.enhancedRisk.incomeFactors || {}).length + 1 // +1 for sentiment
                                },
                                success: true,
                                client_id: cibilData.client_id,
                                name: cibilData.name,
                                credit_score: cibilData.credit_score,
                                overallGrade: overallGrade,
                                defaulters: defaulters,
                                recommendations: recommendations,
                                report: report,
                                plan: plan,
                                bankSuggestions: bankSuggestions,
                                risk_report: risk_report,
                                credit_worthy: creditWorthiness,
                                default_probability: defaultProbability,
                                institution: institutions,
                                message: 'CIBIL data analyzed successfully'
                            });
                        });

                    });
                } else {
                    // Create new record
                    CibilDataModel.create(cibilData, function(err) {
                        if (err) {
                            console.error('Error creating CIBIL data:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }

                        // Analyze the data
                        var analyzer = new GradingEngine(cibilData);
                        var overallGrade = analyzer.calculateOverallGrade();
                        var defaulters = analyzer.identifyDefaulters();
                        var recommendations = analyzer.generateRecommendations();
                        var advanced = new AdvancedAnalytics(cibilData, analyzer);

                        var risk = new RiskAssessment(cibilData, analyzer);
                        var risk_report = risk.generateRiskReport();
                        var creditWorthiness = risk.calculateCreditWorthiness();
                        var defaultProbability = risk.calculateDefaultProbability();
                        var institutions = risk.getEligibleInstitutions();


                        // Generate comprehensive report
                        var report = advanced.generateComprehensiveReport();
                        console.log('Comprehensive Report:', report);

                        // Generate improvement plan
                        var plan = advanced.generateImprovementPlan();
                        console.log('Improvement Plan:', plan);

                        // Get bank suggestions
                        var bankSuggestions = advanced.suggestBanks();
                        console.log('Bank Suggestions:', bankSuggestions);

                        var advancedRiskAssessment = new AdvancedRiskAssessment(cibilData, analyzer, riskAssessment);

                        var baseRisk = riskAssessment.calculateDefaultProbability();

                        advancedRiskAssessment.getEnhancedRiskAssessment(function(err, enhancedAssessment) {
                            if (err) {
                                console.error('Error generating enhanced risk assessment:', err);
                                return res.status(500).json({ error: 'Risk assessment error' });
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
                                        Object.keys(enhancedAssessment.enhancedRisk.incomeFactors || {}).length + 1 // +1 for sentiment
                                },
                                success: true,
                                client_id: cibilData.client_id,
                                name: cibilData.name,
                                credit_score: cibilData.credit_score,
                                overallGrade: overallGrade,
                                defaulters: defaulters,
                                recommendations: recommendations,
                                report: report,
                                plan: plan,
                                bankSuggestions: bankSuggestions,
                                risk_report: risk_report,
                                credit_worthy: creditWorthiness,
                                default_probability: defaultProbability,
                                institution: institutions,
                                message: 'CIBIL data analyzed successfully'
                            });
                        });
                    });
                }
            });
        } catch (error) {
            console.error('Error processing CIBIL data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
})();