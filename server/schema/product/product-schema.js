(function() {

    ProductSchema = module.exports = mongoose.Schema({
        type: {
            type: String,
            enum: ['credit_card', 'personal_loan', 'business_loan', 'msme_loan', 'car_loan', 'insurance'],
            required: true
        },
        name: {
            type: String,
            required: true
        },
        provider: {
            type: String,
            required: true
        },
        interestRate: Number,
        processingFees: Number,
        annualFee: Number,
        loanAmount: {
            min: Number,
            max: Number
        },
        tenure: {
            min: Number,
            max: Number
        },
        features: [String],
        eligibilityCriteria: {
            minIncome: Number,
            minCreditScore: Number,
            employmentType: [String]
        },
        hiddenCharges: [{
            name: String,
            amount: Number,
            description: String
        }],
        insuranceCoverage: {
            sumAssured: Number,
            premium: Number,
            coverageDetails: String,
            exclusions: [String],
            loopholes: [{
                category: String,
                description: String,
                severity: Number // 1-10 scale
            }]
        },
        totalCost: Number, // Calculated field for long-term cost
        popularityScore: {
            type: Number,
            default: 0
        },
        userRatings: [{
            userId: Schema.Types.ObjectId,
            rating: Number,
            review: String
        }],
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    });

    // Index for better performance
    ProductSchema.index({ type: 1, popularityScore: -1 });
    ProductSchema.index({ 'eligibilityCriteria.minCreditScore': 1 });

    Product = module.exports = mongoose.model('Product', ProductSchema);
})()