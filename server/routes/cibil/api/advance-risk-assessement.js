(function() {
    var EconomicDataService = require('./economic-data-services.js');

    function AdvancedRiskAssessment(cibilData, gradingEngine, riskAssessment) {
        this.cibilData = cibilData;
        this.gradingEngine = gradingEngine;
        this.riskAssessment = riskAssessment;
        this.economicDataService = new EconomicDataService();
        
        // Extract user identifiers from updated schema
        this.userIdentifiers = {
            mobile: cibilData.mobile || null,
            email: cibilData.email || null,
            pan: cibilData.pan || null,
            name: cibilData.name || null
        };
    }

    // Enhanced risk assessment with economic factors
    AdvancedRiskAssessment.prototype.getEnhancedRiskAssessment = function(callback) {
        var self = this;

        // Validate required data
        if (!self.cibilData || !self.cibilData.credit_report || self.cibilData.credit_report.length === 0) {
            return callback(new Error('Invalid CIBIL data structure'), null);
        }

        // Log user identification
        console.log(`Risk assessment for user: ${self.userIdentifiers.name}, Mobile: ${self.userIdentifiers.mobile}, PAN: ${self.userIdentifiers.pan}`);

        self.economicDataService.getEconomicData(function(err, economicData) {
            if (err) {
                console.error('Error fetching economic data:', err.message);
                // Fallback to default economic data
                economicData = self.getDefaultEconomicData();
            }

            try {
                var baseRisk = self.riskAssessment.calculateDefaultProbability();
                var enhancedRisk = self.applyEconomicFactors(baseRisk, economicData);
                var incomeAdjustedRisk = self.applyIncomeFactors(enhancedRisk);
                var sentimentAdjustedRisk = self.applyMarketSentiment(incomeAdjustedRisk, economicData);

                var result = {
                    userInfo: {
                        name: self.userIdentifiers.name,
                        mobile: self.userIdentifiers.mobile,
                        email: self.userIdentifiers.email,
                        pan: self.userIdentifiers.pan,
                        creditScore: self.cibilData.credit_score || 'N/A'
                    },
                    baseRisk: baseRisk,
                    enhancedRisk: sentimentAdjustedRisk,
                    economicData: economicData,
                    riskFactors: self.identifyEconomicRiskFactors(economicData),
                    recommendations: self.generateEconomicRecommendation(sentimentAdjustedRisk, economicData),
                    eligibleInstitutions: self.getEligibleInstitutions(),
                    analysisTimestamp: new Date().toISOString()
                };

                callback(null, result);
            } catch (error) {
                console.error('Error in risk assessment calculation:', error);
                callback(error, null);
            }
        });
    };

    // Apply economic factors to risk assessment
    AdvancedRiskAssessment.prototype.applyEconomicFactors = function(baseRisk, economicData) {
        var adjustedProbability = baseRisk.probability || 50;

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

        // Adjust based on sectoral performance if available
        if (economicData.sectorPerformance) {
            var employmentSector = this.getUserEmploymentSector();
            if (employmentSector && economicData.sectorPerformance[employmentSector] < 0) {
                adjustedProbability += 5;
            }
        }

        return {
            probability: Math.min(95, Math.max(5, adjustedProbability)),
            riskLevel: this.getRiskLevel(adjustedProbability),
            factors: baseRisk.factors || [],
            economicAdjustments: {
                gdpImpact: economicData.gdpGrowth < 5 ? '+10%' : economicData.gdpGrowth > 7 ? '-5%' : '0%',
                inflationImpact: economicData.inflationRate > 6 ? '+8%' : economicData.inflationRate < 2 ? '-3%' : '0%',
                repoRateImpact: economicData.repoRate > 7 ? '+7%' : economicData.repoRate < 5 ? '-4%' : '0%',
                unemploymentImpact: economicData.unemploymentRate > 8 ? '+6%' : economicData.unemploymentRate < 5 ? '-3%' : '0%',
                sectorImpact: economicData.sectorPerformance ? this.getUserSectorImpact(economicData) : 'N/A'
            },
            confidenceScore: this.calculateConfidenceScore(adjustedProbability, baseRisk)
        };
    };

    // Apply income factors to risk assessment
    AdvancedRiskAssessment.prototype.applyIncomeFactors = function(riskAssessment) {
        var incomeStabilityScore = this.calculateIncomeStability();
        var incomeGrowthScore = this.calculateIncomeGrowth();
        var industryRiskScore = this.calculateIndustryRisk();

        var adjustedProbability = riskAssessment.probability || 50;

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

        // Adjust based on industry risk
        if (industryRiskScore > 70) {
            adjustedProbability += 7;
        } else if (industryRiskScore < 30) {
            adjustedProbability -= 4;
        }

        return {
            probability: Math.min(95, Math.max(5, adjustedProbability)),
            riskLevel: this.getRiskLevel(adjustedProbability),
            factors: riskAssessment.factors || [],
            incomeFactors: {
                stabilityScore: incomeStabilityScore,
                growthScore: incomeGrowthScore,
                industryRiskScore: industryRiskScore,
                stabilityImpact: incomeStabilityScore < 50 ? '+8%' : incomeStabilityScore > 80 ? '-5%' : '0%',
                growthImpact: incomeGrowthScore < 0 ? '+5%' : incomeGrowthScore > 5 ? '-3%' : '0%',
                industryImpact: industryRiskScore > 70 ? '+7%' : industryRiskScore < 30 ? '-4%' : '0%'
            }
        };
    };

    // Calculate income stability
    AdvancedRiskAssessment.prototype.calculateIncomeStability = function() {
        try {
            var creditReport = this.cibilData.credit_report[0];
            var employmentData = creditReport.employment || [];
            var paymentHistory = this.gradingEngine.getOverallPaymentAnalysis ? 
                this.gradingEngine.getOverallPaymentAnalysis() : { missedRate: 0.1 };

            var stabilityScore = 70;

            // Adjust based on employment history
            if (employmentData.length > 0) {
                var occupationCode = employmentData[0].occupationCode || '00';
                
                // Occupation code mapping (Indian context)
                var occupationStability = {
                    '01': 20, // Professional (Doctor, Engineer, CA)
                    '02': 15, // Salaried - Government
                    '03': 10, // Salaried - Private
                    '04': 5,  // Self-employed
                    '05': 0,  // Business
                    '06': -5, // Daily wage
                    '07': -10 // Unemployed
                };
                
                stabilityScore += occupationStability[occupationCode] || 0;
            }

            // Adjust based on employment duration
            var currentEmployment = employmentData.find(function(emp) {
                return emp.accountType === 'Current Employment';
            });
            
            if (currentEmployment && currentEmployment.dateReported) {
                var employmentDuration = this.calculateMonthsSince(currentEmployment.dateReported);
                if (employmentDuration > 60) stabilityScore += 15; // 5+ years
                else if (employmentDuration > 36) stabilityScore += 10; // 3+ years
                else if (employmentDuration > 24) stabilityScore += 5; // 2+ years
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
        } catch (error) {
            console.error('Error calculating income stability:', error);
            return 50; // Default median score
        }
    };

    // Calculate income growth
    AdvancedRiskAssessment.prototype.calculateIncomeGrowth = function() {
        try {
            var accounts = this.cibilData.credit_report[0].accounts || [];
            var creditLimitIncreases = 0;

            // Count credit limit increases
            accounts.forEach(function(account) {
                if (account.highCreditAmount && account.sanctionedAmount) {
                    if (account.highCreditAmount > account.sanctionedAmount * 0.8) {
                        creditLimitIncreases += 1;
                    }
                }
            });

            // Simulate growth based on credit behavior
            var growthScore = 2;

            if (creditLimitIncreases > 2) {
                growthScore += 3;
            } else if (creditLimitIncreases > 0) {
                growthScore += 1;
            }

            // Adjust based on recent inquiries
            var enquiries = this.cibilData.credit_report[0].enquiries || [];
            var recentInquiries = enquiries.filter(function(inquiry) {
                if (!inquiry.enquiryDate) return false;
                var inquiryDate = new Date(inquiry.enquiryDate);
                var sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                return inquiryDate > sixMonthsAgo;
            }).length;

            if (recentInquiries > 3) {
                growthScore -= 2;
            } else if (recentInquiries > 0) {
                growthScore += 1; // Some credit activity is positive
            }

            // Adjust based on new accounts opened in last year
            var recentAccounts = accounts.filter(function(account) {
                if (!account.dateOpened) return false;
                var openedDate = new Date(account.dateOpened);
                var oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                return openedDate > oneYearAgo;
            }).length;

            if (recentAccounts > 0 && recentAccounts <= 2) {
                growthScore += 1;
            } else if (recentAccounts > 2) {
                growthScore -= 1;
            }

            return growthScore;
        } catch (error) {
            console.error('Error calculating income growth:', error);
            return 0; // Default neutral growth
        }
    };

    // Calculate industry risk
    AdvancedRiskAssessment.prototype.calculateIndustryRisk = function() {
        try {
            var employmentData = this.cibilData.credit_report[0].employment || [];
            var occupationCode = employmentData.length > 0 ? employmentData[0].occupationCode : '00';
            
            // Industry risk mapping (Indian context)
            var industryRiskMapping = {
                '01': 20, // Professional services (low risk)
                '02': 15, // Government (low risk)
                '03': 40, // IT/Tech (medium-low risk)
                '04': 60, // Manufacturing (medium risk)
                '05': 70, // Retail/Business (medium-high risk)
                '06': 85, // Construction (high risk)
                '07': 90, // Hospitality/Tourism (high risk)
                '08': 95, // Real Estate (very high risk)
                '09': 75, // Banking/Finance (medium risk)
                '10': 50  // Education (medium-low risk)
            };

            return industryRiskMapping[occupationCode] || 50; // Default medium risk
        } catch (error) {
            console.error('Error calculating industry risk:', error);
            return 50;
        }
    };

    // Get user's employment sector
    AdvancedRiskAssessment.prototype.getUserEmploymentSector = function() {
        try {
            var employmentData = this.cibilData.credit_report[0].employment || [];
            if (employmentData.length === 0) return null;
            
            var occupationCode = employmentData[0].occupationCode;
            
            // Map occupation codes to sectors
            var sectorMapping = {
                '01': 'professional_services',
                '02': 'government',
                '03': 'it_services',
                '04': 'manufacturing',
                '05': 'retail',
                '06': 'construction',
                '07': 'hospitality',
                '08': 'real_estate',
                '09': 'financial_services',
                '10': 'education'
            };
            
            return sectorMapping[occupationCode] || 'other';
        } catch (error) {
            console.error('Error getting employment sector:', error);
            return null;
        }
    };

    // Get sector-specific impact
    AdvancedRiskAssessment.prototype.getUserSectorImpact = function(economicData) {
        var sector = this.getUserEmploymentSector();
        if (!sector || !economicData.sectorPerformance || !economicData.sectorPerformance[sector]) {
            return 'N/A';
        }
        
        var performance = economicData.sectorPerformance[sector];
        if (performance < -10) return '+10%';
        if (performance < -5) return '+5%';
        if (performance > 10) return '-5%';
        if (performance > 5) return '-3%';
        return '0%';
    };

    // Calculate confidence score for the assessment
    AdvancedRiskAssessment.prototype.calculateConfidenceScore = function(adjustedProbability, baseRisk) {
        var score = 70;
        
        // Higher confidence if we have more data points
        var dataCompleteness = this.assessDataCompleteness();
        score += (dataCompleteness - 50) / 5;
        
        // Lower confidence if probability is in middle range
        if (adjustedProbability > 40 && adjustedProbability < 60) {
            score -= 10;
        }
        
        return Math.min(100, Math.max(30, Math.round(score)));
    };

    // Assess data completeness
    AdvancedRiskAssessment.prototype.assessDataCompleteness = function() {
        var completeness = 50;
        var report = this.cibilData.credit_report[0];
        
        // Check for employment data
        if (report.employment && report.employment.length > 0) completeness += 10;
        
        // Check for multiple accounts
        if (report.accounts && report.accounts.length > 1) completeness += 10;
        
        // Check for credit score
        if (this.cibilData.credit_score) completeness += 10;
        
        // Check for PAN comprehensive data
        if (this.cibilData.pan_comprehensive && this.cibilData.pan_comprehensive.data) completeness += 10;
        
        // Check for recent data
        var recentAccounts = report.accounts.filter(function(acc) {
            if (!acc.dateReported) return false;
            var reportDate = new Date(acc.dateReported);
            return new Date() - reportDate < 365 * 24 * 60 * 60 * 1000;
        }).length;
        
        if (recentAccounts > 0) completeness += 10;
        
        return completeness;
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
            factors: riskAssessment.factors || [],
            sentimentImpact: economicData.marketSentiment < 40 ? '+10%' : economicData.marketSentiment < 60 ? '+5%' : economicData.marketSentiment > 80 ? '-5%' : '0%'
        };
    };

    // Identify economic risk factors
    AdvancedRiskAssessment.prototype.identifyEconomicRiskFactors = function(economicData) {
        var riskFactors = [];

        if (economicData.gdpGrowth < 5) {
            riskFactors.push({
                factor: 'Low GDP Growth',
                severity: 'High',
                description: 'Economic growth below 5% may increase credit risk across the system',
                impact: '+10% to default probability'
            });
        }

        if (economicData.inflationRate > 6) {
            riskFactors.push({
                factor: 'High Inflation',
                severity: 'High',
                description: 'Inflation above 6% may erode purchasing power and increase default risk',
                impact: '+8% to default probability'
            });
        }

        if (economicData.repoRate > 7) {
            riskFactors.push({
                factor: 'High Interest Rates',
                severity: 'Medium',
                description: 'High repo rate may increase borrowing costs and debt servicing burden',
                impact: '+7% to default probability'
            });
        }

        if (economicData.unemploymentRate > 8) {
            riskFactors.push({
                factor: 'High Unemployment',
                severity: 'High',
                description: 'Unemployment above 8% may indicate economic weakness and higher default risk',
                impact: '+6% to default probability'
            });
        }

        if (economicData.marketSentiment < 40) {
            riskFactors.push({
                factor: 'Negative Market Sentiment',
                severity: 'Medium',
                description: 'Poor market sentiment may indicate broader economic concerns',
                impact: '+10% to default probability'
            });
        }

        // Add sector-specific risk factors
        var userSector = this.getUserEmploymentSector();
        if (userSector && economicData.sectorPerformance && economicData.sectorPerformance[userSector] < -5) {
            riskFactors.push({
                factor: `Sector Downturn: ${this.getSectorName(userSector)}`,
                severity: 'Medium',
                description: `The ${this.getSectorName(userSector)} sector is underperforming`,
                impact: '+5% to default probability'
            });
        }

        return riskFactors;
    };

    // Get sector name from code
    AdvancedRiskAssessment.prototype.getSectorName = function(sectorCode) {
        var sectorNames = {
            'professional_services': 'Professional Services',
            'government': 'Government',
            'it_services': 'IT Services',
            'manufacturing': 'Manufacturing',
            'retail': 'Retail',
            'construction': 'Construction',
            'hospitality': 'Hospitality',
            'real_estate': 'Real Estate',
            'financial_services': 'Financial Services',
            'education': 'Education',
            'other': 'Other Sectors'
        };
        return sectorNames[sectorCode] || 'Unknown Sector';
    };

    // Generate economic-based recommendations
    AdvancedRiskAssessment.prototype.generateEconomicRecommendation = function(riskAssessment, economicData) {
        var recommendations = [];

        if (riskAssessment.probability > 60) {
            recommendations.push({
                priority: 'High',
                action: 'Consider secured lending options or lower credit limits',
                rationale: 'High default probability combined with economic factors suggests need for collateral',
                implementation: 'Require collateral or reduce exposure by 20-30%'
            });
        }

        if (economicData.inflationRate > 6) {
            recommendations.push({
                priority: 'Medium',
                action: 'Adjust credit limits for inflation sensitivity',
                rationale: 'High inflation may impact borrower repayment capacity',
                implementation: 'Reduce unsecured limits by 10-15% during high inflation periods'
            });
        }

        if (economicData.repoRate > 7) {
            recommendations.push({
                priority: 'Medium',
                action: 'Review interest rate pricing for new loans',
                rationale: 'High repo rate increases cost of funds, may need to adjust lending rates',
                implementation: 'Increase interest rates by 0.5-1% to maintain margins'
            });
        }

        if (economicData.marketSentiment < 40) {
            recommendations.push({
                priority: 'Low',
                action: 'Monitor portfolio more frequently during negative sentiment periods',
                rationale: 'Negative market sentiment may precede broader economic challenges',
                implementation: 'Increase review frequency from quarterly to monthly'
            });
        }

        // User-specific recommendations
        var incomeStability = this.calculateIncomeStability();
        if (incomeStability < 50) {
            recommendations.push({
                priority: 'High',
                action: 'Request additional income documentation',
                rationale: 'Low income stability score indicates higher risk',
                implementation: 'Require last 6 months bank statements and employment verification'
            });
        }

        return recommendations;
    };

    // Get financial institutions that might still consider this client
    AdvancedRiskAssessment.prototype.getEligibleInstitutions = function() {
        try {
            var creditWorthiness = this.riskAssessment.calculateCreditWorthiness ? 
                this.riskAssessment.calculateCreditWorthiness() : { isCreditWorthy: true };
            var defaultProbability = this.riskAssessment.calculateDefaultProbability ? 
                this.riskAssessment.calculateDefaultProbability() : { probability: 50 };
            var grade = this.gradingEngine.calculateOverallGrade ? 
                this.gradingEngine.calculateOverallGrade() : 'C';

            // Define institution risk profiles (Indian context)
            var institutions = [
                {
                    name: 'SBI (State Bank of India)',
                    type: 'Public Sector Bank',
                    minGrade: 'B',
                    maxDefaultProbability: 30,
                    requiresCreditWorthy: true,
                    interestRateRange: '8.5-11.5%',
                    description: 'Largest public sector bank with conservative lending'
                },
                {
                    name: 'HDFC Bank',
                    type: 'Private Bank',
                    minGrade: 'B+',
                    maxDefaultProbability: 35,
                    requiresCreditWorthy: true,
                    interestRateRange: '10-14%',
                    description: 'Top private bank with stringent credit standards'
                },
                {
                    name: 'ICICI Bank',
                    type: 'Private Bank',
                    minGrade: 'B',
                    maxDefaultProbability: 40,
                    requiresCreditWorthy: true,
                    interestRateRange: '11-15%',
                    description: 'Major private bank with comprehensive risk assessment'
                },
                {
                    name: 'Axis Bank',
                    type: 'Private Bank',
                    minGrade: 'C+',
                    maxDefaultProbability: 50,
                    requiresCreditWorthy: false,
                    interestRateRange: '12-16%',
                    description: 'Private bank with moderate risk appetite'
                },
                {
                    name: 'Kotak Mahindra Bank',
                    type: 'Private Bank',
                    minGrade: 'C',
                    maxDefaultProbability: 55,
                    requiresCreditWorthy: false,
                    interestRateRange: '13-17%',
                    description: 'Tech-focused bank with innovative credit products'
                },
                {
                    name: 'Bajaj Finance',
                    type: 'NBFC',
                    minGrade: 'C',
                    maxDefaultProbability: 65,
                    requiresCreditWorthy: false,
                    interestRateRange: '14-20%',
                    description: 'Leading NBFC with higher risk tolerance'
                },
                {
                    name: 'HDB Financial Services',
                    type: 'NBFC',
                    minGrade: 'D+',
                    maxDefaultProbability: 75,
                    requiresCreditWorthy: false,
                    interestRateRange: '16-24%',
                    description: 'HDFC group NBFC for subprime lending'
                },
                {
                    name: 'EarlySalary',
                    type: 'FinTech',
                    minGrade: 'D',
                    maxDefaultProbability: 80,
                    requiresCreditWorthy: false,
                    interestRateRange: '18-30%',
                    description: 'Salary advance loans for employed individuals'
                },
                {
                    name: 'MoneyTap',
                    type: 'FinTech',
                    minGrade: 'D',
                    maxDefaultProbability: 85,
                    requiresCreditWorthy: false,
                    interestRateRange: '20-36%',
                    description: 'Credit line product for various needs'
                },
                {
                    name: 'Lendingkart',
                    type: 'FinTech',
                    minGrade: 'D',
                    maxDefaultProbability: 90,
                    requiresCreditWorthy: false,
                    interestRateRange: '18-30%',
                    description: 'Business loans for SMEs and entrepreneurs'
                }
            ];

            var gradeOrder = ['D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
            var clientGradeIndex = gradeOrder.indexOf(grade);
            if (clientGradeIndex === -1) clientGradeIndex = 2; // Default to 'C'

            // Filter eligible institutions
            var eligibleInstitutions = institutions.filter(function(institution) {
                var minGradeIndex = gradeOrder.indexOf(institution.minGrade);
                if (minGradeIndex === -1) return false;

                // Check grade requirement
                if (clientGradeIndex < minGradeIndex) return false;

                // Check default probability requirement
                var defaultProb = defaultProbability.probability || 50;
                if (defaultProb > institution.maxDefaultProbability) return false;

                // Check credit worthiness requirement
                if (institution.requiresCreditWorthy && !creditWorthiness.isCreditWorthy) return false;

                return true;
            });

            return eligibleInstitutions;
        } catch (error) {
            console.error('Error getting eligible institutions:', error);
            return [];
        }
    };

    // Convert probability to risk level
    AdvancedRiskAssessment.prototype.getRiskLevel = function(probability) {
        if (probability < 20) return 'Very Low';
        if (probability < 40) return 'Low';
        if (probability < 60) return 'Medium';
        if (probability < 80) return 'High';
        return 'Very High';
    };

    // Helper: Calculate months since date
    AdvancedRiskAssessment.prototype.calculateMonthsSince = function(dateString) {
        if (!dateString) return 0;
        try {
            var date = new Date(dateString);
            if (isNaN(date.getTime())) return 0;
            
            var now = new Date();
            return (now.getFullYear() - date.getFullYear()) * 12 + 
                   (now.getMonth() - date.getMonth());
        } catch (error) {
            return 0;
        }
    };

    // Get default economic data for fallback
    AdvancedRiskAssessment.prototype.getDefaultEconomicData = function() {
        return {
            gdpGrowth: 6.5, // India average
            inflationRate: 5.0, // RBI target midpoint
            repoRate: 6.5, // Current approx
            unemploymentRate: 7.5, // India average
            marketSentiment: 65, // Neutral-positive
            sectorPerformance: {
                professional_services: 5,
                government: 3,
                it_services: 8,
                manufacturing: 4,
                retail: 2,
                construction: -2,
                hospitality: 3,
                real_estate: -1,
                financial_services: 6,
                education: 4
            },
            source: 'Default fallback data',
            lastUpdated: new Date().toISOString()
        };
    };

    module.exports = AdvancedRiskAssessment;
})();