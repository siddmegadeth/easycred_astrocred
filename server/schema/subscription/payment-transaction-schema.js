// Payment Transaction Schema
// Tracks payment transactions for subscriptions
(function() {
    
    PaymentTransactionSchema = module.exports = mongoose.Schema({
        // User reference
        profile: {
            type: String,
            required: true,
            index: true
        },
        
        // Subscription reference
        subscription_id: {
            type: Schema.Types.ObjectId,
            ref: 'SubscriptionModel',
            index: true
        },
        
        // Razorpay payment information
        razorpay_order_id: {
            type: String,
            index: true
        },
        razorpay_payment_id: {
            type: String,
            unique: true,
            sparse: true,
            index: true
        },
        razorpay_signature: {
            type: String
        },
        
        // Payment details
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'INR'
        },
        status: {
            type: String,
            enum: ['pending', 'success', 'failed', 'refunded', 'cancelled'],
            default: 'pending',
            required: true,
            index: true
        },
        
        // Payment method
        payment_method: {
            type: String,
            enum: ['card', 'netbanking', 'upi', 'wallet', 'emi'],
            default: 'card'
        },
        
        // Plan information
        plan_type: {
            type: String,
            enum: ['FREE', 'BASIC', 'PREMIUM'],
            required: true
        },
        billing_cycle: {
            type: String,
            enum: ['monthly', 'quarterly', 'yearly']
        },
        
        // Transaction details
        transaction_date: {
            type: Date,
            default: Date.now,
            index: true
        },
        failure_reason: {
            type: String
        },
        refund_amount: {
            type: Number,
            default: 0
        },
        refund_date: {
            type: Date
        },
        
        // Metadata
        metadata: {
            type: Schema.Types.Mixed
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
            { subscription_id: 1 },
            { status: 1 },
            { transaction_date: -1 },
            { razorpay_order_id: 1 },
            { razorpay_payment_id: 1 }
        ]
    });

    PaymentTransactionModel = module.exports = mongoose.model("PaymentTransactionModel", PaymentTransactionSchema);
})();

