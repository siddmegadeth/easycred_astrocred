(function() {


    AnalyticsSchema = module.exports = mongoose.Schema({
        userId: Schema.Types.ObjectId,
        action: {
            type: String,
            enum: ['search', 'view', 'compare', 'apply', 'rating']
        },
        productType: String,
        productsViewed: [Schema.Types.ObjectId],
        searchFilters: Schema.Types.Mixed,
        timestamp: {
            type: Date,
            default: Date.now
        },
        sessionDuration: Number,
        outcome: String // 'conversion', 'abandoned', etc.
    });

    UserPreferenceSchema = module.exports = mongoose.Schema({
        userId: Schema.Types.ObjectId,
        preferredProductTypes: [String],
        budgetRange: {
            min: Number,
            max: Number
        },
        riskAppetite: Number, // 1-10 scale
        financialGoals: [String],
        creditScore: Number,
        income: Number,
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    });

    Analytics = module.exports = mongoose.model('Analytics', AnalyticsSchema);
    UserPreference = module.exports = mongoose.model('UserPreference', UserPreferenceSchema);


})()