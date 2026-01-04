// API Key Middleware
// Validates API keys and enforces rate limiting
(function() {
    var ApiKeyModel = require('../schema/api-key/api-key-schema.js');
    var ApiUsageTrackingModel = require('../schema/api-key/api-usage-tracking-schema.js');
    var crypto = require('crypto');

    // Rate limiting store (in-memory, can be moved to Redis in production)
    var rateLimitStore = {};

    /**
     * Middleware to validate API key
     */
    function validateApiKey(req, res, next) {
        var apiKey = req.headers['x-api-key'] || req.headers['api-key'] || req.query.api_key;
        
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'API key required',
                message: 'Please provide an API key in the X-API-Key header or api_key query parameter'
            });
        }

        ApiKeyModel.findOne({ api_key: apiKey, status: 'active' })
            .then(function(keyDoc) {
                if (!keyDoc) {
                    return res.status(401).json({
                        success: false,
                        error: 'Invalid or inactive API key'
                    });
                }

                // Check expiration
                if (keyDoc.expires_at && new Date() > keyDoc.expires_at) {
                    keyDoc.status = 'expired';
                    keyDoc.save();
                    return res.status(401).json({
                        success: false,
                        error: 'API key has expired'
                    });
                }

                // Check IP whitelist if configured
                if (keyDoc.ip_whitelist && keyDoc.ip_whitelist.length > 0) {
                    var clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                    if (!keyDoc.ip_whitelist.includes(clientIp)) {
                        return res.status(403).json({
                            success: false,
                            error: 'IP address not whitelisted'
                        });
                    }
                }

                // Attach key info to request
                req.apiKey = keyDoc;
                req.apiKeyProfile = keyDoc.profile;
                
                next();
            })
            .catch(function(error) {
                log('Error validating API key:', error);
                res.status(500).json({
                    success: false,
                    error: 'Error validating API key'
                });
            });
    }

    /**
     * Rate limiting middleware
     */
    function rateLimit(req, res, next) {
        if (!req.apiKey) {
            return next(); // Should not happen if validateApiKey runs first
        }

        var apiKey = req.apiKey.api_key;
        var limits = req.apiKey.rate_limit || {};
        var now = Date.now();
        var minute = Math.floor(now / 60000);
        var hour = Math.floor(now / 3600000);
        var day = Math.floor(now / 86400000);

        // Initialize rate limit store for this key
        if (!rateLimitStore[apiKey]) {
            rateLimitStore[apiKey] = {
                minute: { count: 0, resetAt: (minute + 1) * 60000 },
                hour: { count: 0, resetAt: (hour + 1) * 3600000 },
                day: { count: 0, resetAt: (day + 1) * 86400000 }
            };
        }

        var store = rateLimitStore[apiKey];

        // Reset counters if period has passed
        if (now >= store.minute.resetAt) {
            store.minute = { count: 0, resetAt: (minute + 1) * 60000 };
        }
        if (now >= store.hour.resetAt) {
            store.hour = { count: 0, resetAt: (hour + 1) * 3600000 };
        }
        if (now >= store.day.resetAt) {
            store.day = { count: 0, resetAt: (day + 1) * 86400000 };
        }

        // Check limits
        var perMinute = limits.requests_per_minute || 60;
        var perHour = limits.requests_per_hour || 1000;
        var perDay = limits.requests_per_day || 10000;

        if (store.minute.count >= perMinute) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message: 'Too many requests per minute',
                retry_after: Math.ceil((store.minute.resetAt - now) / 1000)
            });
        }

        if (store.hour.count >= perHour) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message: 'Too many requests per hour',
                retry_after: Math.ceil((store.hour.resetAt - now) / 1000)
            });
        }

        if (store.day.count >= perDay) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message: 'Too many requests per day',
                retry_after: Math.ceil((store.day.resetAt - now) / 1000)
            });
        }

        // Increment counters
        store.minute.count++;
        store.hour.count++;
        store.day.count++;

        next();
    }

    /**
     * Middleware to check permission
     */
    function requirePermission(permission) {
        return function(req, res, next) {
            if (!req.apiKey) {
                return res.status(401).json({
                    success: false,
                    error: 'API key required'
                });
            }

            var permissions = req.apiKey.permissions || [];
            
            if (permissions.length === 0 || permissions.includes(permission)) {
                return next();
            }

            res.status(403).json({
                success: false,
                error: 'Permission denied',
                message: 'API key does not have required permission: ' + permission,
                required_permission: permission,
                available_permissions: permissions
            });
        };
    }

    /**
     * Middleware to track API usage
     */
    function trackApiUsage(req, res, next) {
        var startTime = Date.now();

        // Override res.json to track response
        var originalJson = res.json.bind(res);
        res.json = function(data) {
            var responseTime = Date.now() - startTime;
            var statusCode = res.statusCode || 200;

            // Track usage asynchronously (don't block response)
            setImmediate(function() {
                trackUsage(req, statusCode, responseTime);
            });

            return originalJson(data);
        };

        next();
    }

    /**
     * Track API usage in database
     */
    function trackUsage(req, statusCode, responseTime) {
        if (!req.apiKey) return;

        var requestId = 'REQ_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
        var endpoint = req.route ? req.route.path : req.path;
        var method = req.method;

        // Create usage record
        var usage = new ApiUsageTrackingModel({
            api_key: req.apiKey.api_key,
            profile: req.apiKey.profile,
            endpoint: endpoint,
            method: method,
            http_status: statusCode,
            request_id: requestId,
            ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            user_agent: req.headers['user-agent'],
            response_time_ms: responseTime,
            error_code: statusCode >= 400 ? 'HTTP_' + statusCode : null,
            requested_at: new Date()
        });

        usage.save().catch(function(error) {
            log('Error tracking API usage:', error);
        });

        // Update API key stats
        ApiKeyModel.findByIdAndUpdate(req.apiKey._id, {
            $inc: {
                'usage_stats.total_requests': 1,
                'usage_stats.successful_requests': statusCode < 400 ? 1 : 0,
                'usage_stats.failed_requests': statusCode >= 400 ? 1 : 0
            },
            $set: {
                'usage_stats.last_used_at': new Date(),
                'usage_stats.last_used_endpoint': endpoint
            }
        }).exec().catch(function(error) {
            log('Error updating API key stats:', error);
        });
    }

    /**
     * Combined middleware: validate + rate limit + track
     */
    function apiKeyAuth(req, res, next) {
        validateApiKey(req, res, function() {
            rateLimit(req, res, function() {
                trackApiUsage(req, res, next);
            });
        });
    }

    module.exports = {
        validateApiKey: validateApiKey,
        rateLimit: rateLimit,
        requirePermission: requirePermission,
        trackApiUsage: trackApiUsage,
        apiKeyAuth: apiKeyAuth // Combined middleware
    };

})();

