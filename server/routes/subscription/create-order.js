// Create Payment Order for Subscription
(function() {
    var RazorpayService = require('./razorpay-service.js');
    var SubscriptionPlanModel = require('../../schema/subscription/subscription-plan-schema.js');
    var PaymentTransactionModel = require('../../schema/subscription/payment-transaction-schema.js');

    // Create payment order for subscription
    app.post('/post/api/subscription/create-order', async function(req, res) {
        try {
            var { profile, plan_code, billing_cycle } = req.body;
            
            if (!profile || !plan_code) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: profile and plan_code are required'
                });
            }

            billing_cycle = billing_cycle || 'monthly';

            // Get plan details
            var plan = await SubscriptionPlanModel.findOne({ plan_code: plan_code, is_active: true });
            if (!plan) {
                return res.status(404).json({
                    success: false,
                    error: 'Subscription plan not found or inactive'
                });
            }

            // Determine price based on billing cycle
            var amount = 0;
            if (billing_cycle === 'monthly') {
                amount = plan.price_monthly;
            } else if (billing_cycle === 'quarterly') {
                amount = plan.price_quarterly || (plan.price_monthly * 3 * 0.9); // 10% discount
            } else if (billing_cycle === 'yearly') {
                amount = plan.price_yearly || (plan.price_monthly * 12 * 0.8); // 20% discount
            }

            if (amount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid plan pricing'
                });
            }

            // Create Razorpay order
            var orderResult = await RazorpayService.createOrder({
                amount: amount,
                currency: plan.currency || 'INR',
                receipt: 'SUB_' + profile + '_' + Date.now(),
                notes: {
                    profile: profile,
                    plan_code: plan_code,
                    billing_cycle: billing_cycle,
                    plan_name: plan.plan_name
                }
            });

            if (!orderResult.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to create payment order',
                    details: orderResult.error
                });
            }

            // Save transaction record
            var transaction = new PaymentTransactionModel({
                profile: profile,
                razorpay_order_id: orderResult.order.id,
                amount: amount,
                currency: plan.currency || 'INR',
                status: 'pending',
                plan_type: plan_code,
                billing_cycle: billing_cycle,
                metadata: {
                    plan_name: plan.plan_name,
                    order_created_at: new Date()
                }
            });

            await transaction.save();

            // Return order details (key_id for frontend)
            var keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY;

            res.json({
                success: true,
                order_id: orderResult.order.id,
                amount: amount,
                currency: plan.currency || 'INR',
                key_id: keyId,
                plan: {
                    code: plan_code,
                    name: plan.plan_name,
                    billing_cycle: billing_cycle
                },
                transaction_id: transaction._id
            });

        } catch (error) {
            log('Error creating subscription order:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create payment order',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

})();

