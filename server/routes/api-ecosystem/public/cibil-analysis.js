// Public API: CIBIL Analysis
// Accessible via API key authentication
(function() {
    var apiKeyAuth = require('../../../middleware/api-key-middleware.js').apiKeyAuth;
    var requirePermission = require('../../../middleware/api-key-middleware.js').requirePermission;
    var CibilDataModel = require('../../../schema/cibil/cibil-data-schema.js');
    var GradingEngine = require('../../cibil/api/grading-engine.js');

    // Get CIBIL analysis (public API)
    app.get('/api/v1/cibil/analysis', apiKeyAuth, requirePermission('cibil.analysis.read'), async function(req, res) {
        try {
            var { pan, mobile, email } = req.query;
            
            if (!pan && !mobile && !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, or email)'
                });
            }

            var query = {};
            if (pan) query.pan = pan.toUpperCase();
            if (mobile) query.mobile = mobile;
            if (email) query.email = email.toLowerCase();

            var cibilData = await CibilDataModel.findOne(query)
                .select('name pan mobile email credit_score credit_report updatedAt')
                .lean();

            if (!cibilData) {
                return res.status(404).json({
                    success: false,
                    error: 'CIBIL data not found'
                });
            }

            // Generate analysis
            var gradingEngine = new GradingEngine(cibilData);
            var overallGrade = gradingEngine.calculateOverallGrade();
            var creditUtilization = gradingEngine.getCreditUtilization();
            var creditAge = gradingEngine.getCreditAge();
            var defaulters = gradingEngine.identifyDefaulters();
            var recommendations = gradingEngine.generateRecommendations();
            var componentScores = gradingEngine.getComponentScores();

            res.json({
                success: true,
                data: {
                    user_info: {
                        name: cibilData.name,
                        pan: cibilData.pan,
                        mobile: cibilData.mobile,
                        email: cibilData.email
                    },
                    credit_score: cibilData.credit_score,
                    overall_grade: typeof overallGrade === 'object' ? overallGrade.grade : overallGrade,
                    credit_utilization: Math.round(creditUtilization * 100) / 100,
                    credit_age_months: Math.round(creditAge),
                    defaulters_count: defaulters.length,
                    recommendations: recommendations.slice(0, 5),
                    component_scores: componentScores
                },
                api_version: 'v1',
                requested_at: new Date()
            });

        } catch (error) {
            log('Error in public CIBIL analysis API:', error);
            res.status(500).json({
                success: false,
                error: 'Analysis failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get CIBIL score (public API)
    app.get('/api/v1/cibil/score', apiKeyAuth, requirePermission('cibil.score.read'), async function(req, res) {
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

            var cibilData = await CibilDataModel.findOne(query)
                .select('name credit_score updatedAt')
                .lean();

            if (!cibilData) {
                return res.status(404).json({
                    success: false,
                    error: 'CIBIL data not found'
                });
            }

            res.json({
                success: true,
                data: {
                    credit_score: cibilData.credit_score,
                    name: cibilData.name,
                    last_updated: cibilData.updatedAt
                },
                api_version: 'v1'
            });

        } catch (error) {
            log('Error in public CIBIL score API:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch score'
            });
        }
    });

})();

