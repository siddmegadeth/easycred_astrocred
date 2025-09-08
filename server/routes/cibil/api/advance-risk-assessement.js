(function() {

    var EconomicDataService = require('./economic-data-services.js');


    function AdvancedRiskAssessment(cibilData, gradingEngine, riskAssessment) {
        this.cibilData = cibilData;
        this.gradingEngine = gradingEngine;
        this.riskAssessment = riskAssessment;
        this.economicDataService = new EconomicDataService();
    }

    // Enhanced risk assessment with economic factors
    AdvancedRiskAssessment.prototype.getEnhancedRiskAssessment = function(callback) {
        var self = this;

        self.economicDataService.getEconomicData(function(err, economicData) {
            if (err) {
                callback(err, null);
                return;
            }

            var baseRisk = self.riskAssessment.calculateDefaultProbability();
            var enhancedRisk = self.applyEconomicFactors(baseRisk, economicData);
            var incomeAdjustedRisk = self.applyIncomeFactors(enhancedRisk);
            var sentimentAdjustedRisk = self.applyMarketSentiment(incomeAdjustedRisk, economicData);

            callback(null, {
                baseRisk: baseRisk,
                enhancedRisk: sentimentAdjustedRisk,
                economicData: economicData,
                riskFactors: self.identifyEconomicRiskFactors(economicData),
                recommendation: self.generateEconomicRecommendation(sentimentAdjustedRisk, economicData)
            });
        });
    };

    // Apply economic factors to risk assessment
    AdvancedRiskAssessment.prototype.applyEconomicFactors = function(baseRisk, economicData) {
        var adjustedProbability = baseRisk.probability;

        // Adjust based on GDP growth
        if (economicData.gdpGrowth < 5) {
            adjustedProbability += 10;
        } else if (economicData.gdpGrowth > 7) {
            adjustedProbability -= 5;
        }

        // Adjust based on inflation
        if (economicData.inflationRate > 6) {
            adjustedProbability += 8;
        } else if (economicData.inflationRate < 2) {
            adjustedProbability -= 3;
        }

        // Adjust based on repo rate (monetary policy)
        if (economicData.repoRate > 7) {
            adjustedProbability += 7;
        } else if (economicData.repoRate < 5) {
            adjustedProbability -= 4;
        }

        // Adjust based on unemployment
        if (economicData.unemploymentRate > 8) {
            adjustedProbability += 6;
        } else if (economicData.unemploymentRate < 5) {
            adjustedProbability -= 3;
        }

        return {
            probability: Math.min(95, Math.max(5, adjustedProbability)),
            riskLevel: this.getRiskLevel(adjustedProbability),
            factors: baseRisk.factors,
            economicAdjustments: {
                gdpImpact: economicData.gdpGrowth < 5 ? '+10' : economicData.gdpGrowth > 7 ? '-5' : '0',
                inflationImpact: economicData.inflationRate > 6 ? '+8' : economicData.inflationRate < 2 ? '-3' : '0',
                repoRateImpact: economicData.repoRate > 7 ? '+7' : economicData.repoRate < 5 ? '-4' : '0',
                unemploymentImpact: economicData.unemploymentRate > 8 ? '+6' : economicData.unemploymentRate < 5 ? '-3' : '0'
            }
        };
    };

    // Apply income factors to risk assessment
    AdvancedRiskAssessment.prototype.applyIncomeFactors = function(riskAssessment) {
        var incomeStabilityScore = this.calculateIncomeStability();
        var incomeGrowthScore = this.calculateIncomeGrowth();

        var adjustedProbability = riskAssessment.probability;

        // Adjust based on income stability
        if (incomeStabilityScore < 50) {
            adjustedProbability += 8;
        } else if (incomeStabilityScore > 80) {
            adjustedProbability -= 5;
        }

        // Adjust based on income growth
        if (incomeGrowthScore < 0) {
            adjustedProbability += 5;
        } else if (incomeGrowthScore > 5) {
            adjustedProbability -= 3;
        }

        return {
            probability: Math.min(95, Math.max(5, adjustedProbability)),
            riskLevel: this.getRiskLevel(adjustedProbability),
            factors: riskAssessment.factors,
            incomeFactors: {
                stabilityScore: incomeStabilityScore,
                growthScore: incomeGrowthScore,
                stabilityImpact: incomeStabilityScore < 50 ? '+8' : incomeStabilityScore > 80 ? '-5' : '0',
                growthImpact: incomeGrowthScore < 0 ? '+5' : incomeGrowthScore > 5 ? '-3' : '0'
            }
        };
    };

    // Apply market sentiment to risk assessment
    AdvancedRiskAssessment.prototype.applyMarketSentiment = function(riskAssessment, economicData) {
        var adjustedProbability = riskAssessment.probability;

        // Adjust based on market sentiment
        if (economicData.marketSentiment < 40) {
            adjustedProbability += 10;
        } else if (economicData.marketSentiment < 60) {
            adjustedProbability += 5;
        } else if (economicData.marketSentiment > 80) {
            adjustedProbability -= 5;
        }

        return {
            probability: Math.min(95, Math.max(5, adjustedProbability)),
            riskLevel: this.getRiskLevel(adjustedProbability),
            factors: riskAssessment.factors,
            sentimentImpact: economicData.marketSentiment < 40 ? '+10' : economicData.marketSentiment < 60 ? '+5' : economicData.marketSentiment > 80 ? '-5' : '0'
        };
    };

    // Calculate income stability (simulated)
    AdvancedRiskAssessment.prototype.calculateIncomeStability = function() {
        var employmentData = this.cibilData.credit_report[0].employment;
        var paymentHistory = this.gradingEngine.getOverallPaymentAnalysis();

        var stabilityScore = 70;

        // Adjust based on employment history
        if (employmentData && employmentData.length > 0) {
            if (employmentData[0].occupationCode === '01') {
                stabilityScore += 20;
            } else if (employmentData[0].occupationCode === '02') {
                stabilityScore += 10;
            }
        }

        // Adjust based on payment history
        if (paymentHistory.missedRate > 0.2) {
            stabilityScore -= 25;
        } else if (paymentHistory.missedRate > 0.1) {
            stabilityScore -= 15;
        } else if (paymentHistory.missedRate < 0.05) {
            stabilityScore += 10;
        }

        return Math.min(100, Math.max(0, stabilityScore));
    };

    // Calculate income growth (simulated)
    AdvancedRiskAssessment.prototype.calculateIncomeGrowth = function() {
        var accounts = this.cibilData.credit_report[0].accounts;
        var creditLimitIncreases = 0;

        // Count credit limit increases (as a proxy for income growth)
        accounts.forEach(function(account) {
            if (account.highCreditAmount > (account.sanctionedAmount * 0.8)) {
                creditLimitIncreases += 1;
            }
        });

        // Simulate growth based on credit behavior
        var growthScore = 2;

        if (creditLimitIncreases > 2) {
            growthScore += 3;
        } else if (creditLimitIncreases > 0) {
            growthScore += 1;
        }

        // Adjust based on recent inquiries (new credit applications)
        var recentInquiries = this.cibilData.credit_report[0].enquiries.filter(function(inquiry) {
            var inquiryDate = new Date(inquiry.enquiryDate);
            return new Date() - inquiryDate < 6 * 30 * 24 * 60 * 60 * 1000;
        }).length;

        if (recentInquiries > 3) {
            growthScore -= 2;
        }

        return growthScore;
    };

    // Identify economic risk factors
    AdvancedRiskAssessment.prototype.identifyEconomicRiskFactors = function(economicData) {
        var riskFactors = [];

        if (economicData.gdpGrowth < 5) {
            riskFactors.push({
                factor: 'Low GDP Growth',
                severity: 'High',
                description: 'Economic growth below 5% may increase credit risk across the system'
            });
        }

        if (economicData.inflationRate > 6) {
            riskFactors.push({
                factor: 'High Inflation',
                severity: 'High',
                description: 'Inflation above 6% may erode purchasing power and increase default risk'
            });
        }

        if (economicData.repoRate > 7) {
            riskFactors.push({
                factor: 'High Interest Rates',
                severity: 'Medium',
                description: 'High repo rate may increase borrowing costs and debt servicing burden'
            });
        }

        if (economicData.unemploymentRate > 8) {
            riskFactors.push({
                factor: 'High Unemployment',
                severity: 'High',
                description: 'Unemployment above 8% may indicate economic weakness and higher default risk'
            });
        }

        if (economicData.marketSentiment < 40) {
            riskFactors.push({
                factor: 'Negative Market Sentiment',
                severity: 'Medium',
                description: 'Poor market sentiment may indicate broader economic concerns'
            });
        }

        return riskFactors;
    };

    // Generate economic-based recommendations
    AdvancedRiskAssessment.prototype.generateEconomicRecommendation = function(riskAssessment, economicData) {
        var recommendations = [];

        if (riskAssessment.probability > 60) {
            recommendations.push({
                priority: 'High',
                action: 'Consider secured lending options due to high risk environment',
                rationale: 'High default probability combined with economic factors suggests need for collateral'
            });
        }

        if (economicData.inflationRate > 6) {
            recommendations.push({
                priority: 'Medium',
                action: 'Adjust credit limits for inflation sensitivity',
                rationale: 'High inflation may impact borrower repayment capacity'
            });
        }

        if (economicData.repoRate > 7) {
            recommendations.push({
                priority: 'Medium',
                action: 'Review interest rate pricing for new loans',
                rationale: 'High repo rate increases cost of funds, may need to adjust lending rates'
            });
        }

        if (economicData.marketSentiment < 40) {
            recommendations.push({
                priority: 'Low',
                action: 'Monitor portfolio more frequently during negative sentiment periods',
                rationale: 'Negative market sentiment may precede broader economic challenges'
            });
        }

        return recommendations;
    };

    // Convert probability to risk level
    AdvancedRiskAssessment.prototype.getRiskLevel = function(probability) {
        if (probability < 20) return 'Low';
        if (probability < 40) return 'Moderate';
        if (probability < 60) return 'Medium';
        if (probability < 80) return 'High';
        return 'Very High';
    };

    // Get financial institutions that might still consider this client
    AdvancedRiskAssessment.prototype.getEligibleInstitutions = function() {
        var creditWorthiness = this.riskAssessment.calculateCreditWorthiness();
        var defaultProbability = this.riskAssessment.calculateDefaultProbability();
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

    module.exports = AdvancedRiskAssessment;
})();