// Financial Products Search
(function() {
    var ProductModel = require('../../schema/product/product-schema.js');

    // Search financial products
    app.get('/get/api/financial-hub/search', async function(req, res) {
        try {
            var { q, category, min_score, max_amount, sort_by, limit } = req.query;
            
            if (!q) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameter: q (search query)'
                });
            }

            limit = parseInt(limit) || 20;
            sort_by = sort_by || 'relevance';

            // Build search query
            var query = {
                $or: [
                    { name: new RegExp(q, 'i') },
                    { provider: new RegExp(q, 'i') },
                    { features: { $in: [new RegExp(q, 'i')] } }
                ]
            };

            // Filter by category
            if (category) {
                query.type = category;
            }

            // Filter by credit score
            if (min_score) {
                query['eligibilityCriteria.minCreditScore'] = { $lte: parseInt(min_score) };
            }

            // Filter by amount
            if (max_amount) {
                query['loanAmount.max'] = { $gte: parseFloat(max_amount) };
            }

            // Build sort
            var sortCriteria = {};
            if (sort_by === 'relevance') {
                // Sort by popularity for relevance (can be enhanced with text search scoring)
                sortCriteria.popularityScore = -1;
            } else if (sort_by === 'interest_rate') {
                sortCriteria.interestRate = 1;
            } else if (sort_by === 'amount') {
                sortCriteria['loanAmount.max'] = -1;
            } else {
                sortCriteria.lastUpdated = -1;
            }

            var products = await ProductModel.find(query)
                .sort(sortCriteria)
                .limit(limit)
                .lean();

            res.json({
                success: true,
                query: q,
                results: products,
                count: products.length,
                filters: {
                    category: category || 'all',
                    min_score: min_score || 'all',
                    max_amount: max_amount || 'all'
                }
            });

        } catch (error) {
            log('Error searching products:', error);
            res.status(500).json({
                success: false,
                error: 'Search failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

})();

