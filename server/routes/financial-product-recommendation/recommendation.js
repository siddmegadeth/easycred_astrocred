(function() {



    var RecommendationEngine = function() {
        this.weights = {
            cost: 0.3,
            features: 0.25,
            popularity: 0.2,
            eligibility: 0.15,
            userRating: 0.1
        };
    };

    RecommendationEngine.prototype.calculateLoanCost = function(loanAmount, interestRate, tenure, processingFees) {
        var monthlyInterest = interestRate / 12 / 100;
        var emi = loanAmount * monthlyInterest * Math.pow(1 + monthlyInterest, tenure) /
            (Math.pow(1 + monthlyInterest, tenure) - 1);
        var totalPayment = emi * tenure;
        var totalCost = totalPayment + processingFees - loanAmount;

        return {
            emi: emi,
            totalPayment: totalPayment,
            totalCost: totalCost,
            costPerMonth: totalCost / tenure
        };
    };

    RecommendationEngine.prototype.analyzeInsuranceLoopholes = function(insurancePolicy) {
        var loopholes = [];
        var severityScore = 0;

        if (insurancePolicy.exclusions && insurancePolicy.exclusions.length > 10) {
            loopholes.push({
                category: 'Excessive Exclusions',
                description: 'Policy has too many exclusions limiting coverage',
                severity: 8
            });
            severityScore += 8;
        }

        if (insurancePolicy.premium && insurancePolicy.sumAssured / insurancePolicy.premium < 100) {
            loopholes.push({
                category: 'Poor Value',
                description: 'Premium is high compared to sum assured',
                severity: 7
            });
            severityScore += 7;
        }

        // Add more loophole detection logic

        return {
            loopholes: loopholes,
            overallSeverity: severityScore / Math.max(loopholes.length, 1)
        };
    };

    RecommendationEngine.prototype.getPersonalizedRecommendations = function(userPreferences, productType, limit) {
        return new Promise(function(resolve, reject) {
            var query = { type: productType };
            var scoreCalculation = {};

            // Build query based on user preferences
            if (userPreferences.creditScore) {
                query['eligibilityCriteria.minCreditScore'] = { $lte: userPreferences.creditScore };
            }

            if (userPreferences.budgetRange) {
                if (productType === 'credit_card') {
                    query['loanAmount.min'] = { $lte: userPreferences.budgetRange.max };
                } else {
                    query['loanAmount.max'] = { $gte: userPreferences.budgetRange.min };
                }
            }

            Product.find(query).then(function(products) {
                var scoredProducts = products.map(function(product) {
                    var score = 0;

                    // Cost-based scoring
                    if (product.interestRate) {
                        score += (15 - product.interestRate) * this.weights.cost * 10;
                    }

                    // Feature-based scoring
                    if (product.features) {
                        score += product.features.length * this.weights.features * 5;
                    }

                    // Popularity scoring
                    score += product.popularityScore * this.weights.popularity;

                    // Eligibility scoring
                    if (userPreferences.creditScore && product.eligibilityCriteria.minCreditScore) {
                        var eligibilityScore = Math.max(0, userPreferences.creditScore - product.eligibilityCriteria.minCreditScore);
                        score += eligibilityScore * this.weights.eligibility;
                    }

                    // User rating scoring
                    if (product.userRatings && product.userRatings.length > 0) {
                        var avgRating = product.userRatings.reduce(function(sum, rating) {
                            return sum + rating.rating;
                        }, 0) / product.userRatings.length;
                        score += avgRating * this.weights.userRating * 20;
                    }

                    var costAnalysis = product.interestRate ?
                        this.calculateLoanCost(100000, product.interestRate, 60, product.processingFees || 0) : { totalCost: 0 };

                    var loopholeAnalysis = productType === 'insurance' ?
                        this.analyzeInsuranceLoopholes(product.insuranceCoverage) : { overallSeverity: 0 };

                    return {
                        product: product,
                        score: score,
                        costAnalysis: costAnalysis,
                        loopholeAnalysis: loopholeAnalysis
                    };
                }.bind(this));

                // Sort by score descending
                scoredProducts.sort(function(a, b) {
                    return b.score - a.score;
                });

                resolve(scoredProducts.slice(0, limit || 10));
            }.bind(this)).catch(reject);
        }.bind(this));
    };

    RecommendationEngine.prototype.compareProducts = function(productIds) {
        return new Promise(function(resolve, reject) {
            Product.find({ _id: { $in: productIds } }).then(function(products) {
                var comparison = products.map(function(product) {
                    var analysis = {};

                    if (product.type.includes('loan')) {
                        analysis.cost = this.calculateLoanCost(100000, product.interestRate, 60, product.processingFees || 0);
                        analysis.costEffectiveness = analysis.cost.totalCost;
                    }

                    if (product.type === 'insurance') {
                        analysis.loopholes = this.analyzeInsuranceLoopholes(product.insuranceCoverage);
                    }

                    return {
                        product: product,
                        analysis: analysis
                    };
                }.bind(this));

                // Sort by cost effectiveness (lower is better for loans)
                if (products[0] && products[0].type.includes('loan')) {
                    comparison.sort(function(a, b) {
                        return a.analysis.costEffectiveness - b.analysis.costEffectiveness;
                    });
                }

                resolve(comparison);
            }.bind(this)).catch(reject);
        }.bind(this));
    };



    recommendationEngine = module.exports = new RecommendationEngine();
})()