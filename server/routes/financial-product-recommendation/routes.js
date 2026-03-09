(function() {




    app.get('/recommend/:productType', function(req, res) {
        var productType = req.params.productType;
        var userPreferences = req.query.preferences ? JSON.parse(req.query.preferences) : {};
        var limit = parseInt(req.query.limit) || 5;

        recommendationEngine.getPersonalizedRecommendations(userPreferences, productType, limit)
            .then(function(recommendations) {
                // Track this recommendation action
                analyticsService.trackUserAction(req.userId, 'search', {
                    productType: productType,
                    filters: userPreferences
                });

                res.json({
                    success: true,
                    recommendations: recommendations
                });
            })
            .catch(function(error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            });
    });

    app.post('/compare', function(req, res) {
        var productIds = req.body.productIds;

        if (!productIds || !Array.isArray(productIds)) {
            return res.status(400).json({
                success: false,
                error: 'Product IDs array is required'
            });
        }

        recommendationEngine.compareProducts(productIds)
            .then(function(comparison) {
                res.json({
                    success: true,
                    comparison: comparison
                });
            })
            .catch(function(error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            });
    });

    app.get('/insurance/loopholes/:policyId', function(req, res) {
        var policyId = req.params.policyId;

        Product.findById(policyId).then(function(policy) {
            if (!policy || policy.type !== 'insurance') {
                return res.status(404).json({
                    success: false,
                    error: 'Insurance policy not found'
                });
            }

            var loopholeAnalysis = recommendationEngine.analyzeInsuranceLoopholes(policy.insuranceCoverage);

            res.json({
                success: true,
                policy: policy.name,
                provider: policy.provider,
                loopholeAnalysis: loopholeAnalysis
            });
        }).catch(function(error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        });
    });

})()