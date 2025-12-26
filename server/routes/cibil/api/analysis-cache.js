(function() {
    var crypto = require('crypto');
    
    /**
     * Analysis Cache Helper
     * Computes and caches analysis results to avoid recomputation
     */
    
    var ANALYSIS_VERSION = '1.0'; // Increment when analysis logic changes
    
    /**
     * Generate hash of credit report data to detect changes
     */
    function generateDataHash(creditReport) {
        try {
            var dataString = JSON.stringify(creditReport);
            return crypto.createHash('md5').update(dataString).digest('hex');
        } catch (error) {
            log('Error generating data hash:', error);
            return null;
        }
    }
    
    /**
     * Check if cached analysis is still valid
     */
    function isAnalysisValid(cachedAnalysis, currentDataHash, analysisVersion) {
        if (!cachedAnalysis || !cachedAnalysis.dataHash) {
            return false;
        }
        
        // Check if data has changed
        if (cachedAnalysis.dataHash !== currentDataHash) {
            return false;
        }
        
        // Check if analysis version has changed
        if (cachedAnalysis.analysisVersion !== analysisVersion) {
            return false;
        }
        
        // Check if analysis is too old (optional: 30 days max)
        var maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        if (cachedAnalysis.analyzedAt && (Date.now() - new Date(cachedAnalysis.analyzedAt).getTime() > maxAge)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Compute all analysis results
     */
    function computeAnalysis(cibilData) {
        var GradingEngine = require('./grading-engine');
        var AdvancedAnalytics = require('./analytics-engine-advance.js');
        var RiskAssessment = require('./risk-assessment.js');
        
        var analyzer = new GradingEngine(cibilData);
        var overallGrade = analyzer.calculateOverallGrade() || 'B';
        var defaulters = analyzer.identifyDefaulters() || [];
        var recommendations = analyzer.generateRecommendations() || [];
        
        // Get ALL additional analytics
        var advanced = new AdvancedAnalytics(cibilData, analyzer);
        var risk = new RiskAssessment(cibilData, analyzer);
        var comprehensiveReport = advanced.generateComprehensiveReport();
        var riskReport = risk.generateRiskReport();
        var improvementPlan = advanced.generateImprovementPlan();
        var bankSuggestions = advanced.suggestBanks();
        var creditUtilization = analyzer.getCreditUtilization();
        var creditAge = analyzer.getCreditAge();
        var paymentAnalysis = analyzer.getOverallPaymentAnalysis();
        
        // Get component scores
        var componentScores = {
            paymentHistory: analyzer.calculatePaymentHistoryScore(),
            creditUtilization: analyzer.calculateCreditUtilizationScore(),
            creditAge: analyzer.calculateCreditAgeScore(),
            debtBurden: analyzer.calculateDebtBurdenScore(),
            creditMix: analyzer.calculateCreditMixScore(),
            recentInquiries: analyzer.calculateRecentInquiriesScore()
        };
        
        // Get risk details
        var defaultProbability = risk.calculateDefaultProbability();
        var creditWorthiness = risk.calculateCreditWorthiness();
        var eligibleInstitutions = risk.getEligibleInstitutions();
        
        // Get all accounts
        var allAccounts = analyzer.processAccounts();
        
        return {
            overallGrade: overallGrade,
            defaulters: defaulters,
            recommendations: recommendations,
            comprehensiveReport: comprehensiveReport,
            riskReport: riskReport,
            improvementPlan: improvementPlan,
            bankSuggestions: bankSuggestions,
            creditUtilization: creditUtilization,
            creditAge: creditAge,
            paymentAnalysis: paymentAnalysis,
            componentScores: componentScores,
            riskDetails: {
                defaultProbability: defaultProbability,
                creditWorthiness: creditWorthiness,
                eligibleInstitutions: eligibleInstitutions
            },
            allAccounts: allAccounts
        };
    }
    
    /**
     * Get or compute analysis results
     * Returns cached analysis if valid, otherwise computes and saves
     */
    function getOrComputeAnalysis(cibilData, forceRecompute) {
        return new Promise(function(resolve, reject) {
            try {
                var creditReport = cibilData.credit_report && cibilData.credit_report[0] ? cibilData.credit_report[0] : {};
                var currentDataHash = generateDataHash(creditReport);
                
                // Check if we have cached analysis
                if (!forceRecompute && cibilData.analysis && cibilData.analysis.dataHash) {
                    if (isAnalysisValid(cibilData.analysis, currentDataHash, ANALYSIS_VERSION)) {
                        log('Using cached analysis for client_id: ' + cibilData.client_id);
                        // Convert Mongoose document to plain object if needed
                        var cachedAnalysis = cibilData.analysis.toObject ? cibilData.analysis.toObject() : cibilData.analysis;
                        return resolve({
                            cached: true,
                            analysis: cachedAnalysis
                        });
                    } else {
                        log('Cached analysis invalid, recomputing for client_id: ' + cibilData.client_id);
                    }
                }
                
                // Compute fresh analysis
                log('Computing fresh analysis for client_id: ' + cibilData.client_id);
                var analysisResults = computeAnalysis(cibilData);
                
                // Add metadata
                analysisResults.analysisVersion = ANALYSIS_VERSION;
                analysisResults.analyzedAt = new Date();
                analysisResults.dataHash = currentDataHash;
                
                // Save to database
                CibilDataModel.findOneAndUpdate(
                    { client_id: cibilData.client_id },
                    { 
                        $set: { 
                            analysis: analysisResults,
                            updatedAt: new Date()
                        }
                    },
                    { new: true },
                    function(err, updated) {
                        if (err) {
                            log('Error saving analysis to DB:', err);
                            // Still return results even if save fails
                            return resolve({
                                cached: false,
                                analysis: analysisResults
                            });
                        }
                        
                        log('Analysis saved to database for client_id: ' + cibilData.client_id);
                        resolve({
                            cached: false,
                            analysis: analysisResults
                        });
                    }
                );
                
            } catch (error) {
                log('Error in getOrComputeAnalysis:', error);
                reject(error);
            }
        });
    }
    
    module.exports = {
        getOrComputeAnalysis: getOrComputeAnalysis,
        computeAnalysis: computeAnalysis,
        generateDataHash: generateDataHash,
        isAnalysisValid: isAnalysisValid,
        ANALYSIS_VERSION: ANALYSIS_VERSION
    };
    
})();

