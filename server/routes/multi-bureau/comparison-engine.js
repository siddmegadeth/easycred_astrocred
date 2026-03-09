// Multi-Bureau Comparison Engine
// Compares credit data across CIBIL, EQUIFAX, EXPERION, and CRIF
(function() {
    var CibilDataModel = require('../../schema/cibil/cibil-data-schema.js');
    var EquifaxDataModel = require('../../schema/equifax/equifax-data-schema.js');
    var ExperionDataModel = require('../../schema/experion/experion-data-schema.js');
    var MultiBureauComparisonModel = require('../../schema/multi-bureau/multi-bureau-comparison-schema.js');
    var CibilGradingEngine = require('../cibil/api/grading-engine.js');
    var EquifaxGradingEngine = require('../equifax/api/grading-engine.js');
    var ExperionGradingEngine = require('../experion/api/grading-engine.js');

    function MultiBureauComparisonEngine() {
        this.bureaus = ['CIBIL', 'EQUIFAX', 'EXPERION', 'CRIF'];
    }

    // Fetch data from all available bureaus
    MultiBureauComparisonEngine.prototype.fetchBureauData = async function(identifiers) {
        var { pan, mobile, email, profile } = identifiers;
        var bureauData = {};
        
        // Build query
        var query = {};
        if (pan) query.pan = pan.toUpperCase();
        if (mobile) query.mobile = mobile;
        if (email) query.email = email.toLowerCase();

        // Fetch CIBIL
        try {
            var cibilData = await CibilDataModel.findOne(query).lean();
            if (cibilData) {
                bureauData.CIBIL = cibilData;
            }
        } catch (error) {
            log('Error fetching CIBIL data:', error);
        }

        // Fetch EQUIFAX
        try {
            var equifaxData = await EquifaxDataModel.findOne(query).lean();
            if (equifaxData) {
                bureauData.EQUIFAX = equifaxData;
            }
        } catch (error) {
            log('Error fetching EQUIFAX data:', error);
        }

        // Fetch EXPERION
        try {
            var experionData = await ExperionDataModel.findOne(query).lean();
            if (experionData) {
                bureauData.EXPERION = experionData;
            }
        } catch (error) {
            log('Error fetching EXPERION data:', error);
        }

        return bureauData;
    };

    // Generate unified comparison
    MultiBureauComparisonEngine.prototype.generateComparison = async function(identifiers, userProfile) {
        var { pan, mobile, email } = identifiers;
        var profile = userProfile || identifiers.profile;
        
        if (!profile) {
            profile = 'PROFILE_' + (mobile || email || pan) + '_' + Date.now();
        }

        // Fetch data from all bureaus
        var bureauData = await this.fetchBureauData({ pan, mobile, email });
        
        if (Object.keys(bureauData).length === 0) {
            throw new Error('No bureau data found for the provided identifiers');
        }

        // Process each bureau's data
        var bureauScores = [];
        var scores = [];
        var grades = [];

        // Process CIBIL
        if (bureauData.CIBIL) {
            var cibilGrading = new CibilGradingEngine(bureauData.CIBIL);
            var cibilGrade = cibilGrading.calculateOverallGrade();
            var cibilScore = parseInt(bureauData.CIBIL.credit_score) || 0;
            
            bureauScores.push({
                bureau: 'CIBIL',
                credit_score: cibilScore,
                grade: typeof cibilGrade === 'object' ? cibilGrade.grade : cibilGrade,
                reportDate: bureauData.CIBIL.updatedAt || bureauData.CIBIL.createdAt,
                dataAvailable: true,
                analysis: {
                    overallGrade: typeof cibilGrade === 'object' ? cibilGrade.grade : cibilGrade,
                    creditWorthiness: cibilGrading.getCreditUtilization(),
                    riskLevel: cibilScore >= 750 ? 'LOW' : cibilScore >= 650 ? 'MEDIUM' : 'HIGH'
                }
            });
            
            scores.push(cibilScore);
            grades.push(typeof cibilGrade === 'object' ? cibilGrade.grade : cibilGrade);
        }

        // Process EQUIFAX
        if (bureauData.EQUIFAX) {
            var equifaxGrading = new EquifaxGradingEngine(bureauData.EQUIFAX);
            var equifaxGrade = equifaxGrading.calculateOverallGrade();
            var equifaxScore = parseInt(bureauData.EQUIFAX.credit_score) || 0;
            
            bureauScores.push({
                bureau: 'EQUIFAX',
                credit_score: equifaxScore,
                grade: equifaxGrade,
                reportDate: bureauData.EQUIFAX.updatedAt || bureauData.EQUIFAX.createdAt,
                dataAvailable: true,
                analysis: {
                    overallGrade: equifaxGrade,
                    creditWorthiness: equifaxGrading.getCreditUtilization(),
                    riskLevel: equifaxScore >= 750 ? 'LOW' : equifaxScore >= 650 ? 'MEDIUM' : 'HIGH'
                }
            });
            
            scores.push(equifaxScore);
            grades.push(equifaxGrade);
        }

        // Process EXPERION
        if (bureauData.EXPERION) {
            var experionGrading = new ExperionGradingEngine(bureauData.EXPERION);
            var experionGrade = experionGrading.calculateOverallGrade();
            var experionScore = parseInt(bureauData.EXPERION.credit_score) || 0;
            
            bureauScores.push({
                bureau: 'EXPERION',
                credit_score: experionScore,
                grade: experionGrade,
                reportDate: bureauData.EXPERION.updatedAt || bureauData.EXPERION.createdAt,
                dataAvailable: true,
                analysis: {
                    overallGrade: experionGrade,
                    creditWorthiness: experionGrading.getCreditUtilization(),
                    riskLevel: experionScore >= 750 ? 'LOW' : experionScore >= 650 ? 'MEDIUM' : 'HIGH'
                }
            });
            
            scores.push(experionScore);
            grades.push(experionGrade);
        }

        // Calculate unified metrics
        var averageScore = scores.length > 0 ? scores.reduce(function(a, b) { return a + b; }, 0) / scores.length : 0;
        var highestScore = scores.length > 0 ? Math.max.apply(Math, scores) : 0;
        var lowestScore = scores.length > 0 ? Math.min.apply(Math, scores) : 0;
        var scoreVariance = this.calculateVariance(scores);
        
        // Convert average score to unified grade
        var unifiedGrade = this.scoreToGrade(averageScore);
        
        // Determine consistency
        var consistency = this.determineConsistency(scores);
        
        // Find best and worst bureaus
        var bestBureau = bureauScores.length > 0 ? bureauScores.reduce(function(best, current) {
            return current.credit_score > best.credit_score ? current : best;
        }).bureau : null;
        
        var worstBureau = bureauScores.length > 0 ? bureauScores.reduce(function(worst, current) {
            return current.credit_score < worst.credit_score ? current : worst;
        }).bureau : null;

        // Generate comparison insights
        var comparisonInsights = this.generateInsights(bureauScores, scores, consistency);
        
        // Create unified analysis
        var unifiedAnalysis = {
            overallGrade: unifiedGrade,
            defaultProbability: this.calculateUnifiedDefaultProbability(bureauScores),
            creditWorthiness: averageScore / 10, // Convert to 0-100 scale
            riskLevel: this.determineUnifiedRiskLevel(averageScore),
            recommendations: this.generateUnifiedRecommendations(bureauScores, scores),
            priorityActions: this.generatePriorityActions(bureauScores)
        };

        // Create comparison document
        var comparisonData = {
            profile: profile,
            mobile: mobile,
            email: email,
            pan: pan,
            name: bureauData.CIBIL ? bureauData.CIBIL.name : 
                  bureauData.EQUIFAX ? bureauData.EQUIFAX.name :
                  bureauData.EXPERION ? bureauData.EXPERION.name : null,
            bureauScores: bureauScores,
            averageScore: Math.round(averageScore),
            highestScore: highestScore,
            lowestScore: lowestScore,
            scoreVariance: scoreVariance,
            unifiedGrade: unifiedGrade,
            unifiedAnalysis: unifiedAnalysis,
            comparisonInsights: comparisonInsights,
            availableBureaus: Object.keys(bureauData),
            lastUpdated: new Date()
        };

        // Save or update comparison
        try {
            var existingComparison = await MultiBureauComparisonModel.findOne({ profile: profile });
            if (existingComparison) {
                Object.assign(existingComparison, comparisonData);
                existingComparison.updatedAt = new Date();
                await existingComparison.save();
            } else {
                var comparison = new MultiBureauComparisonModel(comparisonData);
                await comparison.save();
            }
        } catch (error) {
            log('Error saving comparison:', error);
        }

        return comparisonData;
    };

    // Helper methods
    MultiBureauComparisonEngine.prototype.calculateVariance = function(scores) {
        if (scores.length < 2) return 0;
        var mean = scores.reduce(function(a, b) { return a + b; }, 0) / scores.length;
        var variance = scores.reduce(function(sum, score) {
            return sum + Math.pow(score - mean, 2);
        }, 0) / scores.length;
        return Math.round(variance);
    };

    MultiBureauComparisonEngine.prototype.scoreToGrade = function(score) {
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

    MultiBureauComparisonEngine.prototype.determineConsistency = function(scores) {
        if (scores.length < 2) return 'Very Consistent';
        var variance = this.calculateVariance(scores);
        if (variance < 100) return 'Very Consistent';
        if (variance < 500) return 'Consistent';
        if (variance < 1000) return 'Moderate Variance';
        return 'High Variance';
    };

    MultiBureauComparisonEngine.prototype.generateInsights = function(bureauScores, scores, consistency) {
        var insights = {
            scoreConsistency: consistency,
            discrepancies: [],
            recommendations: [],
            bestBureau: bureauScores.length > 0 ? bureauScores.reduce(function(best, current) {
                return current.credit_score > best.credit_score ? current : best;
            }).bureau : null,
            worstBureau: bureauScores.length > 0 ? bureauScores.reduce(function(worst, current) {
                return current.credit_score < worst.credit_score ? current : worst;
            }).bureau : null
        };

        // Add recommendations based on variance
        if (consistency === 'High Variance') {
            insights.recommendations.push('Significant score differences detected. Consider reviewing credit reports from all bureaus.');
        }

        return insights;
    };

    MultiBureauComparisonEngine.prototype.calculateUnifiedDefaultProbability = function(bureauScores) {
        if (bureauScores.length === 0) return 50;
        var totalProbability = 0;
        var count = 0;
        
        bureauScores.forEach(function(score) {
            // Estimate default probability from score
            var scoreValue = score.credit_score;
            var probability = 50;
            if (scoreValue >= 750) probability = 5;
            else if (scoreValue >= 700) probability = 10;
            else if (scoreValue >= 650) probability = 20;
            else if (scoreValue >= 600) probability = 35;
            else if (scoreValue >= 550) probability = 50;
            else probability = 70;
            
            totalProbability += probability;
            count++;
        });
        
        return Math.round(totalProbability / count);
    };

    MultiBureauComparisonEngine.prototype.determineUnifiedRiskLevel = function(averageScore) {
        if (averageScore >= 750) return 'LOW';
        if (averageScore >= 650) return 'MEDIUM';
        if (averageScore >= 550) return 'HIGH';
        return 'VERY_HIGH';
    };

    MultiBureauComparisonEngine.prototype.generateUnifiedRecommendations = function(bureauScores, scores) {
        var recommendations = [];
        var averageScore = scores.length > 0 ? scores.reduce(function(a, b) { return a + b; }, 0) / scores.length : 0;
        
        if (averageScore < 600) {
            recommendations.push({
                priority: 'High',
                title: 'Improve Credit Score',
                description: 'Your average credit score is ' + Math.round(averageScore) + '. Focus on payment history and debt reduction.'
            });
        }
        
        return recommendations;
    };

    MultiBureauComparisonEngine.prototype.generatePriorityActions = function(bureauScores) {
        var actions = [];
        if (bureauScores.length < 2) {
            actions.push({
                priority: 'Medium',
                action: 'Obtain credit reports from additional bureaus for comprehensive analysis'
            });
        }
        return actions;
    };

    module.exports = MultiBureauComparisonEngine;
})();

