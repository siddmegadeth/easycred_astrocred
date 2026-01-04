// Get Available Subscription Plans
(function() {
    var SubscriptionPlanModel = require('../../schema/subscription/subscription-plan-schema.js');

    // Get all available subscription plans
    app.get('/get/api/subscription/plans', async function(req, res) {
        try {
            var plans = await SubscriptionPlanModel.find({ is_active: true })
                .sort({ 'price_monthly': 1 })
                .lean();

            var formattedPlans = plans.map(function(plan) {
                return {
                    plan_code: plan.plan_code,
                    plan_name: plan.plan_name,
                    description: plan.description,
                    pricing: {
                        monthly: plan.price_monthly,
                        quarterly: plan.price_quarterly,
                        yearly: plan.price_yearly,
                        currency: plan.currency
                    },
                    features: plan.features || [],
                    limits: plan.limits || {},
                    trial_days: plan.trial_days || 0
                };
            });

            res.json({
                success: true,
                plans: formattedPlans,
                count: formattedPlans.length
            });

        } catch (error) {
            log('Error fetching subscription plans:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch subscription plans',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get a specific plan
    app.get('/get/api/subscription/plans/:plan_code', async function(req, res) {
        try {
            var planCode = req.params.plan_code.toUpperCase();
            
            var plan = await SubscriptionPlanModel.findOne({ 
                plan_code: planCode, 
                is_active: true 
            }).lean();

            if (!plan) {
                return res.status(404).json({
                    success: false,
                    error: 'Subscription plan not found'
                });
            }

            res.json({
                success: true,
                plan: {
                    plan_code: plan.plan_code,
                    plan_name: plan.plan_name,
                    description: plan.description,
                    pricing: {
                        monthly: plan.price_monthly,
                        quarterly: plan.price_quarterly,
                        yearly: plan.price_yearly,
                        currency: plan.currency
                    },
                    features: plan.features || [],
                    limits: plan.limits || {},
                    trial_days: plan.trial_days || 0
                }
            });

        } catch (error) {
            log('Error fetching subscription plan:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch subscription plan',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

})();

