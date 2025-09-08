(function() {
    var AdvancedRiskAssessment = require("./api/advance-risk-assessement.js");
    var EconomicDataService = require("./api/economic-data-services.js");

    // Get enhanced risk assessment with economic factors
    app.get('/enhanced-risk-assessment/:client_id', function(req, res) {
        try {
            var client_id = req.params.client_id;

            CibilDataModel.findOne({ client_id: client_id }, function(err, cibilData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (!cibilData) {
                    return res.status(404).json({ error: 'Client data not found' });
                }

                var gradingEngine = new GradingEngine(cibilData);
                var riskAssessment = new RiskAssessment(cibilData, gradingEngine);
                var advancedRiskAssessment = new AdvancedRiskAssessment(cibilData, gradingEngine, riskAssessment);

                advancedRiskAssessment.getEnhancedRiskAssessment(function(err, enhancedAssessment) {
                    if (err) {
                        console.error('Error generating enhanced risk assessment:', err);
                        return res.status(500).json({ error: 'Risk assessment error' });
                    }

                    res.json(enhancedAssessment);
                });
            });
        } catch (error) {
            console.error('Error in enhanced risk assessment:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get current economic data
    app.get('/economic-data', function(req, res) {
        try {
            var economicService = new EconomicDataService();

            economicService.getEconomicData(function(err, economicData) {
                if (err) {
                    console.error('Error fetching economic data:', err);
                    return res.status(500).json({ error: 'Economic data error' });
                }

                res.json(economicData);
            });
        } catch (error) {
            console.error('Error in economic data endpoint:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get risk assessment comparison (base vs enhanced)
    app.get('/risk-comparison/:client_id', function(req, res) {
        try {
            var client_id = req.params.client_id;

            CibilDataModel.findOne({ client_id: client_id }, function(err, cibilData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (!cibilData) {
                    return res.status(404).json({ error: 'Client data not found' });
                }

                var gradingEngine = new GradingEngine(cibilData);
                var riskAssessment = new RiskAssessment(cibilData, gradingEngine);
                var advancedRiskAssessment = new AdvancedRiskAssessment(cibilData, gradingEngine, riskAssessment);

                var baseRisk = riskAssessment.calculateDefaultProbability();

                advancedRiskAssessment.getEnhancedRiskAssessment(function(err, enhancedAssessment) {
                    if (err) {
                        console.error('Error generating enhanced risk assessment:', err);
                        return res.status(500).json({ error: 'Risk assessment error' });
                    }

                    res.json({
                        client_id: client_id,
                        baseRisk: baseRisk,
                        enhancedRisk: enhancedAssessment.enhancedRisk,
                        economicData: enhancedAssessment.economicData,
                        comparison: {
                            probabilityDifference: enhancedAssessment.enhancedRisk.probability - baseRisk.probability,
                            riskLevelChange: baseRisk.riskLevel !== enhancedAssessment.enhancedRisk.riskLevel ?
                                baseRisk.riskLevel + ' → ' + enhancedAssessment.enhancedRisk.riskLevel : 'No change',
                            factorsConsidered: Object.keys(enhancedAssessment.enhancedRisk.economicAdjustments || {}).length +
                                Object.keys(enhancedAssessment.enhancedRisk.incomeFactors || {}).length + 1 // +1 for sentiment
                        }
                    });
                });
            });
        } catch (error) {
            console.error('Error in risk comparison endpoint:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
})();