// file: risk-assessment-enhanced.js
(function() {
    var CIBILConstants = require('./cibil-constants.js');
    var EconomicDataService = require('./economic-data-services.js');

    function RiskAssessment(cibilData, gradingEngine) {
        this.cibilData = cibilData;
        this.gradingEngine = gradingEngine;
        this.creditReport = cibilData.credit_report || {};
        this.economicService = new EconomicDataService();
    }

    // Calculate default probability with economic factors
    RiskAssessment.prototype.calculateDefaultProbability = function(callback) {
        var self = this;
        
        // Get economic data
        self.economicService.getEconomicData(function(err, economicData) {
            if (err) {
                console.error('Error fetching economic data:', err);
                economicData = self.getDefaultEconomicData();
            }
            
            try {
                var baseProbability = self.calculateBaseDefaultProbability();
                var adjustedProbability = self.adjustForEconomicFactors(baseProbability, economicData);
                var finalProbability = self.applyRiskMitigation(adjustedProbability);
                
                var result = {
                    probability: Math.min(95, Math.max(5, finalProbability)),
                    riskLevel: self.getRiskLevel(finalProbability),
                    baseProbability: baseProbability,
                    economicAdjustment: adjustedProbability - baseProbability,
                    economicFactors: self.identifyEconomicRiskFactors(economicData),
                    confidence: self.calculateConfidenceScore(),
                    timestamp: new Date().toISOString()
                };
                
                if (callback) callback(null, result);
                return result;
                
            } catch (error) {
                console.error('Error calculating default probability:', error);
                if (callback) callback(error, null);
                return null;
            }
        });
    };

    // Calculate base default probability from credit data
    RiskAssessment.prototype.calculateBaseDefaultProbability = function() {
        var accounts = this.creditReport.accounts || [];
        var enquiries = this.creditReport.enquiries || [];
        
        var probability = 30; // Base probability
        
        // Factor 1: Payment history (40% weight)
        var paymentScore = this.calculatePaymentHistoryScore();
        probability += (100 - paymentScore) * 0.4;
        
        // Factor 2: Credit utilization (25% weight)
        var utilization = this.calculateCreditUtilization();
        if (utilization > 70) probability += 20;
        else if (utilization > 50) probability += 10;
        else if (utilization > 30) probability += 5;
        
        // Factor 3: Default accounts (20% weight)
        var defaultAccounts = accounts.filter(acc => 
            ['004', '005', '007', '011'].includes(acc.creditFacilityStatus)
        ).length;
        probability += defaultAccounts * 8;
        
        // Factor 4: Recent enquiries (10% weight)
        var recentEnquiries = this.countRecentEnquiries(enquiries, 6); // Last 6 months
        probability += Math.min(recentEnquiries * 3, 15);
        
        // Factor 5: Credit age (5% weight)
        var creditAge = this.calculateCreditAge();
        if (creditAge < 12) probability += 10;
        else if (creditAge < 24) probability += 5;
        
        return Math.min(90, probability);
    };

    // Adjust for economic factors
    RiskAssessment.prototype.adjustForEconomicFactors = function(baseProbability, economicData) {
        var adjusted = baseProbability;
        
        // GDP growth impact
        if (economicData.gdpGrowth < 5) adjusted += 10;
        else if (economicData.gdpGrowth > 7) adjusted -= 5;
        
        // Inflation impact
        if (economicData.inflationRate > 6) adjusted += 8;
        else if (economicData.inflationRate < 2) adjusted -= 3;
        
        // Interest rate impact
        if (economicData.repoRate > 7) adjusted += 7;
        else if (economicData.repoRate < 5) adjusted -= 4;
        
        // Unemployment impact
        if (economicData.unemploymentRate > 8) adjusted += 6;
        else if (economicData.unemploymentRate < 5) adjusted -= 3;
        
        // Sector-specific impact
        var userSector = this.getUserSector();
        if (userSector && economicData.sectorPerformance) {
            var sectorPerformance = economicData.sectorPerformance[userSector] || 0;
            if (sectorPerformance < -5) adjusted += 5;
            else if (sectorPerformance > 10) adjusted -= 3;
        }
        
        return adjusted;
    };

    // Get user's employment sector
    RiskAssessment.prototype.getUserSector = function() {
        var employment = this.creditReport.employment || [];
        if (employment.length === 0) return null;
        
        var occupationCode = employment[0].occupationCode;
        var sectorMap = {
            '01': 'professional_services',
            '02': 'government',
            '03': 'private_sector',
            '04': 'self_employed',
            '05': 'business',
            '06': 'daily_wage'
        };
        
        return sectorMap[occupationCode] || 'other';
    };

    // Export the module
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = RiskAssessment;
    }
})();