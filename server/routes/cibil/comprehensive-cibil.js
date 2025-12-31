(function() {
    var AdvancedAnalytics = require("./api/analytics-engine-advance.js");
    var GradingEngine = require("./api/grading-engine.js");

    // Get comprehensive credit health report
    app.get('/comprehensive-report', function(req, res) {
        try {
            var { pan, mobile, email, client_id } = req.query;
            
            // Validate at least one identifier is provided
            if (!pan && !mobile && !email && !client_id) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, email, or client_id)' 
                });
            }
            
            // Build query based on provided identifiers
            var query = {};
            if (client_id) query.client_id = client_id;
            if (pan) query.pan_number = pan;
            if (mobile) query.mobile_number = mobile;
            if (email) query.email = email;

            CibilDataModel.findOne(query, function(err, cibilData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ 
                        success: false,
                        error: 'Internal server error',
                        details: err.message 
                    });
                }

                if (!cibilData) {
                    return res.status(404).json({ 
                        success: false,
                        error: 'Client data not found for the provided identifiers',
                        identifiers: { pan, mobile, email, client_id }
                    });
                }

                try {
                    var gradingEngine = new GradingEngine(cibilData);
                    var advancedAnalytics = new AdvancedAnalytics(cibilData, gradingEngine);
                    var report = advancedAnalytics.generateComprehensiveReport();
                    
                    // Add client info to response
                    report.client_info = {
                        client_id: cibilData.client_id,
                        name: cibilData.name || cibilData.full_name,
                        pan: cibilData.pan_number,
                        mobile: cibilData.mobile_number,
                        email: cibilData.email,
                        credit_score: cibilData.credit_score
                    };
                    
                    res.json({
                        success: true,
                        ...report
                    });
                } catch (analysisError) {
                    console.error('Error generating comprehensive report:', analysisError);
                    res.status(500).json({ 
                        success: false,
                        error: 'Analysis error',
                        details: analysisError.message,
                        client_id: cibilData.client_id
                    });
                }
            });
        } catch (error) {
            console.error('Error generating comprehensive report:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Get improvement plan
    app.get('/improvement-plan', function(req, res) {
        try {
            var { pan, mobile, email, client_id } = req.query;
            
            if (!pan && !mobile && !email && !client_id) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, email, or client_id)' 
                });
            }
            
            var query = {};
            if (client_id) query.client_id = client_id;
            if (pan) query.pan_number = pan;
            if (mobile) query.mobile_number = mobile;
            if (email) query.email = email;

            CibilDataModel.findOne(query, function(err, cibilData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ 
                        success: false,
                        error: 'Internal server error',
                        details: err.message 
                    });
                }

                if (!cibilData) {
                    return res.status(404).json({ 
                        success: false,
                        error: 'Client data not found for the provided identifiers',
                        identifiers: { pan, mobile, email, client_id }
                    });
                }

                try {
                    var gradingEngine = new GradingEngine(cibilData);
                    var advancedAnalytics = new AdvancedAnalytics(cibilData, gradingEngine);
                    var plan = advancedAnalytics.generateImprovementPlan();
                    
                    res.json({
                        success: true,
                        client_id: cibilData.client_id,
                        name: cibilData.name || cibilData.full_name,
                        pan: cibilData.pan_number,
                        mobile: cibilData.mobile_number,
                        email: cibilData.email,
                        current_score: cibilData.credit_score,
                        improvement_plan: plan,
                        generated_at: new Date()
                    });
                } catch (planError) {
                    console.error('Error generating improvement plan:', planError);
                    res.status(500).json({ 
                        success: false,
                        error: 'Plan generation error',
                        details: planError.message,
                        client_id: cibilData.client_id
                    });
                }
            });
        } catch (error) {
            console.error('Error generating improvement plan:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Get bank suggestions
    app.get('/bank-suggestions', function(req, res) {
        try {
            var { pan, mobile, email, client_id } = req.query;
            
            if (!pan && !mobile && !email && !client_id) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, email, or client_id)' 
                });
            }
            
            var query = {};
            if (client_id) query.client_id = client_id;
            if (pan) query.pan_number = pan;
            if (mobile) query.mobile_number = mobile;
            if (email) query.email = email;

            CibilDataModel.findOne(query, function(err, cibilData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ 
                        success: false,
                        error: 'Internal server error',
                        details: err.message 
                    });
                }

                if (!cibilData) {
                    return res.status(404).json({ 
                        success: false,
                        error: 'Client data not found for the provided identifiers',
                        identifiers: { pan, mobile, email, client_id }
                    });
                }

                try {
                    var gradingEngine = new GradingEngine(cibilData);
                    var advancedAnalytics = new AdvancedAnalytics(cibilData, gradingEngine);
                    var suggestions = advancedAnalytics.suggestBanks();
                    
                    res.json({
                        success: true,
                        client_id: cibilData.client_id,
                        name: cibilData.name || cibilData.full_name,
                        pan: cibilData.pan_number,
                        mobile: cibilData.mobile_number,
                        email: cibilData.email,
                        credit_score: cibilData.credit_score,
                        risk_level: suggestions.riskLevel,
                        suggestions: suggestions.banks,
                        recommendation_basis: suggestions.recommendationBasis,
                        generated_at: new Date()
                    });
                } catch (suggestionError) {
                    console.error('Error generating bank suggestions:', suggestionError);
                    res.status(500).json({ 
                        success: false,
                        error: 'Bank suggestion error',
                        details: suggestionError.message,
                        client_id: cibilData.client_id
                    });
                }
            });
        } catch (error) {
            console.error('Error generating bank suggestions:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Get chart data for visualization
    app.get('/chart-data', function(req, res) {
        try {
            var { pan, mobile, email, client_id } = req.query;
            
            if (!pan && !mobile && !email && !client_id) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, email, or client_id)' 
                });
            }
            
            var query = {};
            if (client_id) query.client_id = client_id;
            if (pan) query.pan_number = pan;
            if (mobile) query.mobile_number = mobile;
            if (email) query.email = email;

            CibilDataModel.findOne(query, function(err, cibilData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ 
                        success: false,
                        error: 'Internal server error',
                        details: err.message 
                    });
                }

                if (!cibilData) {
                    return res.status(404).json({ 
                        success: false,
                        error: 'Client data not found for the provided identifiers',
                        identifiers: { pan, mobile, email, client_id }
                    });
                }

                try {
                    var gradingEngine = new GradingEngine(cibilData);
                    var advancedAnalytics = new AdvancedAnalytics(cibilData, gradingEngine);

                    var chartData = {
                        client_info: {
                            client_id: cibilData.client_id,
                            name: cibilData.name || cibilData.full_name,
                            pan: cibilData.pan_number,
                            mobile: cibilData.mobile_number,
                            email: cibilData.email,
                            credit_score: cibilData.credit_score
                        },
                        loanHistory: advancedAnalytics.generateLoanHistoryChartData(),
                        paymentTimeline: advancedAnalytics.generatePaymentTimelineData(),
                        scoreDistribution: advancedAnalytics.generateScoreDistributionData(),
                        creditUtilization: advancedAnalytics.generateCreditUtilizationData(),
                        generated_at: new Date()
                    };
                    
                    res.json({
                        success: true,
                        ...chartData
                    });
                } catch (chartError) {
                    console.error('Error generating chart data:', chartError);
                    res.status(500).json({ 
                        success: false,
                        error: 'Chart data generation error',
                        details: chartError.message,
                        client_id: cibilData.client_id
                    });
                }
            });
        } catch (error) {
            console.error('Error generating chart data:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Get quick credit summary (new endpoint)
    app.get('/credit-summary', function(req, res) {
        try {
            var { pan, mobile, email, client_id } = req.query;
            
            if (!pan && !mobile && !email && !client_id) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, email, or client_id)' 
                });
            }
            
            var query = {};
            if (client_id) query.client_id = client_id;
            if (pan) query.pan_number = pan;
            if (mobile) query.mobile_number = mobile;
            if (email) query.email = email;

            CibilDataModel.findOne(query, function(err, cibilData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ 
                        success: false,
                        error: 'Internal server error',
                        details: err.message 
                    });
                }

                if (!cibilData) {
                    return res.status(404).json({ 
                        success: false,
                        error: 'Client data not found for the provided identifiers',
                        identifiers: { pan, mobile, email, client_id }
                    });
                }

                try {
                    var gradingEngine = new GradingEngine(cibilData);
                    var advancedAnalytics = new AdvancedAnalytics(cibilData, gradingEngine);
                    var riskAssessment = new RiskAssessment(cibilData, gradingEngine);
                    
                    var summary = {
                        client_info: {
                            client_id: cibilData.client_id,
                            name: cibilData.name || cibilData.full_name,
                            pan: cibilData.pan_number,
                            mobile: cibilData.mobile_number,
                            email: cibilData.email
                        },
                        credit_score: cibilData.credit_score,
                        grade: gradingEngine.getOverallGrade(),
                        risk_assessment: {
                            default_probability: riskAssessment.calculateDefaultProbability(),
                            credit_worthiness: riskAssessment.calculateCreditWorthiness()
                        },
                        key_metrics: advancedAnalytics.getKeyMetrics(),
                        immediate_actions: advancedAnalytics.getImmediateActions(),
                        generated_at: new Date()
                    };
                    
                    res.json({
                        success: true,
                        summary: summary
                    });
                } catch (summaryError) {
                    console.error('Error generating credit summary:', summaryError);
                    res.status(500).json({ 
                        success: false,
                        error: 'Summary generation error',
                        details: summaryError.message,
                        client_id: cibilData.client_id
                    });
                }
            });
        } catch (error) {
            console.error('Error generating credit summary:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

})();