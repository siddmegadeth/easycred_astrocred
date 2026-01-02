(function() {
    /**
     * Risk Assessment Engine
     * Evaluates credit risk, default probability, and provides risk-based recommendations
     * Updated for mobile/email/PAN based schema and Indian context
     */
    
    function RiskAssessment(cibilData, gradingEngine) {
        this.cibilData = cibilData;
        this.gradingEngine = gradingEngine;
        this.creditReport = cibilData.credit_report && cibilData.credit_report[0] ? cibilData.credit_report[0] : {};
        
        // User information from updated schema
        this.userInfo = {
            name: cibilData.name || null,
            mobile: cibilData.mobile || null,
            email: cibilData.email || null,
            pan: cibilData.pan || null,
            gender: cibilData.gender || null,
            dateOfBirth: cibilData.date_of_birth || null,
            creditScore: cibilData.credit_score || null
        };
    }
    
    /**
     * Calculate credit worthiness score (0-100)
     */
    RiskAssessment.prototype.calculateCreditWorthiness = function() {
        try {
            var grade = this.gradingEngine.calculateOverallGrade();
            var defaulters = this.gradingEngine.identifyDefaulters();
            var utilization = this.gradingEngine.getCreditUtilization();
            var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis();
            var creditAge = this.gradingEngine.getCreditAge();
            var debtBurden = this.calculateDebtBurdenScore();
            
            // Convert grade to score with Indian context
            var gradeScore = this.gradeToScore(grade);
            
            // Default score: Heavy penalty for defaulters in Indian market
            var defaultScore = defaulters.length > 0 ? Math.max(10, 50 - (defaulters.length * 10)) : 100;
            
            // Utilization score: Indian banks prefer <30% utilization
            var utilizationScore;
            if (utilization <= 10) utilizationScore = 100;
            else if (utilization <= 20) utilizationScore = 90;
            else if (utilization <= 30) utilizationScore = 80;
            else if (utilization <= 40) utilizationScore = 70;
            else if (utilization <= 50) utilizationScore = 60;
            else if (utilization <= 60) utilizationScore = 50;
            else if (utilization <= 70) utilizationScore = 40;
            else if (utilization <= 80) utilizationScore = 30;
            else if (utilization <= 90) utilizationScore = 20;
            else utilizationScore = 10;
            
            // Payment score: Missed payments heavily penalized in India
            var paymentScore;
            if (paymentAnalysis.missedRate === 0 && paymentAnalysis.delayedRate === 0) {
                paymentScore = 100;
            } else if (paymentAnalysis.missedRate <= 0.05 && paymentAnalysis.delayedRate <= 0.1) {
                paymentScore = 80;
            } else if (paymentAnalysis.missedRate <= 0.1 && paymentAnalysis.delayedRate <= 0.2) {
                paymentScore = 60;
            } else if (paymentAnalysis.missedRate <= 0.2 && paymentAnalysis.delayedRate <= 0.3) {
                paymentScore = 40;
            } else {
                paymentScore = 20;
            }
            
            // History score: Longer credit history is valued
            var historyScore;
            if (creditAge >= 84) historyScore = 100; // 7+ years
            else if (creditAge >= 60) historyScore = 90; // 5+ years
            else if (creditAge >= 36) historyScore = 80; // 3+ years
            else if (creditAge >= 24) historyScore = 70; // 2+ years
            else if (creditAge >= 12) historyScore = 60; // 1+ years
            else historyScore = 50; // <1 year
            
            // Debt burden score
            var debtScore;
            if (debtBurden <= 30) debtScore = 100;
            else if (debtBurden <= 40) debtScore = 85;
            else if (debtBurden <= 50) debtScore = 70;
            else if (debtBurden <= 60) debtScore = 55;
            else if (debtBurden <= 70) debtScore = 40;
            else debtScore = 25;
            
            // Weighted average with Indian market weights
            var totalScore = (
                gradeScore * 0.25 +      // 25% Overall Grade
                defaultScore * 0.20 +    // 20% Default History
                utilizationScore * 0.20 + // 20% Credit Utilization
                paymentScore * 0.15 +    // 15% Payment History
                historyScore * 0.10 +    // 10% Credit Age
                debtScore * 0.10         // 10% Debt Burden
            );
            
            // Apply Indian market adjustments
            totalScore = this.applyIndianCreditworthinessAdjustments(totalScore);
            
            return {
                score: Math.round(totalScore),
                isCreditWorthy: totalScore >= 65, // Indian threshold
                isPrimeBorrower: totalScore >= 85,
                isSubprimeBorrower: totalScore < 50,
                components: {
                    gradeScore: gradeScore,
                    defaultScore: defaultScore,
                    utilizationScore: utilizationScore,
                    paymentScore: paymentScore,
                    historyScore: historyScore,
                    debtScore: debtScore
                },
                thresholds: {
                    primeBorrower: 85,
                    creditWorthy: 65,
                    subprimeBorrower: 50
                }
            };
            
        } catch (error) {
            console.error('Error calculating credit worthiness:', error);
            return {
                score: 50,
                isCreditWorthy: false,
                isPrimeBorrower: false,
                isSubprimeBorrower: true,
                components: {},
                thresholds: {}
            };
        }
    };
    
    /**
     * Apply Indian market specific adjustments to creditworthiness
     */
    RiskAssessment.prototype.applyIndianCreditworthinessAdjustments = function(score) {
        var adjustments = 0;
        var employmentData = this.creditReport.employment || [];
        var accounts = this.creditReport.accounts || [];
        
        // Government employee bonus
        if (employmentData.length > 0) {
            var occupationCode = employmentData[0].occupationCode;
            if (occupationCode === '02') { // Government employee
                adjustments += 5; // Considered very stable in India
            } else if (occupationCode === '01') { // Professional
                adjustments += 3;
            }
        }
        
        // Relationship with government banks bonus
        var hasGovernmentBank = accounts.some(function(account) {
            var lender = account.memberShortName || '';
            return lender.includes('SBI') || lender.includes('State Bank') || 
                   lender.includes('PNB') || lender.includes('Bank of Baroda') ||
                   lender.includes('Canara') || lender.includes('Union Bank');
        });
        
        if (hasGovernmentBank) {
            adjustments += 3; // Positive relationship with government banks
        }
        
        // Secured vs unsecured credit mix
        var securedLoans = 0;
        var unsecuredLoans = 0;
        
        accounts.forEach(function(account) {
            var type = (account.accountType || '').toLowerCase();
            if (type.includes('home') || type.includes('car') || type.includes('loan against') || 
                type.includes('secured') || type.includes('mortgage') || type.includes('gold')) {
                securedLoans++;
            } else if (type.includes('credit card') || type.includes('personal loan') || 
                type.includes('consumer') || type.includes('unsecured')) {
                unsecuredLoans++;
            }
        });
        
        if (securedLoans > 0 && unsecuredLoans === 0) {
            adjustments += 2; // Only secured credit - conservative
        } else if (securedLoans === 0 && unsecuredLoans > 0) {
            adjustments -= 2; // Only unsecured credit - higher risk
        } else if (securedLoans > 0 && unsecuredLoans > 0) {
            adjustments += 1; // Good mix
        }
        
        return Math.min(100, Math.max(0, score + adjustments));
    };
    
    /**
     * Calculate debt burden as percentage of estimated income
     */
    RiskAssessment.prototype.calculateDebtBurdenScore = function() {
        try {
            var accounts = this.creditReport.accounts || [];
            var totalEMI = 0;
            
            accounts.forEach(function(account) {
                var emi = this.gradingEngine.safeToNumber(account.emiAmount);
                if (emi > 0) totalEMI += emi;
            }, this);
            
            // Estimate monthly income
            var estimatedIncome = this.estimateMonthlyIncome();
            
            if (estimatedIncome === 0) {
                // If can't estimate income, use alternative calculation
                var totalBalance = 0;
                var totalLimit = 0;
                
                accounts.forEach(function(account) {
                    var balance = this.gradingEngine.safeToNumber(account.currentBalance);
                    var limit = this.gradingEngine.safeToNumber(account.highCreditAmount);
                    totalBalance += balance;
                    totalLimit += limit;
                }, this);
                
                return totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
            }
            
            return (totalEMI / estimatedIncome) * 100;
            
        } catch (error) {
            return 0;
        }
    };
    
    /**
     * Estimate monthly income based on credit profile
     */
    RiskAssessment.prototype.estimateMonthlyIncome = function() {
        try {
            var employmentData = this.creditReport.employment || [];
            var accounts = this.creditReport.accounts || [];
            
            // Method 1: Use employment data
            if (employmentData.length > 0) {
                var occupationCode = employmentData[0].occupationCode;
                var salaryEstimates = {
                    '01': 150000, // Professional
                    '02': 80000,  // Government
                    '03': 75000,  // Private
                    '04': 60000,  // Self-employed
                    '05': 100000, // Business
                    '06': 30000,  // Daily wage
                    '07': 0,      // Unemployed
                    '08': 120000, // Senior management
                    '09': 90000   // Mid-management
                };
                return salaryEstimates[occupationCode] || 50000;
            }
            
            // Method 2: Estimate based on credit limits
            var totalLimit = 0;
            accounts.forEach(function(account) {
                var limit = this.gradingEngine.safeToNumber(account.highCreditAmount);
                if (limit > 0) totalLimit += limit;
            }, this);
            
            if (totalLimit > 0) {
                // Credit limit is typically 2-3x monthly income in India
                return totalLimit / 2.5;
            }
            
            return 50000; // Default estimate
            
        } catch (error) {
            return 50000;
        }
    };
    
    /**
     * Generate risk-based recommendation
     */
    RiskAssessment.prototype.generateRiskRecommendation = function() {
        try {
            var creditWorthiness = this.calculateCreditWorthiness();
            var defaultProbability = this.calculateDefaultProbability();
            var defaultPatterns = this.analyzeDefaultPatterns();
            var overallGrade = this.gradingEngine.calculateOverallGrade();
            
            var recommendation = {
                overallAssessment: '',
                approvalRecommendation: '',
                riskLevel: defaultProbability.riskLevel,
                confidenceScore: this.calculateRecommendationConfidence(),
                suggestedActions: [],
                loanConditions: [],
                monitoringRequirements: [],
                riskMitigationStrategies: []
            };
            
            // Determine overall assessment
            if (creditWorthiness.isPrimeBorrower) {
                recommendation.overallAssessment = 'Prime Borrower - Low Risk Profile';
                recommendation.approvalRecommendation = 'Approve with Standard Terms';
            } else if (creditWorthiness.isCreditWorthy) {
                recommendation.overallAssessment = 'Credit Worthy - Moderate Risk Profile';
                recommendation.approvalRecommendation = 'Approve with Conditions';
            } else if (creditWorthiness.isSubprimeBorrower) {
                recommendation.overallAssessment = 'Subprime Borrower - High Risk Profile';
                recommendation.approvalRecommendation = 'Reject or Require Collateral';
            } else {
                recommendation.overallAssessment = 'High Risk - Not Credit Worthy';
                recommendation.approvalRecommendation = 'Reject';
            }
            
            // Add specific actions based on risk factors
            var riskFactors = this.identifyRiskFactors();
            
            riskFactors.forEach(function(factor) {
                if (factor.severity === 'Critical' || factor.severity === 'Very High') {
                    recommendation.suggestedActions.push(
                        'Address ' + factor.factor.toLowerCase() + ': ' + factor.description
                    );
                    
                    if (factor.severity === 'Critical') {
                        recommendation.loanConditions.push(
                            'Require collateral of at least 150% of loan amount'
                        );
                        recommendation.riskMitigationStrategies.push(
                            'Consider credit insurance or guarantee'
                        );
                    }
                }
            });
            
            // Add grade-specific conditions
            if (overallGrade === 'D' || overallGrade === 'E' || overallGrade === 'F') {
                recommendation.loanConditions.push('Higher interest rate (2-3% above prime)');
                recommendation.loanConditions.push('Shorter loan tenure (maximum 3 years)');
                recommendation.monitoringRequirements.push('Monthly review for first 6 months');
            } else if (overallGrade === 'C' || overallGrade === 'C+') {
                recommendation.loanConditions.push('Moderate interest rate (1-2% above prime)');
                recommendation.monitoringRequirements.push('Quarterly review for first year');
            }
            
            // Add default pattern specific recommendations
            if (defaultPatterns.type === 'Willful') {
                recommendation.suggestedActions.push('Client shows patterns of intentional default - enhanced due diligence required');
                recommendation.loanConditions.push('Strict payment tracking with automatic alerts');
                recommendation.riskMitigationStrategies.push('Consider third-party guarantee or co-signer');
            } else if (defaultPatterns.type === 'Situational') {
                recommendation.suggestedActions.push('Default appears situational - consider temporary relief options');
                recommendation.loanConditions.push('Flexible repayment options during economic downturns');
            }
            
            // Add utilization-based recommendations
            var utilization = this.gradingEngine.getCreditUtilization();
            if (utilization > 70) {
                recommendation.loanConditions.push('Lower credit limit until utilization improves');
                recommendation.suggestedActions.push('Debt consolidation or balance transfer to reduce utilization');
            }
            
            return recommendation;
            
        } catch (error) {
            console.error('Error generating risk recommendation:', error);
            return {
                overallAssessment: 'Assessment Error',
                approvalRecommendation: 'Further Review Required',
                riskLevel: 'Unknown',
                suggestedActions: ['System error - manual review recommended'],
                loanConditions: []
            };
        }
    };
    
    /**
     * Calculate confidence in recommendation
     */
    RiskAssessment.prototype.calculateRecommendationConfidence = function() {
        try {
            var confidence = 70; // Base confidence
            
            // Increase confidence with more data
            var accounts = this.creditReport.accounts || [];
            var creditAge = this.gradingEngine.getCreditAge();
            
            if (accounts.length >= 3) confidence += 10;
            if (creditAge >= 24) confidence += 10;
            
            // Decrease confidence if limited data
            if (accounts.length === 0) confidence -= 20;
            if (creditAge < 6) confidence -= 15;
            
            var employmentData = this.creditReport.employment || [];
            if (employmentData.length === 0) confidence -= 10;
            
            return Math.min(95, Math.max(30, confidence));
            
        } catch (error) {
            return 50;
        }
    };
    
    /**
     * Calculate probability of default
     */
    RiskAssessment.prototype.calculateDefaultProbability = function() {
        try {
            var creditWorthiness = this.calculateCreditWorthiness();
            var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis();
            var utilization = this.gradingEngine.getCreditUtilization();
            var accounts = this.gradingEngine.processAccounts();
            var defaultPatterns = this.analyzeDefaultPatterns();
            
            // Base probability from credit worthiness
            var baseProbability = 100 - creditWorthiness.score;
            
            // Adjust based on payment history
            var recentMissedRate = this.calculateRecentMissedRate(paymentAnalysis);
            if (recentMissedRate > 0.3) {
                baseProbability += 25;
            } else if (recentMissedRate > 0.2) {
                baseProbability += 15;
            } else if (recentMissedRate > 0.1) {
                baseProbability += 10;
            } else if (recentMissedRate > 0.05) {
                baseProbability += 5;
            }
            
            // Adjust based on utilization (Indian banks very sensitive to high utilization)
            if (utilization > 80) {
                baseProbability += 20;
            } else if (utilization > 70) {
                baseProbability += 15;
            } else if (utilization > 60) {
                baseProbability += 10;
            } else if (utilization > 50) {
                baseProbability += 5;
            }
            
            // Adjust based on overdue accounts
            var overdueAccounts = accounts.filter(function(account) {
                return account.status === 'Overdue' || account.status === 'Default' || 
                       account.status === 'Written Off' || account.status === 'Wilful Default';
            }).length;
            
            if (overdueAccounts > 0) {
                baseProbability += (overdueAccounts * 8);
            }
            
            // Adjust based on default patterns
            if (defaultPatterns.type === 'Willful') {
                baseProbability += 20;
            } else if (defaultPatterns.type === 'Situational') {
                baseProbability += 10;
            }
            
            // Adjust based on debt burden
            var debtBurden = this.calculateDebtBurdenScore();
            if (debtBurden > 60) {
                baseProbability += 15;
            } else if (debtBurden > 50) {
                baseProbability += 10;
            } else if (debtBurden > 40) {
                baseProbability += 5;
            }
            
            // Adjust based on economic factors (simplified)
            var economicAdjustment = this.calculateEconomicAdjustment();
            baseProbability += economicAdjustment;
            
            // Cap probability between 5% and 95%
            var probability = Math.min(95, Math.max(5, Math.round(baseProbability)));
            
            return {
                probability: probability,
                riskLevel: this.getRiskLevel(probability),
                confidence: this.calculateDefaultProbabilityConfidence(),
                factors: {
                    creditWorthiness: creditWorthiness.score,
                    missedPaymentRate: paymentAnalysis.missedRate,
                    recentMissedRate: recentMissedRate,
                    creditUtilization: utilization,
                    overdueAccounts: overdueAccounts,
                    defaultPatternType: defaultPatterns.type,
                    debtBurden: debtBurden,
                    economicAdjustment: economicAdjustment
                }
            };
            
        } catch (error) {
            console.error('Error calculating default probability:', error);
            return {
                probability: 50,
                riskLevel: 'Medium',
                confidence: 30,
                factors: {}
            };
        }
    };
    
    /**
     * Calculate recent missed payment rate (last 12 months)
     */
    RiskAssessment.prototype.calculateRecentMissedRate = function(paymentAnalysis) {
        // Focus on last 12 months for Indian context (banks look closely at recent behavior)
        var recentPeriod = 12;
        var recentMissed = Math.min(recentPeriod, paymentAnalysis.missed);
        var recentDelayed = Math.min(recentPeriod, paymentAnalysis.delayed);
        
        // Weight missed payments more heavily than delayed
        return recentPeriod > 0 ? ((recentMissed * 1.5) + (recentDelayed * 0.5)) / recentPeriod : 0;
    };
    
    /**
     * Calculate economic adjustment based on simulated economic conditions
     */
    RiskAssessment.prototype.calculateEconomicAdjustment = function() {
        // Simplified economic adjustment
        // In production, this would use real economic data
        var adjustment = 0;
        
        // Simulate based on employment sector
        var employmentData = this.creditReport.employment || [];
        if (employmentData.length > 0) {
            var occupationCode = employmentData[0].occupationCode;
            
            // Sectors more sensitive to economic downturns
            var highRiskSectors = ['06', '05', '04']; // Daily wage, Business, Self-employed
            var mediumRiskSectors = ['03']; // Private sector
            
            if (highRiskSectors.includes(occupationCode)) {
                adjustment += 8;
            } else if (mediumRiskSectors.includes(occupationCode)) {
                adjustment += 4;
            }
        }
        
        return adjustment;
    };
    
    /**
     * Calculate confidence in default probability calculation
     */
    RiskAssessment.prototype.calculateDefaultProbabilityConfidence = function() {
        try {
            var confidence = 70;
            var accounts = this.creditReport.accounts || [];
            var creditAge = this.gradingEngine.getCreditAge();
            var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis();
            
            // More data = higher confidence
            if (accounts.length >= 4) confidence += 10;
            if (creditAge >= 36) confidence += 15;
            
            // Sufficient payment history
            if (paymentAnalysis.total >= 24) confidence += 10;
            
            // Employment data available
            var employmentData = this.creditReport.employment || [];
            if (employmentData.length > 0) confidence += 5;
            
            return Math.min(95, Math.max(30, confidence));
            
        } catch (error) {
            return 50;
        }
    };
    
    /**
     * Convert letter grade to numerical score
     */
    RiskAssessment.prototype.gradeToScore = function(grade) {
        var gradeScores = {
            'A+': 100,
            'A': 95,
            'B+': 85,
            'B': 75,
            'C+': 65,
            'C': 55,
            'D+': 45,
            'D': 35,
            'E+': 25,
            'E': 15,
            'F': 5
        };
        
        return gradeScores[grade] || 30;
    };
    
    /**
     * Analyze default patterns to determine if willful or situational
     */
    RiskAssessment.prototype.analyzeDefaultPatterns = function() {
        try {
            var accounts = this.creditReport.accounts || [];
            var defaulters = this.gradingEngine.identifyDefaulters();
            var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis();
            
            var willfulDefaultIndicators = 0;
            var situationalDefaultIndicators = 0;
            var analysisNotes = [];
            
            // Check each account for patterns
            for (var i = 0; i < accounts.length; i++) {
                var account = accounts[i];
                var paymentData = this.gradingEngine.parsePaymentHistory(account);
                
                // Pattern 1: Consistent payments then sudden stop (situational)
                var consistentThenStop = this.checkConsistentThenStop(paymentData);
                if (consistentThenStop) {
                    situationalDefaultIndicators++;
                    analysisNotes.push('Account ' + (i + 1) + ': Consistent payments followed by sudden stop');
                }
                
                // Pattern 2: Irregular payments with no pattern (willful)
                var irregularPattern = this.checkIrregularPattern(paymentData);
                if (irregularPattern) {
                    willfulDefaultIndicators++;
                    analysisNotes.push('Account ' + (i + 1) + ': Irregular payment pattern');
                }
                
                // Pattern 3: Small payments on large debts (strategic default)
                var strategicDefault = this.checkStrategicDefault(account, paymentData);
                if (strategicDefault) {
                    willfulDefaultIndicators += 2;
                    analysisNotes.push('Account ' + (i + 1) + ': Small payments on large debt (strategic default)');
                }
            }
            
            // Check for simultaneous defaults across accounts
            var simultaneousDefaults = this.checkSimultaneousDefaults(accounts);
            if (simultaneousDefaults) {
                situationalDefaultIndicators += 2;
                analysisNotes.push('Multiple accounts defaulted simultaneously');
            }
            
            // Check for recent defaults after long history (situational)
            var recentDefaultsAfterHistory = this.checkRecentDefaultsAfterHistory();
            if (recentDefaultsAfterHistory) {
                situationalDefaultIndicators++;
                analysisNotes.push('Recent defaults after long clean history');
            }
            
            // Determine default type
            var defaultType = 'No Clear Pattern';
            if (willfulDefaultIndicators > situationalDefaultIndicators + 2) {
                defaultType = 'Willful';
            } else if (situationalDefaultIndicators > willfulDefaultIndicators + 2) {
                defaultType = 'Situational';
            } else if (willfulDefaultIndicators > 0 || situationalDefaultIndicators > 0) {
                defaultType = 'Mixed Pattern';
            }
            
            return {
                type: defaultType,
                willfulIndicators: willfulDefaultIndicators,
                situationalIndicators: situationalDefaultIndicators,
                defaultAccounts: defaulters.length,
                totalAccounts: accounts.length,
                analysisNotes: analysisNotes,
                severity: this.determinePatternSeverity(willfulDefaultIndicators, situationalDefaultIndicators)
            };
            
        } catch (error) {
            console.error('Error analyzing default patterns:', error);
            return {
                type: 'Analysis Error',
                willfulIndicators: 0,
                situationalIndicators: 0,
                defaultAccounts: 0,
                totalAccounts: 0,
                analysisNotes: ['Pattern analysis failed'],
                severity: 'Unknown'
            };
        }
    };
    
    /**
     * Check for consistent payments followed by sudden stop
     */
    RiskAssessment.prototype.checkConsistentThenStop = function(paymentData) {
        try {
            var payments = paymentData.payments || [];
            if (payments.length < 9) return false; // Need at least 9 months of history
            
            var paidStreak = 0;
            var missedStreak = 0;
            var foundPattern = false;
            
            for (var i = 0; i < payments.length; i++) {
                var payment = payments[i];
                
                if (payment.category === 'Paid') {
                    paidStreak++;
                    if (missedStreak > 0) {
                        // Pattern broken - reset
                        paidStreak = 0;
                        missedStreak = 0;
                    }
                } else if (payment.category === 'Missed') {
                    missedStreak++;
                    // Check if we had a long paid streak followed by missed payments
                    if (paidStreak >= 6 && missedStreak >= 3) {
                        foundPattern = true;
                        break;
                    }
                } else {
                    // Delayed or not reported - reset pattern
                    paidStreak = 0;
                    missedStreak = 0;
                }
            }
            
            return foundPattern;
            
        } catch (error) {
            return false;
        }
    };
    
    /**
     * Check for irregular payment pattern
     */
    RiskAssessment.prototype.checkIrregularPattern = function(paymentData) {
        try {
            var payments = paymentData.payments || [];
            if (payments.length < 6) return false;
            
            var statusChanges = 0;
            var lastStatus = null;
            
            for (var i = 0; i < payments.length; i++) {
                var currentStatus = payments[i].category;
                if (lastStatus !== null && currentStatus !== lastStatus) {
                    statusChanges++;
                }
                lastStatus = currentStatus;
            }
            
            // More than 1 status change per 2 months indicates irregular pattern
            return statusChanges > (payments.length / 2);
            
        } catch (error) {
            return false;
        }
    };
    
    /**
     * Check for strategic default (making small payments on large debt)
     */
    RiskAssessment.prototype.checkStrategicDefault = function(account, paymentData) {
        try {
            var balance = this.gradingEngine.safeToNumber(account.currentBalance);
            var limit = this.gradingEngine.safeToNumber(account.highCreditAmount);
            var overdue = this.gradingEngine.safeToNumber(account.amountOverdue);
            
            // High balance with small or no recent payments
            if (balance > 100000 && overdue > (balance * 0.5)) {
                var recentPayments = paymentData.payments.slice(-6); // Last 6 months
                var recentPaidCount = recentPayments.filter(function(p) {
                    return p.category === 'Paid';
                }).length;
                
                // Making less than 50% of payments in last 6 months on large debt
                return recentPaidCount < 3;
            }
            
            return false;
            
        } catch (error) {
            return false;
        }
    };
    
    /**
     * Check for simultaneous defaults across accounts
     */
    RiskAssessment.prototype.checkSimultaneousDefaults = function(accounts) {
        try {
            var defaultPeriods = {};
            
            for (var i = 0; i < accounts.length; i++) {
                var account = accounts[i];
                var paymentData = this.gradingEngine.parsePaymentHistory(account);
                var defaultMonths = [];
                
                for (var j = 0; j < paymentData.payments.length; j++) {
                    if (paymentData.payments[j].category === 'Missed') {
                        defaultMonths.push(j);
                    }
                }
                
                if (defaultMonths.length > 0) {
                    defaultPeriods['account_' + i] = defaultMonths;
                }
            }
            
            var accountKeys = Object.keys(defaultPeriods);
            if (accountKeys.length < 2) return false;
            
            // Check for overlapping default months across accounts
            for (var i = 0; i < accountKeys.length - 1; i++) {
                for (var j = i + 1; j < accountKeys.length; j++) {
                    var periods1 = defaultPeriods[accountKeys[i]];
                    var periods2 = defaultPeriods[accountKeys[j]];
                    
                    // Find overlapping months
                    var overlap = periods1.filter(function(month) {
                        return periods2.includes(month);
                    });
                    
                    // If 3 or more overlapping default months, likely simultaneous
                    if (overlap.length >= 3) return true;
                }
            }
            
            return false;
            
        } catch (error) {
            return false;
        }
    };
    
    /**
     * Check for recent defaults after long clean history
     */
    RiskAssessment.prototype.checkRecentDefaultsAfterHistory = function() {
        try {
            var accounts = this.creditReport.accounts || [];
            var foundPattern = false;
            
            for (var i = 0; i < accounts.length; i++) {
                var paymentData = this.gradingEngine.parsePaymentHistory(accounts[i]);
                var payments = paymentData.payments || [];
                
                if (payments.length >= 24) { // At least 2 years history
                    var firstHalf = payments.slice(0, Math.floor(payments.length / 2));
                    var secondHalf = payments.slice(Math.floor(payments.length / 2));
                    
                    var firstHalfMissed = firstHalf.filter(function(p) {
                        return p.category === 'Missed';
                    }).length;
                    
                    var secondHalfMissed = secondHalf.filter(function(p) {
                        return p.category === 'Missed';
                    }).length;
                    
                    // Clean first half, defaults in second half
                    if (firstHalfMissed === 0 && secondHalfMissed >= 2) {
                        foundPattern = true;
                        break;
                    }
                }
            }
            
            return foundPattern;
            
        } catch (error) {
            return false;
        }
    };
    
    /**
     * Determine pattern severity
     */
    RiskAssessment.prototype.determinePatternSeverity = function(willfulIndicators, situationalIndicators) {
        var totalIndicators = willfulIndicators + situationalIndicators;
        
        if (totalIndicators === 0) return 'None';
        if (willfulIndicators >= 3) return 'Critical';
        if (willfulIndicators >= 2) return 'High';
        if (situationalIndicators >= 3) return 'Medium';
        if (totalIndicators >= 2) return 'Low-Medium';
        return 'Low';
    };
    
    /**
     * Convert probability to risk level
     */
    RiskAssessment.prototype.getRiskLevel = function(probability) {
        if (probability < 15) return 'Very Low';
        if (probability < 30) return 'Low';
        if (probability < 45) return 'Low-Medium';
        if (probability < 60) return 'Medium';
        if (probability < 75) return 'Medium-High';
        if (probability < 85) return 'High';
        return 'Very High';
    };
    
    /**
     * Generate comprehensive risk assessment report
     */
    RiskAssessment.prototype.generateRiskReport = function() {
        try {
            var creditWorthiness = this.calculateCreditWorthiness();
            var defaultPatterns = this.analyzeDefaultPatterns();
            var defaultProbability = this.calculateDefaultProbability();
            var grade = this.gradingEngine.calculateOverallGrade();
            var recommendations = this.generateRiskRecommendation();
            var riskFactors = this.identifyRiskFactors();
            var eligibleInstitutions = this.getEligibleInstitutions();
            
            return {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    reportVersion: '2.0',
                    assessmentMethodology: 'CIBIL-based risk assessment with Indian market adjustments'
                },
                clientInfo: this.userInfo,
                creditAssessment: {
                    overallGrade: grade,
                    creditWorthiness: creditWorthiness,
                    defaultProbability: defaultProbability,
                    defaultPatternAnalysis: defaultPatterns,
                    paymentAnalysis: this.gradingEngine.getOverallPaymentAnalysis(),
                    utilizationAnalysis: {
                        currentUtilization: this.gradingEngine.getCreditUtilization(),
                        recommendedThreshold: 30,
                        status: this.gradingEngine.getCreditUtilization() <= 30 ? 'Good' : 'Needs Improvement'
                    }
                },
                riskAnalysis: {
                    riskFactors: riskFactors,
                    overallRiskLevel: defaultProbability.riskLevel,
                    riskConcentration: this.analyzeRiskConcentration(),
                    sensitivityAnalysis: this.performSensitivityAnalysis()
                },
                recommendations: recommendations,
                lendingOptions: {
                    eligibleInstitutions: eligibleInstitutions,
                    suggestedLoanProducts: this.suggestLoanProducts(),
                    collateralRequirements: this.determineCollateralRequirements()
                },
                monitoringAndReview: {
                    recommendedReviewFrequency: this.determineReviewFrequency(),
                    keyMonitoringMetrics: this.identifyMonitoringMetrics(),
                    earlyWarningSignals: this.identifyEarlyWarningSignals()
                }
            };
            
        } catch (error) {
            console.error('Error generating risk report:', error);
            return {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    reportVersion: '2.0',
                    note: 'Limited report due to system error'
                },
                clientInfo: this.userInfo,
                error: 'Risk report generation failed: ' + error.message
            };
        }
    };
    
    /**
     * Identify key risk factors
     */
    RiskAssessment.prototype.identifyRiskFactors = function() {
        try {
            var riskFactors = [];
            var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis();
            var utilization = this.gradingEngine.getCreditUtilization();
            var defaulters = this.gradingEngine.identifyDefaulters();
            var defaultPatterns = this.analyzeDefaultPatterns();
            var creditAge = this.gradingEngine.getCreditAge();
            var debtBurden = this.calculateDebtBurdenScore();
            
            // Payment history risk factors
            if (paymentAnalysis.missedRate > 0.2) {
                riskFactors.push({
                    factor: 'Very High Missed Payment Rate',
                    severity: 'Critical',
                    description: 'Missed ' + (paymentAnalysis.missedRate * 100).toFixed(1) + '% of payments',
                    impact: 'Directly increases default probability by 20-30%',
                    mitigation: 'Require automatic payments or payment reminders'
                });
            } else if (paymentAnalysis.missedRate > 0.1) {
                riskFactors.push({
                    factor: 'High Missed Payment Rate',
                    severity: 'High',
                    description: 'Missed ' + (paymentAnalysis.missedRate * 100).toFixed(1) + '% of payments',
                    impact: 'Significantly increases default risk',
                    mitigation: 'Enhanced payment monitoring'
                });
            } else if (paymentAnalysis.delayedRate > 0.3) {
                riskFactors.push({
                    factor: 'High Delayed Payment Rate',
                    severity: 'Medium-High',
                    description: 'Delayed ' + (paymentAnalysis.delayedRate * 100).toFixed(1) + '% of payments',
                    impact: 'Indicates potential cash flow issues',
                    mitigation: 'Flexible payment schedule consideration'
                });
            }
            
            // Credit utilization risk factors
            if (utilization > 80) {
                riskFactors.push({
                    factor: 'Extremely High Credit Utilization',
                    severity: 'Critical',
                    description: 'Using ' + utilization.toFixed(1) + '% of available credit',
                    impact: 'Very high likelihood of future default',
                    mitigation: 'Debt consolidation or balance transfer required'
                });
            } else if (utilization > 70) {
                riskFactors.push({
                    factor: 'Very High Credit Utilization',
                    severity: 'High',
                    description: 'Using ' + utilization.toFixed(1) + '% of available credit',
                    impact: 'High default risk, limited borrowing capacity',
                    mitigation: 'Credit limit increase or debt reduction plan'
                });
            } else if (utilization > 50) {
                riskFactors.push({
                    factor: 'High Credit Utilization',
                    severity: 'Medium',
                    description: 'Using ' + utilization.toFixed(1) + '% of available credit',
                    impact: 'Above optimal utilization level',
                    mitigation: 'Recommend reducing to below 30%'
                });
            }
            
            // Default account risk factors
            if (defaulters.length > 0) {
                var severity = defaulters.length >= 3 ? 'Critical' : (defaulters.length >= 2 ? 'High' : 'Medium');
                riskFactors.push({
                    factor: 'Active Default Accounts',
                    severity: severity,
                    description: defaulters.length + ' account(s) with default indicators',
                    impact: 'Direct evidence of payment failure',
                    mitigation: 'Require settlement or rehabilitation before new credit'
                });
            }
            
            // Default pattern risk factors
            if (defaultPatterns.type === 'Willful') {
                riskFactors.push({
                    factor: 'Willful Default Pattern Detected',
                    severity: 'Critical',
                    description: 'Pattern suggests intentional default behavior',
                    impact: 'Very high probability of future intentional default',
                    mitigation: 'Require collateral or third-party guarantee'
                });
            } else if (defaultPatterns.type === 'Mixed Pattern') {
                riskFactors.push({
                    factor: 'Mixed Default Patterns',
                    severity: 'Medium-High',
                    description: 'Both willful and situational default indicators present',
                    impact: 'Uncertain default behavior pattern',
                    mitigation: 'Enhanced monitoring and conditional lending'
                });
            }
            
            // Credit history risk factors
            if (creditAge < 6) {
                riskFactors.push({
                    factor: 'Very Short Credit History',
                    severity: 'Medium',
                    description: 'Only ' + creditAge + ' months of credit history',
                    impact: 'Limited data for reliable risk assessment',
                    mitigation: 'Consider secured credit or smaller initial limit'
                });
            } else if (creditAge < 12) {
                riskFactors.push({
                    factor: 'Short Credit History',
                    severity: 'Low-Medium',
                    description: 'Only ' + creditAge + ' months of credit history',
                    impact: 'Limited historical performance data',
                    mitigation: 'Gradual credit limit increases based on performance'
                });
            }
            
            // Debt burden risk factors
            if (debtBurden > 60) {
                riskFactors.push({
                    factor: 'Very High Debt Burden',
                    severity: 'Critical',
                    description: 'Debt payments consume ' + debtBurden.toFixed(1) + '% of estimated income',
                    impact: 'Limited capacity for additional debt repayment',
                    mitigation: 'Debt restructuring before new credit'
                });
            } else if (debtBurden > 50) {
                riskFactors.push({
                    factor: 'High Debt Burden',
                    severity: 'High',
                    description: 'Debt payments consume ' + debtBurden.toFixed(1) + '% of estimated income',
                    impact: 'Reduced capacity for additional borrowing',
                    mitigation: 'Smaller loan amounts or longer tenures'
                });
            }
            
            // Employment stability risk factors
            var employmentData = this.creditReport.employment || [];
            if (employmentData.length === 0) {
                riskFactors.push({
                    factor: 'No Employment Information',
                    severity: 'Medium',
                    description: 'Employment status not available',
                    impact: 'Unable to assess income stability',
                    mitigation: 'Require income documentation'
                });
            } else {
                var occupationCode = employmentData[0].occupationCode;
                if (occupationCode === '07') { // Unemployed
                    riskFactors.push({
                        factor: 'Currently Unemployed',
                        severity: 'High',
                        description: 'No current employment income',
                        impact: 'No regular income for debt servicing',
                        mitigation: 'Require alternative income sources or collateral'
                    });
                } else if (occupationCode === '06') { // Daily wage
                    riskFactors.push({
                        factor: 'Daily Wage Employment',
                        severity: 'Medium-High',
                        description: 'Income may be irregular',
                        impact: 'Income volatility increases default risk',
                        mitigation: 'Require consistent employment history'
                    });
                }
            }
            
            // Sort by severity
            var severityOrder = { 'Critical': 1, 'Very High': 2, 'High': 3, 'Medium-High': 4, 'Medium': 5, 'Low-Medium': 6, 'Low': 7 };
            riskFactors.sort(function(a, b) {
                return severityOrder[a.severity] - severityOrder[b.severity];
            });
            
            return riskFactors;
            
        } catch (error) {
            console.error('Error identifying risk factors:', error);
            return [];
        }
    };
    
    /**
     * Analyze risk concentration
     */
    RiskAssessment.prototype.analyzeRiskConcentration = function() {
        try {
            var accounts = this.creditReport.accounts || [];
            var analysis = {
                lenderConcentration: {},
                productConcentration: {},
                riskDistribution: {
                    lowRisk: 0,
                    mediumRisk: 0,
                    highRisk: 0
                }
            };
            
            // Analyze lender concentration
            accounts.forEach(function(account) {
                var lender = account.memberShortName || 'Unknown';
                analysis.lenderConcentration[lender] = (analysis.lenderConcentration[lender] || 0) + 1;
            });
            
            // Analyze product concentration
            accounts.forEach(function(account) {
                var product = account.accountType || 'Unknown';
                analysis.productConcentration[product] = (analysis.productConcentration[product] || 0) + 1;
            });
            
            // Analyze risk distribution
            accounts.forEach(function(account) {
                var paymentData = this.gradingEngine.parsePaymentHistory(account);
                var overdue = this.gradingEngine.safeToNumber(account.amountOverdue);
                var balance = this.gradingEngine.safeToNumber(account.currentBalance);
                var limit = this.gradingEngine.safeToNumber(account.highCreditAmount);
                var utilization = limit > 0 ? (balance / limit) * 100 : 0;
                
                if (overdue > 0 || paymentData.missed > 0 || utilization > 90) {
                    analysis.riskDistribution.highRisk++;
                } else if (paymentData.delayed > 0 || utilization > 70) {
                    analysis.riskDistribution.mediumRisk++;
                } else {
                    analysis.riskDistribution.lowRisk++;
                }
            }, this);
            
            // Calculate concentration ratios
            var totalAccounts = accounts.length;
            if (totalAccounts > 0) {
                analysis.concentrationRatios = {
                    topLenderShare: this.calculateTopShare(analysis.lenderConcentration, totalAccounts),
                    topProductShare: this.calculateTopShare(analysis.productConcentration, totalAccounts),
                    highRiskShare: (analysis.riskDistribution.highRisk / totalAccounts) * 100
                };
            }
            
            return analysis;
            
        } catch (error) {
            return {};
        }
    };
    
    /**
     * Calculate top share for concentration analysis
     */
    RiskAssessment.prototype.calculateTopShare = function(distribution, total) {
        if (total === 0) return 0;
        
        var values = Object.values(distribution);
        var maxValue = Math.max(...values);
        return (maxValue / total) * 100;
    };
    
    /**
     * Perform sensitivity analysis
     */
    RiskAssessment.prototype.performSensitivityAnalysis = function() {
        try {
            var baseProbability = this.calculateDefaultProbability().probability;
            
            // Test different scenarios
            var scenarios = {
                baseCase: baseProbability,
                economicDownturn: baseProbability * 1.3, // 30% increase in downturn
                interestRateIncrease: baseProbability * 1.2, // 20% increase with higher rates
                incomeReduction: baseProbability * 1.4, // 40% increase with 20% income loss
                utilizationIncrease: this.calculateScenarioUtilizationIncrease(),
                paymentMissIncrease: this.calculateScenarioPaymentMissIncrease()
            };
            
            // Calculate scenario impacts
            var impacts = {};
            for (var scenario in scenarios) {
                if (scenario !== 'baseCase') {
                    impacts[scenario] = scenarios[scenario] - baseProbability;
                }
            }
            
            return {
                baseProbability: baseProbability,
                scenarios: scenarios,
                scenarioImpacts: impacts,
                mostSensitiveScenario: this.findMostSensitiveScenario(impacts),
                stressTestResult: this.performStressTest()
            };
            
        } catch (error) {
            return {
                baseProbability: 0,
                scenarios: {},
                scenarioImpacts: {},
                mostSensitiveScenario: 'Analysis Failed',
                stressTestResult: 'Unable to perform stress test'
            };
        }
    };
    
    /**
     * Calculate scenario: Utilization increase to 90%
     */
    RiskAssessment.prototype.calculateScenarioUtilizationIncrease = function() {
        var baseProbability = this.calculateDefaultProbability().probability;
        var currentUtilization = this.gradingEngine.getCreditUtilization();
        
        if (currentUtilization < 90) {
            var increaseFactor = (90 - currentUtilization) / 10; // Each 10% increase adds risk
            return baseProbability + (increaseFactor * 15); // 15% probability increase per 10% utilization
        }
        
        return baseProbability;
    };
    
    /**
     * Calculate scenario: Additional missed payment
     */
    RiskAssessment.prototype.calculateScenarioPaymentMissIncrease = function() {
        var baseProbability = this.calculateDefaultProbability().probability;
        var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis();
        
        // Each additional missed payment adds significant risk
        return baseProbability + (15 * 2); // 2 additional missed payments
    };
    
    /**
     * Find most sensitive scenario
     */
    RiskAssessment.prototype.findMostSensitiveScenario = function(impacts) {
        var maxImpact = 0;
        var mostSensitive = 'None';
        
        for (var scenario in impacts) {
            if (impacts[scenario] > maxImpact) {
                maxImpact = impacts[scenario];
                mostSensitive = scenario;
            }
        }
        
        return {
            scenario: mostSensitive,
            impact: maxImpact
        };
    };
    
    /**
     * Perform stress test
     */
    RiskAssessment.prototype.performStressTest = function() {
        try {
            var baseProbability = this.calculateDefaultProbability().probability;
            
            // Combined stress scenario: Economic downturn + interest rate increase + income reduction
            var stressProbability = baseProbability;
            stressProbability *= 1.3; // Economic downturn
            stressProbability *= 1.2; // Interest rate increase
            stressProbability *= 1.4; // Income reduction
            
            // Cap at 95%
            stressProbability = Math.min(95, stressProbability);
            
            return {
                stressScenario: 'Combined Economic Stress',
                stressProbability: Math.round(stressProbability),
                probabilityIncrease: Math.round(stressProbability - baseProbability),
                passesStressTest: stressProbability <= 70, // Pass if <=70% under stress
                bufferRequired: Math.max(0, stressProbability - 70)
            };
            
        } catch (error) {
            return {
                stressScenario: 'Stress Test Failed',
                stressProbability: 0,
                probabilityIncrease: 0,
                passesStressTest: false,
                bufferRequired: 0
            };
        }
    };
    
    /**
     * Get financial institutions that might still consider this client (Indian context)
     */
    RiskAssessment.prototype.getEligibleInstitutions = function() {
        try {
            var creditWorthiness = this.calculateCreditWorthiness();
            var defaultProbability = this.calculateDefaultProbability();
            var grade = this.gradingEngine.calculateOverallGrade();
            var defaulters = this.gradingEngine.identifyDefaulters();
            var hasDefaulters = defaulters.length > 0;
            
            // Define institution risk profiles for Indian market
            var institutions = [
                // Tier 1: Prime Lenders (Very Strict)
                {
                    name: 'State Bank of India (SBI)',
                    type: 'Public Sector Bank',
                    minGrade: 'B+',
                    maxDefaultProbability: 25,
                    acceptsDefaulters: false,
                    minCreditWorthiness: 80,
                    interestRate: '8.5-11.5%',
                    loanTypes: ['Home Loan', 'Personal Loan', 'Car Loan'],
                    description: 'Largest public sector bank, very conservative lending'
                },
                {
                    name: 'HDFC Bank',
                    type: 'Private Bank',
                    minGrade: 'B+',
                    maxDefaultProbability: 30,
                    acceptsDefaulters: false,
                    minCreditWorthiness: 75,
                    interestRate: '10-14%',
                    loanTypes: ['Personal Loan', 'Credit Card', 'Business Loan'],
                    description: 'Top private bank, stringent credit standards'
                },
                {
                    name: 'ICICI Bank',
                    type: 'Private Bank',
                    minGrade: 'B',
                    maxDefaultProbability: 35,
                    acceptsDefaulters: false,
                    minCreditWorthiness: 70,
                    interestRate: '11-15%',
                    loanTypes: ['Personal Loan', 'Credit Card', 'Gold Loan'],
                    description: 'Major private bank, comprehensive risk assessment'
                },
                
                // Tier 2: Moderate Lenders
                {
                    name: 'Axis Bank',
                    type: 'Private Bank',
                    minGrade: 'C+',
                    maxDefaultProbability: 45,
                    acceptsDefaulters: true,
                    minCreditWorthiness: 65,
                    interestRate: '12-17%',
                    loanTypes: ['Personal Loan', 'Credit Card', 'Education Loan'],
                    description: 'Private bank with moderate risk appetite'
                },
                {
                    name: 'Kotak Mahindra Bank',
                    type: 'Private Bank',
                    minGrade: 'C',
                    maxDefaultProbability: 50,
                    acceptsDefaulters: true,
                    minCreditWorthiness: 60,
                    interestRate: '13-18%',
                    loanTypes: ['Personal Loan', 'Business Loan', 'Secured Credit Card'],
                    description: 'Tech-focused bank, innovative credit products'
                },
                
                // Tier 3: Flexible Lenders
                {
                    name: 'Yes Bank',
                    type: 'Private Bank',
                    minGrade: 'C',
                    maxDefaultProbability: 60,
                    acceptsDefaulters: true,
                    minCreditWorthiness: 55,
                    interestRate: '14-20%',
                    loanTypes: ['Personal Loan', 'Small Business Loan'],
                    description: 'Flexible lending for various profiles'
                },
                {
                    name: 'IndusInd Bank',
                    type: 'Private Bank',
                    minGrade: 'C',
                    maxDefaultProbability: 65,
                    acceptsDefaulters: true,
                    minCreditWorthiness: 50,
                    interestRate: '15-22%',
                    loanTypes: ['Personal Loan', 'Used Car Loan'],
                    description: 'Specialized lending for different segments'
                },
                
                // Tier 4: NBFCs (More Flexible)
                {
                    name: 'Bajaj Finance',
                    type: 'NBFC',
                    minGrade: 'D+',
                    maxDefaultProbability: 70,
                    acceptsDefaulters: true,
                    minCreditWorthiness: 45,
                    interestRate: '14-24%',
                    loanTypes: ['Personal Loan', 'Consumer Durable', 'Business Loan'],
                    description: 'Leading NBFC, higher risk tolerance'
                },
                {
                    name: 'HDB Financial Services',
                    type: 'NBFC',
                    minGrade: 'D',
                    maxDefaultProbability: 75,
                    acceptsDefaulters: true,
                    minCreditWorthiness: 40,
                    interestRate: '16-28%',
                    loanTypes: ['Personal Loan', 'Two-Wheeler Loan'],
                    description: 'HDFC group NBFC for subprime lending'
                },
                {
                    name: 'Aditya Birla Finance',
                    type: 'NBFC',
                    minGrade: 'D',
                    maxDefaultProbability: 80,
                    acceptsDefaulters: true,
                    minCreditWorthiness: 35,
                    interestRate: '18-30%',
                    loanTypes: ['Personal Loan', 'Loan Against Property'],
                    description: 'Flexible lending with various collateral options'
                },
                
                // Tier 5: FinTech Lenders (Most Flexible)
                {
                    name: 'EarlySalary',
                    type: 'FinTech',
                    minGrade: 'D',
                    maxDefaultProbability: 85,
                    acceptsDefaulters: true,
                    minCreditWorthiness: 30,
                    interestRate: '24-36%',
                    loanTypes: ['Salary Advance', 'Small Personal Loan'],
                    description: 'Instant approval for salaried individuals'
                },
                {
                    name: 'MoneyTap',
                    type: 'FinTech',
                    minGrade: 'D',
                    maxDefaultProbability: 90,
                    acceptsDefaulters: true,
                    minCreditWorthiness: 25,
                    interestRate: '18-36%',
                    loanTypes: ['Credit Line', 'Personal Loan'],
                    description: 'Flexible credit line with interest only on amount used'
                },
                {
                    name: 'Lendingkart',
                    type: 'FinTech',
                    minGrade: 'D',
                    maxDefaultProbability: 95,
                    acceptsDefaulters: true,
                    minCreditWorthiness: 20,
                    interestRate: '18-30%',
                    loanTypes: ['Business Loan', 'Working Capital'],
                    description: 'Business loans for SMEs and entrepreneurs'
                }
            ];
            
            var gradeOrder = ['F', 'E', 'E+', 'D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
            var clientGradeIndex = gradeOrder.indexOf(grade);
            if (clientGradeIndex === -1) clientGradeIndex = 0;
            
            // Filter eligible institutions
            var eligibleInstitutions = institutions.filter(function(institution) {
                var minGradeIndex = gradeOrder.indexOf(institution.minGrade);
                
                // Check grade requirement
                if (clientGradeIndex < minGradeIndex) return false;
                
                // Check default probability requirement
                if (defaultProbability.probability > institution.maxDefaultProbability) return false;
                
                // Check credit worthiness requirement
                if (creditWorthiness.score < institution.minCreditWorthiness) return false;
                
                // Check if bank accepts defaulters
                if (hasDefaulters && !institution.acceptsDefaulters) return false;
                
                return true;
            });
            
            // Calculate approval probability for each eligible institution
            eligibleInstitutions.forEach(function(institution) {
                var baseProbability = 60;
                
                // Adjust based on grade difference
                var minGradeIndex = gradeOrder.indexOf(institution.minGrade);
                var gradeDifference = clientGradeIndex - minGradeIndex;
                baseProbability += gradeDifference * 5;
                
                // Adjust based on default probability margin
                var defaultMargin = institution.maxDefaultProbability - defaultProbability.probability;
                baseProbability += defaultMargin * 0.5;
                
                // Adjust based on credit worthiness margin
                var worthinessMargin = creditWorthiness.score - institution.minCreditWorthiness;
                baseProbability += worthinessMargin * 0.3;
                
                // Penalize for defaulters
                if (hasDefaulters) baseProbability -= 10;
                
                institution.approvalProbability = Math.min(95, Math.max(5, Math.round(baseProbability)));
                
                // Add recommendation
                if (institution.approvalProbability >= 80) {
                    institution.recommendation = 'Strong Candidate';
                } else if (institution.approvalProbability >= 60) {
                    institution.recommendation = 'Good Candidate';
                } else if (institution.approvalProbability >= 40) {
                    institution.recommendation = 'Moderate Chance';
                } else {
                    institution.recommendation = 'Low Chance - Consider Alternatives';
                }
            });
            
            // Sort by approval probability (highest first)
            eligibleInstitutions.sort(function(a, b) {
                return b.approvalProbability - a.approvalProbability;
            });
            
            // Limit to top 8 suggestions
            return eligibleInstitutions.slice(0, 8);
            
        } catch (error) {
            console.error('Error getting eligible institutions:', error);
            return [];
        }
    };
    
    /**
     * Suggest appropriate loan products
     */
    RiskAssessment.prototype.suggestLoanProducts = function() {
        try {
            var grade = this.gradingEngine.calculateOverallGrade();
            var creditWorthiness = this.calculateCreditWorthiness();
            var defaulters = this.gradingEngine.identifyDefaulters();
            var hasDefaulters = defaulters.length > 0;
            
            var suggestedProducts = [];
            
            // For prime borrowers
            if (grade >= 'B+' && creditWorthiness.score >= 80 && !hasDefaulters) {
                suggestedProducts.push({
                    product: 'Unsecured Personal Loan',
                    amountRange: '₹1-25 Lakhs',
                    tenure: '1-5 years',
                    interestRate: '10-14%',
                    features: ['No collateral required', 'Quick disbursal', 'Flexible tenure']
                });
                
                suggestedProducts.push({
                    product: 'Credit Card with High Limit',
                    limitRange: '₹1-10 Lakhs',
                    features: ['Reward points', 'Cashback offers', 'Interest-free period', 'Travel benefits']
                });
            }
            
            // For credit worthy borrowers
            if (grade >= 'C+' && creditWorthiness.score >= 65) {
                suggestedProducts.push({
                    product: 'Secured Personal Loan',
                    amountRange: '₹50,000-10 Lakhs',
                    tenure: '6 months - 3 years',
                    interestRate: '12-18%',
                    features: ['Lower interest than unsecured', 'Collateral required', 'Faster approval']
                });
                
                if (!hasDefaulters) {
                    suggestedProducts.push({
                        product: 'Standard Credit Card',
                        limitRange: '₹50,000-2 Lakhs',
                        features: ['Basic rewards', 'Online shopping protection', 'Fuel surcharge waiver']
                    });
                }
            }
            
            // For subprime borrowers or those with defaulters
            if (grade <= 'C' || hasDefaulters) {
                suggestedProducts.push({
                    product: 'Secured Credit Card',
                    depositRange: '₹10,000-1 Lakh',
                    limit: '80-100% of deposit',
                    features: ['Build/repair credit', 'Deposit acts as collateral', 'Reported to credit bureaus']
                });
                
                suggestedProducts.push({
                    product: 'Small Personal Loan against Collateral',
                    amountRange: '₹25,000-5 Lakhs',
                    collateral: ['Gold', 'Fixed Deposit', 'Property'],
                    interestRate: '14-24%',
                    features: ['Collateral-based', 'Lower risk for lender', 'Credit rebuilding opportunity']
                });
            }
            
            // For business owners/self-employed
            var employmentData = this.creditReport.employment || [];
            if (employmentData.length > 0) {
                var occupationCode = employmentData[0].occupationCode;
                if (occupationCode === '04' || occupationCode === '05') { // Self-employed or Business
                    suggestedProducts.push({
                        product: 'Business Loan',
                        amountRange: '₹1-50 Lakhs',
                        tenure: '1-7 years',
                        interestRate: '14-20%',
                        features: ['For business expansion', 'Working capital', 'Equipment purchase'],
                        requirements: ['Business proof', 'ITR for 2-3 years', 'Business bank statements']
                    });
                }
            }
            
            return suggestedProducts;
            
        } catch (error) {
            return [];
        }
    };
    
    /**
     * Determine collateral requirements
     */
    RiskAssessment.prototype.determineCollateralRequirements = function() {
        try {
            var grade = this.gradingEngine.calculateOverallGrade();
            var creditWorthiness = this.calculateCreditWorthiness();
            var defaulters = this.gradingEngine.identifyDefaulters();
            var defaultProbability = this.calculateDefaultProbability();
            
            var requirements = {
                isCollateralRequired: false,
                recommendedCollateralType: 'None',
                collateralCoverage: '0%',
                alternativeOptions: []
            };
            
            // Determine if collateral is required
            if (defaultProbability.probability > 60 || defaulters.length > 0 || grade <= 'C' || creditWorthiness.score < 50) {
                requirements.isCollateralRequired = true;
                
                if (defaultProbability.probability > 75 || defaulters.length >= 2) {
                    requirements.recommendedCollateralType = 'Property or Fixed Deposit';
                    requirements.collateralCoverage = '150% of loan amount';
                } else if (defaultProbability.probability > 60 || defaulters.length > 0) {
                    requirements.recommendedCollateralType = 'Gold or Fixed Deposit';
                    requirements.collateralCoverage = '125% of loan amount';
                } else {
                    requirements.recommendedCollateralType = 'Fixed Deposit or Insurance Policy';
                    requirements.collateralCoverage = '110% of loan amount';
                }
            }
            
            // Alternative options if collateral cannot be provided
            if (requirements.isCollateralRequired) {
                requirements.alternativeOptions = [
                    'Third-party guarantee from credit-worthy individual',
                    'Co-borrower with good credit history',
                    'Credit insurance',
                    'Lower loan amount to reduce risk exposure'
                ];
            }
            
            return requirements;
            
        } catch (error) {
            return {
                isCollateralRequired: true,
                recommendedCollateralType: 'Manual Assessment Required',
                collateralCoverage: '100%',
                alternativeOptions: ['Manual underwriting recommended']
            };
        }
    };
    
    /**
     * Determine review frequency for monitoring
     */
    RiskAssessment.prototype.determineReviewFrequency = function() {
        try {
            var defaultProbability = this.calculateDefaultProbability();
            var creditWorthiness = this.calculateCreditWorthiness();
            var defaulters = this.gradingEngine.identifyDefaulters();
            
            if (defaultProbability.probability > 70 || defaulters.length > 0 || creditWorthiness.isSubprimeBorrower) {
                return 'Monthly review for first 6 months, then quarterly';
            } else if (defaultProbability.probability > 50 || !creditWorthiness.isPrimeBorrower) {
                return 'Quarterly review for first year, then semi-annually';
            } else {
                return 'Semi-annual review';
            }
            
        } catch (error) {
            return 'Quarterly review recommended';
        }
    };
    
    /**
     * Identify key monitoring metrics
     */
    RiskAssessment.prototype.identifyMonitoringMetrics = function() {
        return [
            'Monthly payment performance',
            'Credit utilization ratio',
            'New credit inquiries',
            'Changes in employment status',
            'Overall credit score trends',
            'Debt-to-income ratio',
            'Account status changes (new defaults, settlements)'
        ];
    };
    
    /**
     * Identify early warning signals
     */
    RiskAssessment.prototype.identifyEarlyWarningSignals = function() {
        var signals = [];
        var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis();
        var utilization = this.gradingEngine.getCreditUtilization();
        
        if (paymentAnalysis.missedRate > 0) {
            signals.push('Any additional missed payments');
        }
        
        if (utilization > 50) {
            signals.push('Utilization exceeding 60%');
        }
        
        if (paymentAnalysis.delayedRate > 0.2) {
            signals.push('Pattern of delayed payments becoming more frequent');
        }
        
        signals.push('Multiple new credit inquiries within 30 days');
        signals.push('Sudden increase in overall debt');
        signals.push('Change to unemployed status');
        
        return signals;
    };
    
    module.exports = RiskAssessment;
    
})();