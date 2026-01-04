// Multi-Bureau Comparison API Endpoint
(function() {
    var MultiBureauComparisonEngine = require('./comparison-engine.js');
    var MultiBureauComparisonModel = require('../../schema/multi-bureau/multi-bureau-comparison-schema.js');

    var comparisonEngine = new MultiBureauComparisonEngine();

    // Get multi-bureau comparison
    app.get('/get/api/multi-bureau/comparison', async function(req, res) {
        try {
            var { pan, mobile, email, profile, force_refresh } = req.query;
            
            if (!pan && !mobile && !email && !profile) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, email, or profile)' 
                });
            }

            var forceRecompute = force_refresh === 'true' || force_refresh === '1';
            var comparison;

            // Check if comparison exists and should be refreshed
            if (!forceRecompute && profile) {
                comparison = await MultiBureauComparisonModel.findOne({ profile: profile }).lean();
            } else if (!forceRecompute && (pan || mobile || email)) {
                var query = {};
                if (pan) query.pan = pan.toUpperCase();
                if (mobile) query.mobile = mobile;
                if (email) query.email = email.toLowerCase();
                comparison = await MultiBureauComparisonModel.findOne(query).lean();
            }

            // Generate new comparison if needed
            if (!comparison || forceRecompute) {
                comparison = await comparisonEngine.generateComparison(
                    { pan, mobile, email, profile },
                    profile
                );
            }

            res.json({
                success: true,
                comparison: comparison,
                cached: !forceRecompute && comparison !== undefined,
                generated_at: new Date()
            });

        } catch (error) {
            log('Error in multi-bureau comparison:', error);
            res.status(500).json({
                success: false,
                error: 'Multi-bureau comparison failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Unified dashboard data
    app.get('/get/api/multi-bureau/dashboard', async function(req, res) {
        try {
            var { pan, mobile, email, profile } = req.query;
            
            if (!pan && !mobile && !email && !profile) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Please provide at least one identifier' 
                });
            }

            // Get comparison
            var comparison = await comparisonEngine.generateComparison(
                { pan, mobile, email, profile },
                profile
            );

            // Format for dashboard
            res.json({
                success: true,
                dashboard: {
                    unified_grade: comparison.unifiedGrade,
                    average_score: comparison.averageScore,
                    highest_score: comparison.highestScore,
                    lowest_score: comparison.lowestScore,
                    bureau_scores: comparison.bureauScores,
                    available_bureaus: comparison.availableBureaus,
                    consistency: comparison.comparisonInsights.scoreConsistency,
                    recommendations: comparison.unifiedAnalysis.recommendations,
                    priority_actions: comparison.unifiedAnalysis.priorityActions
                },
                generated_at: new Date()
            });

        } catch (error) {
            log('Error in multi-bureau dashboard:', error);
            res.status(500).json({
                success: false,
                error: 'Dashboard data generation failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

})();

