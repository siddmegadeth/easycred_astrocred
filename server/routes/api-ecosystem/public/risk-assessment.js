// Public API: Risk Assessment
(function() {
    var apiKeyAuth = require('../../../middleware/api-key-middleware.js').apiKeyAuth;
    var requirePermission = require('../../../middleware/api-key-middleware.js').requirePermission;
    var CibilDataModel = require('../../../schema/cibil/cibil-data-schema.js');
    var RiskAssessment = require('../../cibil/api/risk-assessment.js');
    var GradingEngine = require('../../cibil/api/grading-engine.js');

    // Get risk assessment (public API)
    app.get('/api/v1/risk/assessment', apiKeyAuth, requirePermission('cibil.analysis.read'), async function(req, res) {
        try {
            var { pan, mobile, email } = req.query;
            
            if (!pan && !mobile && !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide at least one identifier'
                });
            }

            var query = {};
            if (pan) query.pan = pan.toUpperCase();
            if (mobile) query.mobile = mobile;
            if (email) query.email = email.toLowerCase();

            var cibilData = await CibilDataModel.findOne(query).lean();
            if (!cibilData) {
                return res.status(404).json({
                    success: false,
                    error: 'Credit data not found'
                });
            }

            // Generate risk assessment
            var gradingEngine = new GradingEngine(cibilData);
            var riskAssessment = new RiskAssessment(cibilData, gradingEngine);
            
            var creditWorthiness = riskAssessment.calculateCreditWorthiness();
            var defaultProbability = riskAssessment.calculateDefaultProbability();
            var riskReport = riskAssessment.generateRiskReport();

            res.json({
                success: true,
                data: {
                    credit_worthiness: creditWorthiness,
                    default_probability: defaultProbability,
                    risk_level: riskReport.riskLevel || 'MEDIUM',
                    recommendations: riskReport.recommendations || []
                },
                api_version: 'v1'
            });

        } catch (error) {
            log('Error in risk assessment API:', error);
            res.status(500).json({
                success: false,
                error: 'Risk assessment failed'
            });
        }
    });

})();

