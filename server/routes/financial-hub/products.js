// Financial Products Hub
// Unified marketplace for all financial products
(function() {
    var ProductModel = require('../../schema/product/product-schema.js');

    // Get all financial products
    app.get('/get/api/financial-hub/products', async function(req, res) {
        try {
            var { category, product_type, provider, min_amount, max_amount, sort_by, limit, offset } = req.query;
            
            limit = parseInt(limit) || 20;
            offset = parseInt(offset) || 0;
            sort_by = sort_by || 'popularity';

            var query = {};
            
            // Filter by product type
            if (product_type) {
                query.type = product_type;
            }
            
            // Filter by provider
            if (provider) {
                query.provider = new RegExp(provider, 'i');
            }
            
            // Filter by amount range
            if (min_amount || max_amount) {
                query['loanAmount.min'] = {};
                if (min_amount) query['loanAmount.min'].$lte = parseFloat(max_amount) || 999999999;
                if (max_amount) query['loanAmount.max'] = { $gte: parseFloat(min_amount) || 0 };
            }

            // Build sort criteria
            var sortCriteria = {};
            if (sort_by === 'popularity') {
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
                .skip(offset)
                .lean();

            var total = await ProductModel.countDocuments(query);

            res.json({
                success: true,
                products: products,
                pagination: {
                    total: total,
                    limit: limit,
                    offset: offset,
                    has_more: (offset + limit) < total
                },
                filters_applied: {
                    category: category || 'all',
                    product_type: product_type || 'all',
                    provider: provider || 'all'
                }
            });

        } catch (error) {
            log('Error fetching financial products:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch products',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get product categories
    app.get('/get/api/financial-hub/categories', async function(req, res) {
        try {
            var categories = await ProductModel.distinct('type');
            
            var categoryDetails = categories.map(function(category) {
                return {
                    code: category,
                    name: formatCategoryName(category),
                    description: getCategoryDescription(category)
                };
            });

            res.json({
                success: true,
                categories: categoryDetails,
                count: categoryDetails.length
            });

        } catch (error) {
            log('Error fetching categories:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch categories'
            });
        }
    });

    // Helper functions
    function formatCategoryName(category) {
        var names = {
            'credit_card': 'Credit Cards',
            'personal_loan': 'Personal Loans',
            'business_loan': 'Business Loans',
            'msme_loan': 'MSME Loans',
            'car_loan': 'Car Loans',
            'insurance': 'Insurance'
        };
        return names[category] || category;
    }

    function getCategoryDescription(category) {
        var descriptions = {
            'credit_card': 'Credit cards from various banks and financial institutions',
            'personal_loan': 'Personal loans for various purposes',
            'business_loan': 'Business loans for enterprises',
            'msme_loan': 'Loans for Micro, Small, and Medium Enterprises',
            'car_loan': 'Automotive loans and financing',
            'insurance': 'Insurance products and policies'
        };
        return descriptions[category] || '';
    }

})();

