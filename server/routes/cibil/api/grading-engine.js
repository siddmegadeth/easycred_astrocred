(function() {
    function GradingEngine(cibilData) {
        this.data = cibilData;
        this.creditReport = cibilData.credit_report[0];
    }

    // Parse payment history from either string or monthlyPayStatus array
    GradingEngine.prototype.parsePaymentHistory = function(account) {
        var paymentStatusMap = {
            '0': 'Paid',
            '1': 'Partial-30',
            '2': 'Partial-60',
            '3': 'Partial-90',
            '4': 'Partial-120',
            '5': 'Partial-150',
            '6': 'Partial-180',
            '7': 'Default',
            'STD': 'Paid',
            'SUB': 'Substandard',
            'DBT': 'Doubtful',
            'LSS': 'Loss',
            'XXX': 'Not Reported',
            '': 'No Payment Due'
        };

        var payments = [];
        var onTime = 0,
            delayed = 0,
            missed = 0,
            notReported = 0;

        // Prefer monthlyPayStatus array if available
        if (account.monthlyPayStatus && Array.isArray(account.monthlyPayStatus)) {
            account.monthlyPayStatus.forEach(function(payment, index) {
                var status = paymentStatusMap[payment.status] || 'Unknown';

                if (status === 'Paid') onTime++;
                else if (status.startsWith('Partial')) delayed++;
                else if (status === 'Default' || status === 'Substandard' || status === 'Doubtful' || status === 'Loss') missed++;
                else if (status === 'Not Reported') notReported++;

                payments.push({
                    date: payment.date,
                    status: status,
                    rawStatus: payment.status
                });
            });
        }
        // Fall back to paymentHistory string
        else if (account.paymentHistory && typeof account.paymentHistory === 'string') {
            for (var i = 0; i < Math.min(account.paymentHistory.length, 36); i++) {
                var statusCode = account.paymentHistory[i];
                var status = paymentStatusMap[statusCode] || 'Unknown';

                if (status === 'Paid') onTime++;
                else if (status.startsWith('Partial')) delayed++;
                else if (status === 'Default') missed++;
                else if (status === 'Not Reported') notReported++;

                var date = new Date();
                date.setMonth(date.getMonth() - (account.paymentHistory.length - i - 1));

                payments.push({
                    date: date.toISOString().split('T')[0],
                    status: status,
                    rawStatus: statusCode
                });
            }
        }

        return {
            payments: payments,
            onTime: onTime,
            delayed: delayed,
            missed: missed,
            notReported: notReported,
            total: payments.length
        };
    };

    // Calculate overall credit score grade
    GradingEngine.prototype.calculateOverallGrade = function() {
        var paymentHistoryScore = this.calculatePaymentHistoryScore();
        var creditUtilizationScore = this.calculateCreditUtilizationScore();
        var creditAgeScore = this.calculateCreditAgeScore();
        var debtBurdenScore = this.calculateDebtBurdenScore();
        var creditMixScore = this.calculateCreditMixScore();
        var recentInquiriesScore = this.calculateRecentInquiriesScore();

        var totalScore = (
            paymentHistoryScore * 0.35 +
            creditUtilizationScore * 0.30 +
            creditAgeScore * 0.15 +
            debtBurdenScore * 0.10 +
            creditMixScore * 0.05 +
            recentInquiriesScore * 0.05
        );

        return this.convertScoreToGrade(totalScore);
    };

    // Convert numerical score to letter grade
    GradingEngine.prototype.convertScoreToGrade = function(score) {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B+';
        if (score >= 60) return 'B';
        if (score >= 50) return 'C+';
        if (score >= 40) return 'C';
        if (score >= 30) return 'D+';
        return 'D';
    };

    GradingEngine.prototype.calculatePaymentHistoryScore = function() {
        var totalOnTime = 0;
        var totalDelayed = 0;
        var totalMissed = 0;
        var totalPayments = 0;

        var self = this;
        this.creditReport.accounts.forEach(function(account) {
            var paymentAnalysis = self.parsePaymentHistory(account);
            totalOnTime += paymentAnalysis.onTime;
            totalDelayed += paymentAnalysis.delayed;
            totalMissed += paymentAnalysis.missed;
            totalPayments += paymentAnalysis.total;
        });

        if (totalPayments === 0) return 75;

        var onTimePercentage = (totalOnTime / totalPayments) * 100;

        if (onTimePercentage >= 95) return 100;
        if (onTimePercentage >= 90) return 90;
        if (onTimePercentage >= 85) return 80;
        if (onTimePercentage >= 80) return 70;
        if (onTimePercentage >= 75) return 60;
        if (onTimePercentage >= 70) return 50;
        return 30;
    };

    GradingEngine.prototype.calculateCreditUtilizationScore = function() {
        var totalBalance = 0;
        var totalLimit = 0;

        this.creditReport.accounts.forEach(function(account) {
            if (account.currentBalance !== undefined && account.currentBalance !== null) {
                totalBalance += account.currentBalance;
            }
            if (account.highCreditAmount !== undefined && account.highCreditAmount !== null) {
                totalLimit += account.highCreditAmount;
            }
        });

        if (totalLimit === 0) return 50;

        var utilization = (totalBalance / totalLimit) * 100;

        if (utilization <= 10) return 100;
        if (utilization <= 30) return 90;
        if (utilization <= 50) return 70;
        if (utilization <= 75) return 50;
        return 30;
    };

    GradingEngine.prototype.calculateCreditAgeScore = function() {
        var oldestDate = new Date();
        var self = this;
        var hasValidDate = false;

        this.creditReport.accounts.forEach(function(account) {
            if (account.dateOpened && account.dateOpened !== 'NA' && account.dateOpened !== '11111111') {
                var accountDate = self.parseDate(account.dateOpened);
                if (accountDate && accountDate < oldestDate) {
                    oldestDate = accountDate;
                    hasValidDate = true;
                }
            }
        });

        if (!hasValidDate) return 50;

        var creditAgeMonths = Math.floor((new Date() - oldestDate) / (1000 * 60 * 60 * 24 * 30));

        if (creditAgeMonths >= 84) return 100;
        if (creditAgeMonths >= 60) return 90;
        if (creditAgeMonths >= 36) return 80;
        if (creditAgeMonths >= 24) return 70;
        if (creditAgeMonths >= 12) return 60;
        return 50;
    };

    GradingEngine.prototype.calculateDebtBurdenScore = function() {
        var totalDebt = 0;

        this.creditReport.accounts.forEach(function(account) {
            if (account.currentBalance !== undefined && account.currentBalance !== null) {
                totalDebt += account.currentBalance;
            }
        });

        var totalAssets = 0;
        this.creditReport.accounts.forEach(function(account) {
            if (account.highCreditAmount !== undefined && account.highCreditAmount !== null) {
                totalAssets += account.highCreditAmount;
            }
        });

        if (totalAssets === 0) return 50;

        var debtToAssetRatio = (totalDebt / totalAssets) * 100;

        if (debtToAssetRatio <= 20) return 100;
        if (debtToAssetRatio <= 35) return 80;
        if (debtToAssetRatio <= 50) return 60;
        if (debtToAssetRatio <= 65) return 40;
        return 20;
    };

    GradingEngine.prototype.calculateCreditMixScore = function() {
        var accountTypes = new Set();

        this.creditReport.accounts.forEach(function(account) {
            if (account.accountType) {
                accountTypes.add(account.accountType);
            }
        });

        if (accountTypes.size >= 4) return 100;
        if (accountTypes.size === 3) return 80;
        if (accountTypes.size === 2) return 60;
        return 40;
    };

    GradingEngine.prototype.calculateRecentInquiriesScore = function() {
        var sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        var self = this;

        var recentInquiries = this.creditReport.enquiries.filter(function(inquiry) {
            return inquiry.enquiryDate && self.parseDate(inquiry.enquiryDate) > sixMonthsAgo;
        }).length;

        if (recentInquiries === 0) return 100;
        if (recentInquiries <= 2) return 80;
        if (recentInquiries <= 4) return 60;
        return 40;
    };

    // Helper function to parse dates in YYYY-MM-DD or DDMMYYYY format
    GradingEngine.prototype.parseDate = function(dateStr) {
        if (!dateStr || dateStr === '11111111' || dateStr === 'NA') return new Date();

        try {
            // Try YYYY-MM-DD format first
            if (dateStr.length === 10 && dateStr[4] === '-') {
                return new Date(dateStr);
            }

            // Try DDMMYYYY format
            if (dateStr.length === 8) {
                var day = parseInt(dateStr.substring(0, 2));
                var month = parseInt(dateStr.substring(2, 4)) - 1;
                var year = parseInt(dateStr.substring(4, 8));
                return new Date(year, month, day);
            }

            return new Date(dateStr);
        } catch (e) {
            return new Date();
        }
    };

    // Identify potential defaulters
    GradingEngine.prototype.identifyDefaulters = function() {
        var self = this;
        return this.creditReport.accounts
            .filter(function(account) {
                var paymentAnalysis = self.parsePaymentHistory(account);
                var missedPayments = paymentAnalysis.missed;

                var overduePercentage = account.currentBalance && account.highCreditAmount ?
                    (account.currentBalance / account.highCreditAmount) * 100 :
                    0;

                return missedPayments >= 3 || overduePercentage > 25;
            })
            .map(function(account) {
                return {
                    accountType: account.accountType,
                    lender: account.memberShortName,
                    currentBalance: account.currentBalance,
                    creditLimit: account.highCreditAmount,
                    overdueAmount: account.amountOverdue,
                    overduePercentage: account.highCreditAmount ?
                        (account.currentBalance / account.highCreditAmount) * 100 :
                        0
                };
            });
    };

    // Generate improvement recommendations
    GradingEngine.prototype.generateRecommendations = function() {
        var recommendations = [];
        var grade = this.calculateOverallGrade();

        var paymentAnalysis = this.getOverallPaymentAnalysis();
        if (paymentAnalysis.missedRate > 0.1) {
            recommendations.push({
                priority: 'High',
                message: 'You have missed ' + paymentAnalysis.missed + ' payments. Focus on making all payments on time.',
                area: 'Payment History'
            });
        }

        var utilization = this.getCreditUtilization();
        if (utilization > 50) {
            recommendations.push({
                priority: 'High',
                message: 'Your credit utilization is ' + utilization.toFixed(1) + '%. Try to keep it below 30%.',
                area: 'Credit Utilization'
            });
        }

        var creditAge = this.getCreditAge();
        if (creditAge < 24) {
            recommendations.push({
                priority: 'Medium',
                message: 'Your credit history is relatively short. Maintain your accounts to build a longer history.',
                area: 'Credit Age'
            });
        }

        var accountTypes = new Set();
        this.creditReport.accounts.forEach(function(account) {
            accountTypes.add(account.accountType);
        });

        if (accountTypes.size < 2) {
            recommendations.push({
                priority: 'Low',
                message: 'Consider diversifying your credit types for a better score.',
                area: 'Credit Mix'
            });
        }

        var self = this;
        var recentInquiries = this.creditReport.enquiries.filter(function(inquiry) {
            return self.parseDate(inquiry.enquiryDate) > new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
        }).length;

        if (recentInquiries > 4) {
            recommendations.push({
                priority: 'Medium',
                message: 'You have ' + recentInquiries + ' credit inquiries in the last 6 months. Too many inquiries can lower your score.',
                area: 'Recent Inquiries'
            });
        }

        return recommendations.sort(function(a, b) {
            var priorityOrder = { High: 1, Medium: 2, Low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    };

    // Helper methods for recommendations
    GradingEngine.prototype.getOverallPaymentAnalysis = function() {
        var onTime = 0,
            delayed = 0,
            missed = 0,
            total = 0;
        var self = this;

        this.creditReport.accounts.forEach(function(account) {
            var analysis = self.parsePaymentHistory(account);
            onTime += analysis.onTime;
            delayed += analysis.delayed;
            missed += analysis.missed;
            total += analysis.total;
        });

        return {
            onTime: onTime,
            delayed: delayed,
            missed: missed,
            total: total,
            onTimeRate: total > 0 ? onTime / total : 0,
            missedRate: total > 0 ? missed / total : 0
        };
    };

    GradingEngine.prototype.getCreditUtilization = function() {
        var totalBalance = 0;
        var totalLimit = 0;

        this.creditReport.accounts.forEach(function(account) {
            if (account.currentBalance !== undefined && account.currentBalance !== null) {
                totalBalance += account.currentBalance;
            }
            if (account.highCreditAmount !== undefined && account.highCreditAmount !== null) {
                totalLimit += account.highCreditAmount;
            }
        });

        return totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
    };

    GradingEngine.prototype.getCreditAge = function() {
        var oldestDate = new Date();
        var self = this;
        var hasValidDate = false;

        this.creditReport.accounts.forEach(function(account) {
            if (account.dateOpened && account.dateOpened !== 'NA' && account.dateOpened !== '11111111') {
                var accountDate = self.parseDate(account.dateOpened);
                if (accountDate < oldestDate) {
                    oldestDate = accountDate;
                    hasValidDate = true;
                }
            }
        });

        if (!hasValidDate) return 0;

        return Math.floor((new Date() - oldestDate) / (1000 * 60 * 60 * 24 * 30));
    };

    module.exports = GradingEngine;

})();