// Razorpay Webhook Handler
(function() {
    var RazorpayService = require('./razorpay-service.js');
    var SubscriptionModel = require('../../schema/subscription/subscription-schema.js');
    var PaymentTransactionModel = require('../../schema/subscription/payment-transaction-schema.js');

    // Handle Razorpay webhooks
    app.post('/post/api/subscription/webhook', async function(req, res) {
        try {
            var webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
            var signature = req.headers['x-razorpay-signature'];
            
            if (!signature) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing webhook signature'
                });
            }

            // Verify webhook signature
            var crypto = require('crypto');
            var expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(req.body))
                .digest('hex');

            if (signature !== expectedSignature) {
                log('Invalid webhook signature');
                return res.status(401).json({
                    success: false,
                    error: 'Invalid webhook signature'
                });
            }

            var event = req.body.event;
            var payload = req.body.payload;

            log('Razorpay webhook received:', event);

            // Handle different webhook events
            switch (event) {
                case 'payment.captured':
                    await handlePaymentCaptured(payload.payment.entity);
                    break;
                    
                case 'payment.failed':
                    await handlePaymentFailed(payload.payment.entity);
                    break;
                    
                case 'subscription.activated':
                    await handleSubscriptionActivated(payload.subscription.entity);
                    break;
                    
                case 'subscription.cancelled':
                    await handleSubscriptionCancelled(payload.subscription.entity);
                    break;
                    
                case 'subscription.charged':
                    await handleSubscriptionCharged(payload.subscription.entity);
                    break;
                    
                default:
                    log('Unhandled webhook event:', event);
            }

            res.json({
                success: true,
                message: 'Webhook processed successfully'
            });

        } catch (error) {
            log('Error processing webhook:', error);
            res.status(500).json({
                success: false,
                error: 'Webhook processing failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Handle payment captured
    async function handlePaymentCaptured(payment) {
        try {
            var transaction = await PaymentTransactionModel.findOne({
                razorpay_payment_id: payment.id
            });

            if (transaction) {
                transaction.status = 'success';
                transaction.transaction_date = new Date();
                await transaction.save();
            }
        } catch (error) {
            log('Error handling payment captured:', error);
        }
    }

    // Handle payment failed
    async function handlePaymentFailed(payment) {
        try {
            var transaction = await PaymentTransactionModel.findOne({
                razorpay_order_id: payment.order_id
            });

            if (transaction) {
                transaction.status = 'failed';
                transaction.failure_reason = payment.error_description || 'Payment failed';
                await transaction.save();
            }
        } catch (error) {
            log('Error handling payment failed:', error);
        }
    }

    // Handle subscription activated
    async function handleSubscriptionActivated(subscription) {
        try {
            var sub = await SubscriptionModel.findOne({
                razorpay_subscription_id: subscription.id
            });

            if (sub) {
                sub.status = 'active';
                await sub.save();
            }
        } catch (error) {
            log('Error handling subscription activated:', error);
        }
    }

    // Handle subscription cancelled
    async function handleSubscriptionCancelled(subscription) {
        try {
            var sub = await SubscriptionModel.findOne({
                razorpay_subscription_id: subscription.id
            });

            if (sub) {
                sub.status = 'cancelled';
                sub.cancelled_at = new Date();
                await sub.save();
            }
        } catch (error) {
            log('Error handling subscription cancelled:', error);
        }
    }

    // Handle subscription charged
    async function handleSubscriptionCharged(subscription) {
        try {
            var sub = await SubscriptionModel.findOne({
                razorpay_subscription_id: subscription.id
            });

            if (sub) {
                // Update next billing date
                var nextBilling = new Date(subscription.current_end * 1000);
                sub.next_billing_date = nextBilling;
                sub.end_date = nextBilling;
                await sub.save();
            }
        } catch (error) {
            log('Error handling subscription charged:', error);
        }
    }

})();

