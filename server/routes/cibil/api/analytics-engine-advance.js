(function() {


    function AdvancedAnalytics(cibilData, gradingEngine) {
        this.cibilData = cibilData;
        this.gradingEngine = gradingEngine;
        this.creditReport = cibilData.credit_report[0];
    }

    // Generate chart data for loan history visualization
    AdvancedAnalytics.prototype.generateLoanHistoryChartData = function() {
        var accounts = this.creditReport.accounts;
        var chartData = {
            labels: [],
            datasets: [{
                    label: 'Credit Limit',
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Current Balance',
                    data: [],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        };

        accounts.forEach(function(account, index) {
            chartData.labels.push(account.memberShortName + ' - ' + account.accountType);
            chartData.datasets[0].data.push(account.highCreditAmount || 0);
            chartData.datasets[1].data.push(account.currentBalance || 0);
        });

        return chartData;
    };

    // Generate payment history timeline data
    AdvancedAnalytics.prototype.generatePaymentTimelineData = function() {
        var accounts = this.creditReport.accounts;
        var timelineData = [];
        var self = this;

        accounts.forEach(function(account) {
            var paymentAnalysis = self.gradingEngine.parsePaymentHistory(account.paymentHistory);

            paymentAnalysis.payments.forEach(function(payment, index) {
                var month = new Date();
                month.setMonth(month.getMonth() - (paymentAnalysis.payments.length - index - 1));

                timelineData.push({
                    date: month.toISOString().split('T')[0],
                    account: account.memberShortName,
                    status: payment.status,
                    period: payment.period
                });
            });
        });

        // Sort by date
        timelineData.sort(function(a, b) {
            return new Date(a.date) - new Date(b.date);
        });

        return timelineData;
    };

    // Generate 6-month improvement plan
    AdvancedAnalytics.prototype.generateImprovementPlan = function() {
        var recommendations = this.gradingEngine.generateRecommendations();
        var plan = {
            currentGrade: this.gradingEngine.calculateOverallGrade(),
            targetGrade: this.getTargetGrade(),
            monthlyActions: []
        };

        // Create monthly plan based on recommendations
        for (var month = 1; month <= 6; month++) {
            var monthlyActions = [];

            recommendations.forEach(function(rec) {
                if (month === 1 && rec.priority === 'High') {
                    monthlyActions.push({
                        action: rec.message,
                        area: rec.area,
                        priority: rec.priority
                    });
                } else if (month <= 3 && rec.priority === 'Medium') {
                    monthlyActions.push({
                        action: rec.message,
                        area: rec.area,
                        priority: rec.priority
                    });
                } else if (month > 3 && rec.priority === 'Low') {
                    monthlyActions.push({
                        action: rec.message,
                        area: rec.area,
                        priority: rec.priority
                    });
                }
            });

            // Add specific monthly actions
            if (month === 1) {
                monthlyActions.push({
                    action: 'Review all credit accounts for errors and dispute any inaccuracies',
                    area: 'Credit Report',
                    priority: 'High'
                });
            }

            if (month === 2) {
                monthlyActions.push({
                    action: 'Set up automatic payments for at least the minimum amount due',
                    area: 'Payment History',
                    priority: 'High'
                });
            }

            if (month === 3) {
                monthlyActions.push({
                    action: 'Request a credit limit increase on your credit cards (if you have good payment history)',
                    area: 'Credit Utilization',
                    priority: 'Medium'
                });
            }

            if (month === 4) {
                monthlyActions.push({
                    action: 'Consider a secured credit card if you have no active credit accounts',
                    area: 'Credit Mix',
                    priority: 'Medium'
                });
            }

            if (month === 5) {
                monthlyActions.push({
                    action: 'Avoid new credit inquiries unless absolutely necessary',
                    area: 'Recent Inquiries',
                    priority: 'Medium'
                });
            }

            if (month === 6) {
                monthlyActions.push({
                    action: 'Review your progress and consider professional credit counseling if needed',
                    area: 'Overall',
                    priority: 'Low'
                });
            }

            plan.monthlyActions.push({
                month: month,
                actions: monthlyActions
            });
        }

        return plan;
    };

    // Determine target grade based on current grade
    AdvancedAnalytics.prototype.getTargetGrade = function() {
        var currentGrade = this.gradingEngine.calculateOverallGrade();
        var gradeOrder = ['D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
        var currentIndex = gradeOrder.indexOf(currentGrade);

        if (currentIndex === -1 || currentIndex === gradeOrder.length - 1) {
            return currentGrade; // Already at top or invalid grade
        }

        // Aim for two grades higher, but not beyond A+
        var targetIndex = Math.min(currentIndex + 2, gradeOrder.length - 1);
        return gradeOrder[targetIndex];
    };

    // Suggest banks that might still provide loans
    AdvancedAnalytics.prototype.suggestBanks = function() {
        var grade = this.gradingEngine.calculateOverallGrade();
        var accounts = this.creditReport.accounts;
        var defaulters = this.gradingEngine.identifyDefaulters();

        var allBanks = [
            { name: 'HDFC Bank', minGrade: 'B+', acceptsDefaulters: false, loanTypes: ['Personal Loan', 'Credit Card'] },
            { name: 'ICICI Bank', minGrade: 'B', acceptsDefaulters: false, loanTypes: ['Personal Loan', 'Credit Card'] },
            { name: 'Axis Bank', minGrade: 'C+', acceptsDefaulters: true, loanTypes: ['Personal Loan', 'Credit Card'] },
            { name: 'Kotak Mahindra Bank', minGrade: 'C', acceptsDefaulters: true, loanTypes: ['Personal Loan', 'Credit Card'] },
            { name: 'SBI', minGrade: 'B', acceptsDefaulters: false, loanTypes: ['Personal Loan', 'Credit Card'] },
            { name: 'Yes Bank', minGrade: 'C+', acceptsDefaulters: true, loanTypes: ['Personal Loan', 'Credit Card'] },
            { name: 'IndusInd Bank', minGrade: 'C', acceptsDefaulters: true, loanTypes: ['Personal Loan', 'Credit Card'] },
            { name: 'RBL Bank', minGrade: 'D+', acceptsDefaulters: true, loanTypes: ['Secured Credit Card'] },
            { name: 'IDFC First Bank', minGrade: 'C+', acceptsDefaulters: true, loanTypes: ['Personal Loan', 'Credit Card'] },
            { name: 'Federal Bank', minGrade: 'C', acceptsDefaulters: true, loanTypes: ['Personal Loan', 'Credit Card'] }
        ];

        var gradeOrder = ['D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
        var currentGradeIndex = gradeOrder.indexOf(grade);

        // Filter banks based on grade requirement
        var suggestedBanks = allBanks.filter(function(bank) {
            var minGradeIndex = gradeOrder.indexOf(bank.minGrade);
            return currentGradeIndex >= minGradeIndex &&
                (bank.acceptsDefaulters || defaulters.length === 0);
        });

        // Add success probability based on grade and default status
        suggestedBanks.forEach(function(bank) {
            var minGradeIndex = gradeOrder.indexOf(bank.minGrade);
            var gradeDifference = currentGradeIndex - minGradeIndex;

            // Base probability
            var probability = 60 + (gradeDifference * 10);

            // Adjust based on defaulters
            if (defaulters.length > 0 && !bank.acceptsDefaulters) {
                probability = 10; // Very low if bank doesn't accept defaulters but user has them
            } else if (defaulters.length > 0) {
                probability = Math.max(30, probability - (defaulters.length * 10));
            }

            // Cap probability
            bank.probability = Math.min(95, Math.max(5, probability));
        });

        // Sort by probability (highest first)
        suggestedBanks.sort(function(a, b) {
            return b.probability - a.probability;
        });

        return suggestedBanks;
    };

    // Generate comprehensive credit health report
    AdvancedAnalytics.prototype.generateComprehensiveReport = function() {
        var grade = this.gradingEngine.calculateOverallGrade();
        var defaulters = this.gradingEngine.identifyDefaulters();
        var recommendations = this.gradingEngine.generateRecommendations();
        var utilization = this.gradingEngine.getCreditUtilization();
        var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis();

        var report = {
            summary: {
                name: this.cibilData.name,
                grade: grade,
                creditScore: this.cibilData.credit_score,
                totalAccounts: this.creditReport.accounts.length,
                totalEnquiries: this.creditReport.enquiries.length,
                creditUtilization: utilization,
                paymentHistory: {
                    onTime: paymentAnalysis.onTime,
                    delayed: paymentAnalysis.delayed,
                    missed: paymentAnalysis.missed,
                    total: paymentAnalysis.total
                }
            },
            riskFactors: [],
            improvementPlan: this.generateImprovementPlan(),
            bankSuggestions: this.suggestBanks(),
            chartData: {
                loanHistory: this.generateLoanHistoryChartData(),
                paymentTimeline: this.generatePaymentTimelineData()
            }
        };

        // Identify risk factors
        if (utilization > 50) {
            report.riskFactors.push({
                factor: 'High Credit Utilization',
                severity: 'High',
                description: 'Your credit utilization is ' + utilization.toFixed(1) + '% which is above the recommended 30%'
            });
        }

        if (paymentAnalysis.missedRate > 0.1) {
            report.riskFactors.push({
                factor: 'Missed Payments',
                severity: 'High',
                description: 'You have ' + paymentAnalysis.missed + ' missed payments in your history'
            });
        }

        if (defaulters.length > 0) {
            report.riskFactors.push({
                factor: 'Potential Default Accounts',
                severity: 'Critical',
                description: 'You have ' + defaulters.length + ' accounts with potential default risk'
            });
        }

        var creditAge = this.gradingEngine.getCreditAge();
        if (creditAge < 24) {
            report.riskFactors.push({
                factor: 'Short Credit History',
                severity: 'Medium',
                description: 'Your credit history is only ' + creditAge + ' months old'
            });
        }

        var recentInquiries = this.creditReport.enquiries.filter(function(inquiry) {
            var inquiryDate = new Date(
                parseInt(inquiry.enquiryDate.substring(4, 8)),
                parseInt(inquiry.enquiryDate.substring(2, 4)) - 1,
                parseInt(inquiry.enquiryDate.substring(0, 2))
            );
            return new Date() - inquiryDate < 6 * 30 * 24 * 60 * 60 * 1000;
        }).length;

        if (recentInquiries > 4) {
            report.riskFactors.push({
                factor: 'Multiple Recent Inquiries',
                severity: 'Medium',
                description: 'You have ' + recentInquiries + ' credit inquiries in the last 6 months'
            });
        }

        return report;
    };

    module.exports = AdvancedAnalytics;

})();