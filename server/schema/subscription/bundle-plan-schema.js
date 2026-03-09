// Bundle Plan Schema
// Defines bundle subscription plans (combinations of features)
(function() {
    
    BundlePlanSchema = module.exports = mongoose.Schema({
        // Bundle identifier
        bundle_code: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        
        // Bundle name and description
        bundle_name: {
            type: String,
            required: true
        },
        bundle_description: {
            type: String
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
        currency: {
            type: String,
            default: 'INR'
        },
        
        // Included features/packages
        included_features: [{
            feature_type: {
                type: String,
                enum: ['credit_reports', 'multi_bureau', 'roadmaps', 'offers', 'pdf_reports', 'api_access', 'priority_support'],
                required: true
            },
            feature_details: {
                type: Schema.Types.Mixed
            },
            quantity: {
                type: Number,
                default: -1 // -1 means unlimited
            }
        }],
        
        // Component plans (what individual plans are included)
        component_plans: [{
            plan_code: {
                type: String,
                enum: ['FREE', 'BASIC', 'PREMIUM']
            },
            included: {
                type: Boolean,
                default: true
            }
        }],
        
        // Benefits over individual plans
        benefits: [{
            type: String
        }],
        savings_percentage: {
            type: Number,
            default: 0
        },
        
        // Status
        is_active: {
            type: Boolean,
            default: true
        },
        
        // Razorpay plan IDs
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
            { bundle_code: 1 },
            { is_active: 1 }
        ]
    });

    BundlePlanModel = module.exports = mongoose.model("BundlePlanModel", BundlePlanSchema);
})();

