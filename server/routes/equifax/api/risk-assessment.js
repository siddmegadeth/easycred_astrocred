// EQUIFAX Risk Assessment Engine
// Based on CIBIL risk assessment, adapted for EQUIFAX data
(function() {
    var CIBILConstants = require('../../cibil/api/cibil-constants.js');
    var EconomicDataService = require('../../cibil/api/economic-data-services.js');
    
    function EquifaxRiskAssessment(equifaxData, gradingEngine) {
        this.equifaxData = equifaxData;
        this.gradingEngine = gradingEngine;
        this.economicService = new EconomicDataService();
        this.creditReport = equifaxData.credit_report && equifaxData.credit_report[0] ? equifaxData.credit_report[0] : {};
        
        this.userInfo = {
            name: equifaxData.name || null,
            mobile: equifaxData.mobile || null,
            email: equifaxData.email || null,
            pan: equifaxData.pan || null,
            gender: equifaxData.gender || null,
            dateOfBirth: equifaxData.date_of_birth || null,
            creditScore: equifaxData.credit_score || null
        };
        
        this.cache = {
            creditWorthiness: null,
            defaultProbability: null,
            riskFactors: null,
            lastCalculated: null
        };
    }
    
    // Calculate credit worthiness (same logic as CIBIL)
    EquifaxRiskAssessment.prototype.calculateCreditWorthiness = function() {
        try {
            if (this.cache.creditWorthiness && this.cache.lastCalculated && 
                (Date.now() - this.cache.lastCalculated) < 300000) {
                return this.cache.creditWorthiness;
            }
            
            var grade = this.gradingEngine.calculateOverallGrade();
            var defaulters = this.gradingEngine.identifyDefaulters();
            var utilization = this.gradingEngine.getCreditUtilization();
            var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis();
            var creditAge = this.gradingEngine.getCreditAge();
            
            var gradeScore = this.gradeToScore(grade);
            var defaultPenalty = defaulters.length * 15;
            var defaultScore = Math.max(10, 100 - defaultPenalty);
            var utilizationScore = this.calculateUtilizationScore(utilization);
            var paymentScore = this.calculatePaymentScore(paymentAnalysis);
            var historyScore = this.calculateHistoryScore(creditAge);
            
            var totalScore = (
                gradeScore * 0.25 +
                defaultScore * 0.20 +
                utilizationScore * 0.15 +
                paymentScore * 0.15 +
                historyScore * 0.10 +
                70 * 0.15 // Other factors
            );
            
            var result = {
                score: Math.round(totalScore),
                isCreditWorthy: totalScore >= 65,
                isPrimeBorrower: totalScore >= 85,
                isSubprimeBorrower: totalScore < 50,
                isHighRisk: totalScore < 35,
                grade: grade,
                components: {
                    gradeScore: gradeScore,
                    defaultScore: defaultScore,
                    utilizationScore: utilizationScore,
                    paymentScore: paymentScore,
                    historyScore: historyScore
                }
            };
            
            this.cache.creditWorthiness = result;
            this.cache.lastCalculated = Date.now();
            
            return result;
            
        } catch (error) {
            console.error('Error calculating EQUIFAX credit worthiness:', error);
            return this.getDefaultCreditWorthiness();
        }
    };
    
    // Calculate default probability
    EquifaxRiskAssessment.prototype.calculateDefaultProbability = function() {
        try {
            if (this.cache.defaultProbability && this.cache.lastCalculated && 
                (Date.now() - this.cache.lastCalculated) < 300000) {
                return this.cache.defaultProbability;
            }
            
            var grade = this.gradingEngine.calculateOverallGrade();
            var defaulters = this.gradingEngine.identifyDefaulters();
            var utilization = this.gradingEngine.getCreditUtilization();
            var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis();
            var creditAge = this.gradingEngine.getCreditAge();
            
            var baseProbability = 5; // Base 5% default probability
            
            // Grade adjustment
            var gradeAdjustments = {
                'A+': -3, 'A': -2, 'B+': -1, 'B': 0,
                'C+': 2, 'C': 5, 'D+': 10, 'D': 20, 'F': 40
            };
            baseProbability += gradeAdjustments[grade] || 0;
            
            // Defaulters penalty
            baseProbability += defaulters.length * 10;
            
            // Utilization penalty
            if (utilization > 70) baseProbability += 15;
            else if (utilization > 50) baseProbability += 8;
            else if (utilization > 30) baseProbability += 3;
            
            // Payment history penalty
            if (paymentAnalysis.missedPercentage > 10) baseProbability += 20;
            else if (paymentAnalysis.missedPercentage > 5) baseProbability += 10;
            else if (paymentAnalysis.missedPercentage > 0) baseProbability += 5;
            
            // Credit age benefit
            if (creditAge < 12) baseProbability += 5;
            else if (creditAge < 24) baseProbability += 2;
            
            baseProbability = Math.max(1, Math.min(95, baseProbability));
            
            var riskLevel = 'VERY_LOW';
            if (baseProbability >= 70) riskLevel = 'VERY_HIGH';
            else if (baseProbability >= 50) riskLevel = 'HIGH';
            else if (baseProbability >= 30) riskLevel = 'MEDIUM';
            else if (baseProbability >= 15) riskLevel = 'LOW';
            
            var result = {
                probability: Math.round(baseProbability),
                riskLevel: riskLevel,
                factors: {
                    grade: grade,
                    defaulters: defaulters.length,
                    utilization: Math.round(utilization),
                    missedPayments: paymentAnalysis.missedPercentage.toFixed(1),
                    creditAge: Math.round(creditAge)
                }
            };
            
            this.cache.defaultProbability = result;
            this.cache.lastCalculated = Date.now();
            
            return result;
            
        } catch (error) {
            console.error('Error calculating EQUIFAX default probability:', error);
            return { probability: 50, riskLevel: 'MEDIUM' };
        }
    };
    
    // Helper methods
    EquifaxRiskAssessment.prototype.gradeToScore = function(grade) {
        var scores = { 'A+': 95, 'A': 85, 'B+': 75, 'B': 65, 'C+': 55, 'C': 45, 'D+': 35, 'D': 25, 'F': 15 };
        return scores[grade] || 50;
    };
    
    EquifaxRiskAssessment.prototype.calculateUtilizationScore = function(utilization) {
        var thresholds = CIBILConstants.RISK_THRESHOLDS.CREDIT_UTILIZATION;
        if (utilization <= thresholds.OPTIMAL) return 100;
        if (utilization <= thresholds.WARNING) return 80;
        if (utilization <= thresholds.HIGH_RISK) return 60;
        if (utilization <= thresholds.CRITICAL) return 30;
        return 10;
    };
    
    EquifaxRiskAssessment.prototype.calculatePaymentScore = function(paymentAnalysis) {
        if (paymentAnalysis.missedPercentage === 0 && paymentAnalysis.delayedPercentage === 0) return 100;
        if (paymentAnalysis.missedPercentage === 0 && paymentAnalysis.delayedPercentage < 5) return 90;
        if (paymentAnalysis.missedPercentage < 2) return 75;
        if (paymentAnalysis.missedPercentage < 5) return 60;
        if (paymentAnalysis.missedPercentage < 10) return 40;
        return 20;
    };
    
    EquifaxRiskAssessment.prototype.calculateHistoryScore = function(creditAge) {
        if (creditAge >= 84) return 100;
        if (creditAge >= 60) return 90;
        if (creditAge >= 36) return 80;
        if (creditAge >= 24) return 70;
        if (creditAge >= 12) return 60;
        if (creditAge >= 6) return 50;
        return 40;
    };
    
    EquifaxRiskAssessment.prototype.getDefaultCreditWorthiness = function() {
        return {
            score: 50,
            isCreditWorthy: false,
            isPrimeBorrower: false,
            isSubprimeBorrower: true,
            isHighRisk: false,
            grade: 'C',
            components: {}
        };
    };
    
    // Generate comprehensive risk report
    EquifaxRiskAssessment.prototype.generateRiskReport = function() {
        var creditWorthiness = this.calculateCreditWorthiness();
        var defaultProbability = this.calculateDefaultProbability();
        var grade = this.gradingEngine.calculateOverallGrade();
        var defaulters = this.gradingEngine.identifyDefaulters();
        var utilization = this.gradingEngine.getCreditUtilization();
        var paymentAnalysis = this.gradingEngine.getOverallPaymentAnalysis();
        
        return {
            bureau: 'EQUIFAX',
            overallGrade: grade,
            creditWorthiness: creditWorthiness,
            defaultProbability: defaultProbability,
            riskFactors: {
                defaulters: defaulters.length,
                utilization: Math.round(utilization),
                missedPayments: paymentAnalysis.missedPercentage.toFixed(1),
                delayedPayments: paymentAnalysis.delayedPercentage.toFixed(1)
            },
            recommendations: this.generateRecommendations(creditWorthiness, defaultProbability),
            generatedAt: new Date()
        };
    };
    
    EquifaxRiskAssessment.prototype.generateRecommendations = function(creditWorthiness, defaultProbability) {
        var recommendations = [];
        
        if (defaultProbability.probability > 30) {
            recommendations.push({
                priority: 'Critical',
                title: 'High Default Risk',
                description: 'Your default probability is ' + defaultProbability.probability + '%. Immediate action required.',
                action: 'Clear all overdue accounts and improve payment history'
            });
        }
        
        if (creditWorthiness.score < 50) {
            recommendations.push({
                priority: 'High',
                title: 'Low Credit Worthiness',
                description: 'Your credit worthiness score is ' + creditWorthiness.score + '/100.',
                action: 'Focus on improving payment history and reducing utilization'
            });
        }
        
        return recommendations;
    };
    
    module.exports = EquifaxRiskAssessment;
})();

