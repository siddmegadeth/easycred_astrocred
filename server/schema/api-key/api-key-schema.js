// API Key Management Schema
// Manages API keys for 3rd party developers
(function() {
    
    ApiKeySchema = module.exports = mongoose.Schema({
        // User/Developer reference
        profile: {
            type: String,
            required: true,
            index: true
        },
        
        // API Key details
        api_key: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        api_secret: {
            type: String,
            required: true
        },
        key_name: {
            type: String,
            required: true
        },
        key_description: {
            type: String
        },
        
        // Key status
        status: {
            type: String,
            enum: ['active', 'revoked', 'suspended', 'expired'],
            default: 'active',
            required: true,
            index: true
        },
        
        // Permissions and scope
        permissions: [{
            type: String,
            enum: [
                'cibil.analysis.read',
                'cibil.score.read',
                'equifax.analysis.read',
                'experion.analysis.read',
                'multi-bureau.comparison.read',
                'roadmap.read',
                'offers.read',
                'profile.read'
            ]
        }],
        
        // Rate limiting
        rate_limit: {
            requests_per_minute: {
                type: Number,
                default: 60
            },
            requests_per_hour: {
                type: Number,
                default: 1000
            },
            requests_per_day: {
                type: Number,
                default: 10000
            }
        },
        
        // Usage tracking
        usage_stats: {
            total_requests: {
                type: Number,
                default: 0
            },
            successful_requests: {
                type: Number,
                default: 0
            },
            failed_requests: {
                type: Number,
                default: 0
            },
            last_used_at: {
                type: Date
            },
            last_used_endpoint: {
                type: String
            }
        },
        
        // Expiration
        expires_at: {
            type: Date
        },
        created_at: {
            type: Date,
            default: Date.now
        },
        revoked_at: {
            type: Date
        },
        revocation_reason: {
            type: String
        },
        
        // Metadata
        ip_whitelist: [{
            type: String
        }],
        referer_whitelist: [{
            type: String
        }],
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
            { api_key: 1 },
            { status: 1 },
            { 'usage_stats.last_used_at': -1 }
        ]
    });

    ApiKeyModel = module.exports = mongoose.model("ApiKeyModel", ApiKeySchema);
})();

