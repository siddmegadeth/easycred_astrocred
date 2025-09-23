(function() {


    var DataFetcher = function() {
        this.dataSources = [
            'https://api.financial-data.com/credit-cards',
            'https://api.insurance-providers.com/policies',
            'https://api.loan-aggregators.com/products'
        ];
    };

    DataFetcher.prototype.fetchNewProducts = function() {
        var self = this;

        return new Promise(function(resolve, reject) {
            var fetchPromises = self.dataSources.map(function(source) {
                return axios.get(source, {
                    timeout: 10000
                }).then(function(response) {
                    return self.processFetchedData(response.data, source);
                }).catch(function(error) {
                    console.error('Error fetching from', source, error.message);
                    return [];
                });
            });

            Promise.all(fetchPromises).then(function(results) {
                var allProducts = [].concat.apply([], results);
                var savePromises = allProducts.map(function(productData) {
                    return Product.findOneAndUpdate({
                            name: productData.name,
                            provider: productData.provider,
                            type: productData.type
                        },
                        productData, { upsert: true, new: true }
                    );
                });

                return Promise.all(savePromises);
            }).then(resolve).catch(reject);
        });
    };

    DataFetcher.prototype.processFetchedData = function(data, source) {
        var products = [];

        if (source.includes('credit-cards')) {
            products = data.cards.map(function(card) {
                return {
                    type: 'credit_card',
                    name: card.name,
                    provider: card.provider,
                    annualFee: card.annualFee,
                    interestRate: card.apr,
                    features: card.features || [],
                    eligibilityCriteria: {
                        minIncome: card.minIncome,
                        minCreditScore: card.minCreditScore
                    }
                };
            });
        } else if (source.includes('insurance')) {
            products = data.policies.map(function(policy) {
                return {
                    type: 'insurance',
                    name: policy.policyName,
                    provider: card.provider,
                    insuranceCoverage: {
                        sumAssured: policy.sumAssured,
                        premium: policy.premium,
                        coverageDetails: policy.coverage,
                        exclusions: policy.exclusions || []
                    }
                };
            });
        } else if (source.includes('loan')) {
            products = data.loans.map(function(loan) {
                return {
                    type: loan.loanType,
                    name: loan.productName,
                    provider: loan.lender,
                    interestRate: loan.interestRate,
                    processingFees: loan.processingFee,
                    loanAmount: {
                        min: loan.minAmount,
                        max: loan.maxAmount
                    },
                    tenure: {
                        min: loan.minTenure,
                        max: loan.maxTenure
                    }
                };
            });
        }

        return products;
    };

    module.exports = DataFetcher;

})()