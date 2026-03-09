// services/credit-analysis-service.js

function CreditAnalysisService() {
    this.predictor = new EnhancedCIBILPredictor();
    this.isReady = false;
}

/**
 * Initialize the service
 */
CreditAnalysisService.prototype.initialize = function() {
    var self = this;
    
    return this.predictor.initialize()
        .then(function() {
            self.isReady = true;
            console.log('Credit Analysis Service initialized successfully');
            return true;
        })
        .catch(function(error) {
            console.error('Failed to initialize Credit Analysis Service:', error);
            throw error;
        });
};

/**
 * Analyze CIBIL data with ML predictions
 */
CreditAnalysisService.prototype.analyzeWithPredictions = function(cibilData) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        if (!self.isReady) {
            reject(new Error('Service not initialized'));
            return;
        }
        
        // Your existing credit score analysis
        var traditionalAnalysis = self.traditionalAnalysis(cibilData);
        
        // ML predictions
        var mlPredictions = self.getMLPredictions(cibilData);
        
        // Combine results
        Promise.all([traditionalAnalysis, mlPredictions])
            .then(function(results) {
                var combinedResult = {
                    traditional: results[0],
                    machineLearning: results[1],
                    finalScore: self.combineScores(results[0], results[1]),
                    timestamp: new Date()
                };
                
                resolve(combinedResult);
            })
            .catch(reject);
    });
};

/**
 * Your existing traditional analysis
 */
CreditAnalysisService.prototype.traditionalAnalysis = function(cibilData) {
    // This is where your existing credit score calculation logic goes
    return {
        score: parseInt(cibilData.data.credit_score),
        grade: this.calculateGrade(cibilData.data.credit_score),
        factors: this.analyzeFactors(cibilData),
        recommendations: this.generateRecommendations(cibilData)
    };
};

/**
 * Get ML predictions
 */
CreditAnalysisService.prototype.getMLPredictions = function(cibilData) {
    var self = this;
    
    return this.predictor.predictDefault(cibilData)
        .then(function(defaultPrediction) {
            return {
                defaultProbability: defaultPrediction.probability,
                riskLevel: defaultPrediction.riskLevel,
                confidence: defaultPrediction.confidence,
                warning: defaultPrediction.probability > 0.7 ? 'High default risk detected' : null
            };
        });
};

/**
 * Combine traditional and ML scores
 */
CreditAnalysisService.prototype.combineScores = function(traditional, ml) {
    var baseScore = traditional.score;
    
    // Adjust based on ML prediction
    if (ml.riskLevel === 'HIGH' || ml.riskLevel === 'VERY_HIGH') {
        baseScore = Math.max(300, baseScore - 50); // Reduce score for high risk
    } else if (ml.riskLevel === 'LOW' && ml.confidence > 0.8) {
        baseScore = Math.min(900, baseScore + 20); // Boost score for low risk with high confidence
    }
    
    return baseScore;
};

// Your existing methods...
CreditAnalysisService.prototype.calculateGrade = function(score) {
    if (score >= 800) return 'A+';
    if (score >= 750) return 'A';
    if (score >= 700) return 'B+';
    if (score >= 650) return 'B';
    if (score >= 600) return 'C+';
    if (score >= 550) return 'C';
    return 'D';
};

module.exports = CreditAnalysisService;