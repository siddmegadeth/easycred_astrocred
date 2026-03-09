// Bundle Plans Management
(function() {
    var BundlePlanModel = require('../../schema/subscription/bundle-plan-schema.js');
    var SubscriptionModel = require('../../schema/subscription/subscription-schema.js');
    var SubscriptionPlanModel = require('../../schema/subscription/subscription-plan-schema.js');

    // Get all available bundle plans
    app.get('/get/api/subscription/bundle-plans', async function(req, res) {
        try {
            var bundles = await BundlePlanModel.find({ is_active: true })
                .sort({ price_monthly: 1 })
                .lean();

            var formattedBundles = bundles.map(function(bundle) {
                return {
                    bundle_code: bundle.bundle_code,
                    bundle_name: bundle.bundle_name,
                    bundle_description: bundle.bundle_description,
                    pricing: {
                        monthly: bundle.price_monthly,
                        quarterly: bundle.price_quarterly,
                        yearly: bundle.price_yearly,
                        currency: bundle.currency
                    },
                    included_features: bundle.included_features || [],
                    component_plans: bundle.component_plans || [],
                    benefits: bundle.benefits || [],
                    savings_percentage: bundle.savings_percentage || 0
                };
            });

            res.json({
                success: true,
                bundle_plans: formattedBundles,
                count: formattedBundles.length
            });

        } catch (error) {
            log('Error fetching bundle plans:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch bundle plans',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get specific bundle plan
    app.get('/get/api/subscription/bundle-plans/:bundle_code', async function(req, res) {
        try {
            var bundleCode = req.params.bundle_code.toUpperCase();
            
            var bundle = await BundlePlanModel.findOne({ 
                bundle_code: bundleCode, 
                is_active: true 
            }).lean();

            if (!bundle) {
                return res.status(404).json({
                    success: false,
                    error: 'Bundle plan not found'
                });
            }

            res.json({
                success: true,
                bundle_plan: {
                    bundle_code: bundle.bundle_code,
                    bundle_name: bundle.bundle_name,
                    bundle_description: bundle.bundle_description,
                    pricing: {
                        monthly: bundle.price_monthly,
                        quarterly: bundle.price_quarterly,
                        yearly: bundle.price_yearly,
                        currency: bundle.currency
                    },
                    included_features: bundle.included_features || [],
                    component_plans: bundle.component_plans || [],
                    benefits: bundle.benefits || [],
                    savings_percentage: bundle.savings_percentage || 0
                }
            });

        } catch (error) {
            log('Error fetching bundle plan:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch bundle plan',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Purchase bundle plan
    app.post('/post/api/subscription/purchase-bundle', async function(req, res) {
        try {
            var { profile, bundle_code, billing_cycle } = req.body;
            
            if (!profile || !bundle_code) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: profile and bundle_code are required'
                });
            }

            billing_cycle = billing_cycle || 'monthly';

            // Get bundle plan
            var bundle = await BundlePlanModel.findOne({ bundle_code: bundle_code, is_active: true });
            if (!bundle) {
                return res.status(404).json({
                    success: false,
                    error: 'Bundle plan not found or inactive'
                });
            }

            // Determine price
            var amount = 0;
            if (billing_cycle === 'monthly') {
                amount = bundle.price_monthly;
            } else if (billing_cycle === 'quarterly') {
                amount = bundle.price_quarterly || (bundle.price_monthly * 3 * 0.9);
            } else if (billing_cycle === 'yearly') {
                amount = bundle.price_yearly || (bundle.price_monthly * 12 * 0.8);
            }

            if (amount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid bundle pricing'
                });
            }

            // Create or update subscription with bundle features
            var subscription = await SubscriptionModel.findOne({ profile: profile });
            
            if (!subscription) {
                subscription = new SubscriptionModel({
                    profile: profile,
                    plan_type: 'PREMIUM', // Bundles typically map to premium
                    status: 'pending',
                    billing_cycle: billing_cycle
                });
            }

            // Extract features from bundle
            var features = [];
            bundle.included_features.forEach(function(feature) {
                features.push(feature.feature_type);
            });
            subscription.features = features;
            subscription.updatedAt = new Date();

            await subscription.save();

            // Return bundle details (payment will be handled via create-order endpoint)
            res.json({
                success: true,
                message: 'Bundle plan selected. Proceed to payment.',
                bundle: {
                    bundle_code: bundle.bundle_code,
                    bundle_name: bundle.bundle_name,
                    amount: amount,
                    billing_cycle: billing_cycle,
                    features: features
                },
                next_step: 'Call /post/api/subscription/create-order with plan_code=BUNDLE_' + bundle_code
            });

        } catch (error) {
            log('Error purchasing bundle:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to purchase bundle',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get bundle features for a user
    app.get('/get/api/subscription/bundle-features', async function(req, res) {
        try {
            var { profile } = req.query;
            
            if (!profile) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameter: profile'
                });
            }

            var subscription = await SubscriptionModel.findOne({ profile: profile });
            
            if (!subscription || !subscription.features || subscription.features.length === 0) {
                return res.json({
                    success: true,
                    has_bundle: false,
                    features: []
                });
            }

            res.json({
                success: true,
                has_bundle: true,
                features: subscription.features,
                subscription_status: subscription.status
            });

        } catch (error) {
            log('Error fetching bundle features:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch bundle features',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

})();

