// Subscription Plan Schema
// Defines available subscription plans
(function() {
    
    SubscriptionPlanSchema = module.exports = mongoose.Schema({
        // Plan identifier
        plan_code: {
            type: String,
            required: true,
            unique: true,
            enum: ['FREE', 'BASIC', 'PREMIUM']
        },
        
        // Plan name
        plan_name: {
            type: String,
            required: true
        },
        
        // Pricing
        price_monthly: {
            type: Number,
            required: true,
            default: 0
        },
        price_quarterly: {
            type: Number,
            default: 0
        },
        price_yearly: {
            type: Number,
            default: 0
        },
        
        // Currency
        currency: {
            type: String,
            default: 'INR'
        },
        
        // Features included
        features: [{
            feature_name: String,
            feature_description: String,
            enabled: {
                type: Boolean,
                default: true
            }
        }],
        
        // Limits
        limits: {
            credit_reports_per_month: {
                type: Number,
                default: 0 // 0 means unlimited
            },
            multi_bureau_reports: {
                type: Boolean,
                default: false
            },
            pdf_reports: {
                type: Boolean,
                default: false
            },
            api_access: {
                type: Boolean,
                default: false
            },
            priority_support: {
                type: Boolean,
                default: false
            }
        },
        
        // Trial information
        trial_days: {
            type: Number,
            default: 0
        },
        
        // Razorpay plan ID
        razorpay_plan_id_monthly: {
            type: String,
            sparse: true
        },
        razorpay_plan_id_quarterly: {
            type: String,
            sparse: true
        },
        razorpay_plan_id_yearly: {
            type: String,
            sparse: true
        },
        
        // Status
        is_active: {
            type: Boolean,
            default: true
        },
        
        // Description
        description: {
            type: String
        },
        
        // Timestamps
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }, {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        },
        indexes: [
            { plan_code: 1 },
            { is_active: 1 }
        ]
    });

    SubscriptionPlanModel = module.exports = mongoose.model("SubscriptionPlanModel", SubscriptionPlanSchema);
})();

