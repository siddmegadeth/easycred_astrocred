(function() {


    var mongoose = require('mongoose');

    var TrackingSchema = new mongoose.Schema({
        userId: {
            type: String,
            index: true,
            sparse:true
        },
        mobile: {
            type: String,
            unique: true,
            index: true
        },
        sessionId: {
            type: String,
            index: true
        },
        ip: {
            type: String,
            index: true
        },

        ipReputation: {
            isProxy: Boolean,
            isVPN: Boolean,
            isTor: Boolean,
            riskLevel: String // LOW | MEDIUM | HIGH
        },

        location: {
            country: String,
            region: String,
            city: String,
            latitude: Number,
            longitude: Number
        },
        device: {
            type: {
                type: String // mobile | desktop | tablet
            },
            brand: String,
            model: String,
            os: String,
            osVersion: String,
            browser: String,
            browserVersion: String
        },

        activity: {
            page: String,
            referrer: String,
            event: {
                type: String, // page_view | click | submit | login_attempt
                index: true
            },
            rapidEvents: {
                type: Number,
                default: 0
            }
        },

        ruleRiskScore: {
            type: Number,
            default: 0
        },

        ruleFlags: [String],

        mlFraudScore: {
            type: Number, // 0–100 probability
            default: 0
        },

        mlDecision: {
            type: String, // LOW_RISK | MEDIUM_RISK | HIGH_RISK
            index: true
        },

        finalDecision: {
            type: String, // ALLOW | STEP_UP | BLOCK
            index: true
        },

        consentGiven: {
            type: Boolean,
            default: false
        },

        purpose: {
            type: String,
            default: 'SECURITY_AND_FRAUD_PREVENTION'
        },

        createdAt: {
            type: Date,
            default: Date.now,
            index: true
        },

        expiresAt: {
            type: Date,
            index: { expires: '90d' } // auto-delete after 90 days
        }

    });

    /* =========================
       INDEXES FOR PERFORMANCE
    ========================= */
    TrackingSchema.index({ ip: 1, createdAt: -1 });
    TrackingSchema.index({ userId: 1, createdAt: -1 });
    TrackingSchema.index({ sessionId: 1, createdAt: -1 });

    TrackingModel = module.exports = mongoose.model('Tracking', TrackingSchema);





})()