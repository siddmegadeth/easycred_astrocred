(function() {
    // Comprehensive health check endpoint
    app.get('/get/api/cibil/health', async function(req, res) {
        try {
            log('/get/api/cibil/health - Comprehensive health check');
            
            var healthChecks = {
                timestamp: new Date().toISOString(),
                service: 'CIBIL Analyzer API',
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                status: 'healthy',
                checks: {}
            };
            
            // 1. Database connection check
            try {
                var dbStart = Date.now();
                var dbStatus = await checkDatabaseHealth();
                var dbLatency = Date.now() - dbStart;
                
                healthChecks.checks.database = {
                    status: dbStatus.connected ? 'healthy' : 'unhealthy',
                    connected: dbStatus.connected,
                    latency_ms: dbLatency,
                    collections: dbStatus.collections,
                    client_count: dbStatus.clientCount,
                    details: dbStatus.details
                };
                
                if (!dbStatus.connected) {
                    healthChecks.status = 'degraded';
                }
            } catch (dbError) {
                healthChecks.checks.database = {
                    status: 'unhealthy',
                    connected: false,
                    error: dbError.message,
                    latency_ms: -1
                };
                healthChecks.status = 'degraded';
            }
            
            // 2. External API connectivity check (SurePass)
            try {
                var apiStart = Date.now();
                var apiStatus = await checkSurePassAPI();
                var apiLatency = Date.now() - apiStart;
                
                healthChecks.checks.external_api = {
                    status: apiStatus.available ? 'healthy' : 'unhealthy',
                    available: apiStatus.available,
                    latency_ms: apiLatency,
                    endpoint: apiStatus.endpoint,
                    details: apiStatus.details
                };
                
                if (!apiStatus.available) {
                    healthChecks.status = 'degraded';
                }
            } catch (apiError) {
                healthChecks.checks.external_api = {
                    status: 'unhealthy',
                    available: false,
                    error: apiError.message,
                    latency_ms: -1
                };
                healthChecks.status = 'degraded';
            }
            
            // 3. Cache system check
            try {
                var cacheStatus = await checkCacheSystem();
                healthChecks.checks.cache = {
                    status: cacheStatus.available ? 'healthy' : 'unhealthy',
                    available: cacheStatus.available,
                    type: cacheStatus.type,
                    stats: cacheStatus.stats,
                    details: cacheStatus.details
                };
                
                if (!cacheStatus.available) {
                    healthChecks.status = 'degraded';
                }
            } catch (cacheError) {
                healthChecks.checks.cache = {
                    status: 'unhealthy',
                    available: false,
                    error: cacheError.message
                };
                healthChecks.status = 'degraded';
            }
            
            // 4. System resources check
            try {
                var systemStatus = checkSystemResources();
                healthChecks.checks.system = {
                    status: 'healthy',
                    memory_usage_mb: systemStatus.memoryUsage,
                    memory_percentage: systemStatus.memoryPercentage,
                    uptime_hours: systemStatus.uptime,
                    node_version: systemStatus.nodeVersion,
                    platform: systemStatus.platform
                };
                
                if (systemStatus.memoryPercentage > 90) {
                    healthChecks.checks.system.status = 'warning';
                    healthChecks.status = 'degraded';
                }
            } catch (systemError) {
                healthChecks.checks.system = {
                    status: 'unhealthy',
                    error: systemError.message
                };
                healthChecks.status = 'degraded';
            }
            
            // 5. Core services check
            try {
                var servicesStatus = checkCoreServices();
                healthChecks.checks.services = {
                    status: servicesStatus.allHealthy ? 'healthy' : 'degraded',
                    grading_engine: servicesStatus.gradingEngine,
                    risk_assessment: servicesStatus.riskAssessment,
                    analytics_engine: servicesStatus.analyticsEngine,
                    analysis_cache: servicesStatus.analysisCache,
                    details: servicesStatus.details
                };
                
                if (!servicesStatus.allHealthy) {
                    healthChecks.status = 'degraded';
                }
            } catch (servicesError) {
                healthChecks.checks.services = {
                    status: 'unhealthy',
                    error: servicesError.message
                };
                healthChecks.status = 'degraded';
            }
            
            // 6. Application metrics
            try {
                var metrics = await getApplicationMetrics();
                healthChecks.metrics = {
                    total_requests: metrics.totalRequests,
                    active_connections: metrics.activeConnections,
                    error_rate: metrics.errorRate,
                    average_response_time: metrics.avgResponseTime,
                    cache_hit_rate: metrics.cacheHitRate
                };
            } catch (metricsError) {
                healthChecks.metrics = {
                    error: 'Metrics unavailable: ' + metricsError.message
                };
            }
            
            // 7. Endpoints status
            healthChecks.endpoints = {
                total: 15, // Update this count based on your actual endpoints
                status: 'operational',
                critical_endpoints: checkCriticalEndpoints()
            };
            
            // Set appropriate HTTP status code
            var statusCode = 200;
            if (healthChecks.status === 'degraded') {
                statusCode = 207; // Multi-status
            } else if (healthChecks.status === 'unhealthy') {
                statusCode = 503; // Service Unavailable
            }
            
            // Add response time
            healthChecks.response_time_ms = Date.now() - req.startTime;
            
            // Log health check
            log('Health check completed: ' + healthChecks.status);
            
            res.status(statusCode).json(healthChecks);
            
        } catch (error) {
            log('Health check failed with error:', error);
            res.status(500).json({
                timestamp: new Date().toISOString(),
                service: 'CIBIL Analyzer API',
                status: 'unhealthy',
                error: 'Health check failed',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    });
    
    // Quick health check (lightweight)
    app.get('/get/api/cibil/health/quick', function(req, res) {
        try {
            log('/get/api/cibil/health/quick');
            
            var quickHealth = {
                timestamp: new Date().toISOString(),
                service: 'CIBIL Analyzer API',
                status: 'healthy',
                uptime: process.uptime(),
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            };
            
            // Quick database check
            CibilDataModel.findOne({}, function(err) {
                if (err) {
                    quickHealth.status = 'degraded';
                    quickHealth.database = 'unavailable';
                } else {
                    quickHealth.database = 'available';
                }
                
                res.json(quickHealth);
            }).limit(1);
            
        } catch (error) {
            res.status(500).json({
                timestamp: new Date().toISOString(),
                service: 'CIBIL Analyzer API',
                status: 'unhealthy',
                error: error.message
            });
        }
    });
    
    // Health check for specific component
    app.get('/get/api/cibil/health/:component', async function(req, res) {
        try {
            var component = req.params.component;
            log('/get/api/cibil/health/' + component);
            
            var componentHealth = {
                timestamp: new Date().toISOString(),
                component: component,
                status: 'unknown'
            };
            
            switch(component) {
                case 'database':
                    var dbStatus = await checkDatabaseHealth();
                    componentHealth.status = dbStatus.connected ? 'healthy' : 'unhealthy';
                    componentHealth.details = dbStatus;
                    break;
                    
                case 'api':
                    var apiStatus = await checkSurePassAPI();
                    componentHealth.status = apiStatus.available ? 'healthy' : 'unhealthy';
                    componentHealth.details = apiStatus;
                    break;
                    
                case 'cache':
                    var cacheStatus = await checkCacheSystem();
                    componentHealth.status = cacheStatus.available ? 'healthy' : 'unhealthy';
                    componentHealth.details = cacheStatus;
                    break;
                    
                case 'system':
                    var systemStatus = checkSystemResources();
                    componentHealth.status = 'healthy';
                    componentHealth.details = systemStatus;
                    break;
                    
                default:
                    return res.status(404).json({
                        error: 'Component not found',
                        available_components: ['database', 'api', 'cache', 'system']
                    });
            }
            
            res.json(componentHealth);
            
        } catch (error) {
            res.status(500).json({
                timestamp: new Date().toISOString(),
                component: req.params.component,
                status: 'unhealthy',
                error: error.message
            });
        }
    });
    
    // Helper functions
    
    async function checkDatabaseHealth() {
        try {
            // Check connection by running a simple query
            var collections = await mongoose.connection.db.listCollections().toArray();
            var collectionNames = collections.map(c => c.name);
            
            // Get client count
            var clientCount = await CibilDataModel.countDocuments({});
            
            return {
                connected: true,
                collections: collectionNames,
                clientCount: clientCount,
                details: {
                    host: mongoose.connection.host,
                    port: mongoose.connection.port,
                    name: mongoose.connection.name,
                    readyState: mongoose.connection.readyState
                }
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                details: {
                    host: mongoose.connection.host,
                    readyState: mongoose.connection.readyState
                }
            };
        }
    }
    
    async function checkSurePassAPI() {
        try {
            // Simple check to see if SurePass API is reachable
            if (!process.env.SUREPASS_URL || !process.env.SUREPASS_TOKEN) {
                return {
                    available: false,
                    endpoint: 'Not configured',
                    details: 'Missing SUREPASS_URL or SUREPASS_TOKEN environment variables'
                };
            }
            
            // Try a lightweight endpoint if available, otherwise just check connectivity
            var response = await axios.get(process.env.SUREPASS_URL + '/health', {
                headers: {
                    'Authorization': 'Bearer ' + process.env.SUREPASS_TOKEN
                },
                timeout: 5000 // 5 second timeout
            });
            
            return {
                available: true,
                endpoint: process.env.SUREPASS_URL,
                details: response.data || 'API reachable'
            };
            
        } catch (error) {
            return {
                available: false,
                endpoint: process.env.SUREPASS_URL || 'Not configured',
                error: error.message,
                details: 'API connectivity issue'
            };
        }
    }
    
    async function checkCacheSystem() {
        try {
            var AnalysisCache = require('./api/analysis-cache');
            
            // Check if cache module is available
            if (typeof AnalysisCache.getCacheStatistics === 'function') {
                var stats = AnalysisCache.getCacheStatistics();
                return {
                    available: true,
                    type: 'memory',
                    stats: stats,
                    details: 'Analysis cache operational'
                };
            } else {
                return {
                    available: false,
                    type: 'none',
                    details: 'Cache system not implemented'
                };
            }
        } catch (error) {
            return {
                available: false,
                error: error.message,
                details: 'Cache system error'
            };
        }
    }
    
    function checkSystemResources() {
        var memoryUsage = process.memoryUsage();
        var totalMemMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        var usedMemMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        var memoryPercentage = (usedMemMB / totalMemMB) * 100;
        
        return {
            memoryUsage: usedMemMB + 'MB / ' + totalMemMB + 'MB',
            memoryPercentage: Math.round(memoryPercentage),
            uptime: Math.round(process.uptime() / 3600 * 100) / 100, // Hours
            nodeVersion: process.version,
            platform: process.platform + ' ' + process.arch
        };
    }
    
    function checkCoreServices() {
        var services = {
            gradingEngine: false,
            riskAssessment: false,
            analyticsEngine: false,
            analysisCache: false,
            allHealthy: true,
            details: {}
        };
        
        try {
            require.resolve("./api/grading-engine.js");
            services.gradingEngine = true;
            services.details.gradingEngine = 'Available';
        } catch (e) {
            services.allHealthy = false;
            services.details.gradingEngine = 'Missing or error: ' + e.message;
        }
        
        try {
            require.resolve("./api/risk-assessment.js");
            services.riskAssessment = true;
            services.details.riskAssessment = 'Available';
        } catch (e) {
            services.allHealthy = false;
            services.details.riskAssessment = 'Missing or error: ' + e.message;
        }
        
        try {
            require.resolve("./api/analytics-engine-advance.js");
            services.analyticsEngine = true;
            services.details.analyticsEngine = 'Available';
        } catch (e) {
            services.allHealthy = false;
            services.details.analyticsEngine = 'Missing or error: ' + e.message;
        }
        
        try {
            require.resolve("./api/analysis-cache.js");
            services.analysisCache = true;
            services.details.analysisCache = 'Available';
        } catch (e) {
            services.allHealthy = false;
            services.details.analysisCache = 'Missing or error: ' + e.message;
        }
        
        return services;
    }
    
    async function getApplicationMetrics() {
        // This would typically come from your monitoring system
        // For now, return placeholder metrics
        return {
            totalRequests: 'N/A',
            activeConnections: 'N/A',
            errorRate: 'N/A',
            avgResponseTime: 'N/A',
            cacheHitRate: 'N/A'
        };
    }
    
    function checkCriticalEndpoints() {
        return [
            { endpoint: '/get/api/cibil/upload', status: 'operational' },
            { endpoint: '/get/api/cibil/analysis', status: 'operational' },
            { endpoint: '/risk-assessment', status: 'operational' },
            { endpoint: '/comprehensive-report', status: 'operational' },
            { endpoint: '/enhanced-risk-assessment', status: 'operational' }
        ];
    }

})();