(function () {
    'use strict';

    /**
     * FinVu Spending Analyzer
     * Analyzes bank transactions to provide financial insights
     */

    class SpendingAnalyzer {
        constructor(transactions) {
            this.transactions = transactions || [];
        }

        /**
         * Categorize transactions into spending categories
         */
        categorizeTransactions() {
            var categories = {
                food: { total: 0, count: 0, keywords: ['swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'dominos', 'pizza', 'burger'] },
                transport: { total: 0, count: 0, keywords: ['uber', 'ola', 'rapido', 'fuel', 'petrol', 'diesel', 'metro'] },
                utilities: { total: 0, count: 0, keywords: ['electricity', 'water', 'gas', 'mobile', 'broadband', 'internet', 'jio', 'airtel', 'vi'] },
                entertainment: { total: 0, count: 0, keywords: ['netflix', 'prime', 'hotstar', 'spotify', 'movie', 'cinema', 'pvr', 'inox'] },
                shopping: { total: 0, count: 0, keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'shopping', 'mall'] },
                emi: { total: 0, count: 0, keywords: ['emi', 'loan', 'credit card', 'installment'] },
                investment: { total: 0, count: 0, keywords: ['mutual fund', 'sip', 'stock', 'trading', 'zerodha', 'groww'] },
                other: { total: 0, count: 0, keywords: [] }
            };

            this.transactions.forEach(function (txn) {
                if (txn.type === 'CREDIT') return; // Only analyze debits

                var amount = Math.abs(txn.amount);
                var description = (txn.narration || txn.description || '').toLowerCase();
                var categorized = false;

                for (var catName in categories) {
                    if (catName === 'other') continue;
                    var cat = categories[catName];

                    for (var i = 0; i < cat.keywords.length; i++) {
                        if (description.includes(cat.keywords[i])) {
                            cat.total += amount;
                            cat.count++;
                            categorized = true;
                            break;
                        }
                    }

                    if (categorized) break;
                }

                if (!categorized) {
                    categories.other.total += amount;
                    categories.other.count++;
                }
            });

            return categories;
        }

        /**
         * Calculate total income and expenses
         */
        calculateIncomeExpenseRatio() {
            var totalIncome = 0;
            var totalExpense = 0;

            this.transactions.forEach(function (txn) {
                if (txn.type === 'CREDIT') {
                    totalIncome += Math.abs(txn.amount);
                } else {
                    totalExpense += Math.abs(txn.amount);
                }
            });

            return {
                income: totalIncome,
                expense: totalExpense,
                savings: totalIncome - totalExpense,
                savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(2) : 0
            };
        }

        /**
         * Detect recurring payments (EMIs, subscriptions)
         */
        detectRecurringPayments() {
            var recurring = {};

            this.transactions.forEach(function (txn) {
                if (txn.type === 'CREDIT') return;

                var key = (txn.narration || txn.description || '').toLowerCase().replace(/[0-9]/g, '').trim();
                var amount = Math.abs(txn.amount);

                if (!recurring[key]) {
                    recurring[key] = {
                        count: 0,
                        totalAmount: 0,
                        avgAmount: 0,
                        transactions: []
                    };
                }

                recurring[key].count++;
                recurring[key].totalAmount += amount;
                recurring[key].transactions.push(txn);
            });

            // Filter to only show items that occurred 2+ times with similar amounts
            var filtered = [];
            for (var key in recurring) {
                var item = recurring[key];
                if (item.count >= 2) {
                    item.avgAmount = item.totalAmount / item.count;

                    // Check if amounts are similar (within 10% variance)
                    var amountVariance = item.transactions.reduce(function (sum, txn) {
                        return sum + Math.abs(Math.abs(txn.amount) - item.avgAmount);
                    }, 0) / item.count;

                    if (amountVariance / item.avgAmount < 0.1) {
                        filtered.push({
                            description: key,
                            frequency: item.count,
                            amount: item.avgAmount,
                            totalPaid: item.totalAmount
                        });
                    }
                }
            }

            return filtered.sort(function (a, b) { return b.amount - a.amount; });
        }

        /**
         * Generate spending insights and recommendations
         */
        generateInsights() {
            var categories = this.categorizeTransactions();
            var incomeExpense = this.calculateIncomeExpenseRatio();
            var recurring = this.detectRecurringPayments();

            var insights = [];

            // Savings rate insight
            if (incomeExpense.savingsRate < 20) {
                insights.push({
                    type: 'warning',
                    category: 'Savings',
                    message: 'Your savings rate is ' + incomeExpense.savingsRate + '%. Aim for at least 20% of income.',
                    action: 'Review your spending categories to find areas to reduce.'
                });
            } else {
                insights.push({
                    type: 'success',
                    category: 'Savings',
                    message: 'Great job! You are saving ' + incomeExpense.savingsRate + '% of your income.',
                    action: 'Consider investing surplus in mutual funds or fixed deposits.'
                });
            }

            // Highest spending category
            var highestCat = null;
            var highestAmount = 0;
            for (var catName in categories) {
                if (categories[catName].total > highestAmount) {
                    highestAmount = categories[catName].total;
                    highestCat = catName;
                }
            }

            if (highestCat && highestCat !== 'emi' && highestCat !== 'investment') {
                insights.push({
                    type: 'info',
                    category: 'Spending',
                    message: 'Your highest expense is ' + highestCat + ' (₹' + highestAmount.toFixed(0) + ').',
                    action: 'Track ' + highestCat + ' expenses closely to optimize spending.'
                });
            }

            // Recurring payments
            if (recurring.length > 0) {
                var totalRecurring = recurring.reduce(function (sum, r) { return sum + r.amount; }, 0);
                insights.push({
                    type: 'info',
                    category: 'Recurring Payments',
                    message: 'You have ' + recurring.length + ' recurring payments totaling ₹' + totalRecurring.toFixed(0) + '/month.',
                    action: 'Review subscriptions and EMIs to cancel unused services.'
                });
            }

            return {
                categories: categories,
                incomeExpense: incomeExpense,
                recurring: recurring,
                insights: insights
            };
        }
    }

    module.exports = SpendingAnalyzer;

})();
