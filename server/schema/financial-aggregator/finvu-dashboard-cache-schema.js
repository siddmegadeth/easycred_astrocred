(function () {
    'use strict';

    const mongoose = require('mongoose');

    const FinvuDashboardCacheSchema = new mongoose.Schema({
        mobile: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        accounts: [{
            accountNumber: String,
            bankName: String,
            balance: Number,
            currentBalance: Number,
            type: { type: String },   // account type (field name "type")
            accountType: String,
            ifsc: String,
            branch: String,
            holderName: String
        }],
        transactions: [{
            type: { type: String },   // CREDIT / DEBIT (field name "type")
            amount: Number,
            date: Date,
            valueDate: String,
            narration: String,
            mode: String,
            currentBalance: Number,
            txnId: String,
            accountRef: String
        }],
        summary: {
            totalBalance: { type: Number, default: 0 },
            avgMonthlyIncome: { type: Number, default: 0 },
            avgMonthlyExpense: { type: Number, default: 0 },
            savingsRate: { type: Number, default: 0 },
            transactionCount: { type: Number, default: 0 }
        },
        fetchedAt: { type: Date, default: Date.now }
    }, {
        timestamps: true
    });

    module.exports = mongoose.model('FinvuDashboardCacheModel', FinvuDashboardCacheSchema);

})();
