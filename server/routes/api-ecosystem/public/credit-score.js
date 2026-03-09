// Public API: Credit Score
(function() {
    var apiKeyAuth = require('../../../middleware/api-key-middleware.js').apiKeyAuth;
    var requirePermission = require('../../../middleware/api-key-middleware.js').requirePermission;
    var CibilDataModel = require('../../../schema/cibil/cibil-data-schema.js');
    var EquifaxDataModel = require('../../../schema/equifax/equifax-data-schema.js');
    var ExperionDataModel = require('../../../schema/experion/experion-data-schema.js');

    // Get multi-bureau credit scores
    app.get('/api/v1/credit/score', apiKeyAuth, requirePermission('cibil.score.read'), async function(req, res) {
        try {
            var { pan, mobile, email, bureau } = req.query;
            
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

            bureau = bureau ? bureau.toUpperCase() : 'ALL';

            var scores = {};

            // Fetch CIBIL
            if (bureau === 'ALL' || bureau === 'CIBIL') {
                try {
                    var cibilData = await CibilDataModel.findOne(query).select('credit_score updatedAt').lean();
                    if (cibilData) {
                        scores.CIBIL = {
                            score: cibilData.credit_score,
                            last_updated: cibilData.updatedAt
                        };
                    }
                } catch (error) {
                    log('Error fetching CIBIL score:', error);
                }
            }

            // Fetch EQUIFAX
            if (bureau === 'ALL' || bureau === 'EQUIFAX') {
                try {
                    var equifaxData = await EquifaxDataModel.findOne(query).select('credit_score updatedAt').lean();
                    if (equifaxData) {
                        scores.EQUIFAX = {
                            score: equifaxData.credit_score,
                            last_updated: equifaxData.updatedAt
                        };
                    }
                } catch (error) {
                    log('Error fetching EQUIFAX score:', error);
                }
            }

            // Fetch EXPERION
            if (bureau === 'ALL' || bureau === 'EXPERION') {
                try {
                    var experionData = await ExperionDataModel.findOne(query).select('credit_score updatedAt').lean();
                    if (experionData) {
                        scores.EXPERION = {
                            score: experionData.credit_score,
                            last_updated: experionData.updatedAt
                        };
                    }
                } catch (error) {
                    log('Error fetching EXPERION score:', error);
                }
            }

            if (Object.keys(scores).length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Credit scores not found for the provided identifiers'
                });
            }

            res.json({
                success: true,
                data: {
                    scores: scores,
                    available_bureaus: Object.keys(scores)
                },
                api_version: 'v1'
            });

        } catch (error) {
            log('Error in credit score API:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch credit scores'
            });
        }
    });

})();

