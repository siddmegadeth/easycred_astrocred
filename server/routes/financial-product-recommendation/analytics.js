(function() {


    var AnalyticsService = function() {};

    AnalyticsService.prototype.trackUserAction = function(userId, action, data) {
        var analyticsRecord = new AnalyticsModels.Analytics({
            userId: userId,
            action: action,
            productType: data.productType,
            productsViewed: data.productsViewed,
            searchFilters: data.filters,
            sessionDuration: data.duration,
            outcome: data.outcome
        });

        return analyticsRecord.save();
    };

    AnalyticsService.prototype.updateUserPreferences = function(userId, preferences) {
        return AnalyticsModels.UserPreference.findOneAndUpdate({ userId: userId }, { $set: preferences }, { upsert: true, new: true });
    };

    AnalyticsService.prototype.getPopularProducts = function(productType, limit) {
        return new Promise(function(resolve, reject) {
            AnalyticsModels.Analytics.aggregate([
                { $match: { productType: productType, action: 'view' } },
                { $unwind: '$productsViewed' },
                {
                    $group: {
                        _id: '$productsViewed',
                        viewCount: { $sum: 1 },
                        uniqueUsers: { $addToSet: '$userId' }
                    }
                },
                {
                    $project: {
                        productId: '$_id',
                        viewCount: 1,
                        uniqueUserCount: { $size: '$uniqueUsers' },
                        popularityScore: { $add: ['$viewCount', { $multiply: ['$uniqueUserCount', 2] }] }
                    }
                },
                { $sort: { popularityScore: -1 } },
                { $limit: limit || 10 }
            ]).then(resolve).catch(reject);
        });
    };
    analyticsService = module.exports = new AnalyticsService();
})()