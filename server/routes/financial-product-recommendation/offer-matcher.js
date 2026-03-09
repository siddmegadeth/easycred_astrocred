// Enhanced Offer Matching Engine
// Matches financial products based on credit profile, employment type, income, etc.
(function() {
    var ProductModel = require('../../schema/product/product-schema.js');
    var CibilDataModel = require('../../schema/cibil/cibil-data-schema.js');
    var ProfileModel = require('../../schema/profile/profile-schema.js');

    function OfferMatcher() {
        this.scoringWeights = {
            creditScore: 0.35,
            employmentType: 0.20,
            incomeRange: 0.15,
            creditUtilization: 0.10,
            paymentHistory: 0.10,
            creditAge: 0.05,
            existingProducts: 0.05
        };
    }

    // Match offers based on comprehensive user profile
    OfferMatcher.prototype.matchOffers = async function(userProfile, creditData, productType, limit) {
        try {
            limit = limit || 10;
            
            // Get user profile data
            var profile = await ProfileModel.findOne({ profile: userProfile }).lean();
            if (!profile) {
                throw new Error('User profile not found');
            }

            // Extract user attributes
            var userAttributes = this.extractUserAttributes(profile, creditData);
            
            // Get all active products
            var query = { is_active: true };
            if (productType) {
                query.product_type = productType;
            }
            
            var products = await ProductModel.find(query).lean();
            
            // Score and rank products
            var scoredProducts = products.map(function(product) {
                var score = this.calculateMatchScore(product, userAttributes);
                return {
                    product: product,
                    match_score: score.totalScore,
                    match_percentage: score.matchPercentage,
                    reasons: score.reasons,
                    eligibility: score.eligibility,
                    details: score.details
                };
            }, this);

            // Sort by match score (descending)
            scoredProducts.sort(function(a, b) {
                return b.match_score - a.match_score;
            });

            // Filter by minimum eligibility threshold (e.g., 50%)
            var eligibleProducts = scoredProducts.filter(function(item) {
                return item.eligibility.is_eligible && item.match_percentage >= 50;
            });

            return eligibleProducts.slice(0, limit);

        } catch (error) {
            log('Error matching offers:', error);
            return [];
        }
    };

    // Extract user attributes from profile and credit data
    OfferMatcher.prototype.extractUserAttributes = function(profile, creditData) {
        var attributes = {
            creditScore: parseInt(creditData.credit_score) || 0,
            employmentType: this.getEmploymentType(profile),
            incomeRange: this.getIncomeRange(profile),
            creditUtilization: 0,
            paymentHistory: 'unknown',
            creditAge: 0,
            existingProducts: [],
            defaulters: [],
            grade: 'C'
        };

        // Extract from credit data if available
        if (creditData.credit_report && creditData.credit_report[0]) {
            var report = creditData.credit_report[0];
            var accounts = report.accounts || [];
            
            // Calculate utilization
            var totalLimit = 0;
            var totalBalance = 0;
            accounts.forEach(function(acc) {
                totalLimit += acc.highCreditAmount || 0;
                totalBalance += acc.currentBalance || 0;
            });
            attributes.creditUtilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
            
            // Get existing product types
            attributes.existingProducts = accounts.map(function(acc) {
                return acc.accountType || 'UNKNOWN';
            });

            // Calculate credit age
            if (accounts.length > 0) {
                var oldestDate = null;
                accounts.forEach(function(acc) {
                    if (acc.dateOpened) {
                        var date = new Date(acc.dateOpened);
                        if (!oldestDate || date < oldestDate) {
                            oldestDate = date;
                        }
                    }
                });
                if (oldestDate) {
                    attributes.creditAge = (Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30); // months
                }
            }
        }

        // Get grade from analysis if available
        if (creditData.analysis && creditData.analysis.overallGrade) {
            attributes.grade = creditData.analysis.overallGrade;
        }

        return attributes;
    };

    // Calculate match score for a product
    OfferMatcher.prototype.calculateMatchScore = function(product, userAttributes) {
        var scores = {};
        var reasons = [];
        var eligibility = { is_eligible: true, blockers: [] };
        var details = {};

        // Credit score match
        scores.creditScore = this.scoreCreditScoreMatch(product, userAttributes.creditScore, reasons, eligibility);
        details.credit_score_match = scores.creditScore;

        // Employment type match
        scores.employmentType = this.scoreEmploymentTypeMatch(product, userAttributes.employmentType, reasons, eligibility);
        details.employment_match = scores.employmentType;

        // Income range match
        scores.incomeRange = this.scoreIncomeRangeMatch(product, userAttributes.incomeRange, reasons, eligibility);
        details.income_match = scores.incomeRange;

        // Credit utilization match
        scores.creditUtilization = this.scoreUtilizationMatch(product, userAttributes.creditUtilization, reasons);
        details.utilization_match = scores.creditUtilization;

        // Payment history match
        scores.paymentHistory = this.scorePaymentHistoryMatch(product, userAttributes, reasons);
        details.payment_history_match = scores.paymentHistory;

        // Credit age match
        scores.creditAge = this.scoreCreditAgeMatch(product, userAttributes.creditAge, reasons);
        details.credit_age_match = scores.creditAge;

        // Existing products match (avoid duplicates, prefer diversity)
        scores.existingProducts = this.scoreExistingProductsMatch(product, userAttributes.existingProducts, reasons);
        details.existing_products_match = scores.existingProducts;

        // Calculate weighted total score
        var totalScore = 0;
        Object.keys(this.scoringWeights).forEach(function(key) {
            var weight = this.scoringWeights[key];
            var score = scores[key] || 50;
            totalScore += score * weight;
        }, this);

        // Calculate match percentage (0-100)
        var matchPercentage = Math.min(100, Math.max(0, totalScore));

        return {
            totalScore: totalScore,
            matchPercentage: Math.round(matchPercentage),
            scores: scores,
            reasons: reasons.slice(0, 5), // Top 5 reasons
            eligibility: eligibility,
            details: details
        };
    };

    // Score credit score match
    OfferMatcher.prototype.scoreCreditScoreMatch = function(product, userScore, reasons, eligibility) {
        var minScore = product.eligibility_criteria && product.eligibility_criteria.min_credit_score || 300;
        var maxScore = product.eligibility_criteria && product.eligibility_criteria.max_credit_score || 900;
        var preferredScore = product.eligibility_criteria && product.eligibility_criteria.preferred_credit_score || 750;

        if (userScore < minScore) {
            eligibility.is_eligible = false;
            eligibility.blockers.push('Credit score below minimum requirement (' + minScore + ')');
            return 0;
        }

        if (userScore > maxScore) {
            reasons.push('Credit score exceeds maximum (may get better rates elsewhere)');
            return 70;
        }

        var score = 50;
        if (userScore >= preferredScore) {
            score = 100;
            reasons.push('Excellent credit score match for this product');
        } else if (userScore >= minScore + ((preferredScore - minScore) * 0.7)) {
            score = 85;
            reasons.push('Good credit score for this product');
        } else if (userScore >= minScore + ((preferredScore - minScore) * 0.5)) {
            score = 70;
            reasons.push('Acceptable credit score');
        } else {
            score = 60;
            reasons.push('Meets minimum credit score requirement');
        }

        return score;
    };

    // Score employment type match
    OfferMatcher.prototype.scoreEmploymentTypeMatch = function(product, userEmploymentType, reasons, eligibility) {
        var allowedEmploymentTypes = product.eligibility_criteria && product.eligibility_criteria.employment_types || [];
        var preferredEmploymentTypes = product.eligibility_criteria && product.eligibility_criteria.preferred_employment_types || [];

        if (allowedEmploymentTypes.length === 0) {
            return 50; // No restriction
        }

        if (!allowedEmploymentTypes.includes(userEmploymentType)) {
            eligibility.is_eligible = false;
            eligibility.blockers.push('Employment type not eligible (' + userEmploymentType + ')');
            return 0;
        }

        if (preferredEmploymentTypes.includes(userEmploymentType)) {
            reasons.push('Employment type is preferred for this product');
            return 100;
        }

        reasons.push('Employment type is eligible');
        return 75;
    };

    // Score income range match
    OfferMatcher.prototype.scoreIncomeRangeMatch = function(product, userIncomeRange, reasons, eligibility) {
        var minIncome = product.eligibility_criteria && product.eligibility_criteria.min_monthly_income || 0;
        var preferredIncome = product.eligibility_criteria && product.eligibility_criteria.preferred_monthly_income || minIncome * 1.5;

        var userIncome = userIncomeRange.avg || userIncomeRange.min || 0;

        if (userIncome < minIncome) {
            eligibility.is_eligible = false;
            eligibility.blockers.push('Income below minimum requirement (₹' + minIncome.toLocaleString('en-IN') + '/month)');
            return 0;
        }

        var score = 50;
        if (userIncome >= preferredIncome) {
            score = 100;
            reasons.push('Income exceeds preferred threshold');
        } else if (userIncome >= minIncome * 1.2) {
            score = 85;
            reasons.push('Income is above minimum requirement');
        } else {
            score = 70;
            reasons.push('Income meets minimum requirement');
        }

        return score;
    };

    // Score utilization match
    OfferMatcher.prototype.scoreUtilizationMatch = function(product, utilization, reasons) {
        var maxUtilization = product.eligibility_criteria && product.eligibility_criteria.max_credit_utilization || 100;

        if (utilization > maxUtilization) {
            reasons.push('Credit utilization is high (' + Math.round(utilization) + '%)');
            return 40;
        }

        if (utilization <= 30) {
            reasons.push('Low credit utilization - favorable for approval');
            return 100;
        } else if (utilization <= 50) {
            reasons.push('Moderate credit utilization');
            return 80;
        } else if (utilization <= 70) {
            reasons.push('Credit utilization is acceptable');
            return 60;
        } else {
            reasons.push('High credit utilization may affect approval');
            return 50;
        }
    };

    // Score payment history match
    OfferMatcher.prototype.scorePaymentHistoryMatch = function(product, userAttributes, reasons) {
        // This would use payment history from credit data
        // For now, use grade as proxy
        var gradeOrder = ['F', 'D', 'C', 'B', 'A'];
        var userGradeIndex = gradeOrder.indexOf(userAttributes.grade);
        
        if (userGradeIndex >= 3) {
            reasons.push('Excellent payment history');
            return 100;
        } else if (userGradeIndex >= 2) {
            reasons.push('Good payment history');
            return 75;
        } else if (userGradeIndex >= 1) {
            reasons.push('Fair payment history');
            return 50;
        } else {
            reasons.push('Payment history needs improvement');
            return 30;
        }
    };

    // Score credit age match
    OfferMatcher.prototype.scoreCreditAgeMatch = function(product, creditAge, reasons) {
        var minCreditAge = product.eligibility_criteria && product.eligibility_criteria.min_credit_age_months || 0;

        if (creditAge < minCreditAge) {
            reasons.push('Limited credit history (' + Math.round(creditAge) + ' months)');
            return 50;
        }

        if (creditAge >= 60) {
            reasons.push('Strong credit history');
            return 100;
        } else if (creditAge >= 36) {
            reasons.push('Good credit history');
            return 85;
        } else if (creditAge >= 24) {
            reasons.push('Adequate credit history');
            return 70;
        } else {
            reasons.push('Building credit history');
            return 60;
        }
    };

    // Score existing products match
    OfferMatcher.prototype.scoreExistingProductsMatch = function(product, existingProducts, reasons) {
        var productType = product.product_type;
        
        // Check if user already has similar product
        var hasSimilar = existingProducts.some(function(type) {
            return type === productType || areSimilarTypes(type, productType);
        });

        if (hasSimilar) {
            reasons.push('Similar product already exists (may affect approval)');
            return 60;
        }

        reasons.push('New product type - good for credit mix');
        return 90;
    };

    // Helper functions
    OfferMatcher.prototype.getEmploymentType = function(profile) {
        if (!profile || !profile.profile_info) return 'UNKNOWN';
        
        // Map from profile to employment types used in products
        var occupation = profile.profile_info.occupation || '';
        var employmentType = profile.profile_info.employmentType || '';
        
        // Normalize to common types
        if (occupation.includes('Government') || employmentType === 'GOVERNMENT') return 'GOVERNMENT';
        if (occupation.includes('Private') || employmentType === 'PRIVATE') return 'PRIVATE';
        if (occupation.includes('Self') || employmentType === 'SELF_EMPLOYED') return 'SELF_EMPLOYED';
        if (employmentType === 'BUSINESS') return 'BUSINESS';
        if (employmentType === 'PROFESSIONAL') return 'PROFESSIONAL';
        
        return 'UNKNOWN';
    };

    OfferMatcher.prototype.getIncomeRange = function(profile) {
        if (!profile || !profile.profile_info) {
            return { min: 25000, max: 50000, avg: 37500 };
        }

        var monthlyIncome = profile.profile_info.monthlyIncome || 0;
        
        if (monthlyIncome > 0) {
            return {
                min: monthlyIncome * 0.8,
                max: monthlyIncome * 1.2,
                avg: monthlyIncome
            };
        }

        // Default estimate
        return { min: 25000, max: 50000, avg: 37500 };
    };

    function areSimilarTypes(type1, type2) {
        var similarGroups = {
            'CC': ['CC', 'CREDIT_CARD'],
            'PL': ['PL', 'PERSONAL_LOAN'],
            'HL': ['HL', 'HOME_LOAN'],
            'AL': ['AL', 'CAR_LOAN', 'AUTO_LOAN']
        };

        for (var group in similarGroups) {
            if (similarGroups[group].includes(type1) && similarGroups[group].includes(type2)) {
                return true;
            }
        }
        return false;
    }

    module.exports = new OfferMatcher();

})();

