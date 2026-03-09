// Create/Subscribe User to a Plan
(function() {
    var SubscriptionModel = require('../../schema/subscription/subscription-schema.js');
    var SubscriptionPlanModel = require('../../schema/subscription/subscription-plan-schema.js');

    // Create subscription (for free plans or direct activation)
    app.post('/post/api/subscription/subscribe', async function(req, res) {
        try {
            var { profile, plan_code } = req.body;
            
            if (!profile || !plan_code) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: profile and plan_code are required'
                });
            }

            // Get plan details
            var plan = await SubscriptionPlanModel.findOne({ plan_code: plan_code, is_active: true });
            if (!plan) {
                return res.status(404).json({
                    success: false,
                    error: 'Subscription plan not found or inactive'
                });
            }

            // Check if subscription already exists
            var existingSubscription = await SubscriptionModel.findOne({ profile: profile });

            var subscription;
            var isNew = false;

            if (existingSubscription) {
                // Update existing subscription
                existingSubscription.plan_type = plan_code;
                existingSubscription.status = plan_code === 'FREE' ? 'active' : 'pending';
                existingSubscription.features = plan.features ? plan.features.filter(f => f.enabled).map(f => f.feature_name) : [];
                existingSubscription.updatedAt = new Date();
                
                if (plan_code === 'FREE') {
                    existingSubscription.end_date = null; // Free plan doesn't expire
                    existingSubscription.next_billing_date = null;
                }
                
                subscription = await existingSubscription.save();
            } else {
                // Create new subscription
                isNew = true;
                subscription = new SubscriptionModel({
                    profile: profile,
                    plan_type: plan_code,
                    status: plan_code === 'FREE' ? 'active' : 'pending',
                    billing_cycle: 'monthly',
                    features: plan.features ? plan.features.filter(f => f.enabled).map(f => f.feature_name) : []
                });

                if (plan_code === 'FREE') {
                    subscription.end_date = null;
                    subscription.next_billing_date = null;
                }

                subscription = await subscription.save();
            }

            res.json({
                success: true,
                message: isNew ? 'Subscription created successfully' : 'Subscription updated successfully',
                subscription: {
                    id: subscription._id,
                    profile: subscription.profile,
                    plan_type: subscription.plan_type,
                    status: subscription.status,
                    features: subscription.features,
                    start_date: subscription.start_date,
                    end_date: subscription.end_date
                }
            });

        } catch (error) {
            log('Error creating subscription:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create subscription',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

})();

