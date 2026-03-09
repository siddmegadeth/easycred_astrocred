// EQUIFAX Credit Bureau Data Schema
// Based on CIBIL schema structure, adapted for EQUIFAX format
(function () {

    // EQUIFAX Enquiry Schema
    EquifaxEnquirySchema = module.exports = mongoose.Schema({
        index: String,
        enquiryDate: String,
        memberShortName: String,
        enquiryPurpose: String,
        enquiryAmount: Number
    });

    // EQUIFAX Account Schema
    EquifaxAccountSchema = module.exports = mongoose.Schema({
        index: String,
        memberShortName: String,
        accountType: String,
        ownershipIndicator: String,
        dateOpened: String,
        lastPaymentDate: String,
        dateReported: String,
        highCreditAmount: Number,
        currentBalance: Number,
        paymentHistory: String,
        paymentStartDate: String,
        paymentEndDate: String,
        creditFacilityStatus: String,
        collateralType: String,
        interestRate: Number,
        paymentTenure: Number,
        emiAmount: Number,
        paymentFrequency: String,
        actualPaymentAmount: Number,
        accountNumber: String,
        dateClosed: String,
        amountOverdue: Number,
        termMonths: Number,
        monthlyPayStatus: [{
            date: String,
            status: String,
            amount: Number
        }],
        isActive: {
            type: Boolean,
            default: true
        },
        overdueStatus: {
            type: String,
            enum: ['Current', '30+ Days', '60+ Days', '90+ Days', 'NPA'],
            default: 'Current'
        },
        creditUtilization: {
            type: Number,
            min: 0,
            max: 100
        }
    });

    // Main EQUIFAX Data Schema
    EquifaxDataSchema = module.exports = mongoose.Schema({
        // Primary identifier - mobile number
        mobile: {
            type: String,
            required: true,
            index: true
        },

        // Secondary identifier - email
        email: {
            type: String,
            required: true,
            index: true,
            lowercase: true,
            trim: true
        },

        // PAN card
        pan: {
            type: String,
            required: true,
            index: true,
            uppercase: true
        },

        // User's full name
        name: {
            type: String,
            required: true,
            trim: true
        },

        // Gender
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
            required: true
        },

        // EQUIFAX Credit score
        credit_score: String,

        // EQUIFAX Credit report data
        credit_report: [{
            names: [{
                index: String,
                name: String,
                birthDate: String,
                gender: String
            }],
            ids: [{
                index: String,
                idType: String,
                idNumber: String
            }],
            telephones: [{
                index: String,
                telephoneNumber: String,
                telephoneType: String
            }],
            emails: [{
                index: String,
                emailID: String
            }],
            employment: [{
                index: String,
                accountType: String,
                dateReported: String,
                occupationCode: String
            }],
            scores: [{
                scoreName: String,
                scoreCardName: String,
                scoreCardVersion: String,
                scoreDate: String,
                score: String,
                reasonCodes: [{
                    reasonCodeName: String,
                    reasonCodeValue: String
                }]
            }],
            addresses: [{
                index: String,
                line1: String,
                line2: String,
                line3: String,
                stateCode: String,
                pinCode: String,
                addressCategory: String,
                dateReported: String
            }],
            accounts: [EquifaxAccountSchema],
            enquiries: [EquifaxEnquirySchema],
            response: {
                consumerSummaryresp: {
                    accountSummary: {
                        totalAccounts: Number,
                        highCreditAmount: Number,
                        currentBalance: Number,
                        overdueAccounts: Number,
                        overdueBalance: Number,
                        zeroBalanceAccounts: Number,
                        recentDateOpened: String,
                        oldestDateOpened: String
                    },
                    inquirySummary: {
                        totalInquiry: Number,
                        inquiryPast30Days: String,
                        inquiryPast12Months: String,
                        inquiryPast24Months: String,
                        recentInquiryDate: String
                    }
                }
            }
        }],

        // Original parameters
        params: {
            mobile: String,
            pan: String,
            name: String,
            gender: String,
            consent: String
        },

        // Status flags
        status: Boolean,
        status_code: Number,
        success: Boolean,
        message: String,
        message_code: String,

        // Analysis results cache
        analysis: {
            overallGrade: String,
            defaulters: [Schema.Types.Mixed],
            recommendations: [Schema.Types.Mixed],
            comprehensiveReport: Schema.Types.Mixed,
            riskReport: Schema.Types.Mixed,
            improvementPlan: Schema.Types.Mixed,
            bankSuggestions: [Schema.Types.Mixed],
            creditUtilization: Number,
            creditAge: Number,
            paymentAnalysis: Schema.Types.Mixed,
            componentScores: Schema.Types.Mixed,
            riskDetails: Schema.Types.Mixed,
            allAccounts: [Schema.Types.Mixed],
            analysisVersion: {
                type: String,
                default: '1.0'
            },
            analyzedAt: {
                type: Date,
                default: Date.now
            },
            dataHash: String
        },

        // Bureau identifier
        bureau: {
            type: String,
            default: 'EQUIFAX',
            enum: ['EQUIFAX']
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
            { mobile: 1, email: 1, pan: 1 },
            { bureau: 1 },
            { 'analysis.overallGrade': 1 },
            { credit_score: 1 }
        ]
    });

    EquifaxDataModel = module.exports = mongoose.model("EquifaxDataModel", EquifaxDataSchema);
})();
