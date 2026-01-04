// Get User Subscription Status
(function() {
    var SubscriptionModel = require('../../schema/subscription/subscription-schema.js');
    var SubscriptionPlanModel = require('../../schema/subscription/subscription-plan-schema.js');

    // Get subscription status for a user
    app.get('/get/api/subscription/status', async function(req, res) {
        try {
            var { profile } = req.query;
            
            if (!profile) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required field: profile'
                });
            }

            var subscription = await SubscriptionModel.findOne({ profile: profile });
            
            if (!subscription) {
                // Return free plan default
                return res.json({
                    success: true,
                    subscription: {
                        plan_type: 'FREE',
                        status: 'active',
                        features: [],
                        is_trial: false
                    },
                    has_subscription: false
                });
            }

            // Check if subscription is expired
            var isExpired = false;
            if (subscription.end_date && new Date() > subscription.end_date && subscription.status === 'active') {
                subscription.status = 'expired';
                await subscription.save();
                isExpired = true;
            }

            // Get plan details
            var plan = await SubscriptionPlanModel.findOne({ plan_code: subscription.plan_type });

            res.json({
                success: true,
                subscription: {
                    id: subscription._id,
                    plan_type: subscription.plan_type,
                    plan_name: plan ? plan.plan_name : subscription.plan_type,
                    status: subscription.status,
                    billing_cycle: subscription.billing_cycle,
                    start_date: subscription.start_date,
                    end_date: subscription.end_date,
                    next_billing_date: subscription.next_billing_date,
                    features: subscription.features,
                    is_trial: subscription.is_trial,
                    trial_end_date: subscription.trial_end_date,
                    is_expired: isExpired
                },
                has_subscription: true
            });

        } catch (error) {
            log('Error fetching subscription status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch subscription status',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

})();

