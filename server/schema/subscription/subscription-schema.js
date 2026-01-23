(function () {
    'use strict';

    /**
     * Subscription Schema
     * Manages user subscription plans and billing
     */

    const SubscriptionSchema = new mongoose.Schema({
        // User Reference
        profile: {
            type: String,
            required: true,
            index: true
        },
        mobile: {
            type: String,
            required: true,
            index: true
        },
        email: String,

        // Plan Details
        plan: {
            type: String,
            enum: ['FREE', 'PRO', 'PREMIUM', 'ENTERPRISE'],
            default: 'FREE'
        },
        planName: {
            type: String,
            default: 'Free Plan'
        },

        // Razorpay Subscription
        razorpay: {
            customerId: String,
            subscriptionId: String,
            planId: String,
            status: {
                type: String,
                enum: ['created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired'],
                default: 'created'
            },
            currentPeriodStart: Date,
            currentPeriodEnd: Date,
            shortUrl: String // For payment link
        },

        // Billing
        billing: {
            amount: { type: Number, default: 0 },
            currency: { type: String, default: 'INR' },
            interval: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
            nextBillingDate: Date,
            lastPaymentDate: Date,
            lastPaymentAmount: Number
        },

        // Features Access
        features: {
            creditReports: { type: Number, default: 1 }, // Reports per month
            multiBureau: { type: Boolean, default: false },
            aiChat: { type: Boolean, default: true }, // Limited for free
            aiChatLimit: { type: Number, default: 10 }, // Messages per day
            finvuConnect: { type: Boolean, default: false },
            loanMarketplace: { type: Boolean, default: false },
            prioritySupport: { type: Boolean, default: false },
            apiAccess: { type: Boolean, default: false },
            apiCallsLimit: { type: Number, default: 0 }
        },

        // Usage Tracking
        usage: {
            reportsThisMonth: { type: Number, default: 0 },
            aiChatsToday: { type: Number, default: 0 },
            apiCallsThisMonth: { type: Number, default: 0 },
            lastReportDate: Date,
            lastChatDate: Date
        },

        // Trial
        trial: {
            isActive: { type: Boolean, default: false },
            startDate: Date,
            endDate: Date,
            daysRemaining: Number
        },

        // Status
        isActive: { type: Boolean, default: true },
        cancelledAt: Date,
        cancelReason: String

    }, {
        timestamps: true
    });

    // Plan configurations
    SubscriptionSchema.statics.PLANS = {
        FREE: {
            name: 'Free Plan',
            price: 0,
            features: {
                creditReports: 1,
                multiBureau: false,
                aiChat: true,
                aiChatLimit: 10,
                finvuConnect: false,
                loanMarketplace: false,
                prioritySupport: false,
                apiAccess: false,
                apiCallsLimit: 0
            }
        },
        PRO: {
            name: 'Pro Plan',
            price: 299,
            priceYearly: 2999,
            features: {
                creditReports: 5,
                multiBureau: true,
                aiChat: true,
                aiChatLimit: 100,
                finvuConnect: false,
                loanMarketplace: true,
                prioritySupport: false,
                apiAccess: false,
                apiCallsLimit: 100
            }
        },
        PREMIUM: {
            name: 'Premium Plan',
            price: 599,
            priceYearly: 5999,
            features: {
                creditReports: -1, // Unlimited
                multiBureau: true,
                aiChat: true,
                aiChatLimit: -1, // Unlimited
                finvuConnect: true,
                loanMarketplace: true,
                prioritySupport: true,
                apiAccess: true,
                apiCallsLimit: 1000
            }
        },
        ENTERPRISE: {
            name: 'Enterprise Plan',
            price: 2999,
            priceYearly: 29999,
            features: {
                creditReports: -1,
                multiBureau: true,
                aiChat: true,
                aiChatLimit: -1,
                finvuConnect: true,
                loanMarketplace: true,
                prioritySupport: true,
                apiAccess: true,
                apiCallsLimit: -1 // Unlimited
            }
        }
    };

    // Check if user can use a feature
    SubscriptionSchema.methods.canUseFeature = function (feature) {
        if (!this.isActive) return false;

        // Check trial
        if (this.trial.isActive && new Date() <= this.trial.endDate) {
            return true; // Trial users get full access
        }

        // Check feature access
        const featureValue = this.features[feature];
        if (typeof featureValue === 'boolean') {
            return featureValue;
        }
        if (typeof featureValue === 'number') {
            return featureValue === -1 || featureValue > 0; // -1 means unlimited
        }
        return false;
    };

    // Check usage limits
    SubscriptionSchema.methods.checkLimit = function (limitType) {
        const limits = {
            reports: { used: this.usage.reportsThisMonth, max: this.features.creditReports },
            aiChat: { used: this.usage.aiChatsToday, max: this.features.aiChatLimit },
            apiCalls: { used: this.usage.apiCallsThisMonth, max: this.features.apiCallsLimit }
        };

        const limit = limits[limitType];
        if (!limit) return { allowed: false, reason: 'Unknown limit type' };

        if (limit.max === -1) return { allowed: true, remaining: 'unlimited' };
        if (limit.used >= limit.max) return { allowed: false, remaining: 0, reason: 'Limit exceeded' };

        return { allowed: true, remaining: limit.max - limit.used };
    };

    // Increment usage
    SubscriptionSchema.methods.incrementUsage = async function (usageType) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (usageType) {
            case 'report':
                this.usage.reportsThisMonth += 1;
                this.usage.lastReportDate = new Date();
                break;
            case 'aiChat':
                // Reset daily count if it's a new day
                if (!this.usage.lastChatDate || this.usage.lastChatDate < today) {
                    this.usage.aiChatsToday = 0;
                }
                this.usage.aiChatsToday += 1;
                this.usage.lastChatDate = new Date();
                break;
            case 'apiCall':
                this.usage.apiCallsThisMonth += 1;
                break;
        }

        return this.save();
    };

    module.exports = mongoose.model('Subscription', SubscriptionSchema);
    log('📊 Subscription Schema Initialized');

})();
