// API Usage Tracking Schema
// Tracks API usage for analytics and billing
(function() {
    
    ApiUsageTrackingSchema = module.exports = mongoose.Schema({
        // API Key reference
        api_key: {
            type: String,
            required: true,
            index: true
        },
        profile: {
            type: String,
            required: true,
            index: true
        },
        
        // Request details
        endpoint: {
            type: String,
            required: true,
            index: true
        },
        method: {
            type: String,
            enum: ['GET', 'POST', 'PUT', 'DELETE'],
            default: 'GET'
        },
        http_status: {
            type: Number,
            required: true,
            index: true
        },
        
        // Request metadata
        request_id: {
            type: String,
            unique: true,
            index: true
        },
        ip_address: {
            type: String,
            index: true
        },
        user_agent: {
            type: String
        },
        response_time_ms: {
            type: Number
        },
        
        // Error tracking
        error_code: {
            type: String
        },
        error_message: {
            type: String
        },
        
        // Billing/revenue tracking
        cost_units: {
            type: Number,
            default: 1
        },
        billing_tier: {
            type: String,
            enum: ['free', 'basic', 'premium', 'enterprise']
        },
        
        // Timestamp
        requested_at: {
            type: Date,
            default: Date.now,
            required: true,
            index: true
        }
    }, {
        timestamps: false,
        indexes: [
            { api_key: 1, requested_at: -1 },
            { profile: 1, requested_at: -1 },
            { endpoint: 1, requested_at: -1 },
            { requested_at: -1 },
            { request_id: 1 }
        ]
    });

    // TTL index to auto-delete old records (90 days)
    ApiUsageTrackingSchema.index({ requested_at: 1 }, { expireAfterSeconds: 7776000 });

    ApiUsageTrackingModel = module.exports = mongoose.model("ApiUsageTrackingModel", ApiUsageTrackingSchema);
})();

