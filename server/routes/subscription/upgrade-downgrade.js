// Upgrade/Downgrade Subscription
(function() {
    var SubscriptionModel = require('../../schema/subscription/subscription-schema.js');
    var SubscriptionPlanModel = require('../../schema/subscription/subscription-plan-schema.js');

    // Upgrade or downgrade subscription
    app.post('/post/api/subscription/change-plan', async function(req, res) {
        try {
            var { profile, new_plan_code } = req.body;
            
            if (!profile || !new_plan_code) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: profile and new_plan_code are required'
                });
            }

            // Validate new plan
            var newPlan = await SubscriptionPlanModel.findOne({ plan_code: new_plan_code, is_active: true });
            if (!newPlan) {
                return res.status(404).json({
                    success: false,
                    error: 'New subscription plan not found or inactive'
                });
            }

            var subscription = await SubscriptionModel.findOne({ profile: profile });
            
            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    error: 'Subscription not found. Please create a subscription first.'
                });
            }

            var oldPlanCode = subscription.plan_type;
            var isUpgrade = this.isUpgrade(oldPlanCode, new_plan_code);

            // Update subscription
            subscription.plan_type = new_plan_code;
            subscription.features = newPlan.features ? newPlan.features.filter(f => f.enabled).map(f => f.feature_name) : [];
            subscription.updatedAt = new Date();

            // If upgrading to free, remove end date
            if (new_plan_code === 'FREE') {
                subscription.end_date = null;
                subscription.next_billing_date = null;
            }

            await subscription.save();

            res.json({
                success: true,
                message: isUpgrade ? 'Subscription upgraded successfully' : 'Subscription changed successfully',
                subscription: {
                    id: subscription._id,
                    old_plan: oldPlanCode,
                    new_plan: new_plan_code,
                    plan_type: subscription.plan_type,
                    status: subscription.status,
                    features: subscription.features
                },
                change_type: isUpgrade ? 'upgrade' : 'change'
            });

        } catch (error) {
            log('Error changing subscription plan:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to change subscription plan',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }.bind({
        isUpgrade: function(oldPlan, newPlan) {
            var planHierarchy = { 'FREE': 0, 'BASIC': 1, 'PREMIUM': 2 };
            return (planHierarchy[newPlan] || 0) > (planHierarchy[oldPlan] || 0);
        }
    }));

    // Helper function to determine if it's an upgrade
    function isUpgrade(oldPlan, newPlan) {
        var planHierarchy = { 'FREE': 0, 'BASIC': 1, 'PREMIUM': 2 };
        return (planHierarchy[newPlan] || 0) > (planHierarchy[oldPlan] || 0);
    }

})();

