// Cancel Subscription
(function() {
    var SubscriptionModel = require('../../schema/subscription/subscription-schema.js');
    var RazorpayService = require('./razorpay-service.js');

    // Cancel subscription
    app.post('/post/api/subscription/cancel', async function(req, res) {
        try {
            var { profile, cancellation_reason } = req.body;
            
            if (!profile) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required field: profile'
                });
            }

            var subscription = await SubscriptionModel.findOne({ profile: profile });
            
            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    error: 'Subscription not found'
                });
            }

            if (subscription.status === 'cancelled') {
                return res.json({
                    success: true,
                    message: 'Subscription already cancelled',
                    subscription: subscription
                });
            }

            // Cancel Razorpay subscription if exists
            if (subscription.razorpay_subscription_id) {
                try {
                    await RazorpayService.cancelSubscription(subscription.razorpay_subscription_id);
                } catch (error) {
                    log('Error cancelling Razorpay subscription:', error);
                    // Continue with cancellation even if Razorpay fails
                }
            }

            // Update subscription status
            subscription.status = 'cancelled';
            subscription.cancelled_at = new Date();
            subscription.cancellation_reason = cancellation_reason || null;
            subscription.updatedAt = new Date();
            await subscription.save();

            res.json({
                success: true,
                message: 'Subscription cancelled successfully',
                subscription: {
                    id: subscription._id,
                    status: subscription.status,
                    cancelled_at: subscription.cancelled_at
                }
            });

        } catch (error) {
            log('Error cancelling subscription:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to cancel subscription',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

})();

