(function() {
    function RiskAssessment(cibilData, gradingEngine) {
        this.cibilData = cibilData;
        this.gradingEngine = gradingEngine;
        this.creditReport = cibilData.credit_report[0];
    }

    // Calculate credit worthiness score (0-100)
    RiskAssessment.prototype.calculateCreditWorthiness = function() {
        var grade = this.gradingEngine.calculateOverallGrade();
        var defaulters = this.gradingEngine.identifyDefaulters();
        var utilization = this.gradingEngine.getCreditUtilization();
        var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis();
        var creditAge = this.gradingEngine.getCreditAge();

        var gradeScore = this.gradeToScore(grade);
        var defaultScore = defaulters.length > 0 ? 30 : 100;
        var utilizationScore = utilization > 75 ? 40 : (utilization > 50 ? 60 : (utilization > 30 ? 80 : 100));
        var paymentScore = paymentAnalysis.missedRate > 0.2 ? 30 : (paymentAnalysis.missedRate > 0.1 ? 50 : (paymentAnalysis.missedRate > 0.05 ? 70 : 100));
        var historyScore = creditAge < 12 ? 60 : (creditAge < 24 ? 80 : 100);

        // Weighted average
        var totalScore = (
            gradeScore * 0.3 +
            defaultScore * 0.25 +
            utilizationScore * 0.2 +
            paymentScore * 0.15 +
            historyScore * 0.1
        );

        return {
            score: Math.round(totalScore),
            isCreditWorthy: totalScore >= 60,
            components: {
                gradeScore: gradeScore,
                defaultScore: defaultScore,
                utilizationScore: utilizationScore,
                paymentScore: paymentScore,
                historyScore: historyScore
            }
        };
    };
    // Generate risk-based recommendation
    RiskAssessment.prototype.generateRiskRecommendation = function() {
        var creditWorthiness = this.calculateCreditWorthiness();
        var defaultProbability = this.calculateDefaultProbability();
        var defaultPatterns = this.analyzeDefaultPatterns();

        var recommendation = {
            approvalRecommendation: creditWorthiness.isCreditWorthy ? 'Approve with Conditions' : 'Reject',
            riskLevel: defaultProbability.riskLevel,
            suggestedActions: [],
            loanConditions: []
        };

        if (creditWorthiness.isCreditWorthy) {
            if (defaultProbability.probability < 30) {
                recommendation.approvalRecommendation = 'Approve';
                recommendation.suggestedActions.push('Standard credit assessment passed');
            } else {
                recommendation.suggestedActions.push('Enhanced monitoring required');

                if (defaultPatterns.type === 'Willful') {
                    recommendation.loanConditions.push('Require collateral for any new credit');
                    recommendation.loanConditions.push('Higher interest rate recommended');
                } else if (defaultPatterns.type === 'Situational') {
                    recommendation.loanConditions.push('Consider smaller credit limit initially');
                    recommendation.loanConditions.push('Quarterly review of credit status');
                }
            }
        } else {
            recommendation.suggestedActions.push('Client does not meet minimum creditworthiness criteria');

            if (defaultPatterns.type === 'Willful') {
                recommendation.suggestedActions.push('Client shows patterns of intentional default - high risk');
            } else {
                recommendation.suggestedActions.push('Consider secured credit options if available');
            }
        }

        return recommendation;
    }

    // Update risk assessment to use the improved payment history data
    RiskAssessment.prototype.calculateDefaultProbability = function() {
        var creditWorthiness = this.calculateCreditWorthiness();
        var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis();
        var utilization = this.gradingEngine.getCreditUtilization();
        var accounts = this.gradingEngine.processAccounts();

        var baseProbability = 100 - creditWorthiness.score;

        // Adjust based on payment history (more weight to recent patterns)
        var recentMissedRate = this.calculateRecentMissedRate(paymentAnalysis);
        if (recentMissedRate > 0.2) {
            baseProbability += 20;
        } else if (recentMissedRate > 0.1) {
            baseProbability += 10;
        } else if (recentMissedRate > 0.05) {
            baseProbability += 5;
        }

        // Adjust based on utilization
        if (utilization > 75) {
            baseProbability += 10;
        } else if (utilization > 50) {
            baseProbability += 5;
        }

        // Adjust based on overdue accounts
        var overdueAccounts = accounts.filter(function(account) {
            return account.status === 'Overdue' || account.status === 'Default';
        }).length;

        if (overdueAccounts > 0) {
            baseProbability += (overdueAccounts * 5);
        }

        // Cap probability between 5% and 95%
        var probability = Math.min(95, Math.max(5, baseProbability));

        return {
            probability: probability,
            riskLevel: this.getRiskLevel(probability),
            factors: {
                creditWorthiness: creditWorthiness.score,
                missedPaymentRate: paymentAnalysis.missedRate,
                recentMissedRate: recentMissedRate,
                creditUtilization: utilization,
                overdueAccounts: overdueAccounts
            }
        };
    };

    RiskAssessment.prototype.calculateRecentMissedRate = function(paymentAnalysis) {
        // Give more weight to recent payments (last 12 months)
        var recentPayments = Math.min(12, paymentAnalysis.total);
        var recentMissed = Math.min(recentPayments, paymentAnalysis.missed);

        return recentPayments > 0 ? recentMissed / recentPayments : 0;
    };


    RiskAssessment.prototype.getOverallPaymentAnalysis = function() {
        var onTime = 0,
            delayed = 0,
            missed = 0,
            total = 0;
        var self = this;

        this.creditReport.accounts.forEach(function(account) {
            var analysis = self.gradingEngine.parsePaymentHistory(account);
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
            missedRate: total > 0 ? missed / total : 0,
            delayedRate: total > 0 ? delayed / total : 0
        };
    };


    // Convert letter grade to numerical score
    RiskAssessment.prototype.gradeToScore = function(grade) {
        var gradeScores = {
            'A+': 100,
            'A': 90,
            'B+': 80,
            'B': 70,
            'C+': 60,
            'C': 50,
            'D+': 40,
            'D': 30
        };

        return gradeScores[grade] || 30;
    };

    // Analyze default patterns to determine if willful or situational
    RiskAssessment.prototype.analyzeDefaultPatterns = function() {
        var accounts = this.creditReport.accounts;
        var defaulters = this.gradingEngine.identifyDefaulters();
        var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis();

        var willfulDefaultIndicators = 0;
        var situationalDefaultIndicators = 0;

        // Check for patterns across all accounts
        accounts.forEach(function(account) {
            var paymentHistory = this.gradingEngine.parsePaymentHistory(account.paymentHistory);

            // Pattern 1: Consistent payments then sudden stop (situational)
            var consistentThenStop = this.checkConsistentThenStop(paymentHistory);
            if (consistentThenStop) situationalDefaultIndicators++;

            // Pattern 2: Irregular payments with no pattern (willful)
            var irregularPattern = this.checkIrregularPattern(paymentHistory);
            if (irregularPattern) willfulDefaultIndicators++;

            // Pattern 3: Multiple accounts defaulting at same time (situational)
            // This will be checked outside the loop
        }, this);

        // Check if multiple accounts defaulted around the same time
        var simultaneousDefaults = this.checkSimultaneousDefaults(accounts);
        if (simultaneousDefaults) situationalDefaultIndicators += 2;

        // Determine default type
        var defaultType = 'Unknown';
        if (willfulDefaultIndicators > situationalDefaultIndicators) {
            defaultType = 'Willful';
        } else if (situationalDefaultIndicators > willfulDefaultIndicators) {
            defaultType = 'Situational';
        }

        return {
            type: defaultType,
            willfulIndicators: willfulDefaultIndicators,
            situationalIndicators: situationalDefaultIndicators,
            defaultAccounts: defaulters.length,
            totalAccounts: accounts.length
        };
    };

    // Check for consistent payments followed by sudden stop
    RiskAssessment.prototype.checkConsistentThenStop = function(paymentHistory) {
        var paidCount = 0;
        var missedCount = 0;
        var consistentThenStop = false;

        for (var i = 0; i < paymentHistory.payments.length; i++) {
            log('Payment History :');
            log(paymentHistory.payments[i].status);
            if (paymentHistory.payments[i].status === 'Paid') {
                paidCount++;
                if (missedCount > 0) break; // Pattern broken
            } else {
                missedCount++;
                if (paidCount >= 6 && missedCount >= 3) {
                    consistentThenStop = true;
                    break;
                }
            }
        }

        return consistentThenStop;
    };

    // Check for irregular payment pattern
    RiskAssessment.prototype.checkIrregularPattern = function(paymentHistory) {
        var statusChanges = 0;
        var lastStatus = null;

        for (var i = 0; i < paymentHistory.payments.length; i++) {
            if (lastStatus !== null && paymentHistory.payments[i].status !== lastStatus) {
                statusChanges++;
            }
            lastStatus = paymentHistory.payments[i].status;
        }

        // More than 8 changes in 12 months indicates irregular pattern
        return statusChanges > 8;
    };

    // Check for simultaneous defaults across accounts
    RiskAssessment.prototype.checkSimultaneousDefaults = function(accounts) {
        var defaultPeriods = {};

        accounts.forEach(function(account) {
            var paymentHistory = this.gradingEngine.parsePaymentHistory(account.paymentHistory);
            var defaultMonths = [];

            for (var i = 0; i < paymentHistory.payments.length; i++) {
                if (paymentHistory.payments[i].status !== 'Paid') {
                    defaultMonths.push(i);
                }
            }

            if (defaultMonths.length > 0) {
                defaultPeriods[account.index] = defaultMonths;
            }
        }, this);

        // Check if there are overlapping default periods across accounts
        var accountKeys = Object.keys(defaultPeriods);
        if (accountKeys.length < 2) return false;

        for (var i = 0; i < accountKeys.length - 1; i++) {
            for (var j = i + 1; j < accountKeys.length; j++) {
                var periods1 = defaultPeriods[accountKeys[i]];
                var periods2 = defaultPeriods[accountKeys[j]];

                // Check for overlapping default months
                var overlap = periods1.filter(function(month) {
                    return periods2.indexOf(month) !== -1;
                });

                if (overlap.length >= 2) return true;
            }
        }

        return false;
    };

    // Calculate probability of future default


    // Convert probability to risk level
    RiskAssessment.prototype.getRiskLevel = function(probability) {
        if (probability < 20) return 'Low';
        if (probability < 40) return 'Moderate';
        if (probability < 60) return 'Medium';
        if (probability < 80) return 'High';
        return 'Very High';
    };

    // Generate comprehensive risk assessment report
    RiskAssessment.prototype.generateRiskReport = function() {
        var creditWorthiness = this.calculateCreditWorthiness();
        var defaultPatterns = this.analyzeDefaultPatterns();
        var defaultProbability = this.calculateDefaultProbability();
        var grade = this.gradingEngine.calculateOverallGrade();

        return {
            clientInfo: {
                name: this.cibilData.name,
                clientId: this.cibilData.client_id,
                pan: this.cibilData.pan,
                creditScore: this.cibilData.credit_score
            },
            creditAssessment: {
                overallGrade: grade,
                creditWorthiness: creditWorthiness,
                defaultProbability: defaultProbability,
                defaultPatternAnalysis: defaultPatterns
            },
            riskFactors: this.identifyRiskFactors(),
            recommendation: this.generateRiskRecommendation(),
            reportDate: new Date().toISOString()
        };
    };

    // Identify key risk factors
    RiskAssessment.prototype.identifyRiskFactors = function() {
        var riskFactors = [];
        var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis();
        var utilization = this.gradingEngine.getCreditUtilization();
        var defaulters = this.gradingEngine.identifyDefaulters();
        var defaultPatterns = this.analyzeDefaultPatterns();

        if (paymentAnalysis.missedRate > 0.1) {
            riskFactors.push({
                factor: 'High Missed Payment Rate',
                severity: 'High',
                description: 'Client has missed ' + (paymentAnalysis.missedRate * 100).toFixed(1) + '% of payments'
            });
        }

        if (utilization > 75) {
            riskFactors.push({
                factor: 'Very High Credit Utilization',
                severity: 'High',
                description: 'Client is using ' + utilization.toFixed(1) + '% of available credit'
            });
        } else if (utilization > 50) {
            riskFactors.push({
                factor: 'High Credit Utilization',
                severity: 'Medium',
                description: 'Client is using ' + utilization.toFixed(1) + '% of available credit'
            });
        }

        if (defaulters.length > 0) {
            riskFactors.push({
                factor: 'Active Default Accounts',
                severity: 'Very High',
                description: 'Client has ' + defaulters.length + ' accounts with default indicators'
            });
        }

        if (defaultPatterns.type === 'Willful') {
            riskFactors.push({
                factor: 'Willful Default Pattern',
                severity: 'Very High',
                description: 'Client shows patterns of intentional default behavior'
            });
        }

        var creditAge = this.gradingEngine.getCreditAge();
        if (creditAge < 12) {
            riskFactors.push({
                factor: 'Limited Credit History',
                severity: 'Medium',
                description: 'Client has only ' + creditAge + ' months of credit history'
            });
        }

        return riskFactors;
    };



    // Get financial institutions that might still consider this client
    RiskAssessment.prototype.getEligibleInstitutions = function() {
        var creditWorthiness = this.calculateCreditWorthiness();
        var defaultProbability = this.calculateDefaultProbability();
        var grade = this.gradingEngine.calculateOverallGrade();

        // Define institution risk profiles
        var institutions = [{
                name: 'Prime Lenders (HDFC, ICICI, SBI)',
                minGrade: 'B+',
                maxDefaultProbability: 30,
                requiresCreditWorthy: true,
                description: 'Top-tier banks with strict lending criteria'
            },
            {
                name: 'Tier 2 Banks (Axis, Kotak, Yes Bank)',
                minGrade: 'C+',
                maxDefaultProbability: 50,
                requiresCreditWorthy: false,
                description: 'Banks with moderate risk appetite'
            },
            {
                name: 'NBFCs (Bajaj Finance, HDB Financial)',
                minGrade: 'C',
                maxDefaultProbability: 65,
                requiresCreditWorthy: false,
                description: 'Non-banking financial companies with higher risk tolerance'
            },
            {
                name: 'FinTech Lenders (EarlySalary, MoneyTap)',
                minGrade: 'D+',
                maxDefaultProbability: 80,
                requiresCreditWorthy: false,
                description: 'Digital lenders specializing in subprime credit'
            },
            {
                name: 'Secured Loan Providers',
                minGrade: 'D',
                maxDefaultProbability: 95,
                requiresCreditWorthy: false,
                description: 'Lenders offering loans against collateral'
            }
        ];

        var gradeOrder = ['D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
        var clientGradeIndex = gradeOrder.indexOf(grade);

        // Filter eligible institutions
        var eligibleInstitutions = institutions.filter(function(institution) {
            var minGradeIndex = gradeOrder.indexOf(institution.minGrade);

            // Check grade requirement
            if (clientGradeIndex < minGradeIndex) return false;

            // Check default probability requirement
            if (defaultProbability.probability > institution.maxDefaultProbability) return false;

            // Check credit worthiness requirement
            if (institution.requiresCreditWorthy && !creditWorthiness.isCreditWorthy) return false;

            return true;
        });

        return eligibleInstitutions;
    };

    module.exports = RiskAssessment;

})();