(function() {

    CibilDataSchema = module.exports = mongoose.Schema({
        client_id: {
            type: String,
            unique: true,
            index: true
        },
        mobile: String,
        pan: String,
        name: String,
        gender: String,
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
                stateCode: String,
                pinCode: String,
                addressCategory: String,
                dateReported: String,
                enquiryEnriched: String,
                residenceCode: String
            }],
            accounts: [CreditAccountSchema],
            enquiries: [{
                index: String,
                enquiryDate: String,
                memberShortName: String,
                enquiryPurpose: String,
                enquiryAmount: Number
            }]
        }],
        status_code: Number,
        success: Boolean,
        message: String,
        message_code: String,
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