(function() {
    var AdvancedRiskAssessment = require("./api/advance-risk-assessement.js");
    var EconomicDataService = require("./api/economic-data-services.js");
    var GradingEngine = require("./api/grading-engine.js");
    var RiskAssessment = require("./api/risk-assessment.js");

    // Get enhanced risk assessment with economic factors - accepts multiple identifiers
    app.get('/enhanced-risk-assessment', function(req, res) {
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

                var gradingEngine = new GradingEngine(cibilData);
                var riskAssessment = new RiskAssessment(cibilData, gradingEngine);
                var advancedRiskAssessment = new AdvancedRiskAssessment(cibilData, gradingEngine, riskAssessment);

                advancedRiskAssessment.getEnhancedRiskAssessment(function(err, enhancedAssessment) {
                    if (err) {
                        console.error('Error generating enhanced risk assessment:', err);
                        return res.status(500).json({ 
                            success: false,
                            error: 'Risk assessment error',
                            details: err.message
                        });
                    }

                    // Add client info to response
                    enhancedAssessment.client_info = {
                        client_id: cibilData.client_id,
                        name: cibilData.name || cibilData.full_name,
                        pan: cibilData.pan_number,
                        mobile: cibilData.mobile_number,
                        email: cibilData.email,
                        credit_score: cibilData.credit_score
                    };

                    res.json({
                        success: true,
                        ...enhancedAssessment
                    });
                });
            });
        } catch (error) {
            console.error('Error in enhanced risk assessment:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Get current economic data
    app.get('/economic-data', function(req, res) {
        try {
            var economicService = new EconomicDataService();
            
            // Check cache first
            var cacheKey = 'economic_data';
            var cachedData = global.cache ? global.cache.get(cacheKey) : null;
            
            if (cachedData) {
                return res.json({
                    success: true,
                    data: cachedData,
                    cached: true,
                    timestamp: new Date()
                });
            }

            economicService.getEconomicData(function(err, economicData) {
                if (err) {
                    console.error('Error fetching economic data:', err);
                    return res.status(500).json({ 
                        success: false,
                        error: 'Economic data error',
                        details: err.message 
                    });
                }

                // Cache the data for 1 hour
                if (global.cache) {
                    global.cache.set(cacheKey, economicData, 3600); // 1 hour
                }

                res.json({
                    success: true,
                    data: economicData,
                    cached: false,
                    timestamp: new Date()
                });
            });
        } catch (error) {
            console.error('Error in economic data endpoint:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Get risk assessment comparison (base vs enhanced)
    app.get('/risk-comparison', function(req, res) {
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

                var gradingEngine = new GradingEngine(cibilData);
                var riskAssessment = new RiskAssessment(cibilData, gradingEngine);
                var advancedRiskAssessment = new AdvancedRiskAssessment(cibilData, gradingEngine, riskAssessment);

                var baseRisk = riskAssessment.calculateDefaultProbability();

                advancedRiskAssessment.getEnhancedRiskAssessment(function(err, enhancedAssessment) {
                    if (err) {
                        console.error('Error generating enhanced risk assessment:', err);
                        return res.status(500).json({ 
                            success: false,
                            error: 'Risk assessment error',
                            details: err.message 
                        });
                    }

                    res.json({
                        success: true,
                        client_id: cibilData.client_id,
                        name: cibilData.name || cibilData.full_name,
                        pan: cibilData.pan_number,
                        mobile: cibilData.mobile_number,
                        email: cibilData.email,
                        baseRisk: baseRisk,
                        enhancedRisk: enhancedAssessment.enhancedRisk,
                        economicData: enhancedAssessment.economicData,
                        comparison: {
                            probabilityDifference: enhancedAssessment.enhancedRisk.probability - baseRisk.probability,
                            riskLevelChange: baseRisk.riskLevel !== enhancedAssessment.enhancedRisk.riskLevel ?
                                baseRisk.riskLevel + ' → ' + enhancedAssessment.enhancedRisk.riskLevel : 'No change',
                            factorsConsidered: Object.keys(enhancedAssessment.enhancedRisk.economicAdjustments || {}).length +
                                Object.keys(enhancedAssessment.enhancedRisk.incomeFactors || {}).length + 1,
                            impactSummary: getImpactSummary(enhancedAssessment.enhancedRisk.probability - baseRisk.probability)
                        },
                        recommendations: getRiskRecommendations(
                            baseRisk.riskLevel, 
                            enhancedAssessment.enhancedRisk.riskLevel,
                            enhancedAssessment.enhancedRisk.probability - baseRisk.probability
                        )
                    });
                });
            });
        } catch (error) {
            console.error('Error in risk comparison endpoint:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Helper function to get impact summary
    function getImpactSummary(difference) {
        if (difference > 5) return 'Significantly higher risk due to economic factors';
        if (difference > 2) return 'Moderately higher risk due to economic factors';
        if (difference > -2 && difference < 2) return 'Minimal impact from economic factors';
        if (difference > -5) return 'Moderately lower risk due to economic factors';
        return 'Significantly lower risk due to economic factors';
    }

    // Helper function to get risk recommendations
    function getRiskRecommendations(baseRiskLevel, enhancedRiskLevel, difference) {
        var recommendations = [];
        
        if (enhancedRiskLevel === 'high' || enhancedRiskLevel === 'very-high') {
            recommendations.push('Immediate credit review recommended');
            recommendations.push('Consider reducing credit utilization');
            recommendations.push('Monitor economic indicators closely');
        }
        
        if (difference > 3) {
            recommendations.push('Economic factors are increasing risk - consider conservative credit approach');
        } else if (difference < -3) {
            recommendations.push('Economic factors are reducing risk - may consider slightly more aggressive credit approach');
        }
        
        if (baseRiskLevel !== enhancedRiskLevel) {
            recommendations.push('Risk level changed from ' + baseRiskLevel + ' to ' + enhancedRiskLevel + ' due to economic analysis');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Continue with current credit management strategy');
        }
        
        return recommendations;
    }

    // Get historical economic trends (optional endpoint)
    app.get('/economic-trends', function(req, res) {
        try {
            var { period = '30d', indicators } = req.query;
            var economicService = new EconomicDataService();
            
            var periodMap = {
                '7d': 7,
                '30d': 30,
                '90d': 90,
                '1y': 365
            };
            
            var days = periodMap[period] || 30;
            
            economicService.getHistoricalData(days, function(err, historicalData) {
                if (err) {
                    console.error('Error fetching historical economic data:', err);
                    return res.status(500).json({ 
                        success: false,
                        error: 'Historical data error',
                        details: err.message 
                    });
                }

                res.json({
                    success: true,
                    period: period,
                    days: days,
                    data: historicalData,
                    timestamp: new Date()
                });
            });
        } catch (error) {
            console.error('Error in economic trends endpoint:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

})();