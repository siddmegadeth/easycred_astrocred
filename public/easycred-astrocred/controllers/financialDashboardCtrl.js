(function () {
    'use strict';

    app.controller('financialDashboardCtrl', ['$scope', '$http', 'cibilCore', 'stateManager', '$timeout', '$location',
    function ($scope, $http, cibilCore, stateManager, $timeout, $location) {
        
        console.log('Financial Dashboard Controller Initialized');
        
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

            cibilCore.getAnalysis(identifier).then(function (res) {
                if (res.data && res.data.status) {
                    var data = res.data.data || res.data;
                    $scope.financialData.creditScore = data.credit_score || data.creditScore || 700;
                    $scope.financialData.creditGrade = data.overallGrade?.grade || data.creditGrade || 'B';
                    
                    if (data.recommendations) {
                        $scope.financialData.recommendations = data.recommendations;
                    }
                    
                    // Calculate health score
                    $scope.calculateHealthScore();
                }
            }).catch(function(err) {
                console.log('Credit data load error:', err);
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
                        $scope.financialData.linkedAccounts = res.data.accounts || [];
                        $scope.financialData.bankBalance = res.data.summary?.totalBalance || 0;
                        
                        // Update monthly income/expense if available
                        if (res.data.summary?.avgMonthlyIncome) {
                            $scope.financialData.monthlyIncome = res.data.summary.avgMonthlyIncome;
                        }
                        if (res.data.summary?.avgMonthlyExpense) {
                            $scope.financialData.monthlyExpense = res.data.summary.avgMonthlyExpense;
                        }
                        
                        $scope.calculateSavingsRate();
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
            }, 1000);
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
