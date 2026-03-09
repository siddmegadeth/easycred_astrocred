// Generate API Key
(function() {
    var ApiKeyModel = require('../../schema/api-key/api-key-schema.js');
    var crypto = require('crypto');

    // Generate new API key
    app.post('/post/api/ecosystem/generate-key', async function(req, res) {
        try {
            var { profile, key_name, key_description, permissions, rate_limit, expires_in_days, ip_whitelist } = req.body;
            
            if (!profile || !key_name) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: profile and key_name are required'
                });
            }

            // Generate API key and secret
            var apiKey = 'AK_' + crypto.randomBytes(16).toString('hex').toUpperCase();
            var apiSecret = crypto.randomBytes(32).toString('hex');

            // Set expiration date
            var expiresAt = null;
            if (expires_in_days) {
                expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + parseInt(expires_in_days));
            }

            // Default permissions if not provided
            var defaultPermissions = permissions || [
                'cibil.analysis.read',
                'cibil.score.read',
                'roadmap.read',
                'offers.read'
            ];

            // Default rate limits
            var defaultRateLimit = rate_limit || {
                requests_per_minute: 60,
                requests_per_hour: 1000,
                requests_per_day: 10000
            };

            // Create API key record
            var apiKeyDoc = new ApiKeyModel({
                profile: profile,
                api_key: apiKey,
                api_secret: apiSecret,
                key_name: key_name,
                key_description: key_description || '',
                permissions: defaultPermissions,
                rate_limit: defaultRateLimit,
                expires_at: expiresAt,
                ip_whitelist: ip_whitelist || [],
                status: 'active'
            });

            await apiKeyDoc.save();

            res.json({
                success: true,
                message: 'API key generated successfully',
                api_key: {
                    key: apiKey,
                    secret: apiSecret, // Only shown once
                    key_name: key_name,
                    permissions: defaultPermissions,
                    rate_limit: defaultRateLimit,
                    expires_at: expiresAt,
                    created_at: apiKeyDoc.created_at
                },
                warning: 'Please save the API secret securely. It will not be shown again.'
            });

        } catch (error) {
            log('Error generating API key:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate API key',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // List API keys for a user
    app.get('/get/api/ecosystem/keys', async function(req, res) {
        try {
            var { profile } = req.query;
            
            if (!profile) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameter: profile'
                });
            }

            var keys = await ApiKeyModel.find({ profile: profile })
                .select('-api_secret') // Don't expose secrets
                .sort({ created_at: -1 })
                .lean();

            res.json({
                success: true,
                api_keys: keys,
                count: keys.length
            });

        } catch (error) {
            log('Error listing API keys:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to list API keys',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Revoke API key
    app.post('/post/api/ecosystem/revoke-key', async function(req, res) {
        try {
            var { profile, api_key, revocation_reason } = req.body;
            
            if (!profile || !api_key) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: profile and api_key are required'
                });
            }

            var keyDoc = await ApiKeyModel.findOne({ profile: profile, api_key: api_key });
            if (!keyDoc) {
                return res.status(404).json({
                    success: false,
                    error: 'API key not found'
                });
            }

            keyDoc.status = 'revoked';
            keyDoc.revoked_at = new Date();
            keyDoc.revocation_reason = revocation_reason || null;
            await keyDoc.save();

            res.json({
                success: true,
                message: 'API key revoked successfully',
                api_key: api_key,
                revoked_at: keyDoc.revoked_at
            });

        } catch (error) {
            log('Error revoking API key:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to revoke API key',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

})();

