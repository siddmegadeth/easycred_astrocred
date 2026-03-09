// Multi-Bureau Comparison Schema
// Stores unified comparison data across all credit bureaus
(function() {
    
    // Bureau Score Entry
    BureauScoreSchema = module.exports = mongoose.Schema({
        bureau: {
            type: String,
            enum: ['CIBIL', 'EQUIFAX', 'EXPERION', 'CRIF'],
            required: true
        },
        credit_score: {
            type: Number,
            min: 300,
            max: 900
        },
        grade: {
            type: String,
            enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F']
        },
        reportDate: Date,
        dataAvailable: {
            type: Boolean,
            default: false
        },
        analysis: {
            overallGrade: String,
            defaultProbability: Number,
            creditWorthiness: Number,
            riskLevel: String,
            recommendations: [Schema.Types.Mixed]
        }
    }, { _id: false });

    // Unified Comparison Schema
    MultiBureauComparisonSchema = module.exports = mongoose.Schema({
        // User identifiers
        profile: {
            type: String,
            required: true,
            index: true
        },
        mobile: {
            type: String,
            required: true,
            index: true
        },
        email: {
            type: String,
            index: true,
            lowercase: true
        },
        pan: {
            type: String,
            index: true,
            uppercase: true
        },
        name: {
            type: String,
            required: true
        },

        // Bureau scores comparison
        bureauScores: [BureauScoreSchema],

        // Unified metrics
        averageScore: {
            type: Number,
            min: 300,
            max: 900
        },
        highestScore: {
            type: Number,
            min: 300,
            max: 900
        },
        lowestScore: {
            type: Number,
            min: 300,
            max: 900
        },
        scoreVariance: Number, // How much scores differ across bureaus

        // Unified grade (average of all bureaus)
        unifiedGrade: {
            type: String,
            enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F']
        },

        // Unified analysis
        unifiedAnalysis: {
            overallGrade: String,
            defaultProbability: Number,
            creditWorthiness: Number,
            riskLevel: String,
            recommendations: [Schema.Types.Mixed],
            priorityActions: [Schema.Types.Mixed],
            improvementPlan: Schema.Types.Mixed
        },

        // Comparison insights
        comparisonInsights: {
            scoreConsistency: {
                type: String,
                enum: ['Very Consistent', 'Consistent', 'Moderate Variance', 'High Variance'],
                default: 'Moderate Variance'
            },
            discrepancies: [{
                bureau: String,
                field: String,
                value: Schema.Types.Mixed,
                note: String
            }],
            recommendations: [String],
            bestBureau: String, // Which bureau shows best score
            worstBureau: String // Which bureau shows worst score
        },

        // Data availability
        availableBureaus: [{
            type: String,
            enum: ['CIBIL', 'EQUIFAX', 'EXPERION', 'CRIF']
        }],
        lastUpdated: {
            type: Date,
            default: Date.now
        },

        // Metadata
        comparisonVersion: {
            type: String,
            default: '1.0'
        },
        generatedAt: {
            type: Date,
            default: Date.now
        },

        // Timestamps
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }, {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        },
        indexes: [
            { profile: 1 },
            { mobile: 1, email: 1, pan: 1 },
            { unifiedGrade: 1 },
            { averageScore: 1 },
            { lastUpdated: -1 }
        ]
    });

    MultiBureauComparisonModel = module.exports = mongoose.model("MultiBureauComparisonModel", MultiBureauComparisonSchema);
})();

