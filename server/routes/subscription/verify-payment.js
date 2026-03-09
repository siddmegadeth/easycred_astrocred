// Verify Payment and Create Subscription
(function() {
    var RazorpayService = require('./razorpay-service.js');
    var SubscriptionModel = require('../../schema/subscription/subscription-schema.js');
    var SubscriptionPlanModel = require('../../schema/subscription/subscription-plan-schema.js');
    var PaymentTransactionModel = require('../../schema/subscription/payment-transaction-schema.js');

    // Verify payment and activate subscription
    app.post('/post/api/subscription/verify-payment', async function(req, res) {
        try {
            var { profile, razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_code, billing_cycle } = req.body;
            
            if (!profile || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required payment verification fields'
                });
            }

            // Verify payment signature
            var verification = RazorpayService.verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
            if (!verification.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Payment verification failed',
                    details: verification.error
                });
            }

            // Find transaction
            var transaction = await PaymentTransactionModel.findOne({
                razorpay_order_id: razorpay_order_id,
                profile: profile
            });

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    error: 'Transaction not found'
                });
            }

            // Get plan details
            plan_code = plan_code || transaction.plan_type;
            var plan = await SubscriptionPlanModel.findOne({ plan_code: plan_code });
            if (!plan) {
                return res.status(404).json({
                    success: false,
                    error: 'Plan not found'
                });
            }

            billing_cycle = billing_cycle || transaction.billing_cycle || 'monthly';

            // Update transaction
            transaction.razorpay_payment_id = razorpay_payment_id;
            transaction.razorpay_signature = razorpay_signature;
            transaction.status = 'success';
            transaction.transaction_date = new Date();
            await transaction.save();

            // Calculate subscription dates
            var startDate = new Date();
            var endDate = new Date();
            var nextBillingDate = new Date();

            if (billing_cycle === 'monthly') {
                endDate.setMonth(endDate.getMonth() + 1);
                nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            } else if (billing_cycle === 'quarterly') {
                endDate.setMonth(endDate.getMonth() + 3);
                nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
            } else if (billing_cycle === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
                nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
            }

            // Create or update subscription
            var subscription = await SubscriptionModel.findOne({ profile: profile });
            
            if (subscription) {
                // Update existing subscription
                subscription.plan_type = plan_code;
                subscription.status = 'active';
                subscription.billing_cycle = billing_cycle;
                subscription.start_date = startDate;
                subscription.end_date = endDate;
                subscription.next_billing_date = nextBillingDate;
                subscription.cancelled_at = null;
                subscription.features = plan.features ? plan.features.filter(f => f.enabled).map(f => f.feature_name) : [];
                subscription.updatedAt = new Date();
                await subscription.save();
            } else {
                // Create new subscription
                subscription = new SubscriptionModel({
                    profile: profile,
                    plan_type: plan_code,
                    status: 'active',
                    billing_cycle: billing_cycle,
                    start_date: startDate,
                    end_date: endDate,
                    next_billing_date: nextBillingDate,
                    features: plan.features ? plan.features.filter(f => f.enabled).map(f => f.feature_name) : []
                });
                await subscription.save();
            }

            // Link transaction to subscription
            transaction.subscription_id = subscription._id;
            await transaction.save();

            res.json({
                success: true,
                message: 'Payment verified and subscription activated',
                subscription: {
                    id: subscription._id,
                    plan_type: subscription.plan_type,
                    status: subscription.status,
                    end_date: subscription.end_date,
                    next_billing_date: subscription.next_billing_date,
                    features: subscription.features
                },
                payment: {
                    transaction_id: transaction._id,
                    amount: transaction.amount,
                    status: transaction.status
                }
            });

        } catch (error) {
            log('Error verifying payment:', error);
            res.status(500).json({
                success: false,
                error: 'Payment verification failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

})();

