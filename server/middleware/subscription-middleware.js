// Subscription Middleware
// Checks user subscription status and validates feature access
(function() {
    var SubscriptionModel = require('../schema/subscription/subscription-schema.js');
    var SubscriptionPlanModel = require('../schema/subscription/subscription-plan-schema.js');

    /**
     * Middleware to check if user has active subscription
     */
    function requireSubscription(req, res, next) {
        var profile = req.profile || req.query.profile || req.body.profile || req.headers['x-profile'];
        
        if (!profile) {
            return res.status(401).json({
                success: false,
                error: 'User profile not found. Please login.'
            });
        }

        checkSubscription(profile)
            .then(function(subscription) {
                if (!subscription || subscription.status !== 'active') {
                    return res.status(403).json({
                        success: false,
                        error: 'Active subscription required',
                        subscription_required: true
                    });
                }
                
                req.subscription = subscription;
                next();
            })
            .catch(function(error) {
                log('Error checking subscription:', error);
                res.status(500).json({
                    success: false,
                    error: 'Error validating subscription'
                });
            });
    }

    /**
     * Middleware to check if user has specific plan or higher
     */
    function requirePlan(minPlan) {
        return function(req, res, next) {
            var profile = req.profile || req.query.profile || req.body.profile || req.headers['x-profile'];
            
            if (!profile) {
                return res.status(401).json({
                    success: false,
                    error: 'User profile not found'
                });
            }

            checkSubscription(profile)
                .then(function(subscription) {
                    if (!subscription || subscription.status !== 'active') {
                        return res.status(403).json({
                            success: false,
                            error: 'Active subscription required',
                            subscription_required: true
                        });
                    }

                    var planHierarchy = { 'FREE': 0, 'BASIC': 1, 'PREMIUM': 2 };
                    var userPlanLevel = planHierarchy[subscription.plan_type] || 0;
                    var requiredPlanLevel = planHierarchy[minPlan] || 0;

                    if (userPlanLevel < requiredPlanLevel) {
                        return res.status(403).json({
                            success: false,
                            error: minPlan + ' plan or higher required',
                            current_plan: subscription.plan_type,
                            required_plan: minPlan,
                            upgrade_required: true
                        });
                    }

                    req.subscription = subscription;
                    next();
                })
                .catch(function(error) {
                    log('Error checking plan:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Error validating subscription plan'
                    });
                });
        };
    }

    /**
     * Middleware to check if user has access to specific feature
     */
    function requireFeature(featureName) {
        return function(req, res, next) {
            var profile = req.profile || req.query.profile || req.body.profile || req.headers['x-profile'];
            
            if (!profile) {
                return res.status(401).json({
                    success: false,
                    error: 'User profile not found'
                });
            }

            checkSubscription(profile)
                .then(function(subscription) {
                    if (!subscription || subscription.status !== 'active') {
                        return res.status(403).json({
                            success: false,
                            error: 'Active subscription required',
                            subscription_required: true
                        });
                    }

                    // Check if feature is included
                    var hasFeature = subscription.features && subscription.features.includes(featureName);
                    
                    if (!hasFeature) {
                        return res.status(403).json({
                            success: false,
                            error: 'Feature not available in your plan',
                            feature: featureName,
                            current_plan: subscription.plan_type,
                            upgrade_required: true
                        });
                    }

                    req.subscription = subscription;
                    next();
                })
                .catch(function(error) {
                    log('Error checking feature access:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Error validating feature access'
                    });
                });
        };
    }

    /**
     * Optional middleware - adds subscription info to request but doesn't block
     */
    function attachSubscription(req, res, next) {
        var profile = req.profile || req.query.profile || req.body.profile || req.headers['x-profile'];
        
        if (!profile) {
            return next();
        }

        checkSubscription(profile)
            .then(function(subscription) {
                req.subscription = subscription;
                next();
            })
            .catch(function(error) {
                log('Error attaching subscription:', error);
                next(); // Continue even if error
            });
    }

    /**
     * Helper function to check subscription status
     */
    async function checkSubscription(profile) {
        try {
            var subscription = await SubscriptionModel.findOne({ profile: profile });
            
            if (!subscription) {
                // Default to FREE plan
                return {
                    plan_type: 'FREE',
                    status: 'active',
                    features: []
                };
            }

            // Check if expired
            if (subscription.end_date && new Date() > subscription.end_date && subscription.status === 'active') {
                subscription.status = 'expired';
                await subscription.save();
            }

            // Get plan details for features
            if (!subscription.features || subscription.features.length === 0) {
                var plan = await SubscriptionPlanModel.findOne({ plan_code: subscription.plan_type });
                if (plan && plan.features) {
                    subscription.features = plan.features.filter(function(f) { return f.enabled; }).map(function(f) { return f.feature_name; });
                }
            }

            return subscription.toObject ? subscription.toObject() : subscription;
        } catch (error) {
            log('Error in checkSubscription:', error);
            throw error;
        }
    }

    // Export middleware functions
    module.exports = {
        requireSubscription: requireSubscription,
        requirePlan: requirePlan,
        requireFeature: requireFeature,
        attachSubscription: attachSubscription,
        checkSubscription: checkSubscription
    };

})();

