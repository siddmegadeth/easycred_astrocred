(function () {
    var GradingEngine = require("./api/grading-engine");
    var AdvancedAnalytics = require("./api/analytics-engine-advance.js");
    var RiskAssessment = require("./api/risk-assessment.js");

    /**
     * Dashboard Data Aggregation Endpoint
     * Provides comprehensive financial summary for dashboard UI
     */
    app.get('/api/dashboard/summary', async function (req, res) {
        try {
            log('/api/dashboard/summary');

            var mobile = req.session?.mobile || req.query.mobile;

            if (!mobile) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - No mobile number found',
                    requiresAuth: true
                });
            }

            var response = {
                success: true,
                user: {
                    mobile: mobile,
                    name: null
                },
                cibil: null,
                finvu: null,
                insights: [],
                alerts: []
            };

            // 1. Fetch CIBIL Data (resolver: DB first, then hydrate from CibilFetchCache – no refetch)
            try {
                var getCibilForUser = require('./api/cibil-data-resolver.js').getCibilForUser;
                var cibilData = await getCibilForUser({ mobile: mobile, email: '', pan: '' });

                if (cibilData) {
                    var analyzer = new GradingEngine(cibilData);
                    var advanced = new AdvancedAnalytics(cibilData, analyzer);
                    var risk = new RiskAssessment(cibilData, analyzer);

                    var grade = analyzer.calculateOverallGrade();
                    var recommendations = advanced.generateRecommendations();
                    var riskDetails = risk.assessCreditWorthiness();

                    response.user.name = cibilData.name || cibilData.full_name;
                    response.cibil = {
                        score: parseInt(cibilData.credit_score) || 0,
                        grade: grade,
                        lastUpdated: cibilData.updatedAt || new Date(),
                        accounts: {
                            total: cibilData.credit_report?.[0]?.accounts?.length || 0,
                            active: cibilData.credit_report?.[0]?.accounts?.filter(a => a.creditFacilityStatus === '00').length || 0
                        },
                        enquiries: {
                            last6Months: cibilData.credit_report?.[0]?.enquiries?.length || 0
                        },
                        utilization: advanced.getCreditUtilization(),
                        age: advanced.getCreditAge(),
                        risk: {
                            level: riskDetails.riskLevel,
                            probability: riskDetails.defaultProbability
                        }
                    };

                    // Generate insights
                    if (response.cibil.score < 650) {
                        response.alerts.push({
                            type: 'warning',
                            message: 'Your credit score is below average. Focus on timely payments to improve.',
                            action: 'View Roadmap'
                        });
                    }

                    if (response.cibil.utilization > 70) {
                        response.alerts.push({
                            type: 'danger',
                            message: 'High credit utilization detected. Try to reduce outstanding balances.',
                            action: 'See Recommendations'
                        });
                    }

                    // Add top recommendations as insights
                    recommendations.slice(0, 3).forEach(function (rec) {
                        response.insights.push({
                            type: 'info',
                            title: rec.category,
                            message: rec.action
                        });
                    });
                }
            } catch (cibilError) {
                console.error('Error fetching CIBIL data:', cibilError);
                response.cibil = null;
            }

            // 2. Fetch FinVu Data
            try {
                var LinkedAccountModel = require('../../schema/financial-aggregator/linked-account-schema');
                var accounts = await LinkedAccountModel.find({
                    mobile: mobile,
                    status: 'ACTIVE'
                }).lean();

                if (accounts.length > 0) {
                    var totalBalance = accounts.reduce(function (sum, acc) {
                        return sum + (acc.currentBalance || 0);
                    }, 0);

                    response.finvu = {
                        linked: true,
                        totalBalance: totalBalance,
                        accountCount: accounts.length,
                        banks: accounts.map(function (a) { return a.bankName; }),
                        accounts: accounts.map(function (a) {
                            return {
                                bank: a.bankName,
                                type: a.accountType,
                                balance: a.currentBalance,
                                masked: a.accountNumber
                            };
                        }),
                        lastSynced: accounts.length > 0 ?
                            Math.max.apply(null, accounts.map(function (a) { return new Date(a.lastUpdated).getTime(); })) :
                            Date.now()
                    };

                    // Add savings insight
                    if (totalBalance > 50000) {
                        response.insights.push({
                            type: 'success',
                            title: 'Good Savings',
                            message: 'You have healthy savings across ' + accounts.length + ' accounts.'
                        });
                    }
                } else {
                    response.finvu = {
                        linked: false,
                        message: 'Link your bank accounts to get comprehensive financial insights'
                    };
                }
            } catch (finvuError) {
                console.error('Error fetching FinVu data:', finvuError);
                response.finvu = { linked: false, error: true };
            }

            // 3. Add general insights
            if (!response.cibil && !response.finvu?.linked) {
                response.insights.push({
                    type: 'info',
                    title: 'Get Started',
                    message: 'Upload your CIBIL report and link bank accounts to unlock full insights.'
                });
            }

            res.json(response);

        } catch (error) {
            console.error('Dashboard summary error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch dashboard data',
                details: error.message
            });
        }
    });

})();
