// file: grading-engine-enhanced.js
(function () {
    var CIBILConstants = require('./cibil-constants.js');

    function GradingEngine(cibilData) {
        this.cibilData = cibilData;
        var cr = cibilData.credit_report;
        this.creditReport = (Array.isArray(cr) && cr[0]) ? cr[0] : (cr || {});
        this.userInfo = {
            name: cibilData.name,
            mobile: cibilData.mobile,
            email: cibilData.email,
            pan: cibilData.pan
        };
    }

    // Enhanced payment history parsing with CIBIL codes
    GradingEngine.prototype.parsePaymentHistory = function (account) {
        var paymentHistoryStr = account.paymentHistory || '';
        var monthlyPayStatus = account.monthlyPayStatus || [];
        var payments = [];
        var categories = {
            onTime: 0,
            delayed: 0,
            missed: 0,
            notReported: 0
        };

        // Use monthlyPayStatus if available
        if (Array.isArray(monthlyPayStatus) && monthlyPayStatus.length > 0) {
            monthlyPayStatus.forEach(function (payment, index) {
                var status = payment.status || '';
                var category = this.categorizePaymentStatus(status);
                categories[category]++;

                payments.push({
                    date: payment.date || '',
                    status: status,
                    category: category,
                    description: CIBILConstants.PAYMENT_HISTORY_CODES[status] || 'Unknown',
                    period: index + 1
                });
            }, this);
        }
        // Parse paymentHistory string
        else if (paymentHistoryStr && paymentHistoryStr.length > 0) {
            for (var i = 0; i < Math.min(36, paymentHistoryStr.length); i++) {
                var statusCode = paymentHistoryStr.charAt(i);
                var category = this.categorizePaymentStatus(statusCode);
                categories[category]++;

                var date = new Date();
                date.setMonth(date.getMonth() - (paymentHistoryStr.length - i - 1));

                payments.push({
                    date: date.toISOString().split('T')[0],
                    status: statusCode,
                    category: category,
                    description: CIBILConstants.PAYMENT_HISTORY_CODES[statusCode] || 'Unknown',
                    period: i + 1
                });
            }
        }

        var total = payments.length;
        return {
            payments: payments,
            categories: categories,
            total: total,
            onTimePercentage: total > 0 ? (categories.onTime / total) * 100 : 0,
            missedPercentage: total > 0 ? (categories.missed / total) * 100 : 0,
            delayedPercentage: total > 0 ? (categories.delayed / total) * 100 : 0,
            score: this.calculatePaymentHistoryScore(categories, total)
        };
    };

    // Calculate numeric score from payment history categories
    // When called with no args, uses getOverallPaymentAnalysis()
    GradingEngine.prototype.calculatePaymentHistoryScore = function (categories, total) {
        if (arguments.length === 0) {
            var analysis = this.getOverallPaymentAnalysis ? this.getOverallPaymentAnalysis() : {};
            categories = { onTime: analysis.onTime || 0, delayed: analysis.delayed || 0, missed: analysis.missed || 0 };
            total = analysis.total || 0;
        }
        if (!categories || total === 0) return 70; // default when no data

        var score = 100; // Start with perfect score

        // Deduct points for delays and misses
        var missedRatio = (categories.missed || 0) / total;
        var delayedRatio = (categories.delayed || 0) / total;

        score -= (missedRatio * 60); // Heavy penalty for missed payments
        score -= (delayedRatio * 30); // Moderate penalty for delays

        return Math.max(0, Math.min(100, score));
    };

    // Categorize using CIBIL constants
    GradingEngine.prototype.categorizePaymentStatus = function (status) {
        if (!status) return 'notReported';

        status = String(status).toUpperCase();

        // On-time payments
        if (['0', '00', '000', 'C', 'CUR'].includes(status)) {
            return 'onTime';
        }

        // Delayed payments (1-60 days)
        if (['1', '01', '001', '2', '02', '002'].includes(status)) {
            return 'delayed';
        }

        // Missed payments (60+ days)
        if (['3', '03', '003', '4', '04', '004', '5', '05', '005',
            '8', '9', 'D', 'W'].includes(status)) {
            return 'missed';
        }

        return 'notReported';
    };

    // Calculate overall grade with CIBIL weightings
    GradingEngine.prototype.calculateOverallGrade = function () {
        try {
            var scores = {
                paymentHistory: this.calculatePaymentHistoryComponent(),
                creditUtilization: this.calculateUtilizationComponent(),
                creditAge: this.calculateCreditAgeComponent(),
                creditMix: this.calculateCreditMixComponent(),
                recentBehaviour: this.calculateRecentBehaviourComponent()
            };

            // CIBIL weightings for Indian market
            var totalScore = (
                scores.paymentHistory * 0.35 +    // 35% Payment History
                scores.creditUtilization * 0.30 + // 30% Credit Utilization
                scores.creditAge * 0.15 +         // 15% Credit History Length
                scores.creditMix * 0.10 +         // 10% Credit Mix
                scores.recentBehaviour * 0.10     // 10% Recent Credit Behavior
            );

            // Convert to letter grade
            return this.convertScoreToGrade(totalScore);

        } catch (error) {
            console.error('Error calculating overall grade:', error);
            return 'C';
        }
    };

    // Convert score to grade
    GradingEngine.prototype.convertScoreToGrade = function (score) {
        var grades = CIBILConstants.SCORE_RANGES;

        if (score >= 800) return 'A+';
        if (score >= 750) return 'A';
        if (score >= 700) return 'B+';
        if (score >= 650) return 'B';
        if (score >= 600) return 'C+';
        if (score >= 550) return 'C';
        if (score >= 500) return 'D+';
        if (score >= 450) return 'D';
        return 'F';
    };

    // Payment history component
    GradingEngine.prototype.calculatePaymentHistoryComponent = function () {
        var accounts = this.creditReport.accounts || [];
        if (accounts.length === 0) return 650; // Neutral score

        var totalScore = 0;
        var totalWeight = 0;

        accounts.forEach(function (account) {
            var paymentAnalysis = this.parsePaymentHistory(account);
            var accountAge = this.getAccountAge(account);
            var weight = Math.min(accountAge / 12, 1); // More weight to older accounts

            // Calculate score based on payment performance
            var baseScore = 750; // Start with good score

            // Deductions for missed payments
            if (paymentAnalysis.missedPercentage > 0) {
                baseScore -= paymentAnalysis.missedPercentage * 20;
            }

            // Deductions for delayed payments
            if (paymentAnalysis.delayedPercentage > 0) {
                baseScore -= paymentAnalysis.delayedPercentage * 10;
            }

            // Bonus for perfect payment history
            if (paymentAnalysis.missedPercentage === 0 &&
                paymentAnalysis.delayedPercentage === 0) {
                baseScore += 50;
            }

            totalScore += baseScore * weight;
            totalWeight += weight;
        }, this);

        return totalWeight > 0 ? totalScore / totalWeight : 650;
    };

    // Credit utilization component
    GradingEngine.prototype.calculateUtilizationComponent = function () {
        var accounts = this.creditReport.accounts || [];
        var totalLimit = 0;
        var totalBalance = 0;

        accounts.forEach(function (account) {
            totalLimit += account.highCreditAmount || 0;
            totalBalance += account.currentBalance || 0;
        });

        if (totalLimit === 0) return 700; // No utilization

        var utilization = (totalBalance / totalLimit) * 100;

        // Score based on utilization bands
        if (utilization <= 10) return 850;
        if (utilization <= 20) return 800;
        if (utilization <= 30) return 750;
        if (utilization <= 40) return 700;
        if (utilization <= 50) return 650;
        if (utilization <= 60) return 600;
        if (utilization <= 70) return 550;
        if (utilization <= 80) return 500;
        if (utilization <= 90) return 450;
        return 400; // >90% utilization
    };

    // Get account age in months
    GradingEngine.prototype.getAccountAge = function (account) {
        if (!account.dateOpened) return 0;

        try {
            var openedDate = this.parseDate(account.dateOpened);
            if (!openedDate) return 0;

            var months = (new Date() - openedDate) / (1000 * 60 * 60 * 24 * 30);
            return Math.floor(months);
        } catch (error) {
            return 0;
        }
    };

    // Parse date from various formats
    GradingEngine.prototype.parseDate = function (dateStr) {
        if (!dateStr) return null;

        try {
            // Try YYYYMMDD format
            if (/^\d{8}$/.test(dateStr)) {
                var year = parseInt(dateStr.substring(0, 4));
                var month = parseInt(dateStr.substring(4, 6)) - 1;
                var day = parseInt(dateStr.substring(6, 8));
                return new Date(year, month, day);
            }

            // Try YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return new Date(dateStr);
            }

            // Try DD/MM/YYYY format
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
                var parts = dateStr.split('/');
                return new Date(parts[2], parts[1] - 1, parts[0]);
            }

            return new Date(dateStr);
        } catch (error) {
            return null;
        }
    };

    // Credit age component
    GradingEngine.prototype.calculateCreditAgeComponent = function () {
        var accounts = this.creditReport.accounts || [];
        if (accounts.length === 0) return 600; // Neutral score

        var totalAge = 0;
        var count = 0;

        accounts.forEach(function (account) {
            var age = this.getAccountAge(account);
            if (age > 0) {
                totalAge += age;
                count++;
            }
        }, this);

        if (count === 0) return 600;

        var avgAge = totalAge / count; // Average age in months

        // Score based on average credit age
        if (avgAge >= 60) return 850; // 5+ years
        if (avgAge >= 48) return 800; // 4+ years
        if (avgAge >= 36) return 750; // 3+ years
        if (avgAge >= 24) return 700; // 2+ years
        if (avgAge >= 12) return 650; // 1+ year
        if (avgAge >= 6) return 600;  // 6+ months
        return 550; // Less than 6 months
    };

    // Credit mix component
    GradingEngine.prototype.calculateCreditMixComponent = function () {
        var accounts = this.creditReport.accounts || [];
        if (accounts.length === 0) return 600;

        var types = {};
        accounts.forEach(function (account) {
            var type = account.accountType || account.type || 'Unknown';
            types[type] = (types[type] || 0) + 1;
        });

        var typeCount = Object.keys(types).length;

        // Score based on diversity of credit types
        if (typeCount >= 4) return 800; // Excellent mix
        if (typeCount >= 3) return 750; // Good mix
        if (typeCount >= 2) return 700; // Adequate mix
        return 650; // Limited mix
    };

    // Recent behaviour component
    GradingEngine.prototype.calculateRecentBehaviourComponent = function () {
        var accounts = this.creditReport.accounts || [];
        var enquiries = this.creditReport.enquiries || [];

        if (accounts.length === 0) return 700;

        // Check recent enquiries (last 6 months)
        var recentEnquiries = enquiries.filter(function (eq) {
            var date = this.parseDate(eq.dateOfEnquiry || eq.enquiryDate);
            if (!date) return false;
            var monthsAgo = (new Date() - date) / (1000 * 60 * 60 * 24 * 30);
            return monthsAgo <= 6;
        }, this);

        // Check recent payment behavior
        var recentPayments = 0;
        var recentMissed = 0;

        accounts.forEach(function (account) {
            var paymentHistory = this.parsePaymentHistory(account);
            // Check last 6 months
            var recent = paymentHistory.payments.slice(-6);
            recent.forEach(function (payment) {
                recentPayments++;
                if (payment.category === 'missed') recentMissed++;
            });
        }, this);

        var score = 700; // Base score

        // Penalty for too many recent enquiries
        if (recentEnquiries.length > 5) score -= 50;
        else if (recentEnquiries.length > 3) score -= 30;

        // Penalty for recent missed payments
        if (recentPayments > 0) {
            var missedRate = (recentMissed / recentPayments) * 100;
            if (missedRate > 20) score -= 100;
            else if (missedRate > 10) score -= 50;
        }

        return Math.max(400, Math.min(850, score));
    };

    // Identify default accounts
    GradingEngine.prototype.identifyDefaulters = function () {
        var accounts = this.creditReport.accounts || [];
        var defaulters = [];

        accounts.forEach(function (account) {
            var paymentHistory = this.parsePaymentHistory(account);
            var overdue = account.amountOverdue || 0;
            var status = account.accountStatus || account.status || '';

            // Check if account is in default
            if (overdue > 0 ||
                status.toUpperCase().includes('DEFAULT') ||
                status.toUpperCase().includes('WRITTEN') ||
                status.toUpperCase().includes('SETTLED') ||
                paymentHistory.missedPercentage > 30) {
                defaulters.push({
                    accountNumber: account.accountNumber || account.maskedAccountNumber || 'N/A',
                    bank: account.bankName || account.bank || 'Unknown',
                    type: account.accountType || account.type || 'Unknown',
                    overdue: overdue,
                    status: status,
                    missedPayments: paymentHistory.missedPercentage
                });
            }
        }, this);

        return defaulters;
    };

    // Generate recommendations
    GradingEngine.prototype.generateRecommendations = function () {
        var recommendations = [];
        var accounts = this.creditReport.accounts || [];
        var utilization = this.calculateUtilizationComponent();
        var paymentHistory = this.calculatePaymentHistoryComponent();
        var defaulters = this.identifyDefaulters();

        // Check utilization
        var accountsData = this.creditReport.accounts || [];
        var totalLimit = 0;
        var totalBalance = 0;
        accountsData.forEach(function (acc) {
            totalLimit += acc.highCreditAmount || 0;
            totalBalance += acc.currentBalance || 0;
        });
        var utilPercent = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

        if (utilPercent > 30) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Credit Utilization',
                action: 'Reduce credit card balances to below 30% of limit',
                impact: 'Can improve score by 20-40 points',
                timeline: '3-6 months'
            });
        }

        // Check defaulters
        if (defaulters.length > 0) {
            recommendations.push({
                priority: 'CRITICAL',
                category: 'Default Accounts',
                action: 'Clear overdue amounts on default accounts immediately',
                impact: 'Can improve score by 50-100 points',
                timeline: 'Immediate'
            });
        }

        // Check payment history
        if (paymentHistory < 700) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Payment History',
                action: 'Ensure all payments are made on time going forward',
                impact: 'Can improve score by 30-50 points over 6 months',
                timeline: '6 months'
            });
        }

        return recommendations;
    };

    // Get credit utilization percentage
    GradingEngine.prototype.getCreditUtilization = function () {
        var accounts = this.creditReport.accounts || [];
        var totalLimit = 0;
        var totalBalance = 0;

        accounts.forEach(function (account) {
            totalLimit += account.highCreditAmount || 0;
            totalBalance += account.currentBalance || 0;
        });

        if (totalLimit === 0) return 0;
        return Math.round((totalBalance / totalLimit) * 100);
    };

    // Get overall payment analysis
    GradingEngine.prototype.getOverallPaymentAnalysis = function () {
        var accounts = this.creditReport.accounts || [];
        var totalOnTime = 0;
        var totalDelayed = 0;
        var totalMissed = 0;
        var totalPayments = 0;

        accounts.forEach(function (account) {
            var paymentHistory = this.parsePaymentHistory(account);
            totalOnTime += paymentHistory.categories.onTime || 0;
            totalDelayed += paymentHistory.categories.delayed || 0;
            totalMissed += paymentHistory.categories.missed || 0;
            totalPayments += paymentHistory.total || 0;
        }, this);

        return {
            onTime: totalOnTime,
            delayed: totalDelayed,
            missed: totalMissed,
            total: totalPayments,
            onTimePercentage: totalPayments > 0 ? (totalOnTime / totalPayments) * 100 : 0
        };
    };

    // Get credit age in months
    GradingEngine.prototype.getCreditAge = function () {
        var accounts = this.creditReport.accounts || [];
        if (accounts.length === 0) return 0;

        var oldestDate = null;
        accounts.forEach(function (account) {
            var date = this.parseDate(account.dateOpened);
            if (date && (!oldestDate || date < oldestDate)) {
                oldestDate = date;
            }
        }, this);

        if (!oldestDate) return 0;

        var months = (new Date() - oldestDate) / (1000 * 60 * 60 * 24 * 30);
        return Math.floor(months);
    };

    // Get component scores
    GradingEngine.prototype.getComponentScores = function () {
        return {
            paymentHistory: this.calculatePaymentHistoryComponent(),
            creditUtilization: this.calculateUtilizationComponent(),
            creditAge: this.calculateCreditAgeComponent(),
            creditMix: this.calculateCreditMixComponent(),
            recentBehaviour: this.calculateRecentBehaviourComponent()
        };
    };

    // Get all grades
    GradingEngine.prototype.getAllGrades = function () {
        var scores = this.getComponentScores();
        return {
            overall: this.calculateOverallGrade(),
            paymentHistory: this.convertScoreToGrade(scores.paymentHistory),
            creditUtilization: this.convertScoreToGrade(scores.creditUtilization),
            creditAge: this.convertScoreToGrade(scores.creditAge),
            creditMix: this.convertScoreToGrade(scores.creditMix),
            recentBehaviour: this.convertScoreToGrade(scores.recentBehaviour)
        };
    };

    /**
     * Get score range description
     */
    GradingEngine.prototype.getScoreRange = function () {
        try {
            var score = this.calculateOverallScore ? this.calculateOverallScore() :
                (this.cibilData.credit_score ? parseInt(this.cibilData.credit_score) : 0);

            if (score >= 800) return { min: 800, max: 900, label: 'Excellent' };
            if (score >= 750) return { min: 750, max: 799, label: 'Very Good' };
            if (score >= 700) return { min: 700, max: 749, label: 'Good' };
            if (score >= 650) return { min: 650, max: 699, label: 'Fair' };
            if (score >= 600) return { min: 600, max: 649, label: 'Poor' };
            return { min: 300, max: 599, label: 'Very Poor' };
        } catch (error) {
            console.error('Error getting score range:', error);
            return { min: 300, max: 900, label: 'Unknown' };
        }
    };

    // Convert grade letter to numeric score
    GradingEngine.prototype.gradeToScore = function (grade) {
        var gradeMap = {
            'A+': 850,
            'A': 800,
            'B+': 750,
            'B': 700,
            'C+': 650,
            'C': 600,
            'D+': 550,
            'D': 500,
            'F': 400
        };
        return gradeMap[grade] || 650;
    };

    // Export the module
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GradingEngine;
    }
})();