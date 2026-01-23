(function () {
    'use strict';

    const mongoose = require('mongoose');

    const LinkedAccountSchema = new mongoose.Schema({
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
        provider: {
            type: String,
            enum: ['FINVU', 'SETU', 'PERFIOS'],
            required: true
        },
        accountType: {
            type: String, // SAVINGS, CURRENT, CREDIT_CARD, INVESTMENT
            required: true
        },
        accountNumber: {
            type: String,
            required: true
        },
        bankName: {
            type: String,
            required: true
        },
        ifsc: String,
        currentBalance: {
            type: Number,
            default: 0
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        },
        consentId: String,
        status: {
            type: String,
            enum: ['ACTIVE', 'EXPIRED', 'REVOKED'],
            default: 'ACTIVE'
        },
        raw_data: mongoose.Schema.Types.Mixed,
        analytics: {
            averageDailyBalance: Number,
            monthlyIncome: Number,
            monthlyExpense: Number,
            isSalaryAccount: Boolean
        }
    }, {
        timestamps: true
    });

    module.exports = mongoose.model('LinkedAccountModel', LinkedAccountSchema);

})();
