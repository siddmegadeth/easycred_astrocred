(function() {
    function GradingEngine(cibilData) {
        this.data = cibilData;
        this.creditReport = cibilData.credit_report[0];
    }
    // Enhanced payment history parsing for CIBIL data
    GradingEngine.prototype.parsePaymentHistory = function(account) {
        var paymentHistoryStr = account.paymentHistory || '';
        var monthlyPayStatus = account.monthlyPayStatus || [];
        var payments = [];
        var onTime = 0,
            delayed = 0,
            missed = 0,
            notReported = 0;

        // Priority 1: Use monthlyPayStatus array if available and valid
        if (monthlyPayStatus.length > 0) {
            monthlyPayStatus.forEach(function(payment, index) {
                var status = payment.status;
                var statusCategory = this.categorizePaymentStatus(status);

                if (statusCategory === 'Paid') onTime++;
                else if (statusCategory === 'Delayed') delayed++;
                else if (statusCategory === 'Missed') missed++;
                else if (statusCategory === 'Not Reported') notReported++;

                payments.push({
                    date: payment.date,
                    status: status,
                    category: statusCategory,
                    period: index + 1
                });
            }, this);
        }
        // Priority 2: Parse paymentHistory string if monthlyPayStatus is not available
        else if (paymentHistoryStr && paymentHistoryStr.length > 0) {
            // CIBIL payment history typically uses 3-character codes for each month
            var months = Math.min(36, Math.floor(paymentHistoryStr.length / 3));

            for (var i = 0; i < months; i++) {
                var statusCode = paymentHistoryStr.substring(i * 3, (i * 3) + 3);
                var statusCategory = this.categorizePaymentStatus(statusCode);

                if (statusCategory === 'Paid') onTime++;
                else if (statusCategory === 'Delayed') delayed++;
                else if (statusCategory === 'Missed') missed++;
                else if (statusCategory === 'Not Reported') notReported++;

                var date = new Date();
                date.setMonth(date.getMonth() - (months - i - 1));

                payments.push({
                    date: date.toISOString().split('T')[0],
                    status: statusCode,
                    category: statusCategory,
                    period: i + 1
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



    // Categorize payment status based on CIBIL standards
    GradingEngine.prototype.categorizePaymentStatus = function(status) {
        if (!status) return 'Not Reported';

        // Convert to string and normalize
        var statusStr = String(status).toUpperCase().trim();

        // Handle numeric status codes
        if (!isNaN(statusStr)) {
            var statusNum = parseInt(statusStr);

            if (statusNum === 0) return 'Paid';
            if (statusNum >= 1 && statusNum <= 30) return 'Delayed';
            if (statusNum >= 31 && statusNum <= 60) return 'Delayed';
            if (statusNum >= 61 && statusNum <= 90) return 'Missed';
            if (statusNum >= 91 && statusNum <= 120) return 'Missed';
            if (statusNum >= 121 && statusNum <= 150) return 'Missed';
            if (statusNum >= 151 && statusNum <= 180) return 'Missed';
            if (statusNum > 180) return 'Missed';
        }

        // Handle text status codes
        switch (statusStr) {
            case 'STD': // Standard
            case '000':
            case '0':
                return 'Paid';

            case 'SMA': // Special Mention Account
            case '01':
            case '02':
            case '03':
            case '04':
            case '05':
            case '06':
            case '07':
            case '08':
            case '09':
            case '10':
            case '11':
            case '12':
                return 'Delayed';

            case 'SUB': // Substandard
            case 'DBT': // Doubtful
            case 'LSS': // Loss
            case 'DEF': // Default
            case 'WO': // Write-off
                return 'Missed';

            case 'XXX': // Not reported
            case 'NA': // Not available
            case '': // Empty
                return 'Not Reported';

            default:
                // Check if it's a numeric string that wasn't caught above
                if (!isNaN(statusStr)) {
                    var num = parseInt(statusStr);
                    if (num === 0) return 'Paid';
                    if (num > 0 && num <= 30) return 'Delayed';
                    if (num > 30) return 'Missed';
                }

                return 'Not Reported';
        }
    };



    // Update the payment history score calculation
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

        // Calculate weighted score giving more importance to recent payments
        var onTimePercentage = (totalOnTime / totalPayments) * 100;

        // Penalize more for missed payments than delayed payments
        var adjustedScore = onTimePercentage - (totalMissed * 2) - (totalDelayed * 0.5);

        if (adjustedScore >= 95) return 100;
        if (adjustedScore >= 90) return 90;
        if (adjustedScore >= 85) return 80;
        if (adjustedScore >= 80) return 70;
        if (adjustedScore >= 75) return 60;
        if (adjustedScore >= 70) return 50;
        if (adjustedScore >= 60) return 40;
        if (adjustedScore >= 50) return 30;
        return 20;
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
                        (account.currentBalance / account.highCreditAmount) * 100 : 0
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



    // Update the account processing to handle different CIBIL data structures
    GradingEngine.prototype.processAccounts = function() {
        var accounts = this.creditReport.accounts || [];
        var processedAccounts = [];

        accounts.forEach(function(account) {
            var paymentAnalysis = this.parsePaymentHistory(account);
            var utilization = 0;

            if (account.highCreditAmount && account.highCreditAmount > 0) {
                utilization = (account.currentBalance / account.highCreditAmount) * 100;
            }

            processedAccounts.push({
                index: account.index,
                accountType: account.accountType,
                memberShortName: account.memberShortName,
                dateOpened: account.dateOpened,
                currentBalance: account.currentBalance,
                highCreditAmount: account.highCreditAmount,
                amountOverdue: account.amountOverdue,
                utilization: utilization,
                paymentAnalysis: paymentAnalysis,
                status: this.determineAccountStatus(account, paymentAnalysis)
            });
        }, this);

        return processedAccounts;
    };



    GradingEngine.prototype.determineAccountStatus = function(account, paymentAnalysis) {
        // Check for overdue amount
        if (account.amountOverdue && account.amountOverdue > 0) {
            return 'Overdue';
        }

        // Check payment history
        if (paymentAnalysis.missed > 0) {
            return 'Default';
        }

        if (paymentAnalysis.delayed > 0) {
            return 'Delayed';
        }

        // Check utilization
        if (account.highCreditAmount && account.highCreditAmount > 0) {
            var utilization = (account.currentBalance / account.highCreditAmount) * 100;
            if (utilization > 90) {
                return 'High Utilization';
            }
        }

        return 'Good Standing';
    };

    module.exports = GradingEngine;

})();