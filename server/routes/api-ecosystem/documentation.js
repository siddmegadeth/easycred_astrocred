// API Documentation Endpoint
(function() {

    // Get API documentation
    app.get('/get/api/ecosystem/documentation', function(req, res) {
        var documentation = {
            api_name: 'ASTROCRED Public API',
            version: 'v1',
            description: 'Public API for accessing credit analysis, scores, and recommendations',
            base_url: process.env.API_BASE_URL || 'https://api.astrocred.com',
            authentication: {
                type: 'API Key',
                header_name: 'X-API-Key',
                description: 'Include your API key in the X-API-Key header or as api_key query parameter'
            },
            rate_limits: {
                free_tier: {
                    requests_per_minute: 60,
                    requests_per_hour: 1000,
                    requests_per_day: 10000
                },
                basic_tier: {
                    requests_per_minute: 120,
                    requests_per_hour: 5000,
                    requests_per_day: 50000
                },
                premium_tier: {
                    requests_per_minute: 300,
                    requests_per_hour: 20000,
                    requests_per_day: 200000
                }
            },
            endpoints: [
                {
                    path: '/api/v1/cibil/score',
                    method: 'GET',
                    description: 'Get CIBIL credit score',
                    permission_required: 'cibil.score.read',
                    parameters: {
                        pan: 'PAN number (optional)',
                        mobile: 'Mobile number (optional)',
                        email: 'Email address (optional)'
                    },
                    example: '/api/v1/cibil/score?pan=ABCDE1234F&mobile=9876543210'
                },
                {
                    path: '/api/v1/cibil/analysis',
                    method: 'GET',
                    description: 'Get comprehensive CIBIL analysis',
                    permission_required: 'cibil.analysis.read',
                    parameters: {
                        pan: 'PAN number (optional)',
                        mobile: 'Mobile number (optional)',
                        email: 'Email address (optional)'
                    },
                    example: '/api/v1/cibil/analysis?pan=ABCDE1234F'
                },
                {
                    path: '/api/v1/credit/score',
                    method: 'GET',
                    description: 'Get multi-bureau credit scores',
                    permission_required: 'cibil.score.read',
                    parameters: {
                        pan: 'PAN number (optional)',
                        mobile: 'Mobile number (optional)',
                        email: 'Email address (optional)',
                        bureau: 'Bureau filter: CIBIL, EQUIFAX, EXPERION, or ALL (default: ALL)'
                    },
                    example: '/api/v1/credit/score?pan=ABCDE1234F&bureau=ALL'
                },
                {
                    path: '/api/v1/risk/assessment',
                    method: 'GET',
                    description: 'Get credit risk assessment',
                    permission_required: 'cibil.analysis.read',
                    parameters: {
                        pan: 'PAN number (optional)',
                        mobile: 'Mobile number (optional)',
                        email: 'Email address (optional)'
                    },
                    example: '/api/v1/risk/assessment?pan=ABCDE1234F'
                }
            ],
            permissions: [
                {
                    code: 'cibil.analysis.read',
                    description: 'Read CIBIL analysis data'
                },
                {
                    code: 'cibil.score.read',
                    description: 'Read CIBIL credit scores'
                },
                {
                    code: 'equifax.analysis.read',
                    description: 'Read EQUIFAX analysis data'
                },
                {
                    code: 'experion.analysis.read',
                    description: 'Read EXPERION analysis data'
                },
                {
                    code: 'multi-bureau.comparison.read',
                    description: 'Read multi-bureau comparison data'
                },
                {
                    code: 'roadmap.read',
                    description: 'Read credit improvement roadmaps'
                },
                {
                    code: 'offers.read',
                    description: 'Read financial product offers'
                },
                {
                    code: 'profile.read',
                    description: 'Read user profile data'
                }
            ],
            error_codes: {
                '400': 'Bad Request - Invalid parameters',
                '401': 'Unauthorized - Invalid or missing API key',
                '403': 'Forbidden - Permission denied',
                '404': 'Not Found - Resource not found',
                '429': 'Too Many Requests - Rate limit exceeded',
                '500': 'Internal Server Error'
            },
            getting_started: {
                step1: 'Register for an API key at /post/api/ecosystem/generate-key',
                step2: 'Include your API key in requests using X-API-Key header',
                step3: 'Start making API calls to available endpoints',
                step4: 'Monitor your usage at /get/api/ecosystem/usage-stats'
            }
        };

        res.json({
            success: true,
            documentation: documentation
        });
    });

})();

