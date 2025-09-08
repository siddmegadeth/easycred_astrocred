(function() {

    CreditAccountSchema = module.exports = mongoose.Schema({
        index: String,
        memberShortName: String,
        accountType: String,
        ownershipIndicator: Number,
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
        actualPaymentAmount: Number
    }, {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'

        }
    });

    CreditAccountModel = module.exports = mongoose.model("CreditAccountModel", CreditAccountSchema);




})()