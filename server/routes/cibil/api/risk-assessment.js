// file: risk-assessment-enhanced.js
(function () {
    var CIBILConstants = require('./cibil-constants.js');
    var EconomicDataService = require('./economic-data-services.js');

    /**
     * Enhanced Risk Assessment Engine
     * Advanced credit risk evaluation with CIBIL integration and Indian market context
     */

    function RiskAssessment(cibilData, gradingEngine) {
        this.cibilData = cibilData;
        this.gradingEngine = gradingEngine;
        this.economicService = new EconomicDataService();
        this.creditReport = cibilData.credit_report && cibilData.credit_report[0] ? cibilData.credit_report[0] : {};

        // Enhanced user information with Indian context
        this.userInfo = {
            name: cibilData.name || null,
            mobile: cibilData.mobile || null,
            email: cibilData.email || null,
            pan: cibilData.pan || null,
            gender: cibilData.gender || null,
            dateOfBirth: cibilData.date_of_birth || null,
            creditScore: cibilData.credit_score || null,
            // Additional Indian identifiers
            aadhaar: cibilData.aadhaar_number || null,
            address: this.extractAddress(),
            employment: this.extractEmploymentInfo()
        };

        // Cache for performance
        this.cache = {
            creditWorthiness: null,
            defaultProbability: null,
            riskFactors: null,
            lastCalculated: null
        };
    }

    /**
     * Extract address information from credit report
     */
    RiskAssessment.prototype.extractAddress = function () {
        try {
            var addresses = this.creditReport.addresses || [];
            if (addresses.length === 0) return null;

            // Use the most recent address
            var latestAddress = addresses.reduce((latest, current) => {
                var latestDate = latest.dateReported ? new Date(latest.dateReported) : new Date(0);
                var currentDate = current.dateReported ? new Date(current.dateReported) : new Date(0);
                return currentDate > latestDate ? current : latest;
            });

            return {
                line1: latestAddress.line1 || '',
                line2: latestAddress.line2 || '',
                city: latestAddress.city || '',
                state: latestAddress.stateCode || '',
                pincode: latestAddress.pinCode || '',
                type: latestAddress.addressCategory || 'Residential'
            };
        } catch (error) {
            return null;
        }
    };

    /**
     * Extract employment information
     */
    RiskAssessment.prototype.extractEmploymentInfo = function () {
        try {
            var employment = this.creditReport.employment || [];
            if (employment.length === 0) return null;

            var latestEmp = employment[0];
            return {
                occupationCode: latestEmp.occupationCode || '',
                occupation: CIBILConstants.OCCUPATION_CODES[latestEmp.occupationCode] || 'Unknown',
                dateReported: latestEmp.dateReported || '',
                organization: latestEmp.organizationName || ''
            };
        } catch (error) {
            return null;
        }
    };

    /**
     * Calculate enhanced credit worthiness score with CIBIL integration
     */
    RiskAssessment.prototype.calculateCreditWorthiness = function () {
        try {
            // Check cache first
            if (this.cache.creditWorthiness && this.cache.lastCalculated &&
                (Date.now() - this.cache.lastCalculated) < 300000) { // 5 minute cache
                return this.cache.creditWorthiness;
            }

            var grade = 'C';
            var defaulters = [];
            var utilization = 0;
            var paymentAnalysis = { onTime: 0, delayed: 0, missed: 0, total: 0 };
            var creditAge = 0;

            try {
                grade = this.gradingEngine.calculateOverallGrade ? this.gradingEngine.calculateOverallGrade() : 'C';
            } catch (e) {
                console.error('Error calculating grade in credit worthiness:', e.message);
            }

            try {
                defaulters = this.gradingEngine.identifyDefaulters ? this.gradingEngine.identifyDefaulters() : [];
            } catch (e) {
                console.error('Error identifying defaulters:', e.message);
            }

            try {
                utilization = this.gradingEngine.getCreditUtilization ? this.gradingEngine.getCreditUtilization() : 0;
            } catch (e) {
                console.error('Error getting utilization:', e.message);
            }

            try {
                paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis ?
                    this.gradingEngine.getOverallPaymentAnalysis() : { onTime: 0, delayed: 0, missed: 0, total: 0 };
            } catch (e) {
                console.error('Error getting payment analysis:', e.message);
            }

            try {
                creditAge = this.gradingEngine.getCreditAge ? this.gradingEngine.getCreditAge() : 0;
            } catch (e) {
                console.error('Error getting credit age:', e.message);
            }
            var debtBurden = this.calculateDebtBurdenScore();
            var accountMix = this.calculateAccountMixScore();
            var recentBehavior = this.calculateRecentBehaviorScore();

            // Convert grade to score with CIBIL weightings
            var gradeScore = this.gradeToScore(grade);

            // Default score: Heavy penalty for defaulters (Indian market)
            var defaultPenalty = defaulters.length * 15;
            var defaultScore = Math.max(10, 100 - defaultPenalty);

            // Utilization score based on CIBIL thresholds
            var utilizationScore = this.calculateUtilizationScore(utilization);

            // Payment score with CIBIL status consideration
            var paymentScore = this.calculatePaymentScore(paymentAnalysis);

            // Credit history score with Indian preference for longer history
            var historyScore = this.calculateHistoryScore(creditAge);

            // Debt burden score with DTI thresholds
            var debtScore = this.calculateDebtScore(debtBurden);

            // Account mix score (diversity)
            var mixScore = accountMix;

            // Recent behavior score
            var behaviorScore = recentBehavior;

            // Weighted average with Indian market weights (CIBIL influenced)
            var totalScore = (
                gradeScore * 0.25 +      // 25% Overall Grade
                defaultScore * 0.20 +    // 20% Default History
                utilizationScore * 0.15 + // 15% Credit Utilization
                paymentScore * 0.15 +    // 15% Payment History
                historyScore * 0.10 +    // 10% Credit Age
                debtScore * 0.05 +       // 5% Debt Burden
                mixScore * 0.05 +        // 5% Account Mix
                behaviorScore * 0.05     // 5% Recent Behavior
            );

            // Apply Indian market and CIBIL-specific adjustments
            totalScore = this.applyCreditworthinessAdjustments(totalScore);

            var result = {
                score: Math.round(totalScore),
                isCreditWorthy: totalScore >= 65, // Indian threshold
                isPrimeBorrower: totalScore >= 85,
                isSubprimeBorrower: totalScore < 50,
                isHighRisk: totalScore < 35,
                grade: grade,
                components: {
                    gradeScore: gradeScore,
                    defaultScore: defaultScore,
                    utilizationScore: utilizationScore,
                    paymentScore: paymentScore,
                    historyScore: historyScore,
                    debtScore: debtScore,
                    mixScore: mixScore,
                    behaviorScore: behaviorScore
                },
                thresholds: {
                    primeBorrower: 85,
                    creditWorthy: 65,
                    subprimeBorrower: 50,
                    highRisk: 35
                },
                recommendations: this.generateCreditWorthinessRecommendations(totalScore, grade)
            };

            // Update cache
            this.cache.creditWorthiness = result;
            this.cache.lastCalculated = Date.now();

            return result;

        } catch (error) {
            console.error('Error calculating credit worthiness:', error);
            return this.getDefaultCreditWorthiness();
        }
    };

    /**
     * Calculate utilization score based on CIBIL thresholds
     */
    RiskAssessment.prototype.calculateUtilizationScore = function (utilization) {
        var thresholds = CIBILConstants.RISK_THRESHOLDS.CREDIT_UTILIZATION;

        if (utilization <= thresholds.OPTIMAL) return 100;
        if (utilization <= thresholds.WARNING) return 80;
        if (utilization <= thresholds.HIGH_RISK) return 60;
        if (utilization <= thresholds.CRITICAL) return 30;
        return 10;
    };

    /**
     * Calculate payment score with CIBIL status codes
     */
    RiskAssessment.prototype.calculatePaymentScore = function (paymentAnalysis) {
        var onTimePercentage = paymentAnalysis.onTimePercentage || 0;
        var missedRate = paymentAnalysis.missedRate || 0;
        var delayedRate = paymentAnalysis.delayedRate || 0;

        // Base score from on-time percentage
        var baseScore = onTimePercentage;

        // Heavy penalties for missed payments (CIBIL heavily penalizes)
        baseScore -= missedRate * 100 * 2; // Double penalty for missed payments

        // Moderate penalty for delayed payments
        baseScore -= delayedRate * 100 * 0.5;

        // Bonus for perfect payment history
        if (missedRate === 0 && delayedRate === 0 && onTimePercentage >= 95) {
            baseScore += 20;
        }

        // Penalty for recent missed payments
        var recentMissed = this.calculateRecentMissedPayments();
        baseScore -= recentMissed * 10;

        return Math.max(10, Math.min(100, baseScore));
    };

    /**
     * Calculate recent missed payments (last 6 months)
     */
    RiskAssessment.prototype.calculateRecentMissedPayments = function () {
        try {
            var accounts = this.creditReport.accounts || [];
            var recentMissed = 0;

            accounts.forEach(account => {
                var paymentAnalysis = this.gradingEngine.parsePaymentHistory(account);
                // Count missed payments in last 6 months
                var recentPayments = paymentAnalysis.payments.slice(-6);
                recentMissed += recentPayments.filter(p => p.category === 'missed').length;
            });

            return recentMissed;
        } catch (error) {
            return 0;
        }
    };

    /**
     * Calculate history score with Indian preference
     */
    RiskAssessment.prototype.calculateHistoryScore = function (creditAge) {
        // Indian banks prefer longer credit history
        if (creditAge >= 84) return 100; // 7+ years
        if (creditAge >= 60) return 90;  // 5+ years
        if (creditAge >= 36) return 80;  // 3+ years
        if (creditAge >= 24) return 70;  // 2+ years
        if (creditAge >= 12) return 60;  // 1+ years
        if (creditAge >= 6) return 50;   // 6+ months
        if (creditAge >= 3) return 40;   // 3+ months
        return 30; // Less than 3 months
    };

    /**
     * Calculate debt score with DTI thresholds
     */
    RiskAssessment.prototype.calculateDebtScore = function (debtBurden) {
        var thresholds = CIBILConstants.RISK_THRESHOLDS.DEBT_TO_INCOME;

        if (debtBurden <= thresholds.IDEAL) return 100;
        if (debtBurden <= thresholds.ACCEPTABLE) return 80;
        if (debtBurden <= thresholds.RISKY) return 60;
        if (debtBurden <= thresholds.CRITICAL) return 30;
        return 10;
    };

    /**
     * Calculate account mix score
     */
    RiskAssessment.prototype.calculateAccountMixScore = function () {
        var accounts = this.creditReport.accounts || [];
        if (accounts.length === 0) return 50;

        var score = 50;
        var accountTypes = new Set();
        var hasSecured = false;
        var hasUnsecured = false;
        var hasRevolving = false;
        var hasInstallment = false;

        accounts.forEach(account => {
            var type = account.accountType || '';
            accountTypes.add(type);

            // Map to CIBIL account types
            var cibilType = CIBILConstants.ACCOUNT_TYPES[type];

            // Check secured vs unsecured
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

        // Score components
        if (hasSecured && hasUnsecured) score += 25;
        if (hasRevolving && hasInstallment) score += 20;
        if (accountTypes.size >= 3) score += 20;
        if (accountTypes.size >= 2) score += 10;

        return Math.min(100, score);
    };

    /**
     * Calculate recent behavior score
     */
    RiskAssessment.prototype.calculateRecentBehaviorScore = function () {
        try {
            var score = 70; // Base score

            // Recent inquiries impact
            var enquiries = this.creditReport.enquiries || [];
            var recentInquiries = enquiries.filter(enquiry => {
                if (!enquiry.enquiryDate) return false;
                var inquiryDate = new Date(enquiry.enquiryDate);
                var sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                return inquiryDate > sixMonthsAgo;
            }).length;

            // Penalty for multiple recent inquiries
            if (recentInquiries > 4) score -= 30;
            else if (recentInquiries > 2) score -= 15;
            else if (recentInquiries > 0) score -= 5;

            // New accounts impact
            var accounts = this.creditReport.accounts || [];
            var newAccounts = accounts.filter(account => {
                if (!account.dateOpened) return false;
                var openedDate = new Date(account.dateOpened);
                var oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                return openedDate > oneYearAgo;
            }).length;

            // Moderate penalty for many new accounts
            if (newAccounts > 3) score -= 20;
            else if (newAccounts > 1) score -= 10;

            // Credit limit changes (positive if increases)
            var limitChanges = this.analyzeCreditLimitChanges();
            score += limitChanges * 5;

            return Math.max(10, Math.min(100, score));

        } catch (error) {
            return 50;
        }
    };

    /**
     * Analyze credit limit changes
     */
    RiskAssessment.prototype.analyzeCreditLimitChanges = function () {
        // This would analyze historical credit limit changes
        // For now, return a neutral score
        return 0;
    };

    /**
     * Apply comprehensive creditworthiness adjustments
     */
    RiskAssessment.prototype.applyCreditworthinessAdjustments = function (score) {
        var adjustments = 0;
        var accounts = this.creditReport.accounts || [];
        var employment = this.userInfo.employment;

        // Government employee bonus (Indian context)
        if (employment && employment.occupationCode === '02') {
            adjustments += 8; // Government employees highly valued
        }

        // Professional bonus
        if (employment && employment.occupationCode === '01') {
            adjustments += 5;
        }

        // Relationship with government banks (Indian preference)
        var hasGovernmentBank = accounts.some(account => {
            var lender = account.memberShortName || '';
            var govBanks = CIBILConstants.BANK_CATEGORIES.PUBLIC_SECTOR;
            return govBanks.some(govBank => lender.includes(govBank));
        });

        if (hasGovernmentBank) {
            adjustments += 4;
        }

        // Secured vs unsecured mix (Indian banks prefer mix)
        var securedLoans = accounts.filter(acc =>
            ['HL', 'AL', 'GL', 'BL'].includes(acc.accountType)
        ).length;

        var unsecuredLoans = accounts.filter(acc =>
            ['CC', 'PL', 'EL', 'CL', 'TL'].includes(acc.accountType)
        ).length;

        if (securedLoans > 0 && unsecuredLoans > 0) {
            adjustments += 3; // Good mix
        } else if (securedLoans > 0 && unsecuredLoans === 0) {
            adjustments += 1; // Only secured (conservative)
        } else if (securedLoans === 0 && unsecuredLoans > 0) {
            adjustments -= 2; // Only unsecured (higher risk)
        }

        // Credit age bonus for established history
        var creditAge = this.gradingEngine.getCreditAge();
        if (creditAge >= 60) adjustments += 5;
        else if (creditAge >= 36) adjustments += 3;
        else if (creditAge >= 24) adjustments += 2;

        // Negative adjustments for high-risk factors
        var defaulters = this.gradingEngine.identifyDefaulters();
        if (defaulters.length > 0) {
            adjustments -= defaulters.length * 3;
        }

        // Utilization penalty
        var utilization = this.gradingEngine.getCreditUtilization();
        if (utilization > 70) adjustments -= 5;
        else if (utilization > 50) adjustments -= 2;

        return Math.min(100, Math.max(0, score + adjustments));
    };

    /**
     * Generate creditworthiness recommendations
     */
    RiskAssessment.prototype.generateCreditWorthinessRecommendations = function (score, grade) {
        var recommendations = [];

        if (score < 50) {
            recommendations.push({
                priority: 'High',
                action: 'Immediate credit improvement required',
                focus: 'Payment history and debt reduction',
                timeline: '3-6 months',
                expectedImprovement: '20-30 point increase'
            });
        } else if (score < 65) {
            recommendations.push({
                priority: 'Medium',
                action: 'Credit building needed',
                focus: 'Consistent payments and credit mix',
                timeline: '2-4 months',
                expectedImprovement: '15-25 point increase'
            });
        } else if (score < 85) {
            recommendations.push({
                priority: 'Low',
                action: 'Maintain current credit behavior',
                focus: 'Optimization and monitoring',
                timeline: 'Ongoing',
                expectedImprovement: '5-15 point increase'
            });
        }

        // Grade-specific recommendations
        if (grade === 'D' || grade === 'E' || grade === 'F') {
            recommendations.push({
                priority: 'High',
                action: 'Consider secured credit card',
                focus: 'Credit rebuilding',
                timeline: 'Immediate',
                resources: ['SBI Secure Card', 'HDFC Secured Card', 'ICICI Coral Contactless']
            });
        }

        return recommendations;
    };

    /**
     * Calculate enhanced default probability with economic factors
     */
    RiskAssessment.prototype.calculateDefaultProbability = function (callback) {
        var self = this;

        // Check cache
        if (this.cache.defaultProbability && this.cache.lastCalculated &&
            (Date.now() - this.cache.lastCalculated) < 300000) {
            if (callback) {
                setTimeout(() => callback(null, this.cache.defaultProbability), 0);
                return;
            }
            return this.cache.defaultProbability;
        }

        // Get economic data
        self.economicService.getEconomicData(function (err, economicData) {
            if (err) {
                console.error('Error fetching economic data:', err);
                economicData = self.getDefaultEconomicData();
            }

            try {
                var baseProbability = self.calculateBaseDefaultProbability();
                var adjustedProbability = self.adjustForEconomicFactors(baseProbability, economicData);
                var finalProbability = self.applyRiskMitigation(adjustedProbability);

                // Calculate confidence score
                var confidence = self.calculateProbabilityConfidence();

                var result = {
                    probability: Math.min(95, Math.max(5, Math.round(finalProbability))),
                    riskLevel: self.getRiskLevel(finalProbability),
                    riskCategory: self.getRiskCategory(finalProbability),
                    baseProbability: Math.round(baseProbability),
                    economicAdjustment: Math.round(adjustedProbability - baseProbability),
                    confidence: confidence,
                    economicFactors: self.identifyEconomicRiskFactors(economicData),
                    sensitivityAnalysis: self.performSensitivityAnalysis(finalProbability),
                    stressTest: self.performStressTest(finalProbability),
                    timestamp: new Date().toISOString(),
                    methodology: 'CIBIL-based risk assessment with economic integration'
                };

                // Update cache
                self.cache.defaultProbability = result;
                self.cache.lastCalculated = Date.now();

                if (callback) callback(null, result);
                else return result;

            } catch (error) {
                console.error('Error calculating default probability:', error);
                if (callback) callback(error, null);
                else return self.getDefaultProbabilityResult();
            }
        });

        // Return promise-like interface for sync calls
        if (!callback) {
            // Fallback to synchronous calculation
            return this.calculateDefaultProbabilitySync();
        }
    };

    /**
     * Synchronous default probability calculation
     */
    RiskAssessment.prototype.calculateDefaultProbabilitySync = function () {
        try {
            var baseProbability = this.calculateBaseDefaultProbability();
            var economicData = this.getDefaultEconomicData();
            var adjustedProbability = this.adjustForEconomicFactors(baseProbability, economicData);
            var finalProbability = this.applyRiskMitigation(adjustedProbability);

            return {
                probability: Math.min(95, Math.max(5, Math.round(finalProbability))),
                riskLevel: this.getRiskLevel(finalProbability),
                baseProbability: Math.round(baseProbability),
                confidence: 70
            };
        } catch (error) {
            return this.getDefaultProbabilityResult();
        }
    };

    /**
     * Calculate base default probability from credit data
     */
    RiskAssessment.prototype.calculateBaseDefaultProbability = function () {
        var accounts = this.creditReport.accounts || [];
        var enquiries = this.creditReport.enquiries || [];

        var probability = 30; // Base probability for Indian market

        // Factor 1: Payment history (40% weight)
        var paymentScore = this.calculatePaymentScore(this.gradingEngine.getOverallPaymentAnalysis());
        probability += (100 - paymentScore) * 0.4;

        // Factor 2: Credit utilization (20% weight)
        var utilization = this.gradingEngine.getCreditUtilization();
        if (utilization > 80) probability += 25;
        else if (utilization > 70) probability += 18;
        else if (utilization > 60) probability += 12;
        else if (utilization > 50) probability += 8;
        else if (utilization > 40) probability += 4;

        // Factor 3: Default accounts (15% weight)
        var defaulters = this.gradingEngine.identifyDefaulters();
        probability += defaulters.length * 6;

        // Factor 4: Debt burden (10% weight)
        var debtBurden = this.calculateDebtBurdenScore();
        if (debtBurden > 60) probability += 15;
        else if (debtBurden > 50) probability += 10;
        else if (debtBurden > 40) probability += 5;

        // Factor 5: Credit age (5% weight)
        var creditAge = this.gradingEngine.getCreditAge();
        if (creditAge < 6) probability += 10;
        else if (creditAge < 12) probability += 6;
        else if (creditAge < 24) probability += 3;

        // Factor 6: Recent inquiries (5% weight)
        var recentInquiries = this.countRecentEnquiries(enquiries, 6);
        probability += Math.min(recentInquiries * 2, 10);

        // Factor 7: Account mix (5% weight)
        var accountMixScore = this.calculateAccountMixScore();
        probability += (100 - accountMixScore) * 0.05;

        return Math.min(90, probability);
    };

    /**
     * Count recent enquiries
     */
    RiskAssessment.prototype.countRecentEnquiries = function (enquiries, months) {
        var cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - months);

        return enquiries.filter(enquiry => {
            if (!enquiry.enquiryDate) return false;
            var enquiryDate = new Date(enquiry.enquiryDate);
            return enquiryDate > cutoffDate;
        }).length;
    };

    /**
     * Adjust for economic factors
     */
    RiskAssessment.prototype.adjustForEconomicFactors = function (baseProbability, economicData) {
        var adjusted = baseProbability;

        // GDP growth impact
        if (economicData.gdpGrowth < 5) adjusted += 12;
        else if (economicData.gdpGrowth < 6) adjusted += 6;
        else if (economicData.gdpGrowth > 8) adjusted -= 5;

        // Inflation impact (RBI target: 4% +/- 2%)
        if (economicData.inflationRate > 6) adjusted += 10;
        else if (economicData.inflationRate < 2) adjusted += 5; // Deflation risk
        else if (economicData.inflationRate >= 4 && economicData.inflationRate <= 6) adjusted -= 3;

        // Interest rate impact
        if (economicData.repoRate > 7) adjusted += 8;
        else if (economicData.repoRate < 5) adjusted -= 4;

        // Unemployment impact
        if (economicData.unemploymentRate > 8) adjusted += 7;
        else if (economicData.unemploymentRate < 5) adjusted -= 3;

        // Market sentiment impact
        if (economicData.marketSentiment < 40) adjusted += 10;
        else if (economicData.marketSentiment < 60) adjusted += 5;
        else if (economicData.marketSentiment > 80) adjusted -= 4;

        // Sector-specific impact
        var userSector = this.getUserSector();
        if (userSector && economicData.sectorPerformance) {
            var sectorPerformance = economicData.sectorPerformance[userSector] || 0;
            if (sectorPerformance < -5) adjusted += 6;
            else if (sectorPerformance > 10) adjusted -= 3;
        }

        return adjusted;
    };

    /**
     * Get user's employment sector
     */
    RiskAssessment.prototype.getUserSector = function () {
        var employment = this.userInfo.employment;
        if (!employment) return null;

        var occupationCode = employment.occupationCode;
        var sectorMap = {
            '01': 'professional_services',
            '02': 'government',
            '03': 'private_sector',
            '04': 'self_employed',
            '05': 'business',
            '06': 'daily_wage',
            '07': 'unemployed',
            '08': 'retired',
            '09': 'student',
            '10': 'homemaker'
        };

        return sectorMap[occupationCode] || 'other';
    };

    /**
     * Apply risk mitigation factors
     */
    RiskAssessment.prototype.applyRiskMitigation = function (probability) {
        var mitigated = probability;
        var accounts = this.creditReport.accounts || [];

        // Mitigation for secured loans
        var securedLoans = accounts.filter(acc =>
            ['HL', 'AL', 'GL', 'BL'].includes(acc.accountType)
        ).length;

        if (securedLoans > 0) {
            mitigated -= securedLoans * 2; // Secured loans reduce risk
        }

        // Mitigation for long credit history
        var creditAge = this.gradingEngine.getCreditAge();
        if (creditAge >= 60) mitigated -= 5;
        else if (creditAge >= 36) mitigated -= 3;

        // Mitigation for government employment
        var employment = this.userInfo.employment;
        if (employment && employment.occupationCode === '02') {
            mitigated -= 4; // Government employees have lower default risk
        }

        return Math.max(5, mitigated);
    };

    /**
     * Calculate probability confidence score
     */
    RiskAssessment.prototype.calculateProbabilityConfidence = function () {
        try {
            var confidence = 70;
            var accounts = this.creditReport.accounts || [];
            var creditAge = this.gradingEngine.getCreditAge();
            var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis();

            // Data completeness
            if (accounts.length >= 5) confidence += 10;
            else if (accounts.length >= 3) confidence += 5;
            else if (accounts.length === 0) confidence -= 20;

            // Credit history length
            if (creditAge >= 60) confidence += 15;
            else if (creditAge >= 36) confidence += 10;
            else if (creditAge >= 24) confidence += 5;
            else if (creditAge < 6) confidence -= 10;

            // Payment history data
            if (paymentAnalysis.total >= 36) confidence += 10;
            else if (paymentAnalysis.total >= 24) confidence += 5;
            else if (paymentAnalysis.total < 6) confidence -= 15;

            // Employment data
            if (this.userInfo.employment) confidence += 5;

            // Address data
            if (this.userInfo.address) confidence += 5;

            return Math.min(95, Math.max(30, confidence));

        } catch (error) {
            return 50;
        }
    };

    /**
     * Get risk level based on probability
     */
    RiskAssessment.prototype.getRiskLevel = function (probability) {
        var thresholds = CIBILConstants.RISK_THRESHOLDS.DEFAULT_PROBABILITY;

        if (probability < thresholds.VERY_LOW) return 'Very Low';
        if (probability < thresholds.LOW) return 'Low';
        if (probability < thresholds.MEDIUM) return 'Medium';
        if (probability < thresholds.HIGH) return 'High';
        return 'Very High';
    };

    /**
     * Get risk category with more granular classification
     */
    RiskAssessment.prototype.getRiskCategory = function (probability) {
        if (probability < 10) return 'Minimal Risk';
        if (probability < 20) return 'Very Low Risk';
        if (probability < 30) return 'Low Risk';
        if (probability < 40) return 'Low-Medium Risk';
        if (probability < 50) return 'Medium Risk';
        if (probability < 60) return 'Medium-High Risk';
        if (probability < 70) return 'High Risk';
        if (probability < 80) return 'Very High Risk';
        if (probability < 90) return 'Severe Risk';
        return 'Critical Risk';
    };

    /**
     * Identify economic risk factors
     */
    RiskAssessment.prototype.identifyEconomicRiskFactors = function (economicData) {
        var factors = [];

        // GDP growth factors
        if (economicData.gdpGrowth < 5) {
            factors.push({
                factor: 'Low Economic Growth',
                impact: 'High',
                description: `GDP growth at ${economicData.gdpGrowth}% may increase overall default rates`,
                adjustment: '+12% to default probability'
            });
        } else if (economicData.gdpGrowth > 8) {
            factors.push({
                factor: 'Strong Economic Growth',
                impact: 'Positive',
                description: `GDP growth at ${economicData.gdpGrowth}% supports credit health`,
                adjustment: '-5% to default probability'
            });
        }

        // Inflation factors
        if (economicData.inflationRate > 6) {
            factors.push({
                factor: 'High Inflation',
                impact: 'High',
                description: `Inflation at ${economicData.inflationRate}% erodes purchasing power`,
                adjustment: '+10% to default probability'
            });
        }

        // Interest rate factors
        if (economicData.repoRate > 7) {
            factors.push({
                factor: 'High Interest Rates',
                impact: 'Medium',
                description: `Repo rate at ${economicData.repoRate}% increases borrowing costs`,
                adjustment: '+8% to default probability'
            });
        }

        // Unemployment factors
        if (economicData.unemploymentRate > 8) {
            factors.push({
                factor: 'High Unemployment',
                impact: 'High',
                description: `Unemployment at ${economicData.unemploymentRate}% indicates economic stress`,
                adjustment: '+7% to default probability'
            });
        }

        // Market sentiment factors
        if (economicData.marketSentiment < 40) {
            factors.push({
                factor: 'Negative Market Sentiment',
                impact: 'Medium',
                description: 'Poor market sentiment may precede economic challenges',
                adjustment: '+10% to default probability'
            });
        }

        // Sector-specific factors
        var userSector = this.getUserSector();
        if (userSector && economicData.sectorPerformance) {
            var sectorPerf = economicData.sectorPerformance[userSector];
            if (sectorPerf < -5) {
                factors.push({
                    factor: `Sector Downturn (${this.getSectorName(userSector)})`,
                    impact: 'Medium',
                    description: `Sector performance at ${sectorPerf}% may impact income stability`,
                    adjustment: '+6% to default probability'
                });
            }
        }

        return factors;
    };

    /**
     * Get sector name from code
     */
    RiskAssessment.prototype.getSectorName = function (sectorCode) {
        var sectorNames = {
            'professional_services': 'Professional Services',
            'government': 'Government',
            'private_sector': 'Private Sector',
            'self_employed': 'Self-Employed',
            'business': 'Business',
            'daily_wage': 'Daily Wage',
            'unemployed': 'Unemployed',
            'retired': 'Retired',
            'student': 'Student',
            'homemaker': 'Homemaker',
            'other': 'Other'
        };

        return sectorNames[sectorCode] || 'Unknown Sector';
    };

    /**
     * Perform sensitivity analysis
     */
    RiskAssessment.prototype.performSensitivityAnalysis = function (baseProbability) {
        var analysis = {
            baseCase: Math.round(baseProbability),
            scenarios: {},
            impacts: {},
            mostSensitive: null
        };

        // Define scenarios
        var scenarios = {
            economicDownturn: baseProbability * 1.35, // 35% increase
            interestRateHike: baseProbability * 1.25, // 25% increase
            incomeReduction: baseProbability * 1.4,   // 40% increase
            jobLoss: baseProbability * 1.6,          // 60% increase
            utilizationIncrease: this.calculateScenarioUtilizationIncrease(baseProbability),
            paymentMiss: this.calculateScenarioPaymentMiss(baseProbability)
        };

        analysis.scenarios = scenarios;

        // Calculate impacts
        for (var scenario in scenarios) {
            analysis.impacts[scenario] = Math.round(scenarios[scenario] - baseProbability);
        }

        // Find most sensitive scenario
        var maxImpact = 0;
        for (var scenario in analysis.impacts) {
            if (analysis.impacts[scenario] > maxImpact) {
                maxImpact = analysis.impacts[scenario];
                analysis.mostSensitive = {
                    scenario: scenario,
                    impact: analysis.impacts[scenario]
                };
            }
        }

        return analysis;
    };

    /**
     * Calculate scenario: Utilization increase
     */
    RiskAssessment.prototype.calculateScenarioUtilizationIncrease = function (baseProbability) {
        var currentUtilization = this.gradingEngine.getCreditUtilization();
        if (currentUtilization >= 90) return baseProbability;

        var increaseTo90 = 90 - currentUtilization;
        var probabilityIncrease = increaseTo90 * 1.2; // 1.2% increase per utilization point
        return baseProbability + probabilityIncrease;
    };

    /**
     * Calculate scenario: Additional missed payment
     */
    RiskAssessment.prototype.calculateScenarioPaymentMiss = function (baseProbability) {
        var missedPayments = this.gradingEngine.getOverallPaymentAnalysis().missed || 0;
        var additionalImpact = (missedPayments + 2) * 8; // Each missed payment adds ~8%
        return baseProbability + additionalImpact;
    };

    /**
     * Perform stress test
     */
    RiskAssessment.prototype.performStressTest = function (baseProbability) {
        // Combined stress scenario
        var stressProbability = baseProbability;

        // Apply stress factors
        stressProbability *= 1.3; // Economic downturn
        stressProbability *= 1.2; // Interest rate hike
        stressProbability *= 1.25; // Income reduction
        stressProbability *= 1.15; // Market volatility

        // Cap at 95%
        stressProbability = Math.min(95, stressProbability);

        return {
            scenario: 'Severe Economic Stress (Combined Factors)',
            probability: Math.round(stressProbability),
            increase: Math.round(stressProbability - baseProbability),
            passes: stressProbability <= 75, // Pass if <=75% under stress
            buffer: Math.max(0, stressProbability - 75),
            rating: stressProbability <= 60 ? 'Strong' :
                stressProbability <= 75 ? 'Adequate' :
                    stressProbability <= 85 ? 'Weak' : 'Failing'
        };
    };

    /**
     * Generate comprehensive risk report
     */
    RiskAssessment.prototype.generateRiskReport = function () {
        try {
            var creditWorthiness = {};
            var defaultProbability = {};
            var defaultPatterns = {};
            var grade = 'C';
            var recommendations = [];
            var riskFactors = [];
            var economicContext = {};
            var stressTest = {};

            try {
                creditWorthiness = this.calculateCreditWorthiness ? this.calculateCreditWorthiness() : {};
            } catch (e) {
                console.error('Error calculating credit worthiness:', e.message);
            }

            try {
                defaultProbability = this.calculateDefaultProbabilitySync ? this.calculateDefaultProbabilitySync() : {};
            } catch (e) {
                console.error('Error calculating default probability:', e.message);
            }

            try {
                defaultPatterns = this.analyzeDefaultPatterns ? this.analyzeDefaultPatterns() : {};
            } catch (e) {
                console.error('Error analyzing default patterns:', e.message);
            }

            try {
                grade = this.gradingEngine.calculateOverallGrade ? this.gradingEngine.calculateOverallGrade() : 'C';
            } catch (e) {
                console.error('Error calculating grade:', e.message);
            }

            try {
                recommendations = this.generateRiskRecommendation ? this.generateRiskRecommendation() : [];
            } catch (e) {
                console.error('Error generating recommendations:', e.message);
            }

            try {
                riskFactors = this.identifyRiskFactors ? this.identifyRiskFactors() : [];
            } catch (e) {
                console.error('Error identifying risk factors:', e.message);
            }

            try {
                economicContext = this.getEconomicContext ? this.getEconomicContext() : {};
            } catch (e) {
                console.error('Error getting economic context:', e.message);
            }

            try {
                stressTest = this.performStressTest && defaultProbability.probability ?
                    this.performStressTest(defaultProbability.probability) : {};
            } catch (e) {
                console.error('Error performing stress test:', e.message);
            }

            var report = {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    reportVersion: '3.0',
                    assessmentMethodology: 'Enhanced CIBIL risk assessment with economic integration',
                    regulatoryFramework: 'RBI Guidelines Compliant'
                },
                clientInfo: this.userInfo,
                executiveSummary: this.generateRiskExecutiveSummary(creditWorthiness, defaultProbability, grade),
                creditAssessment: {
                    overallGrade: grade,
                    gradeInterpretation: this.interpretGrade(grade),
                    creditWorthiness: creditWorthiness,
                    defaultProbability: defaultProbability,
                    defaultPatternAnalysis: defaultPatterns,
                    paymentAnalysis: this.gradingEngine.getOverallPaymentAnalysis(),
                    utilizationAnalysis: {
                        currentUtilization: this.gradingEngine.getCreditUtilization(),
                        recommendedThreshold: CIBILConstants.RISK_THRESHOLDS.CREDIT_UTILIZATION.OPTIMAL,
                        status: this.getUtilizationStatus(this.gradingEngine.getCreditUtilization())
                    }
                },
                riskAnalysis: {
                    riskFactors: riskFactors,
                    overallRiskLevel: defaultProbability.riskLevel,
                    riskCategory: defaultProbability.riskCategory,
                    riskConcentration: this.analyzeRiskConcentration(),
                    sensitivityAnalysis: defaultProbability.sensitivityAnalysis,
                    stressTest: stressTest,
                    earlyWarningIndicators: this.identifyEarlyWarningIndicators()
                },
                economicContext: economicContext,
                recommendations: recommendations,
                lendingOptions: {
                    eligibleInstitutions: this.getEligibleInstitutions(),
                    suggestedLoanProducts: this.suggestLoanProducts(),
                    collateralRequirements: this.determineCollateralRequirements(),
                    pricingRecommendations: this.generatePricingRecommendations(grade, defaultProbability.probability)
                },
                monitoringAndReview: {
                    recommendedReviewFrequency: this.determineReviewFrequency(defaultProbability.probability),
                    keyMonitoringMetrics: this.identifyMonitoringMetrics(),
                    earlyWarningSignals: this.identifyEarlyWarningSignals(),
                    complianceRequirements: this.getComplianceRequirements()
                },
                improvementRoadmap: this.generateImprovementRoadmap(creditWorthiness.score, grade)
            };

            return report;

        } catch (error) {
            console.error('Error generating risk report:', error);
            return this.getDefaultRiskReport();
        }
    };

    /**
     * Generate risk executive summary
     */
    RiskAssessment.prototype.generateRiskExecutiveSummary = function (creditWorthiness, defaultProbability, grade) {
        var summary = {
            overallAssessment: '',
            keyFindings: [],
            immediateConcerns: [],
            strengths: [],
            recommendation: '',
            outlook: ''
        };

        // Overall assessment
        if (creditWorthiness.isPrimeBorrower && defaultProbability.probability < 30) {
            summary.overallAssessment = 'Excellent Credit Risk Profile';
            summary.recommendation = 'Approve with preferential terms';
            summary.outlook = 'Very Positive';
        } else if (creditWorthiness.isCreditWorthy && defaultProbability.probability < 50) {
            summary.overallAssessment = 'Good Credit Risk Profile';
            summary.recommendation = 'Approve with standard terms';
            summary.outlook = 'Positive';
        } else if (creditWorthiness.isSubprimeBorrower && defaultProbability.probability < 70) {
            summary.overallAssessment = 'Moderate Credit Risk Profile';
            summary.recommendation = 'Approve with conditions';
            summary.outlook = 'Cautious';
        } else {
            summary.overallAssessment = 'High Credit Risk Profile';
            summary.recommendation = 'Reject or require enhanced collateral';
            summary.outlook = 'Negative';
        }

        // Key findings
        summary.keyFindings.push(`Credit Grade: ${grade}`);
        summary.keyFindings.push(`Default Probability: ${defaultProbability.probability}%`);
        summary.keyFindings.push(`Risk Level: ${defaultProbability.riskLevel}`);

        if (defaultProbability.probability > 60) {
            summary.immediateConcerns.push('High default probability requires careful consideration');
        }

        if (creditWorthiness.score < 50) {
            summary.immediateConcerns.push('Low credit worthiness score indicates elevated risk');
        }

        // Strengths
        if (creditWorthiness.score >= 70) {
            summary.strengths.push('Good overall credit worthiness');
        }

        var utilization = this.gradingEngine.getCreditUtilization();
        if (utilization <= 30) {
            summary.strengths.push('Excellent credit utilization management');
        }

        return summary;
    };

    /**
     * Get utilization status
     */
    RiskAssessment.prototype.getUtilizationStatus = function (utilization) {
        var thresholds = CIBILConstants.RISK_THRESHOLDS.CREDIT_UTILIZATION;

        if (utilization <= thresholds.OPTIMAL) return 'Optimal';
        if (utilization <= thresholds.WARNING) return 'Moderate';
        if (utilization <= thresholds.HIGH_RISK) return 'High Risk';
        return 'Critical';
    };

    /**
     * Interpret grade
     */
    RiskAssessment.prototype.interpretGrade = function (grade) {
        var interpretations = {
            'A+': 'Excellent - Top tier creditworthiness',
            'A': 'Very Good - Strong credit profile',
            'B+': 'Good - Above average credit',
            'B': 'Fair - Average credit profile',
            'C+': 'Below Average - Some improvement needed',
            'C': 'Poor - Significant improvement needed',
            'D+': 'Very Poor - Limited credit options',
            'D': 'Weak - Rebuilding required',
            'E+': 'Bad - Major issues present',
            'E': 'Very Bad - Serious credit problems',
            'F': 'Critical - Extremely poor credit'
        };

        return interpretations[grade] || 'Grade not available';
    };

    /**
     * Get economic context
     */
    RiskAssessment.prototype.getEconomicContext = function () {
        return {
            country: 'India',
            assessmentPeriod: new Date().toISOString().split('T')[0],
            keyIndicators: {
                gdpGrowth: '6.5% (FY24 estimate)',
                inflation: '4.5% (CPI)',
                repoRate: '6.5%',
                unemployment: '7.3%'
            },
            sectorOutlook: this.getSectorOutlook(),
            regulatoryEnvironment: 'RBI tightening supervision, focus on asset quality'
        };
    };

    /**
     * Get sector outlook
     */
    RiskAssessment.prototype.getSectorOutlook = function () {
        var employment = this.userInfo.employment;
        if (!employment) return { outlook: 'Neutral', risk: 'Medium' };

        var outlooks = {
            '01': { outlook: 'Strong', risk: 'Low', trend: 'Growing' }, // Professional
            '02': { outlook: 'Very Stable', risk: 'Very Low', trend: 'Stable' }, // Government
            '03': { outlook: 'Moderate', risk: 'Medium', trend: 'Growing' }, // Private
            '04': { outlook: 'Variable', risk: 'Medium-High', trend: 'Mixed' }, // Self-employed
            '05': { outlook: 'Moderate', risk: 'Medium', trend: 'Recovering' }, // Business
            '06': { outlook: 'Volatile', risk: 'High', trend: 'Uncertain' } // Daily wage
        };

        return outlooks[employment.occupationCode] || { outlook: 'Neutral', risk: 'Medium', trend: 'Stable' };
    };

    /**
     * Get eligible financial institutions based on risk profile
     */
    RiskAssessment.prototype.getEligibleInstitutions = function () {
        return [
            { name: 'FinTech Lenders (EarlySalary, MoneyTap)', description: 'Digital lenders specializing in subprime credit' },
            { name: 'Secured Loan Providers', description: 'Lenders offering loans against collateral' },
            { name: 'Public Sector Banks', description: 'SBI, PNB - for prime borrowers' },
            { name: 'Private Banks', description: 'HDFC, ICICI, Axis - risk-based pricing' }
        ];
    };

    /**
     * Suggest appropriate loan products based on grade and credit worthiness
     */
    RiskAssessment.prototype.suggestLoanProducts = function () {
        try {
            var grade = (this.gradingEngine && this.gradingEngine.calculateOverallGrade) ? this.gradingEngine.calculateOverallGrade() : 'C';
            var creditWorthiness = this.calculateCreditWorthiness();
            var score = (creditWorthiness && creditWorthiness.score) ? creditWorthiness.score : 60;
            var defaulters = (this.gradingEngine && this.gradingEngine.identifyDefaulters) ? this.gradingEngine.identifyDefaulters() : [];
            var hasDefaulters = defaulters.length > 0;
            var suggestedProducts = [];

            if ((grade === 'A+' || grade === 'A' || grade === 'B+') && score >= 80 && !hasDefaulters) {
                suggestedProducts.push({ product: 'Unsecured Personal Loan', amountRange: '₹1-25 Lakhs', tenure: '1-5 years', interestRate: '10-14%', features: ['No collateral', 'Quick disbursal'] });
                suggestedProducts.push({ product: 'Credit Card with High Limit', limitRange: '₹1-10 Lakhs', features: ['Reward points', 'Cashback', 'Travel benefits'] });
            }
            if ((grade === 'B+' || grade === 'B' || grade === 'C+') && score >= 65) {
                suggestedProducts.push({ product: 'Secured Personal Loan', amountRange: '₹50,000-10 Lakhs', tenure: '6 months - 3 years', interestRate: '12-18%', features: ['Lower interest', 'Collateral required'] });
                if (!hasDefaulters) {
                    suggestedProducts.push({ product: 'Standard Credit Card', limitRange: '₹50,000-2 Lakhs', features: ['Basic rewards', 'Online protection'] });
                }
            }
            if (grade <= 'C' || hasDefaulters) {
                suggestedProducts.push({ product: 'Secured Credit Card', depositRange: '₹10,000-1 Lakh', limit: '80-100% of deposit', features: ['Build credit', 'Deposit as collateral'] });
                suggestedProducts.push({ product: 'Small Personal Loan against Collateral', amountRange: '₹25,000-5 Lakhs', collateral: ['Gold', 'FD', 'Property'], interestRate: '14-24%', features: ['Credit rebuilding'] });
            }
            if (suggestedProducts.length === 0) {
                suggestedProducts.push({ product: 'Secured Credit Card', depositRange: '₹10,000+', features: ['Build/repair credit'] });
            }
            return suggestedProducts;
        } catch (e) {
            return [{ product: 'Secured Credit Card', depositRange: '₹10,000+', features: ['Build credit'] }];
        }
    };

    /**
     * Determine collateral requirements based on risk
     */
    RiskAssessment.prototype.determineCollateralRequirements = function () {
        var prob = this.cache.defaultProbability != null ? this.cache.defaultProbability : (this.calculateDefaultProbabilitySync && this.calculateDefaultProbabilitySync()) || 30;
        if (prob > 50) return { required: true, types: ['Gold', 'Fixed Deposit', 'Property'], minCover: '100-120% of loan amount' };
        if (prob > 25) return { required: 'Optional', types: ['FD', 'Gold'], minCover: 'Up to 100%' };
        return { required: false, types: [], minCover: 'N/A' };
    };

    /**
     * Recommended review frequency (months)
     */
    RiskAssessment.prototype.determineReviewFrequency = function (probability) {
        if (probability > 60) return 'Monthly';
        if (probability > 40) return 'Quarterly';
        if (probability > 20) return 'Half-yearly';
        return 'Annual';
    };

    /**
     * Key monitoring metrics for the account
     */
    RiskAssessment.prototype.identifyMonitoringMetrics = function () {
        return ['Credit utilization ratio', 'Days past due (DPD)', 'New enquiries', 'Account mix', 'Payment history', 'Outstanding balance trend'];
    };

    /**
     * Early warning signals to watch
     */
    RiskAssessment.prototype.identifyEarlyWarningSignals = function () {
        return ['Rise in DPD', 'Increase in utilization above 50%', 'Multiple new enquiries', 'Missed payment', 'Overdue amount increase'];
    };

    /**
     * Generate pricing recommendations
     */
    RiskAssessment.prototype.generatePricingRecommendations = function (grade, defaultProbability) {
        var recommendations = [];
        var baseRate = 8.5; // Base rate for prime borrowers

        // Grade-based adjustments
        var gradeAdjustment = 0;
        switch (grade) {
            case 'A+': gradeAdjustment = -0.5; break;
            case 'A': gradeAdjustment = 0; break;
            case 'B+': gradeAdjustment = 0.5; break;
            case 'B': gradeAdjustment = 1.0; break;
            case 'C+': gradeAdjustment = 1.5; break;
            case 'C': gradeAdjustment = 2.0; break;
            case 'D': gradeAdjustment = 3.0; break;
            case 'E': gradeAdjustment = 4.0; break;
            case 'F': gradeAdjustment = 5.0; break;
            default: gradeAdjustment = 1.0;
        }

        // Risk-based adjustments
        var riskAdjustment = 0;
        if (defaultProbability > 60) riskAdjustment = 2.0;
        else if (defaultProbability > 40) riskAdjustment = 1.0;
        else if (defaultProbability > 20) riskAdjustment = 0.5;

        var recommendedRate = baseRate + gradeAdjustment + riskAdjustment;

        recommendations.push({
            product: 'Personal Loan',
            recommendedRate: recommendedRate.toFixed(2) + '%',
            rateRange: (recommendedRate - 0.5).toFixed(2) + '% - ' + (recommendedRate + 0.5).toFixed(2) + '%',
            justification: `Based on grade (${grade}) and default probability (${defaultProbability}%)`
        });

        recommendations.push({
            product: 'Credit Card',
            recommendedRate: (recommendedRate + 3).toFixed(2) + '%',
            rateRange: '24-48% per annum',
            features: 'Standard features with risk-based limit'
        });

        return recommendations;
    };

    /**
     * Get compliance requirements
     */
    RiskAssessment.prototype.getComplianceRequirements = function () {
        return {
            kycRequirements: ['PAN verification', 'Aadhaar verification', 'Address proof'],
            documentation: ['Income proof', 'Bank statements (6 months)', 'Business proof if self-employed'],
            regulatoryChecks: ['CIBIL check', 'Fraud check', 'AML screening'],
            reportingRequirements: 'Monthly reporting to credit bureau required'
        };
    };

    /**
     * Generate improvement roadmap
     */
    RiskAssessment.prototype.generateImprovementRoadmap = function (score, grade) {
        var roadmap = {
            currentScore: score,
            currentGrade: grade,
            targetScore: Math.min(100, score + 20),
            targetGrade: this.getNextGrade(grade),
            timeline: '6-12 months',
            phases: []
        };

        // Phase 1: Immediate actions (1-3 months)
        roadmap.phases.push({
            phase: 'Immediate Actions',
            duration: '1-3 months',
            focus: 'Stop negative behavior',
            actions: [
                'Ensure all payments are made on time',
                'Reduce credit utilization below 50%',
                'Dispute any errors in credit report'
            ],
            successMetrics: ['No late payments', 'Utilization < 50%', 'Credit report clean']
        });

        // Phase 2: Building phase (3-6 months)
        roadmap.phases.push({
            phase: 'Building Phase',
            duration: '3-6 months',
            focus: 'Establish positive history',
            actions: [
                'Maintain perfect payment history',
                'Request credit limit increases on existing cards',
                'Consider secured credit card if needed'
            ],
            successMetrics: ['6 months clean history', 'Credit limit increases obtained', 'Score improvement of 20+ points']
        });

        // Phase 3: Optimization phase (6-12 months)
        roadmap.phases.push({
            phase: 'Optimization Phase',
            duration: '6-12 months',
            focus: 'Optimize credit profile',
            actions: [
                'Diversify credit mix',
                'Maintain low utilization',
                'Monitor credit score monthly'
            ],
            successMetrics: ['Credit mix improved', 'Utilization < 30%', 'Target grade achieved']
        });

        return roadmap;
    };

    /**
     * Get next grade level
     */
    RiskAssessment.prototype.getNextGrade = function (currentGrade) {
        var gradeOrder = ['F', 'E', 'E+', 'D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
        var currentIndex = gradeOrder.indexOf(currentGrade);

        if (currentIndex === -1 || currentIndex === gradeOrder.length - 1) {
            return currentGrade;
        }

        return gradeOrder[currentIndex + 1];
    };

    /**
     * Default implementations
     */
    RiskAssessment.prototype.getDefaultEconomicData = function () {
        return {
            gdpGrowth: 6.5,
            inflationRate: 4.5,
            repoRate: 6.5,
            unemploymentRate: 7.3,
            marketSentiment: 65,
            sectorPerformance: {
                professional_services: 5,
                government: 3,
                private_sector: 4,
                self_employed: 2,
                business: 3,
                daily_wage: -1
            }
        };
    };

    RiskAssessment.prototype.getDefaultCreditWorthiness = function () {
        return {
            score: 50,
            isCreditWorthy: false,
            isPrimeBorrower: false,
            isSubprimeBorrower: true,
            isHighRisk: false,
            grade: 'C',
            components: {},
            thresholds: {},
            recommendations: []
        };
    };

    RiskAssessment.prototype.getDefaultProbabilityResult = function () {
        return {
            probability: 50,
            riskLevel: 'Medium',
            riskCategory: 'Medium Risk',
            baseProbability: 50,
            economicAdjustment: 0,
            confidence: 50,
            economicFactors: [],
            sensitivityAnalysis: {},
            stressTest: {},
            timestamp: new Date().toISOString()
        };
    };

    RiskAssessment.prototype.getDefaultRiskReport = function () {
        return {
            metadata: {
                generatedAt: new Date().toISOString(),
                reportVersion: '3.0',
                note: 'Limited report due to system error'
            },
            clientInfo: this.userInfo,
            executiveSummary: {
                overallAssessment: 'Assessment Error',
                keyFindings: ['System encountered an error'],
                recommendation: 'Manual review required'
            },
            error: 'Risk report generation failed'
        };
    };

    // Analyze default patterns
    RiskAssessment.prototype.analyzeDefaultPatterns = function () {
        try {
            var defaulters = this.gradingEngine.identifyDefaulters ?
                this.gradingEngine.identifyDefaulters() : [];

            if (defaulters.length === 0) {
                return {
                    hasDefaults: false,
                    defaultCount: 0,
                    totalOverdue: 0,
                    pattern: 'No defaults detected',
                    severity: 'LOW',
                    recommendations: []
                };
            }

            var totalOverdue = 0;
            var bankGroups = {};
            var typeGroups = {};

            defaulters.forEach(function (def) {
                totalOverdue += def.overdue || 0;

                var bank = def.bank || 'Unknown';
                bankGroups[bank] = (bankGroups[bank] || 0) + 1;

                var type = def.type || 'Unknown';
                typeGroups[type] = (typeGroups[type] || 0) + 1;
            });

            var mostAffectedBank = Object.keys(bankGroups).reduce(function (a, b) {
                return bankGroups[a] > bankGroups[b] ? a : b;
            }, 'Unknown');

            var mostAffectedType = Object.keys(typeGroups).reduce(function (a, b) {
                return typeGroups[a] > typeGroups[b] ? a : b;
            }, 'Unknown');

            var severity = defaulters.length >= 3 ? 'HIGH' :
                defaulters.length >= 2 ? 'MEDIUM' : 'LOW';

            return {
                hasDefaults: true,
                defaultCount: defaulters.length,
                totalOverdue: totalOverdue,
                pattern: severity === 'HIGH' ? 'Multiple defaults across accounts' :
                    'Isolated defaults detected',
                severity: severity,
                mostAffectedBank: mostAffectedBank,
                mostAffectedType: mostAffectedType,
                recommendations: [
                    'Clear overdue amounts immediately',
                    'Contact lenders to negotiate payment plans',
                    'Avoid new credit applications until defaults are cleared'
                ]
            };
        } catch (error) {
            console.error('Error analyzing default patterns:', error);
            return {
                hasDefaults: false,
                defaultCount: 0,
                totalOverdue: 0,
                pattern: 'Analysis error',
                severity: 'UNKNOWN',
                recommendations: []
            };
        }
    };

    /**
     * Calculate debt burden score (0-100)
     * Higher score = higher debt burden = higher risk
     */
    RiskAssessment.prototype.calculateDebtBurdenScore = function () {
        try {
            var accounts = this.creditReport.accounts || [];
            var totalDebt = 0;
            var totalIncome = 0;
            var totalEMI = 0;

            // Calculate total debt and EMI
            accounts.forEach(function (account) {
                if (account.accountType === 'LOAN' || account.accountType === 'CREDIT_CARD') {
                    var outstanding = parseFloat(account.outstandingAmount || account.currentBalance || 0);
                    totalDebt += outstanding;

                    var emi = parseFloat(account.emi || account.monthlyPayment || 0);
                    totalEMI += emi;
                }
            });

            // Estimate income from credit limit (rough estimate: 3x credit limit)
            accounts.forEach(function (account) {
                if (account.accountType === 'CREDIT_CARD') {
                    var limit = parseFloat(account.creditLimit || 0);
                    totalIncome += limit * 3; // Rough estimate
                }
            });

            // If no income estimate, use debt-to-income ratio based on EMI
            if (totalIncome === 0 && totalEMI > 0) {
                // Assume EMI is 30% of income (typical Indian standard)
                totalIncome = (totalEMI / 0.3);
            }

            // Calculate debt-to-income ratio
            var dtiRatio = totalIncome > 0 ? (totalDebt / totalIncome) * 100 : 0;

            // Convert to score (0-100, higher = worse)
            // DTI > 50% = 100, DTI 40-50% = 80, DTI 30-40% = 60, DTI 20-30% = 40, DTI < 20% = 20
            var score = 0;
            if (dtiRatio >= 50) score = 100;
            else if (dtiRatio >= 40) score = 80;
            else if (dtiRatio >= 30) score = 60;
            else if (dtiRatio >= 20) score = 40;
            else if (dtiRatio > 0) score = 20;

            return Math.min(100, Math.max(0, score));
        } catch (error) {
            console.error('Error calculating debt burden score:', error);
            return 50; // Default medium risk
        }
    };

    /**
     * Analyze risk concentration across accounts
     */
    RiskAssessment.prototype.analyzeRiskConcentration = function () {
        try {
            var accounts = this.creditReport.accounts || [];
            var riskByBank = {};
            var riskByType = {};
            var totalRisk = 0;

            accounts.forEach(function (account) {
                var bank = account.bankName || account.lenderName || 'Unknown';
                var type = account.accountType || 'Unknown';
                var balance = parseFloat(account.outstandingAmount || account.currentBalance || 0);

                // Calculate account risk (simplified)
                var accountRisk = 0;
                if (account.paymentStatus === 'DEFAULT' || account.paymentStatus === 'WRITTEN_OFF') {
                    accountRisk = 100;
                } else if (account.paymentStatus === 'OVERDUE') {
                    accountRisk = 70;
                } else {
                    var utilization = parseFloat(account.utilization || 0);
                    accountRisk = Math.min(100, utilization);
                }

                totalRisk += accountRisk * balance;

                if (!riskByBank[bank]) riskByBank[bank] = { count: 0, totalRisk: 0, totalBalance: 0 };
                riskByBank[bank].count++;
                riskByBank[bank].totalRisk += accountRisk * balance;
                riskByBank[bank].totalBalance += balance;

                if (!riskByType[type]) riskByType[type] = { count: 0, totalRisk: 0, totalBalance: 0 };
                riskByType[type].count++;
                riskByType[type].totalRisk += accountRisk * balance;
                riskByType[type].totalBalance += balance;
            });

            // Find highest concentration
            var highestBankRisk = Object.keys(riskByBank).reduce(function (max, bank) {
                var bankRisk = riskByBank[bank];
                var avgRisk = bankRisk.totalBalance > 0 ? bankRisk.totalRisk / bankRisk.totalBalance : 0;
                return avgRisk > max.risk ? { bank: bank, risk: avgRisk, balance: bankRisk.totalBalance } : max;
            }, { bank: 'None', risk: 0, balance: 0 });

            var highestTypeRisk = Object.keys(riskByType).reduce(function (max, type) {
                var typeRisk = riskByType[type];
                var avgRisk = typeRisk.totalBalance > 0 ? typeRisk.totalRisk / typeRisk.totalBalance : 0;
                return avgRisk > max.risk ? { type: type, risk: avgRisk, balance: typeRisk.totalBalance } : max;
            }, { type: 'None', risk: 0, balance: 0 });

            return {
                bankConcentration: {
                    highestRiskBank: highestBankRisk.bank,
                    riskLevel: highestBankRisk.risk > 70 ? 'HIGH' : highestBankRisk.risk > 40 ? 'MEDIUM' : 'LOW',
                    totalExposure: highestBankRisk.balance
                },
                typeConcentration: {
                    highestRiskType: highestTypeRisk.type,
                    riskLevel: highestTypeRisk.risk > 70 ? 'HIGH' : highestTypeRisk.risk > 40 ? 'MEDIUM' : 'LOW',
                    totalExposure: highestTypeRisk.balance
                },
                overallConcentration: totalRisk > 0 ? 'HIGH' : 'LOW',
                recommendations: [
                    'Diversify credit across multiple lenders',
                    'Reduce exposure to highest risk account types',
                    'Maintain balanced credit portfolio'
                ]
            };
        } catch (error) {
            console.error('Error analyzing risk concentration:', error);
            return {
                bankConcentration: { highestRiskBank: 'Unknown', riskLevel: 'UNKNOWN', totalExposure: 0 },
                typeConcentration: { highestRiskType: 'Unknown', riskLevel: 'UNKNOWN', totalExposure: 0 },
                overallConcentration: 'UNKNOWN',
                recommendations: []
            };
        }
    };

    /**
     * Convert grade to numeric score
     */
    RiskAssessment.prototype.gradeToScore = function (grade) {
        var gradeMap = {
            'A+': 100,
            'A': 90,
            'B+': 80,
            'B': 75,
            'C+': 65,
            'C': 60,
            'D+': 50,
            'D': 40,
            'F': 30
        };
        return gradeMap[grade] || 60;
    };

    /**
     * Identify early warning indicators
     */
    RiskAssessment.prototype.identifyEarlyWarningIndicators = function () {
        var indicators = [];
        var accounts = this.creditReport.accounts || [];

        // Check for recent inquiries
        var enquiries = this.creditReport.enquiries || [];
        if (this.countRecentEnquiries(enquiries, 3) > 2) {
            indicators.push({
                type: 'High Inquiries',
                severity: 'Medium',
                description: 'Multiple credit inquiries in last 3 months'
            });
        }

        // Check for utilization spikes
        var utilization = this.gradingEngine.getCreditUtilization();
        if (utilization > 80) {
            indicators.push({
                type: 'High Utilization',
                severity: 'High',
                description: 'Credit card utilization above 80%'
            });
        }

        return indicators;
    };

    /**
     * Get risk level description
     */
    RiskAssessment.prototype.getRiskLevel = function (probability) {
        if (probability < 10) return 'Very Low';
        if (probability < 20) return 'Low';
        if (probability < 40) return 'Medium';
        if (probability < 60) return 'High';
        return 'Very High';
    };

    /**
     * Get risk category
     */
    RiskAssessment.prototype.getRiskCategory = function (probability) {
        if (probability < 20) return 'Safe';
        if (probability < 50) return 'Caution';
        return 'Risky';
    };

    /**
     * Get default default probability result
     */
    RiskAssessment.prototype.getDefaultProbabilityResult = function () {
        return {
            probability: 20,
            riskLevel: 'Low',
            confidence: 50
        };
    };

    /**
     * Identify economic risk factors
     */
    RiskAssessment.prototype.identifyEconomicRiskFactors = function () {
        return ['Inflation volatility', 'Sector specific slowdown'];
    };

    /**
     * Perform sensitivity analysis
     */
    RiskAssessment.prototype.performSensitivityAnalysis = function (prob) {
        return {
            interestRateShock: prob + 5,
            incomeShock: prob + 15
        };
    };

    /**
     * Perform stress test
     */
    RiskAssessment.prototype.performStressTest = function (prob) {
        return {
            scenario: 'Severe Recession',
            impact: 'High',
            newProbability: Math.min(99, prob * 1.5)
        };
    };

    /**
     * Get default economic data
     */
    RiskAssessment.prototype.getDefaultEconomicData = function () {
        return {
            gdpGrowth: 6.5,
            inflationRate: 5.0,
            repoRate: 6.5,
            unemploymentRate: 7.2,
            marketSentiment: 50
        };
    };

    // Export the module
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = RiskAssessment;
    }
})();