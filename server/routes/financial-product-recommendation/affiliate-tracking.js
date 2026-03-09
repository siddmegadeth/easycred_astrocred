// Affiliate Tracking and Click Management
(function() {
    var AffiliateTrackingModel = require('../../schema/product/affiliate-tracking-schema.js');
    var ProductModel = require('../../schema/product/product-schema.js');
    var crypto = require('crypto');

    // Track affiliate click
    app.post('/post/api/offers/track-click', async function(req, res) {
        try {
            var { profile, product_id, source, campaign_id, metadata } = req.body;
            
            if (!profile || !product_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: profile and product_id are required'
                });
            }

            // Get product details
            var product = await ProductModel.findById(product_id).lean();
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }

            // Generate unique click ID
            var clickId = 'CLICK_' + Date.now() + '_' + crypto.randomBytes(8).toString('hex');

            // Get affiliate information from product
            var affiliatePartner = product.affiliate_partner || 'direct';
            var affiliateUrl = product.apply_url || product.application_link || '#';
            var affiliateId = product.affiliate_id || null;

            // Extract user context from request (if available)
            var userContext = {
                credit_score: req.body.credit_score || null,
                grade: req.body.grade || null,
                employment_type: req.body.employment_type || null,
                income_range: req.body.income_range || null,
                match_score: req.body.match_score || null,
                match_percentage: req.body.match_percentage || null
            };

            // Create tracking record
            var tracking = new AffiliateTrackingModel({
                profile: profile,
                product_id: product_id,
                click_id: clickId,
                affiliate_partner: affiliatePartner,
                affiliate_id: affiliateId,
                affiliate_url: affiliateUrl,
                user_context: userContext,
                ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                user_agent: req.headers['user-agent'],
                referrer: req.headers['referer'],
                campaign_id: campaign_id || null,
                source: source || 'dashboard',
                metadata: metadata || {}
            });

            await tracking.save();

            // Return tracking URL with click ID for redirect
            var trackingUrl = affiliateUrl;
            if (affiliateUrl.indexOf('?') > -1) {
                trackingUrl += '&click_id=' + clickId + '&ref=astrocred';
            } else {
                trackingUrl += '?click_id=' + clickId + '&ref=astrocred';
            }

            res.json({
                success: true,
                click_id: clickId,
                tracking_url: trackingUrl,
                product_name: product.product_name,
                affiliate_partner: affiliatePartner
            });

        } catch (error) {
            log('Error tracking affiliate click:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to track click',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Update conversion status (webhook from affiliate partner or manual)
    app.post('/post/api/offers/track-conversion', async function(req, res) {
        try {
            var { click_id, conversion_status, conversion_value, commission_amount, commission_rate } = req.body;
            
            if (!click_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required field: click_id'
                });
            }

            conversion_status = conversion_status || 'converted';

            var tracking = await AffiliateTrackingModel.findOne({ click_id: click_id });
            if (!tracking) {
                return res.status(404).json({
                    success: false,
                    error: 'Click tracking record not found'
                });
            }

            // Update conversion details
            tracking.conversion_status = conversion_status;
            tracking.converted_at = new Date();
            tracking.conversion_value = conversion_value || 0;
            tracking.commission_amount = commission_amount || 0;
            tracking.commission_rate = commission_rate || 0;
            tracking.updatedAt = new Date();

            await tracking.save();

            res.json({
                success: true,
                message: 'Conversion tracked successfully',
                click_id: click_id,
                conversion_status: conversion_status,
                commission_amount: tracking.commission_amount
            });

        } catch (error) {
            log('Error tracking conversion:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to track conversion',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get affiliate statistics for a user
    app.get('/get/api/offers/affiliate-stats', async function(req, res) {
        try {
            var { profile, start_date, end_date } = req.query;
            
            if (!profile) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameter: profile'
                });
            }

            var query = { profile: profile };
            
            if (start_date || end_date) {
                query.clicked_at = {};
                if (start_date) query.clicked_at.$gte = new Date(start_date);
                if (end_date) query.clicked_at.$lte = new Date(end_date);
            }

            var clicks = await AffiliateTrackingModel.find(query)
                .populate('product_id', 'product_name product_type provider_name')
                .sort({ clicked_at: -1 })
                .lean();

            // Calculate statistics
            var stats = {
                total_clicks: clicks.length,
                converted_clicks: clicks.filter(c => c.conversion_status === 'converted').length,
                pending_clicks: clicks.filter(c => c.conversion_status === 'pending').length,
                total_commission: clicks.reduce(function(sum, c) { return sum + (c.commission_amount || 0); }, 0),
                conversion_rate: clicks.length > 0 ? (clicks.filter(c => c.conversion_status === 'converted').length / clicks.length * 100).toFixed(2) : 0,
                clicks_by_product: {},
                clicks_by_partner: {}
            };

            // Group by product
            clicks.forEach(function(click) {
                var productName = click.product_id ? click.product_id.product_name : 'Unknown';
                stats.clicks_by_product[productName] = (stats.clicks_by_product[productName] || 0) + 1;
            });

            // Group by partner
            clicks.forEach(function(click) {
                var partner = click.affiliate_partner;
                stats.clicks_by_partner[partner] = (stats.clicks_by_partner[partner] || 0) + 1;
            });

            res.json({
                success: true,
                profile: profile,
                statistics: stats,
                recent_clicks: clicks.slice(0, 20),
                period: {
                    start_date: start_date || 'all',
                    end_date: end_date || 'all'
                }
            });

        } catch (error) {
            log('Error fetching affiliate stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch affiliate statistics',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

})();

