(function () {
    'use strict';

    /**
     * Razorpay Subscription Routes
     * Handles subscription creation, webhooks, and management
     */

    const Razorpay = require('razorpay');

    // Initialize Razorpay
    const rzpKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
    const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

    const razorpay = new Razorpay({
        key_id: rzpKeyId,
        key_secret: rzpKeySecret
    });

    const isRzpConfigured = !!process.env.RAZORPAY_KEY_ID;

    const SubscriptionModel = require('../../schema/subscription/subscription-schema');

    // Get subscription plans
    app.get('/api/subscription/plans', async (req, res) => {
        try {
            const plans = SubscriptionModel.PLANS;
            res.json({ success: true, plans: plans });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get current user's subscription
    app.get('/api/subscription/current', async (req, res) => {
        try {
            const mobile = req.session?.mobile || req.query.mobile;
            if (!mobile) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            let subscription = await SubscriptionModel.findOne({ mobile: mobile });

            // Create free subscription if none exists
            if (!subscription) {
                subscription = await SubscriptionModel.create({
                    mobile: mobile,
                    profile: req.session?.profile || mobile,
                    plan: 'FREE',
                    planName: 'Free Plan',
                    features: SubscriptionModel.PLANS.FREE.features
                });
            }

            res.json({ success: true, subscription: subscription });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Create Razorpay subscription
    app.post('/api/subscription/create', async (req, res) => {
        try {
            const { plan, interval } = req.body;
            const mobile = req.session?.mobile || req.body.mobile;

            if (!isRzpConfigured) {
                return res.status(503).json({
                    success: false,
                    error: 'Razorpay is not configured on this server. Please add RAZORPAY_KEY_ID to .env'
                });
            }

            if (!mobile || !plan) {
                return res.status(400).json({ success: false, error: 'Mobile and plan are required' });
            }

            const planConfig = SubscriptionModel.PLANS[plan];
            if (!planConfig) {
                return res.status(400).json({ success: false, error: 'Invalid plan' });
            }

            const amount = interval === 'yearly' ? planConfig.priceYearly : planConfig.price;

            // Create or get Razorpay customer
            let subscription = await SubscriptionModel.findOne({ mobile: mobile });

            let customerId = subscription?.razorpay?.customerId;
            if (!customerId) {
                const customer = await razorpay.customers.create({
                    contact: mobile,
                    email: subscription?.email || `${mobile}@astrocred.in`,
                    name: subscription?.profile || mobile
                });
                customerId = customer.id;
            }

            // Create Razorpay subscription
            // Note: You need to create plans in Razorpay dashboard first
            const razorpayPlanId = process.env[`RAZORPAY_PLAN_${plan}_${interval?.toUpperCase() || 'MONTHLY'}`];

            if (!razorpayPlanId) {
                // Fallback: Create a payment link instead
                const paymentLink = await razorpay.paymentLink.create({
                    amount: amount * 100, // Razorpay uses paise
                    currency: 'INR',
                    description: `${planConfig.name} - ${interval || 'Monthly'} Subscription`,
                    customer: {
                        contact: mobile
                    },
                    callback_url: `${process.env.BASE_URL || 'https://astrocred.co.in'}/api/subscription/callback?plan=${plan}&mobile=${mobile}`,
                    callback_method: 'get'
                });

                // Update subscription record
                await SubscriptionModel.findOneAndUpdate(
                    { mobile: mobile },
                    {
                        $set: {
                            'razorpay.customerId': customerId,
                            'razorpay.shortUrl': paymentLink.short_url,
                            'razorpay.status': 'created',
                            'billing.amount': amount,
                            'billing.interval': interval || 'monthly'
                        }
                    },
                    { upsert: true, new: true }
                );

                return res.json({
                    success: true,
                    paymentUrl: paymentLink.short_url,
                    amount: amount,
                    plan: planConfig.name
                });
            }

            // Create actual subscription
            const rzpSubscription = await razorpay.subscriptions.create({
                plan_id: razorpayPlanId,
                customer_id: customerId,
                quantity: 1,
                total_count: interval === 'yearly' ? 1 : 12
            });

            // Update subscription record
            await SubscriptionModel.findOneAndUpdate(
                { mobile: mobile },
                {
                    $set: {
                        'razorpay.customerId': customerId,
                        'razorpay.subscriptionId': rzpSubscription.id,
                        'razorpay.planId': razorpayPlanId,
                        'razorpay.status': rzpSubscription.status,
                        'razorpay.shortUrl': rzpSubscription.short_url,
                        'billing.amount': amount,
                        'billing.interval': interval || 'monthly'
                    }
                },
                { upsert: true, new: true }
            );

            res.json({
                success: true,
                subscriptionId: rzpSubscription.id,
                paymentUrl: rzpSubscription.short_url,
                amount: amount,
                plan: planConfig.name
            });

        } catch (error) {
            console.error('Subscription Create Error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Payment callback
    app.get('/api/subscription/callback', async (req, res) => {
        try {
            const { plan, mobile, razorpay_payment_id, razorpay_payment_link_id } = req.query;

            if (razorpay_payment_id) {
                // Payment successful
                const planConfig = SubscriptionModel.PLANS[plan];

                await SubscriptionModel.findOneAndUpdate(
                    { mobile: mobile },
                    {
                        $set: {
                            plan: plan,
                            planName: planConfig.name,
                            features: planConfig.features,
                            'razorpay.status': 'active',
                            'billing.lastPaymentDate': new Date(),
                            'billing.nextBillingDate': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                            isActive: true
                        }
                    }
                );

                // Redirect to success page
                res.redirect('/#/subscription/success?plan=' + plan);
            } else {
                // Payment failed
                res.redirect('/#/subscription/failed');
            }
        } catch (error) {
            console.error('Callback Error:', error);
            res.redirect('/#/subscription/failed');
        }
    });

    // Razorpay Webhook
    app.post('/api/subscription/webhook', async (req, res) => {
        try {
            const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
            const signature = req.headers['x-razorpay-signature'];

            // Verify webhook signature
            const crypto = require('crypto');
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(req.body))
                .digest('hex');

            if (signature !== expectedSignature) {
                return res.status(400).json({ error: 'Invalid signature' });
            }

            const event = req.body.event;
            const payload = req.body.payload;

            log('Razorpay Webhook:', event);

            switch (event) {
                case 'subscription.activated':
                    await handleSubscriptionActivated(payload.subscription.entity);
                    break;
                case 'subscription.charged':
                    await handleSubscriptionCharged(payload.subscription.entity, payload.payment.entity);
                    break;
                case 'subscription.cancelled':
                    await handleSubscriptionCancelled(payload.subscription.entity);
                    break;
                case 'subscription.halted':
                case 'subscription.pending':
                    await handleSubscriptionPaused(payload.subscription.entity);
                    break;
            }

            res.json({ status: 'ok' });
        } catch (error) {
            console.error('Webhook Error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Webhook handlers
    async function handleSubscriptionActivated(subscription) {
        await SubscriptionModel.findOneAndUpdate(
            { 'razorpay.subscriptionId': subscription.id },
            {
                $set: {
                    'razorpay.status': 'active',
                    isActive: true
                }
            }
        );
    }

    async function handleSubscriptionCharged(subscription, payment) {
        await SubscriptionModel.findOneAndUpdate(
            { 'razorpay.subscriptionId': subscription.id },
            {
                $set: {
                    'razorpay.status': 'active',
                    'billing.lastPaymentDate': new Date(),
                    'billing.lastPaymentAmount': payment.amount / 100,
                    'billing.nextBillingDate': new Date(subscription.current_end * 1000),
                    isActive: true
                }
            }
        );
    }

    async function handleSubscriptionCancelled(subscription) {
        await SubscriptionModel.findOneAndUpdate(
            { 'razorpay.subscriptionId': subscription.id },
            {
                $set: {
                    'razorpay.status': 'cancelled',
                    cancelledAt: new Date(),
                    // Keep active until current period ends
                    'billing.nextBillingDate': new Date(subscription.current_end * 1000)
                }
            }
        );
    }

    async function handleSubscriptionPaused(subscription) {
        await SubscriptionModel.findOneAndUpdate(
            { 'razorpay.subscriptionId': subscription.id },
            {
                $set: {
                    'razorpay.status': subscription.status,
                    isActive: false
                }
            }
        );
    }

    // Cancel subscription
    app.post('/api/subscription/cancel', async (req, res) => {
        try {
            const mobile = req.session?.mobile || req.body.mobile;
            const { reason } = req.body;

            const subscription = await SubscriptionModel.findOne({ mobile: mobile });
            if (!subscription || !subscription.razorpay.subscriptionId) {
                return res.status(400).json({ success: false, error: 'No active subscription found' });
            }

            // Cancel in Razorpay
            await razorpay.subscriptions.cancel(subscription.razorpay.subscriptionId);

            // Update local record
            await SubscriptionModel.findOneAndUpdate(
                { mobile: mobile },
                {
                    $set: {
                        'razorpay.status': 'cancelled',
                        cancelledAt: new Date(),
                        cancelReason: reason
                    }
                }
            );

            res.json({ success: true, message: 'Subscription cancelled. Access continues until current period ends.' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Check feature access middleware
    app.checkSubscriptionAccess = async function (req, res, feature) {
        const mobile = req.session?.mobile;
        if (!mobile) return { allowed: false, reason: 'Not logged in' };

        const subscription = await SubscriptionModel.findOne({ mobile: mobile });
        if (!subscription) return { allowed: false, reason: 'No subscription found' };

        return subscription.canUseFeature(feature)
            ? { allowed: true }
            : { allowed: false, reason: 'Feature not available in your plan', upgrade: true };
    };

    log('💳 Razorpay Subscription Routes Initialized');

})();
