(function() {



    EnquirySchema = module.exports = mongoose.Schema({
        index: String,
        enquiryDate: String,
        memberShortName: String,
        enquiryPurpose: String,
        enquiryAmount: Number
    });

    CibilDataSchema = module.exports = mongoose.Schema({
        // Primary identifier - mobile number (India specific)
        mobile: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: function(v) {
                    // Indian mobile number validation: 10 digits starting with 6-9
                    return /^[6-9]\d{9}$/.test(v);
                },
                message: props => `${props.value} is not a valid Indian mobile number!`
            }
        },

        // Secondary identifier - email
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: function(v) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                },
                message: props => `${props.value} is not a valid email address!`
            }
        },

        // PAN card (Indian Permanent Account Number)
        pan: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            validate: {
                validator: function(v) {
                    // PAN format: ABCDE1234F (5 letters, 4 digits, 1 letter)
                    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
                },
                message: props => `${props.value} is not a valid PAN number!`
            }
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

        // Credit score
        credit_score: String,

        // Credit report data
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
                telephoneType: String,
                enquiryEnriched: String
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
                line5: String,
                stateCode: String,
                pinCode: String,
                addressCategory: String,
                dateReported: String,
                enquiryEnriched: String,
                residenceCode: String
            }],
            accounts: [CreditAccountSchema],
            enquiries: [EnquirySchema],
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

        // PAN comprehensive data
        pan_comprehensive: {
            data: {
                pan_number: String,
                pan_details: {
                    full_name: String,
                    full_name_split: [String],
                    masked_aadhaar: String,
                    address: {
                        line_1: String,
                        line_2: String,
                        street_name: String,
                        zip: String,
                        city: String,
                        state: String,
                        country: String,
                        full: String
                    },
                    email: String,
                    phone_number: String,
                    gender: String,
                    dob: String,
                    input_dob: String,
                    aadhaar_linked: Boolean,
                    dob_verified: Boolean,
                    dob_check: Boolean,
                    category: String,
                    status: String,
                    less_info: Boolean,
                    father_name: String
                },
                less_info: Boolean
            },
            status_code: Number,
            success: Boolean,
            message: String,
            message_code: String
        },

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
            // Metadata for cache invalidation
            analysisVersion: {
                type: String,
                default: '1.0'
            },
            analyzedAt: {
                type: Date,
                default: Date.now
            },
            dataHash: String // Hash of credit_report to detect data changes
        },

        // Additional Indian-specific fields
        aadhaar_number: {
            type: String,
            sparse: true,
            validate: {
                validator: function(v) {
                    if (!v) return true; // Optional
                    // Aadhaar validation: 12 digits
                    return /^\d{12}$/.test(v);
                },
                message: props => `${props.value} is not a valid Aadhaar number!`
            }
        },

        date_of_birth: {
            type: Date,
            required: true
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

        // Compound unique index for mobile + email combination
        indexes: [
            { mobile: 1, email: 1, pan: 1 }
        ]
    });

    CibilDataModel = module.exports = mongoose.model("CibilDataModel", CibilDataSchema);
})();