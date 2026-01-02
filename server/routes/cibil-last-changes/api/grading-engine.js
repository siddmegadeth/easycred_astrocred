// file: grading-engine-enhanced.js
(function() {
    var CIBILConstants = require('./cibil-constants.js');

    function GradingEngine(cibilData) {
        this.cibilData = cibilData;
        this.creditReport = cibilData.credit_report || {};
        this.userInfo = {
            name: cibilData.name,
            mobile: cibilData.mobile,
            email: cibilData.email,
            pan: cibilData.pan
        };
    }

    // Enhanced payment history parsing with CIBIL codes
    GradingEngine.prototype.parsePaymentHistory = function(account) {
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

    // Categorize using CIBIL constants
    GradingEngine.prototype.categorizePaymentStatus = function(status) {
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
    GradingEngine.prototype.calculateOverallGrade = function() {
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
    GradingEngine.prototype.convertScoreToGrade = function(score) {
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
    GradingEngine.prototype.calculatePaymentHistoryComponent = function() {
        var accounts = this.creditReport.accounts || [];
        if (accounts.length === 0) return 650; // Neutral score
        
        var totalScore = 0;
        var totalWeight = 0;
        
        accounts.forEach(function(account) {
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
    GradingEngine.prototype.calculateUtilizationComponent = function() {
        var accounts = this.creditReport.accounts || [];
        var totalLimit = 0;
        var totalBalance = 0;
        
        accounts.forEach(function(account) {
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
    GradingEngine.prototype.getAccountAge = function(account) {
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
    GradingEngine.prototype.parseDate = function(dateStr) {
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

    // Export the module
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GradingEngine;
    }
})();