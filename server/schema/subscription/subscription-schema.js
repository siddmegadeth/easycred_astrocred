// Subscription Schema
// User subscription management
(function() {
    
    SubscriptionSchema = module.exports = mongoose.Schema({
        // User reference
        profile: {
            type: String,
            required: true,
            index: true,
            ref: 'ProfileModel'
        },
        
        // Plan type
        plan_type: {
            type: String,
            enum: ['FREE', 'BASIC', 'PREMIUM'],
            default: 'FREE',
            required: true,
            index: true
        },
        
        // Subscription status
        status: {
            type: String,
            enum: ['active', 'expired', 'cancelled', 'pending', 'trial'],
            default: 'active',
            required: true,
            index: true
        },
        
        // Billing cycle
        billing_cycle: {
            type: String,
            enum: ['monthly', 'quarterly', 'yearly'],
            default: 'monthly'
        },
        
        // Subscription dates
        start_date: {
            type: Date,
            default: Date.now
        },
        end_date: {
            type: Date
        },
        next_billing_date: {
            type: Date
        },
        cancelled_at: {
            type: Date
        },
        
        // Trial information
        is_trial: {
            type: Boolean,
            default: false
        },
        trial_start_date: {
            type: Date
        },
        trial_end_date: {
            type: Date
        },
        
        // Payment information
        razorpay_subscription_id: {
            type: String,
            sparse: true,
            index: true
        },
        razorpay_customer_id: {
            type: String,
            sparse: true
        },
        
        // Features access list
        features: [{
            type: String
        }],
        
        // Metadata
        cancellation_reason: {
            type: String
        },
        notes: {
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
            { profile: 1 },
            { status: 1 },
            { plan_type: 1 },
            { razorpay_subscription_id: 1 },
            { end_date: 1 }
        ]
    });

    SubscriptionModel = module.exports = mongoose.model("SubscriptionModel", SubscriptionSchema);
})();

