(function() {

    var RiskAssessment = require("./api/risk-assessment.js");

    // Add these new routes to your existing app

    // Get comprehensive risk assessment
    app.get('/risk-assessment/:client_id', function(req, res) {
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
                var report = riskAssessment.generateRiskReport();

                res.json(report);
            });
        } catch (error) {
            console.error('Error generating risk assessment:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get credit worthiness evaluation
    app.get('/credit-worthiness/:client_id', function(req, res) {
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
                var creditWorthiness = riskAssessment.calculateCreditWorthiness();

                res.json(creditWorthiness);
            });
        } catch (error) {
            console.error('Error evaluating credit worthiness:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get default probability analysis
    app.get('/default-probability/:client_id', function(req, res) {
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
                var defaultProbability = riskAssessment.calculateDefaultProbability();

                res.json(defaultProbability);
            });
        } catch (error) {
            console.error('Error analyzing default probability:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get eligible financial institutions
    app.get('/eligible-institutions/:client_id', function(req, res) {
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
                var institutions = riskAssessment.getEligibleInstitutions();

                res.json(institutions);
            });
        } catch (error) {
            console.error('Error finding eligible institutions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

})();