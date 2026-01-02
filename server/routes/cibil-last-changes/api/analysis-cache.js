(function() {
    var crypto = require('crypto');
    
    /**
     * Analysis Cache Helper
     * Computes and caches analysis results to avoid recomputation
     * Updated for mobile/email/PAN based schema
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
        try {
            var GradingEngine = require('./grading-engine');
            var AdvancedAnalytics = require('./analytics-engine-advance.js');
            var RiskAssessment = require('./risk-assessment.js');
            var AdvancedRiskAssessment = require('./advanced-risk-assessment.js');
            
            var analyzer = new GradingEngine(cibilData);
            var overallGrade = analyzer.calculateOverallGrade ? analyzer.calculateOverallGrade() : 'B';
            var defaulters = analyzer.identifyDefaulters ? analyzer.identifyDefaulters() : [];
            var recommendations = analyzer.generateRecommendations ? analyzer.generateRecommendations() : [];
            
            // Get advanced analytics if available
            var comprehensiveReport = {};
            var riskReport = {};
            var improvementPlan = {};
            var bankSuggestions = [];
            var riskDetails = {};
            var enhancedRiskAssessment = {};
            
            try {
                var advanced = new AdvancedAnalytics(cibilData, analyzer);
                var risk = new RiskAssessment(cibilData, analyzer);
                var advancedRisk = new AdvancedRiskAssessment(cibilData, analyzer, risk);
                
                comprehensiveReport = advanced.generateComprehensiveReport ? advanced.generateComprehensiveReport() : {};
                riskReport = risk.generateRiskReport ? risk.generateRiskReport() : {};
                improvementPlan = advanced.generateImprovementPlan ? advanced.generateImprovementPlan() : {};
                bankSuggestions = advanced.suggestBanks ? advanced.suggestBanks() : [];
                
                // Get enhanced risk assessment
                enhancedRiskAssessment = advancedRisk.getEnhancedRiskAssessmentSync ? 
                    advancedRisk.getEnhancedRiskAssessmentSync() : {};
                
                // Get risk details
                var defaultProbability = risk.calculateDefaultProbability ? risk.calculateDefaultProbability() : {};
                var creditWorthiness = risk.calculateCreditWorthiness ? risk.calculateCreditWorthiness() : {};
                var eligibleInstitutions = risk.getEligibleInstitutions ? risk.getEligibleInstitutions() : [];
                
                riskDetails = {
                    defaultProbability: defaultProbability,
                    creditWorthiness: creditWorthiness,
                    eligibleInstitutions: eligibleInstitutions,
                    enhancedRisk: enhancedRiskAssessment
                };
                
            } catch (advError) {
                log('Advanced analytics error, using basic analysis:', advError.message);
            }
            
            // Get basic analytics
            var creditUtilization = analyzer.getCreditUtilization ? analyzer.getCreditUtilization() : 0;
            var creditAge = analyzer.getCreditAge ? analyzer.getCreditAge() : 0;
            var paymentAnalysis = analyzer.getOverallPaymentAnalysis ? analyzer.getOverallPaymentAnalysis() : {};
            
            // Get component scores
            var componentScores = {
                paymentHistory: analyzer.calculatePaymentHistoryScore ? analyzer.calculatePaymentHistoryScore() : 0,
                creditUtilization: analyzer.calculateCreditUtilizationScore ? analyzer.calculateCreditUtilizationScore() : 0,
                creditAge: analyzer.calculateCreditAgeScore ? analyzer.calculateCreditAgeScore() : 0,
                debtBurden: analyzer.calculateDebtBurdenScore ? analyzer.calculateDebtBurdenScore() : 0,
                creditMix: analyzer.calculateCreditMixScore ? analyzer.calculateCreditMixScore() : 0,
                recentInquiries: analyzer.calculateRecentInquiriesScore ? analyzer.calculateRecentInquiriesScore() : 0
            };
            
            // Get all accounts
            var allAccounts = analyzer.processAccounts ? analyzer.processAccounts() : [];
            
            // Get user information from updated schema
            var userInfo = {
                name: cibilData.name || null,
                mobile: cibilData.mobile || null,
                email: cibilData.email || null,
                pan: cibilData.pan || null,
                gender: cibilData.gender || null,
                creditScore: cibilData.credit_score || null
            };
            
            return {
                userInfo: userInfo,
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
                riskDetails: riskDetails,
                allAccounts: allAccounts,
                enhancedRiskAssessment: enhancedRiskAssessment,
                // Summary for quick reference
                summary: {
                    grade: overallGrade,
                    riskLevel: riskDetails.enhancedRisk?.riskLevel || 'Medium',
                    defaultProbability: riskDetails.defaultProbability?.probability || 50,
                    eligibleBanksCount: bankSuggestions.length || 0,
                    utilizationPercentage: creditUtilization,
                    creditAgeYears: Math.round(creditAge / 12)
                }
            };
            
        } catch (error) {
            log('Error in computeAnalysis:', error);
            throw error;
        }
    }
    
    /**
     * Get or compute analysis results
     * Returns cached analysis if valid, otherwise computes and saves
     * Updated for mobile/email/PAN based schema
     */
    function getOrComputeAnalysis(cibilData, forceRecompute) {
        return new Promise(function(resolve, reject) {
            try {
                if (!cibilData) {
                    return reject(new Error('No CIBIL data provided'));
                }
                
                var creditReport = cibilData.credit_report && cibilData.credit_report[0] ? cibilData.credit_report[0] : {};
                var currentDataHash = generateDataHash(creditReport);
                
                // Get user identifier for logging
                var userIdentifier = cibilData.mobile || cibilData.email || cibilData.pan || 'unknown_user';
                
                // Check if we have cached analysis
                if (!forceRecompute && cibilData.analysis && cibilData.analysis.dataHash) {
                    if (isAnalysisValid(cibilData.analysis, currentDataHash, ANALYSIS_VERSION)) {
                        log(`Using cached analysis for user: ${userIdentifier}`);
                        // Convert Mongoose document to plain object if needed
                        var cachedAnalysis = cibilData.analysis.toObject ? 
                            cibilData.analysis.toObject() : 
                            cibilData.analysis;
                        
                        // Add user info if not present (for backward compatibility)
                        if (!cachedAnalysis.userInfo) {
                            cachedAnalysis.userInfo = {
                                name: cibilData.name || null,
                                mobile: cibilData.mobile || null,
                                email: cibilData.email || null,
                                pan: cibilData.pan || null,
                                gender: cibilData.gender || null,
                                creditScore: cibilData.credit_score || null
                            };
                        }
                        
                        return resolve({
                            cached: true,
                            analysis: cachedAnalysis,
                            userIdentifier: userIdentifier
                        });
                    } else {
                        log(`Cached analysis invalid, recomputing for user: ${userIdentifier}`);
                    }
                }
                
                // Compute fresh analysis
                log(`Computing fresh analysis for user: ${userIdentifier}`);
                var analysisResults = computeAnalysis(cibilData);
                
                // Add metadata
                analysisResults.analysisVersion = ANALYSIS_VERSION;
                analysisResults.analyzedAt = new Date();
                analysisResults.dataHash = currentDataHash;
                
                // Determine query based on available identifiers
                var query = {};
                if (cibilData.mobile) query.mobile = cibilData.mobile;
                else if (cibilData.email) query.email = cibilData.email;
                else if (cibilData.pan) query.pan = cibilData.pan;
                else {
                    // If no identifier, can't save to database
                    log('Warning: No valid identifier found, analysis not saved to database');
                    return resolve({
                        cached: false,
                        analysis: analysisResults,
                        userIdentifier: userIdentifier
                    });
                }
                
                // Import model if not already available
                var CibilDataModel;
                try {
                    CibilDataModel = mongoose.model('CibilDataModel');
                } catch (err) {
                    CibilDataModel = require('../models/cibil-data-model'); // Adjust path as needed
                }
                
                // Save to database using appropriate identifier
                CibilDataModel.findOneAndUpdate(
                    query,
                    { 
                        $set: { 
                            analysis: analysisResults,
                            updatedAt: new Date()
                        }
                    },
                    { 
                        new: true,
                        upsert: false // Don't create new record, update existing
                    },
                    function(err, updated) {
                        if (err) {
                            log('Error saving analysis to DB:', err.message);
                            // Still return results even if save fails
                            return resolve({
                                cached: false,
                                analysis: analysisResults,
                                userIdentifier: userIdentifier,
                                saveError: err.message
                            });
                        }
                        
                        if (!updated) {
                            log(`No matching record found for user: ${userIdentifier}`);
                        } else {
                            log(`Analysis saved to database for user: ${userIdentifier}`);
                        }
                        
                        resolve({
                            cached: false,
                            analysis: analysisResults,
                            userIdentifier: userIdentifier
                        });
                    }
                );
                
            } catch (error) {
                log('Error in getOrComputeAnalysis:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Get analysis by user identifier (mobile, email, or PAN)
     */
    function getAnalysisByIdentifier(identifier, identifierType) {
        return new Promise(function(resolve, reject) {
            try {
                var query = {};
                
                // Build query based on identifier type
                switch(identifierType) {
                    case 'mobile':
                        query.mobile = identifier;
                        break;
                    case 'email':
                        query.email = identifier;
                        break;
                    case 'pan':
                        query.pan = identifier;
                        break;
                    default:
                        return reject(new Error('Invalid identifier type. Use: mobile, email, or pan'));
                }
                
                // Import model
                var CibilDataModel;
                try {
                    CibilDataModel = mongoose.model('CibilDataModel');
                } catch (err) {
                    CibilDataModel = require('../models/cibil-data-model'); // Adjust path as needed
                }
                
                CibilDataModel.findOne(query, function(err, cibilData) {
                    if (err) {
                        return reject(err);
                    }
                    
                    if (!cibilData) {
                        return reject(new Error(`No CIBIL data found for ${identifierType}: ${identifier}`));
                    }
                    
                    // Get analysis (compute if needed)
                    getOrComputeAnalysis(cibilData, false)
                        .then(result => resolve(result))
                        .catch(err => reject(err));
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Helper function for sync usage (for backward compatibility)
     */
    function getOrComputeAnalysisSync(cibilData, forceRecompute) {
        try {
            var result = null;
            var error = null;
            
            getOrComputeAnalysis(cibilData, forceRecompute)
                .then(function(res) {
                    result = res;
                })
                .catch(function(err) {
                    error = err;
                });
            
            // Simple sync wrapper (note: this is not truly sync, just for compatibility)
            if (error) {
                throw error;
            }
            return result;
        } catch (err) {
            throw err;
        }
    }
    
    /**
     * Clear analysis cache for a user
     */
    function clearAnalysisCache(userIdentifier, identifierType) {
        return new Promise(function(resolve, reject) {
            try {
                var query = {};
                
                switch(identifierType) {
                    case 'mobile':
                        query.mobile = userIdentifier;
                        break;
                    case 'email':
                        query.email = userIdentifier;
                        break;
                    case 'pan':
                        query.pan = userIdentifier;
                        break;
                    default:
                        return reject(new Error('Invalid identifier type'));
                }
                
                var CibilDataModel;
                try {
                    CibilDataModel = mongoose.model('CibilDataModel');
                } catch (err) {
                    CibilDataModel = require('../models/cibil-data-model');
                }
                
                CibilDataModel.findOneAndUpdate(
                    query,
                    { 
                        $unset: { analysis: "" },
                        $set: { updatedAt: new Date() }
                    },
                    { new: true },
                    function(err, updated) {
                        if (err) return reject(err);
                        resolve({
                            success: true,
                            message: `Analysis cache cleared for ${identifierType}: ${userIdentifier}`,
                            data: updated
                        });
                    }
                );
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Batch analysis for multiple users
     */
    function batchAnalyzeUsers(userIdentifiers, identifierType, forceRecompute) {
        return new Promise(function(resolve, reject) {
            try {
                var query = {};
                query[identifierType] = { $in: userIdentifiers };
                
                var CibilDataModel;
                try {
                    CibilDataModel = mongoose.model('CibilDataModel');
                } catch (err) {
                    CibilDataModel = require('../models/cibil-data-model');
                }
                
                CibilDataModel.find(query, function(err, cibilDataList) {
                    if (err) return reject(err);
                    
                    var promises = cibilDataList.map(function(cibilData) {
                        return getOrComputeAnalysis(cibilData, forceRecompute);
                    });
                    
                    Promise.all(promises)
                        .then(results => resolve(results))
                        .catch(err => reject(err));
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    module.exports = {
        getOrComputeAnalysis: getOrComputeAnalysis,
        getOrComputeAnalysisSync: getOrComputeAnalysisSync,
        computeAnalysis: computeAnalysis,
        generateDataHash: generateDataHash,
        isAnalysisValid: isAnalysisValid,
        getAnalysisByIdentifier: getAnalysisByIdentifier,
        clearAnalysisCache: clearAnalysisCache,
        batchAnalyzeUsers: batchAnalyzeUsers,
        ANALYSIS_VERSION: ANALYSIS_VERSION
    };
    
})();