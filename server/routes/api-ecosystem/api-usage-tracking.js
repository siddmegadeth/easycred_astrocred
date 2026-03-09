// API Usage Tracking and Analytics
(function() {
    var ApiUsageTrackingModel = require('../../schema/api-key/api-usage-tracking-schema.js');
    var ApiKeyModel = require('../../schema/api-key/api-key-schema.js');

    // Get API usage statistics
    app.get('/get/api/ecosystem/usage-stats', async function(req, res) {
        try {
            var { profile, api_key, start_date, end_date, group_by } = req.query;
            
            if (!profile) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameter: profile'
                });
            }

            var query = { profile: profile };
            if (api_key) query.api_key = api_key;
            
            if (start_date || end_date) {
                query.requested_at = {};
                if (start_date) query.requested_at.$gte = new Date(start_date);
                if (end_date) query.requested_at.$lte = new Date(end_date);
            }

            var usageRecords = await ApiUsageTrackingModel.find(query)
                .sort({ requested_at: -1 })
                .limit(1000)
                .lean();

            // Calculate statistics
            var stats = {
                total_requests: usageRecords.length,
                successful_requests: usageRecords.filter(r => r.http_status < 400).length,
                failed_requests: usageRecords.filter(r => r.http_status >= 400).length,
                average_response_time_ms: usageRecords.length > 0 ?
                    Math.round(usageRecords.reduce(function(sum, r) { return sum + (r.response_time_ms || 0); }, 0) / usageRecords.length) : 0,
                requests_by_endpoint: {},
                requests_by_status: {},
                requests_by_day: {}
            };

            // Group by endpoint
            usageRecords.forEach(function(record) {
                var endpoint = record.endpoint;
                stats.requests_by_endpoint[endpoint] = (stats.requests_by_endpoint[endpoint] || 0) + 1;
            });

            // Group by status
            usageRecords.forEach(function(record) {
                var status = record.http_status;
                stats.requests_by_status[status] = (stats.requests_by_status[status] || 0) + 1;
            });

            // Group by day
            usageRecords.forEach(function(record) {
                var day = new Date(record.requested_at).toISOString().split('T')[0];
                stats.requests_by_day[day] = (stats.requests_by_day[day] || 0) + 1;
            });

            res.json({
                success: true,
                profile: profile,
                api_key: api_key || 'all',
                statistics: stats,
                period: {
                    start_date: start_date || 'all',
                    end_date: end_date || 'all'
                },
                recent_requests: usageRecords.slice(0, 50)
            });

        } catch (error) {
            log('Error fetching usage stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch usage statistics',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get API key details with usage
    app.get('/get/api/ecosystem/key-details', async function(req, res) {
        try {
            var { profile, api_key } = req.query;
            
            if (!profile || !api_key) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: profile and api_key'
                });
            }

            var keyDoc = await ApiKeyModel.findOne({ profile: profile, api_key: api_key })
                .select('-api_secret')
                .lean();

            if (!keyDoc) {
                return res.status(404).json({
                    success: false,
                    error: 'API key not found'
                });
            }

            // Get recent usage
            var recentUsage = await ApiUsageTrackingModel.find({ api_key: api_key })
                .sort({ requested_at: -1 })
                .limit(100)
                .lean();

            res.json({
                success: true,
                api_key: keyDoc,
                recent_usage: recentUsage,
                usage_summary: {
                    total_requests: keyDoc.usage_stats.total_requests,
                    successful_requests: keyDoc.usage_stats.successful_requests,
                    failed_requests: keyDoc.usage_stats.failed_requests,
                    last_used_at: keyDoc.usage_stats.last_used_at,
                    last_used_endpoint: keyDoc.usage_stats.last_used_endpoint
                }
            });

        } catch (error) {
            log('Error fetching key details:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch API key details',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

})();

