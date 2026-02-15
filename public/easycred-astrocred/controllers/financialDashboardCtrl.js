(function () {
    'use strict';

    app.controller('financialDashboardCtrl', ['$scope', '$rootScope', '$http', 'cibilCore', 'stateManager', '$timeout', '$location',
    function ($scope, $rootScope, $http, cibilCore, stateManager, $timeout, $location) {
        
        console.log('Financial Dashboard Controller Initialized');
        
        $rootScope.loaderShow = true;
        $scope.loaderShow = true;
        $scope.isRefreshing = false;
        $scope.user = stateManager.getProfile() || {};
        
        // Initialize financial data
        $scope.financialData = {
            creditScore: '---',
            creditGrade: 'N/A',
            bankBalance: 0,
            linkedAccounts: [],
            verifiedAssets: [],
            recommendations: [],
            healthScore: 72,
            dti: 28,
            savingsRate: 22,
            monthlyIncome: 75000,
            monthlyExpense: 55000,
            goals: [
                { name: 'Emergency Fund', type: 'savings', current: 125000, target: 300000, progress: 42, eta: '8 months' },
                { name: 'Home Down Payment', type: 'home', current: 500000, target: 1500000, progress: 33, eta: '24 months' }
            ]
        };

        // Loan calculator model
        $scope.loanCalc = {
            amount: 500000,
            rate: 12,
            tenure: 36
        };
        $scope.loanAnalysis = null;

        // Initialize
        $scope.init = function () {
            $scope.loadCreditData();
            $scope.loadBankAccounts();
            $scope.loadAssets();
            $scope.generateRecommendations();
        };

        // Load credit data
        $scope.loadCreditData = function () {
            var profile = stateManager.getProfile();
            if (!profile) {
                $scope.checkLoader();
                return;
            }

            var identifier = {
                pan: profile.kyc?.pan_number,
                mobile: profile.mobile || profile.profile_info?.mobile,
                email: profile.profile_info?.email
            };

            console.log('[financialDashboardCtrl] Loading credit data with identifier:', identifier);
            cibilCore.getAnalysis(identifier).then(function (res) {
                console.log('[financialDashboardCtrl] Credit data response:', res.data);
                var data = res.data;
                if (data && (data.success !== false)) {
                    // API returns: credit_score, overallGrade, score_summary, detailed_analysis, etc.
                    $scope.financialData.creditScore = data.credit_score || data.score_summary?.credit_score || 700;
                    $scope.financialData.creditGrade = (data.score_summary && data.score_summary.overall_grade) || (data.overallGrade && data.overallGrade.grade) || data.creditGrade || 'B';
                    
                    if (data.detailed_analysis && data.detailed_analysis.recommendations) {
                        $scope.financialData.recommendations = Array.isArray(data.detailed_analysis.recommendations)
                            ? data.detailed_analysis.recommendations
                            : [data.detailed_analysis.recommendations];
                    } else if (data.recommendations) {
                        $scope.financialData.recommendations = Array.isArray(data.recommendations) ? data.recommendations : [data.recommendations];
                    }
                    
                    $scope.calculateHealthScore();
                } else {
                    console.warn('[financialDashboardCtrl] No credit data found or invalid response');
                }
            }).catch(function(err) {
                console.error('[financialDashboardCtrl] Credit data load error:', err);
                if (err.data) {
                    console.error('[financialDashboardCtrl] Error details:', err.data);
                }
                if (err.status === 404) {
                    console.warn('[financialDashboardCtrl] CIBIL data not found for user');
                }
            }).finally(function () {
                $scope.checkLoader();
            });
        };

        // Load bank accounts from FinVu
        $scope.loadBankAccounts = function () {
            var profile = stateManager.getProfile();
            if (!profile || !profile.mobile) {
                $scope.checkLoader();
                return;
            }

            $http.get('/api/finvu/summary?mobile=' + (profile.mobile || profile.profile_info?.mobile))
                .then(function (res) {
                    if (res.data.success) {
                        var raw = res.data.accounts || [];
                        $scope.financialData.linkedAccounts = raw.map(function(a) {
                            return {
                                bank: a.bank,
                                bankName: a.bankName || a.bank,
                                type: a.type,
                                accountType: a.accountType || a.type,
                                balance: a.balance,
                                currentBalance: a.currentBalance != null ? a.currentBalance : a.balance,
                                masked: a.masked,
                                accountNumber: a.accountNumber || a.masked
                            };
                        });
                        $scope.financialData.bankBalance = res.data.summary?.totalBalance || 0;
                        $scope.calculateSavingsRate();
                    }
                })
                .then(function() {
                    var p = stateManager.getProfile();
                    var mobile = p && (p.mobile || (p.profile_info && p.profile_info.mobile));
                    if (!mobile) return;
                    return $http.get('/api/finvu/dashboard?mobile=' + mobile);
                })
                .then(function (res) {
                    if (res.data && res.data.success && res.data.data) {
                        var d = res.data.data;
                        if (d.summary) {
                            if (d.summary.avgMonthlyIncome != null) $scope.financialData.monthlyIncome = d.summary.avgMonthlyIncome;
                            if (d.summary.avgMonthlyExpense != null) $scope.financialData.monthlyExpense = d.summary.avgMonthlyExpense;
                            if (d.summary.savingsRate != null) $scope.financialData.savingsRate = d.summary.savingsRate;
                        }
                        if (d.accounts && d.accounts.length && !$scope.financialData.linkedAccounts.length) {
                            $scope.financialData.linkedAccounts = d.accounts.map(function(a) {
                                return {
                                    bankName: a.bankName || a.bank_name,
                                    accountNumber: a.accountNumber || a.masked_account_number,
                                    accountType: a.accountType || a.type,
                                    currentBalance: a.currentBalance != null ? a.currentBalance : a.balance
                                };
                            });
                        }
                        if (d.summary && d.summary.totalBalance != null) $scope.financialData.bankBalance = d.summary.totalBalance;
                        $scope.calculateSavingsRate();
                        $scope.calculateHealthScore();
                    }
                })
                .catch(function(err) {
                    console.log('Bank accounts load error:', err);
                })
                .finally(function () {
                    $scope.checkLoader();
                });
        };

        // Load verified assets
        $scope.loadAssets = function () {
            $scope.financialData.verifiedAssets = $scope.user.api_setu?.verifiedAssets || [];
        };

        // Generate AI recommendations
        $scope.generateRecommendations = function() {
            var recs = [];
            
            // Credit score recommendations
            if ($scope.financialData.creditScore < 700) {
                recs.push({
                    area: 'Credit Score',
                    message: 'Focus on paying bills on time and reducing credit utilization to improve your score.',
                    priority: 'high',
                    impact: '+50 points possible'
                });
            }
            
            // DTI recommendation
            if ($scope.financialData.dti > 40) {
                recs.push({
                    area: 'Debt Management',
                    message: 'Your debt-to-income ratio is high. Consider debt consolidation or increasing income.',
                    priority: 'high',
                    impact: 'Better loan eligibility'
                });
            }
            
            // Savings recommendation
            if ($scope.financialData.savingsRate < 20) {
                recs.push({
                    area: 'Savings',
                    message: 'Aim to save at least 20% of your income. Automate your savings for better discipline.',
                    priority: 'medium',
                    impact: 'Financial security'
                });
            }
            
            // Default recommendation
            if (recs.length === 0) {
                recs.push({
                    area: 'Great Progress!',
                    message: 'Your financial health is looking good. Keep maintaining your habits.',
                    priority: 'low',
                    impact: 'Stay consistent'
                });
            }
            
            $scope.financialData.recommendations = recs;
        };

        // Calculate health score
        $scope.calculateHealthScore = function() {
            var score = 50; // Base score
            
            // Credit score component (30%)
            var creditScore = parseInt($scope.financialData.creditScore) || 650;
            score += Math.min(30, ((creditScore - 300) / 600) * 30);
            
            // DTI component (20%)
            var dti = $scope.financialData.dti || 30;
            score += Math.max(0, 20 - (dti / 2));
            
            // Savings rate component (20%)
            var savingsRate = $scope.financialData.savingsRate || 15;
            score += Math.min(20, savingsRate);
            
            $scope.financialData.healthScore = Math.round(Math.min(100, score));
        };

        // Calculate savings rate
        $scope.calculateSavingsRate = function() {
            var income = $scope.financialData.monthlyIncome || 0;
            var expense = $scope.financialData.monthlyExpense || 0;
            
            if (income > 0) {
                $scope.financialData.savingsRate = Math.round(((income - expense) / income) * 100);
            }
        };

        // Analyze loan
        $scope.analyzeLoan = function() {
            var P = $scope.loanCalc.amount || 500000;
            var r = ($scope.loanCalc.rate || 12) / 100 / 12;
            var n = $scope.loanCalc.tenure || 36;
            
            // Calculate EMI
            var emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
            
            // Calculate new DTI
            var currentEMIs = ($scope.financialData.dti / 100) * $scope.financialData.monthlyIncome;
            var newTotalEMIs = currentEMIs + emi;
            var newDTI = Math.round((newTotalEMIs / $scope.financialData.monthlyIncome) * 100);
            
            // Determine recommendation
            var recommend = newDTI < 50;
            var verdict = recommend 
                ? 'This loan is manageable with your current income. Your new DTI of ' + newDTI + '% is within healthy limits.'
                : 'This loan would push your DTI to ' + newDTI + '%, which may strain your finances. Consider a smaller amount or longer tenure.';
            
            $scope.loanAnalysis = {
                emi: Math.round(emi),
                newDTI: newDTI,
                recommend: recommend,
                verdict: verdict
            };
        };

        // Refresh accounts
        $scope.refreshAccounts = function() {
            $scope.isRefreshing = true;
            $scope.loadBankAccounts();
            $timeout(function() {
                $scope.isRefreshing = false;
            }, 2000);
        };

        // Check loader
        $scope.checkLoader = function () {
            $timeout(function () {
                $scope.loaderShow = false;
                $rootScope.loaderShow = false;
            }, 500);
        };

        // UI Helpers
        $scope.getScoreColor = function (score) {
            score = parseInt(score) || 0;
            if (score >= 750) return 'success';
            if (score >= 700) return '';
            if (score >= 650) return 'warning';
            return 'danger';
        };

        $scope.getHealthClass = function(score) {
            if (score >= 80) return 'excellent';
            if (score >= 60) return 'good';
            if (score >= 40) return 'fair';
            return 'poor';
        };

        $scope.getHealthStatus = function(score) {
            if (score >= 80) return 'Excellent';
            if (score >= 60) return 'Good';
            if (score >= 40) return 'Fair';
            return 'Needs Improvement';
        };

        $scope.getHealthRingDash = function(score) {
            var circumference = 2 * Math.PI * 50;
            var progress = (score || 72) / 100;
            return (circumference * progress) + ' ' + circumference;
        };

        $scope.getDTIClass = function(dti) {
            if (dti <= 30) return 'success';
            if (dti <= 40) return 'warning';
            return 'danger';
        };

        $scope.getDTIStatus = function(dti) {
            if (dti <= 30) return 'Healthy';
            if (dti <= 40) return 'Manageable';
            return 'High Risk';
        };

        $scope.getRecommendationIcon = function(area) {
            var icons = {
                'Credit Score': 'fas fa-chart-line',
                'Debt Management': 'fas fa-balance-scale',
                'Savings': 'fas fa-piggy-bank',
                'Great Progress!': 'fas fa-trophy'
            };
            return icons[area] || 'fas fa-lightbulb';
        };

        $scope.getGoalIcon = function(type) {
            var icons = {
                savings: 'fas fa-piggy-bank',
                home: 'fas fa-home',
                car: 'fas fa-car',
                education: 'fas fa-graduation-cap',
                travel: 'fas fa-plane'
            };
            return icons[type] || 'fas fa-flag';
        };

        // Navigation
        $scope.linkBank = function() {
            $location.path('/finvu-connect');
        };

        $scope.verifyAsset = function() {
            $location.path('/utility-hub');
        };

        $scope.openAIChat = function() {
            alert('AI Chat feature coming soon!');
        };

        $scope.addGoal = function() {
            alert('Goal setting feature coming soon!');
        };

        // Initialize
        $scope.init();
    }]);

})();
