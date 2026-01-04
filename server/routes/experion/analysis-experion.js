// EXPERION Analysis Endpoint
// Similar to CIBIL analysis-client.js, adapted for EXPERION
(function() {
    var ExperionDataModel = require('../../schema/experion/experion-data-schema.js');
    var ExperionGradingEngine = require('./api/grading-engine.js');
    var ExperionRiskAssessment = require('./api/risk-assessment.js');
    var AnalysisCache = require('../cibil/api/analysis-cache.js');

    // Get EXPERION analysis for a client
    app.get('/get/api/experion/analysis', async function(req, res) {
        try {
            var { pan, mobile, email, force_refresh } = req.query;
            
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

            var experionData = await ExperionDataModel.findOne(query)
                .select('name pan mobile email credit_score credit_report updatedAt analysis')
                .lean();
            
            if (!experionData) {
                return res.status(404).json({ 
                    success: false,
                    error: 'EXPERION data not found for the provided identifiers',
                    identifiers: { pan, mobile, email }
                });
            }

            // Use cached analysis if available
            var forceRecompute = force_refresh === 'true' || force_refresh === '1';
            var analysisResult = await AnalysisCache.getOrComputeAnalysis(experionData, forceRecompute, 'EXPERION');
            var analysis = analysisResult.analysis;
            
            log('EXPERION Analysis endpoint: Using ' + (analysisResult.cached ? 'cached' : 'fresh') + ' analysis');

            // Get additional metrics from grading engine
            var gradingEngine = new ExperionGradingEngine(experionData);
            var riskAssessment = new ExperionRiskAssessment(experionData, gradingEngine);
            
            var overallGrade = gradingEngine.calculateOverallGrade();
            var creditUtilization = gradingEngine.getCreditUtilization();
            var creditAge = gradingEngine.getCreditAge();
            var defaulters = gradingEngine.identifyDefaulters();
            var recommendations = gradingEngine.generateRecommendations();
            var componentScores = gradingEngine.getComponentScores();
            var paymentAnalysis = gradingEngine.getOverallPaymentAnalysis();
            
            var creditWorthiness = riskAssessment.calculateCreditWorthiness();
            var defaultProbability = riskAssessment.calculateDefaultProbability();
            var riskReport = riskAssessment.generateRiskReport();

            res.json({
                success: true,
                bureau: 'EXPERION',
                user_info: {
                    name: experionData.name,
                    mobile: experionData.mobile,
                    email: experionData.email,
                    pan: experionData.pan
                },
                credit_score: experionData.credit_score,
                overall_grade: overallGrade,
                credit_utilization: Math.round(creditUtilization * 100) / 100,
                credit_age_months: Math.round(creditAge),
                defaulters_count: defaulters.length,
                defaulters: defaulters,
                recommendations: recommendations,
                component_scores: componentScores,
                payment_analysis: paymentAnalysis,
                credit_worthiness: creditWorthiness,
                default_probability: defaultProbability,
                risk_report: riskReport,
                analysis: analysis,
                report_date: experionData.updatedAt || new Date(),
                cached: analysisResult.cached
            });

        } catch (error) {
            log('Error in EXPERION analysis endpoint:', error);
            res.status(500).json({
                success: false,
                error: 'EXPERION analysis failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

})();

