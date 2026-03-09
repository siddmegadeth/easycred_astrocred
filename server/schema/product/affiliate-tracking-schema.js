// Affiliate Tracking Schema
// Tracks affiliate clicks and conversions for monetization
(function() {
    
    AffiliateTrackingSchema = module.exports = mongoose.Schema({
        // User reference
        profile: {
            type: String,
            required: true,
            index: true
        },
        
        // Product reference
        product_id: {
            type: Schema.Types.ObjectId,
            ref: 'ProductModel',
            required: true,
            index: true
        },
        
        // Tracking information
        click_id: {
            type: String,
            unique: true,
            required: true,
            index: true
        },
        
        // Affiliate information
        affiliate_partner: {
            type: String,
            required: true,
            index: true
        },
        affiliate_id: {
            type: String,
            index: true
        },
        affiliate_url: {
            type: String,
            required: true
        },
        
        // User context at time of click
        user_context: {
            credit_score: Number,
            grade: String,
            employment_type: String,
            income_range: {
                min: Number,
                max: Number,
                avg: Number
            },
            match_score: Number,
            match_percentage: Number
        },
        
        // Click tracking
        clicked_at: {
            type: Date,
            default: Date.now,
            index: true
        },
        ip_address: {
            type: String
        },
        user_agent: {
            type: String
        },
        referrer: {
            type: String
        },
        
        // Conversion tracking
        conversion_status: {
            type: String,
            enum: ['pending', 'converted', 'rejected', 'cancelled'],
            default: 'pending',
            index: true
        },
        converted_at: {
            type: Date
        },
        conversion_value: {
            type: Number,
            default: 0
        },
        commission_amount: {
            type: Number,
            default: 0
        },
        commission_rate: {
            type: Number,
            default: 0
        },
        
        // Metadata
        campaign_id: {
            type: String
        },
        source: {
            type: String,
            enum: ['dashboard', 'recommendations', 'email', 'sms', 'api', 'other'],
            default: 'dashboard'
        },
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
            { profile: 1, clicked_at: -1 },
            { product_id: 1 },
            { affiliate_partner: 1, conversion_status: 1 },
            { click_id: 1 },
            { conversion_status: 1 },
            { clicked_at: -1 }
        ]
    });

    AffiliateTrackingModel = module.exports = mongoose.model("AffiliateTrackingModel", AffiliateTrackingSchema);
})();

