(function() {


    MonthlyPayStatusSchema = module.exports = mongoose.Schema({
        date: String,
        status: String
    });

    CreditAccountSchema = module.exports = mongoose.Schema({
        index: String,
        accountType: String,
        accountNumber: String,
        memberShortName: String,
        ownershipIndicator: String,
        dateOpened: String,
        dateReported: String,
        dateClosed: String,
        highCreditAmount: Number,
        currentBalance: Number,
        amountOverdue: Number,
        actualPaymentAmount: Number,
        paymentHistory: String,
        monthlyPayStatus: [MonthlyPayStatusSchema],
        paymentStartDate: String,
        paymentEndDate: String,
        creditFacilityStatus: String,
        collateralType: String,
        interestRate: Number,
        paymentTenure: Number,
        termMonths: Number,
        emiAmount: Number,
        paymentFrequency: String,
        woAmountPrincipal: Number,
        woAmountTotal: Number
    });

    EnquirySchema = module.exports = mongoose.Schema({
        index: String,
        enquiryDate: String,
        memberShortName: String,
        enquiryPurpose: String,
        enquiryAmount: Number
    });

    CibilDataSchema = module.exports = mongoose.Schema({
        client_id: {
            type: String,
            required: true,
            unique: true
        },
        mobile: String,
        pan: String,
        name: String,
        gender: String,
        user_email: String,
        credit_score: String,
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
        pan_comprehensive: {
            data: {
                client_id: String,
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
        params: {
            mobile: String,
            pan: String,
            name: String,
            gender: String,
            consent: String
        },
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

        }
    });





    CibilDataModel = module.exports = mongoose.model("CibilDataModel", CibilDataSchema);





})()