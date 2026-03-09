// EXPERION Grading Engine
// Reuses CIBIL grading logic, adapted for EXPERION data format
(function() {
    var CIBILConstants = require('../../cibil/api/cibil-constants.js');

    function ExperionGradingEngine(experionData) {
        this.experionData = experionData;
        this.creditReport = experionData.credit_report || {};
        this.userInfo = {
            name: experionData.name,
            mobile: experionData.mobile,
            email: experionData.email,
            pan: experionData.pan
        };
        this.bureau = 'EXPERION';
    }

    // Parse payment history (EXPERION format - similar to CIBIL)
    ExperionGradingEngine.prototype.parsePaymentHistory = function(account) {
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
            monthlyPayStatus.forEach(function(payment, index) {
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

    // Categorize payment status (same as CIBIL)
    ExperionGradingEngine.prototype.categorizePaymentStatus = function(status) {
        if (!status) return 'notReported';
        
        status = String(status).toUpperCase();
        
        if (['0', '00', '000', 'C', 'CUR'].includes(status)) {
            return 'onTime';
        }
        
        if (['1', '01', '001', '2', '02', '002'].includes(status)) {
            return 'delayed';
        }
        
        if (['3', '03', '003', '4', '04', '004', '5', '05', '005', 
             '8', '9', 'D', 'W'].includes(status)) {
            return 'missed';
        }
        
        return 'notReported';
    };

    // Calculate overall grade (EXPERION uses same scoring as CIBIL)
    ExperionGradingEngine.prototype.calculateOverallGrade = function() {
        try {
            var scores = {
                paymentHistory: this.calculatePaymentHistoryComponent(),
                creditUtilization: this.calculateUtilizationComponent(),
                creditAge: this.calculateCreditAgeComponent(),
                creditMix: this.calculateCreditMixComponent(),
                recentBehaviour: this.calculateRecentBehaviourComponent()
            };

            // EXPERION weightings (same as CIBIL for consistency)
            var totalScore = (
                scores.paymentHistory * 0.35 +
                scores.creditUtilization * 0.30 +
                scores.creditAge * 0.15 +
                scores.creditMix * 0.10 +
                scores.recentBehaviour * 0.10
            );

            return this.convertScoreToGrade(totalScore);

        } catch (error) {
            console.error('Error calculating EXPERION overall grade:', error);
            return 'C';
        }
    };

    // Convert score to grade (same as CIBIL)
    ExperionGradingEngine.prototype.convertScoreToGrade = function(score) {
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
    ExperionGradingEngine.prototype.calculatePaymentHistoryComponent = function() {
        var accounts = this.creditReport.accounts || [];
        if (accounts.length === 0) return 650;
        
        var totalScore = 0;
        var totalWeight = 0;
        
        accounts.forEach(function(account) {
            var paymentAnalysis = this.parsePaymentHistory(account);
            var accountAge = this.getAccountAge(account);
            var weight = Math.min(accountAge / 12, 1);
            
            var baseScore = 750;
            
            if (paymentAnalysis.missedPercentage > 0) {
                baseScore -= paymentAnalysis.missedPercentage * 20;
            }
            
            if (paymentAnalysis.delayedPercentage > 0) {
                baseScore -= paymentAnalysis.delayedPercentage * 10;
            }
            
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
    ExperionGradingEngine.prototype.calculateUtilizationComponent = function() {
        var accounts = this.creditReport.accounts || [];
        var totalLimit = 0;
        var totalBalance = 0;
        
        accounts.forEach(function(account) {
            totalLimit += account.highCreditAmount || 0;
            totalBalance += account.currentBalance || 0;
        });
        
        if (totalLimit === 0) return 700;
        
        var utilization = (totalBalance / totalLimit) * 100;
        
        if (utilization <= 10) return 850;
        if (utilization <= 30) return 800;
        if (utilization <= 50) return 700;
        if (utilization <= 70) return 600;
        if (utilization <= 90) return 500;
        return 400;
    };

    // Credit age component
    ExperionGradingEngine.prototype.calculateCreditAgeComponent = function() {
        var accounts = this.creditReport.accounts || [];
        if (accounts.length === 0) return 600;
        
        var oldestDate = null;
        accounts.forEach(function(account) {
            if (account.dateOpened) {
                var date = new Date(account.dateOpened);
                if (!oldestDate || date < oldestDate) {
                    oldestDate = date;
                }
            }
        });
        
        if (!oldestDate) return 600;
        
        var ageMonths = (Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        
        if (ageMonths >= 84) return 850;
        if (ageMonths >= 60) return 800;
        if (ageMonths >= 36) return 750;
        if (ageMonths >= 24) return 700;
        if (ageMonths >= 12) return 650;
        if (ageMonths >= 6) return 600;
        return 550;
    };

    // Credit mix component
    ExperionGradingEngine.prototype.calculateCreditMixComponent = function() {
        var accounts = this.creditReport.accounts || [];
        if (accounts.length === 0) return 600;
        
        var accountTypes = new Set();
        var hasSecured = false;
        var hasUnsecured = false;
        var hasRevolving = false;
        var hasInstallment = false;
        
        accounts.forEach(function(account) {
            var type = account.accountType || '';
            accountTypes.add(type);
            
            if (['HL', 'AL', 'GL', 'BL'].includes(type)) {
                hasSecured = true;
                hasInstallment = true;
            } else if (['CC', 'OD'].includes(type)) {
                hasUnsecured = true;
                hasRevolving = true;
            } else if (['PL', 'EL', 'CL', 'TL'].includes(type)) {
                hasUnsecured = true;
                hasInstallment = true;
            }
        });
        
        var score = 600;
        if (hasSecured && hasUnsecured) score += 100;
        if (hasRevolving && hasInstallment) score += 80;
        if (accountTypes.size >= 3) score += 50;
        if (accountTypes.size >= 2) score += 30;
        
        return Math.min(900, score);
    };

    // Recent behaviour component
    ExperionGradingEngine.prototype.calculateRecentBehaviourComponent = function() {
        var accounts = this.creditReport.accounts || [];
        var enquiries = this.creditReport.enquiries || [];
        
        var score = 700;
        
        // Recent enquiries penalty
        var sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        var recentEnquiries = enquiries.filter(function(enquiry) {
            if (!enquiry.enquiryDate) return false;
            var enquiryDate = new Date(enquiry.enquiryDate);
            return enquiryDate > sixMonthsAgo;
        }).length;
        
        if (recentEnquiries > 4) score -= 100;
        else if (recentEnquiries > 2) score -= 50;
        else if (recentEnquiries > 0) score -= 20;
        
        // New accounts impact
        var oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        var newAccounts = accounts.filter(function(account) {
            if (!account.dateOpened) return false;
            var openedDate = new Date(account.dateOpened);
            return openedDate > oneYearAgo;
        }).length;
        
        if (newAccounts > 3) score -= 50;
        else if (newAccounts > 1) score -= 20;
        
        return Math.max(400, Math.min(900, score));
    };

    // Get account age in months
    ExperionGradingEngine.prototype.getAccountAge = function(account) {
        if (!account.dateOpened) return 0;
        try {
            var openedDate = new Date(account.dateOpened);
            var now = new Date();
            return (now.getTime() - openedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        } catch (e) {
            return 0;
        }
    };

    // Calculate payment history score
    ExperionGradingEngine.prototype.calculatePaymentHistoryScore = function(categories, total) {
        if (total === 0) return 650;
        
        var onTimeRatio = categories.onTime / total;
        var missedRatio = categories.missed / total;
        var delayedRatio = categories.delayed / total;
        
        var score = 750;
        score += onTimeRatio * 100;
        score -= missedRatio * 200;
        score -= delayedRatio * 50;
        
        return Math.max(300, Math.min(900, score));
    };

    // Get credit utilization
    ExperionGradingEngine.prototype.getCreditUtilization = function() {
        var accounts = this.creditReport.accounts || [];
        var totalLimit = 0;
        var totalBalance = 0;
        
        accounts.forEach(function(account) {
            totalLimit += account.highCreditAmount || 0;
            totalBalance += account.currentBalance || 0;
        });
        
        if (totalLimit === 0) return 0;
        return (totalBalance / totalLimit) * 100;
    };

    // Get credit age in months
    ExperionGradingEngine.prototype.getCreditAge = function() {
        var accounts = this.creditReport.accounts || [];
        if (accounts.length === 0) return 0;
        
        var oldestDate = null;
        accounts.forEach(function(account) {
            if (account.dateOpened) {
                var date = new Date(account.dateOpened);
                if (!oldestDate || date < oldestDate) {
                    oldestDate = date;
                }
            }
        });
        
        if (!oldestDate) return 0;
        return (Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    };

    // Identify defaulters
    ExperionGradingEngine.prototype.identifyDefaulters = function() {
        var accounts = this.creditReport.accounts || [];
        var defaulters = [];
        
        accounts.forEach(function(account) {
            var status = account.creditFacilityStatus || '';
            var overdue = account.amountOverdue || 0;
            
            if (overdue > 0 || ['004', '005', '008', '009', '010', '011'].includes(status)) {
                defaulters.push({
                    account: account.accountNumber || account.index,
                    bank: account.memberShortName,
                    type: account.accountType,
                    overdue: overdue,
                    status: status,
                    description: CIBILConstants.ACCOUNT_STATUS[status] || 'Default Account'
                });
            }
        });
        
        return defaulters;
    };

    // Generate recommendations
    ExperionGradingEngine.prototype.generateRecommendations = function() {
        var recommendations = [];
        var grade = this.calculateOverallGrade();
        var utilization = this.getCreditUtilization();
        var paymentAnalysis = this.getOverallPaymentAnalysis();
        var defaulters = this.identifyDefaulters();
        
        // High utilization
        if (utilization > 30) {
            recommendations.push({
                priority: 'High',
                title: 'Reduce Credit Utilization',
                description: 'Your credit utilization is ' + Math.round(utilization) + '%. Aim for below 30%.',
                impact: 'Can improve score by 15-30 points',
                action: 'Pay down balances, request credit limit increases'
            });
        }
        
        // Payment history issues
        if (paymentAnalysis.missedPercentage > 0) {
            recommendations.push({
                priority: 'Critical',
                title: 'Clear Missed Payments',
                description: 'You have ' + paymentAnalysis.missedPercentage.toFixed(1) + '% missed payments.',
                impact: 'Can improve score by 20-40 points',
                action: 'Ensure all payments are made on time going forward'
            });
        }
        
        // Defaulters
        if (defaulters.length > 0) {
            recommendations.push({
                priority: 'Critical',
                title: 'Clear Default Accounts',
                description: 'You have ' + defaulters.length + ' default account(s) totaling ₹' + 
                    defaulters.reduce(function(sum, d) { return sum + (d.overdue || 0); }, 0).toLocaleString('en-IN'),
                impact: 'Can improve score by 30-60 points',
                action: 'Contact banks to clear overdue amounts'
            });
        }
        
        // Credit age
        var creditAge = this.getCreditAge();
        if (creditAge < 24) {
            recommendations.push({
                priority: 'Medium',
                title: 'Build Credit History',
                description: 'Your credit history is ' + creditAge.toFixed(1) + ' months old.',
                impact: 'Improves over time',
                action: 'Keep oldest accounts open and active'
            });
        }
        
        return recommendations;
    };

    // Get overall payment analysis
    ExperionGradingEngine.prototype.getOverallPaymentAnalysis = function() {
        var accounts = this.creditReport.accounts || [];
        var totalOnTime = 0;
        var totalDelayed = 0;
        var totalMissed = 0;
        var totalPayments = 0;
        
        accounts.forEach(function(account) {
            var analysis = this.parsePaymentHistory(account);
            totalOnTime += analysis.categories.onTime;
            totalDelayed += analysis.categories.delayed;
            totalMissed += analysis.categories.missed;
            totalPayments += analysis.total;
        }, this);
        
        return {
            onTime: totalOnTime,
            delayed: totalDelayed,
            missed: totalMissed,
            total: totalPayments,
            onTimePercentage: totalPayments > 0 ? (totalOnTime / totalPayments) * 100 : 0,
            delayedPercentage: totalPayments > 0 ? (totalDelayed / totalPayments) * 100 : 0,
            missedPercentage: totalPayments > 0 ? (totalMissed / totalPayments) * 100 : 0,
            onTimeRatio: totalPayments > 0 ? totalOnTime / totalPayments : 0,
            missedRate: totalPayments > 0 ? totalMissed / totalPayments : 0,
            delayedRate: totalPayments > 0 ? totalDelayed / totalPayments : 0
        };
    };

    // Get component scores
    ExperionGradingEngine.prototype.getComponentScores = function() {
        return {
            paymentHistory: this.calculatePaymentHistoryComponent(),
            creditUtilization: this.calculateUtilizationComponent(),
            creditAge: this.calculateCreditAgeComponent(),
            creditMix: this.calculateCreditMixComponent(),
            recentBehaviour: this.calculateRecentBehaviourComponent(),
            overallGrade: this.calculateOverallGrade()
        };
    };

    module.exports = ExperionGradingEngine;
})();
