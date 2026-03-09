// Personalized Offers Generator
// Generates personalized financial product recommendations
(function() {
    var OfferMatcher = require('./offer-matcher.js');
    var CibilDataModel = require('../../schema/cibil/cibil-data-schema.js');
    var ProfileModel = require('../../schema/profile/profile-schema.js');

    // Get personalized offers
    app.get('/get/api/offers/personalized', async function(req, res) {
        try {
            var { profile, product_type, limit } = req.query;
            
            if (!profile) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameter: profile'
                });
            }

            limit = parseInt(limit) || 10;
            product_type = product_type || null; // null means all types

            // Get user credit data
            var userProfile = await ProfileModel.findOne({ profile: profile }).lean();
            if (!userProfile) {
                return res.status(404).json({
                    success: false,
                    error: 'User profile not found'
                });
            }

            // Get credit data
            var query = {};
            if (userProfile.pan) query.pan = userProfile.pan;
            if (userProfile.mobile) query.mobile = userProfile.mobile;
            if (userProfile.email) query.email = userProfile.email;

            var creditData = await CibilDataModel.findOne(query).lean();
            if (!creditData) {
                return res.status(404).json({
                    success: false,
                    error: 'Credit data not found. Please upload your credit report first.'
                });
            }

            // Match offers
            var matchedOffers = await OfferMatcher.matchOffers(profile, creditData, product_type, limit);

            // Format response
            var formattedOffers = matchedOffers.map(function(item) {
                return {
                    product_id: item.product._id,
                    product_name: item.product.product_name,
                    product_type: item.product.product_type,
                    provider: item.product.provider_name || item.product.bank_name,
                    interest_rate: item.product.interest_rate || item.product.apr,
                    processing_fee: item.product.processing_fee,
                    max_amount: item.product.max_amount,
                    min_amount: item.product.min_amount,
                    tenure: item.product.tenure,
                    features: item.product.features || [],
                    match_score: item.match_score,
                    match_percentage: item.match_percentage,
                    eligibility: item.eligibility,
                    match_reasons: item.reasons,
                    apply_url: item.product.apply_url || item.product.application_link,
                    terms_and_conditions: item.product.terms_and_conditions
                };
            });

            res.json({
                success: true,
                user_profile: {
                    profile: profile,
                    credit_score: creditData.credit_score,
                    grade: creditData.analysis ? creditData.analysis.overallGrade : 'C'
                },
                offers: formattedOffers,
                total_matched: formattedOffers.length,
                filter_applied: {
                    product_type: product_type || 'all',
                    limit: limit
                }
            });

        } catch (error) {
            log('Error generating personalized offers:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate personalized offers',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get loan offers specifically
    app.get('/get/api/offers/loans', async function(req, res) {
        try {
            var { profile, loan_type, limit } = req.query;
            
            if (!profile) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameter: profile'
                });
            }

            // Map loan types to product types
            var loanTypeMap = {
                'personal': 'PL',
                'home': 'HL',
                'car': 'AL',
                'business': 'BL',
                'education': 'EL',
                'gold': 'GL'
            };

            var product_type = loan_type ? loanTypeMap[loan_type.toLowerCase()] : null;

            // Redirect to personalized offers
            req.query.product_type = product_type;
            req.query.limit = limit || 10;
            
            // Call personalized offers handler
            return app._router.handle(req, res, function() {
                // This will call the personalized offers endpoint
            });

        } catch (error) {
            log('Error fetching loan offers:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch loan offers',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get credit card offers specifically
    app.get('/get/api/offers/credit-cards', async function(req, res) {
        try {
            var { profile, limit } = req.query;
            
            if (!profile) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameter: profile'
                });
            }

            req.query.product_type = 'CC';
            req.query.limit = limit || 10;
            
            // Redirect to personalized offers
            return app._router.handle(req, res, function() {});

        } catch (error) {
            log('Error fetching credit card offers:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch credit card offers',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

})();

