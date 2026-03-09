(function() {
    var RiskAssessment = require("./api/risk-assessment.js");
    var GradingEngine = require("./api/grading-engine.js");
    
    // Add these new routes to your existing app
    
    // Get comprehensive risk assessment - accepts pan, mobile, or email as query params
    app.get('/risk-assessment', function(req, res) {
        try {
            var { pan, mobile, email } = req.query;
            
            // Validate at least one identifier is provided
            if (!pan && !mobile && !email) {
                return res.status(400).json({ 
                    error: 'Please provide at least one identifier (pan, mobile, or email)' 
                });
            }
            
            // Build query based on provided identifiers
            var query = {};
            if (pan) query.pan_number = pan;
            if (mobile) query.mobile_number = mobile;
            if (email) query.email = email;

            CibilDataModel.findOne(query, function(err, cibilData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (!cibilData) {
                    return res.status(404).json({ 
                        error: 'Client data not found for the provided identifiers',
                        identifiers: { pan, mobile, email }
                    });
                }

                var gradingEngine = new GradingEngine(cibilData);
                var riskAssessment = new RiskAssessment(cibilData, gradingEngine);
                var report = riskAssessment.generateRiskReport();
                
                // Include client info in response
                report.client_info = {
                    client_id: cibilData.client_id,
                    name: cibilData.name || cibilData.full_name,
                    pan: cibilData.pan_number,
                    mobile: cibilData.mobile_number,
                    email: cibilData.email
                };
                
                res.json({
                    success: true,
                    data: report
                });
            });
        } catch (error) {
            console.error('Error generating risk assessment:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get credit worthiness evaluation
    app.get('/credit-worthiness', function(req, res) {
        try {
            var { pan, mobile, email } = req.query;
            
            if (!pan && !mobile && !email) {
                return res.status(400).json({ 
                    error: 'Please provide at least one identifier (pan, mobile, or email)' 
                });
            }
            
            var query = {};
            if (pan) query.pan_number = pan;
            if (mobile) query.mobile_number = mobile;
            if (email) query.email = email;

            CibilDataModel.findOne(query, function(err, cibilData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (!cibilData) {
                    return res.status(404).json({ 
                        error: 'Client data not found for the provided identifiers',
                        identifiers: { pan, mobile, email }
                    });
                }

                var gradingEngine = new GradingEngine(cibilData);
                var riskAssessment = new RiskAssessment(cibilData, gradingEngine);
                var creditWorthiness = riskAssessment.calculateCreditWorthiness();
                
                res.json({
                    success: true,
                    client_id: cibilData.client_id,
                    data: creditWorthiness
                });
            });
        } catch (error) {
            console.error('Error evaluating credit worthiness:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get default probability analysis
    app.get('/default-probability', function(req, res) {
        try {
            var { pan, mobile, email } = req.query;
            
            if (!pan && !mobile && !email) {
                return res.status(400).json({ 
                    error: 'Please provide at least one identifier (pan, mobile, or email)' 
                });
            }
            
            var query = {};
            if (pan) query.pan_number = pan;
            if (mobile) query.mobile_number = mobile;
            if (email) query.email = email;

            CibilDataModel.findOne(query, function(err, cibilData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (!cibilData) {
                    return res.status(404).json({ 
                        error: 'Client data not found for the provided identifiers',
                        identifiers: { pan, mobile, email }
                    });
                }

                var gradingEngine = new GradingEngine(cibilData);
                var riskAssessment = new RiskAssessment(cibilData, gradingEngine);
                var defaultProbability = riskAssessment.calculateDefaultProbability();
                
                res.json({
                    success: true,
                    client_id: cibilData.client_id,
                    data: defaultProbability
                });
            });
        } catch (error) {
            console.error('Error analyzing default probability:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get eligible financial institutions
    app.get('/eligible-institutions', function(req, res) {
        try {
            var { pan, mobile, email } = req.query;
            
            if (!pan && !mobile && !email) {
                return res.status(400).json({ 
                    error: 'Please provide at least one identifier (pan, mobile, or email)' 
                });
            }
            
            var query = {};
            if (pan) query.pan_number = pan;
            if (mobile) query.mobile_number = mobile;
            if (email) query.email = email;

            CibilDataModel.findOne(query, function(err, cibilData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (!cibilData) {
                    return res.status(404).json({ 
                        error: 'Client data not found for the provided identifiers',
                        identifiers: { pan, mobile, email }
                    });
                }

                var gradingEngine = new GradingEngine(cibilData);
                var riskAssessment = new RiskAssessment(cibilData, gradingEngine);
                var institutions = riskAssessment.getEligibleInstitutions();
                
                res.json({
                    success: true,
                    client_id: cibilData.client_id,
                    data: institutions
                });
            });
        } catch (error) {
            console.error('Error finding eligible institutions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

})();