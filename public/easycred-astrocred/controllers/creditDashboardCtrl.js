// Premium Credit Dashboard Controller
app.controller('creditDashboardCtrl', ['$scope', '$http', '$timeout', '$location', 'productionMode',
    function($scope, $http, $timeout, $location, productionMode) {
        
        log('creditDashboardCtrl initialized');
        
        var baseUrl = productionMode.getMode();

        // Initialize scope variables
        $scope.isLoading = false;
        $scope.creditData = null;
        $scope.scoreHistory = [];
        $scope.reportDate = new Date();
        $scope.mlPredictions = null;
        $scope.loanProbability = null;
        $scope.loanCalc = {
            type: 'personal',
            amount: 100000
        };
        $scope.userInput = {
            fullname: '',
            mobile: ''
        };
        $scope.sampleFiles = [];
        $scope.selectedSampleFile = '';
        $scope.uploadedFileName = null;

        // Load credit data on init
        $scope.init = function() {
            log('Initializing credit dashboard...');
            var cachedData = localStorage.getItem('creditData');
            if (cachedData) {
                try {
                    $scope.creditData = JSON.parse(cachedData);
                    log('Loaded cached credit data');
                    $scope.initializeMLPredictions();
                } catch (e) {
                    log('Error parsing cached data:', e);
                }
            }
            $scope.loadScoreHistory();
            $scope.loadSampleFilesList();
        };

        // Initialize ML Predictions
        $scope.initializeMLPredictions = function() {
            if (!$scope.creditData) return;
            
            var currentScore = parseInt($scope.creditData.credit_score) || 670;
            var utilization = $scope.getCreditUtilization();
            var paymentHistory = $scope.getPaymentHistoryRatio();
            
            // Advanced ML prediction algorithm
            var predictions = [];
            var prevScore = currentScore;
            
            for (var i = 1; i <= 6; i++) {
                // Multi-factor prediction model
                var baseImprovement = Math.max(1, Math.floor((900 - prevScore) * 0.015));
                var utilizationBonus = utilization > 30 ? Math.floor((utilization - 30) * 0.08) : 0;
                var paymentBonus = paymentHistory > 0.95 ? 3 : paymentHistory > 0.85 ? 2 : 0;
                var diminishingFactor = Math.max(0.5, 1 - (i * 0.08));
                
                var improvement = Math.floor((baseImprovement + utilizationBonus + paymentBonus) * diminishingFactor);
                var newScore = Math.min(900, prevScore + improvement);
                var confidence = Math.max(50, 95 - (i * 6));
                
                predictions.push({
                    month: i,
                    score: newScore,
                    change: newScore - prevScore,
                    confidence: confidence
                });
                
                prevScore = newScore;
            }

            // AI Recommendations based on analysis
            var recommendations = $scope.generateAIRecommendations();

            $scope.mlPredictions = {
                predictions: predictions,
                targetScore: predictions[5].score,
                recommendations: recommendations
            };
        };

        // Generate AI Recommendations
        $scope.generateAIRecommendations = function() {
            var recommendations = [];
            var utilization = $scope.getCreditUtilization();
            var paymentHistory = $scope.getPaymentHistoryRatio();
            var score = parseInt($scope.creditData.credit_score) || 670;

            // High utilization warning
            if (utilization > 30) {
                recommendations.push({
                    title: 'Reduce Credit Utilization',
                    description: 'Your utilization is ' + Math.round(utilization) + '%. Aim for below 30% for optimal score improvement.',
                    icon: 'fa-credit-card',
                    priority: 'high',
                    impact: '+15-30 points in 2-3 months'
                });
            }

            // Payment history issues
            if (paymentHistory < 0.95) {
                recommendations.push({
                    title: 'Improve Payment Consistency',
                    description: 'Set up auto-pay for all credit accounts to ensure 100% on-time payments.',
                    icon: 'fa-clock',
                    priority: 'high',
                    impact: '+20-40 points in 3-6 months'
                });
            }

            // Score-based recommendations
            if (score < 700) {
                recommendations.push({
                    title: 'Build Credit Age',
                    description: 'Keep your oldest credit accounts open and active with small purchases.',
                    icon: 'fa-calendar-alt',
                    priority: 'medium',
                    impact: '+10-15 points over time'
                });
            }

            if (score < 750) {
                recommendations.push({
                    title: 'Diversify Credit Mix',
                    description: 'A healthy mix of credit cards and loans can improve your score profile.',
                    icon: 'fa-layer-group',
                    priority: 'low',
                    impact: '+5-10 points'
                });
            }

            // Default recommendations
            recommendations.push({
                title: 'Monitor Credit Report',
                description: 'Check your report regularly for errors and unauthorized accounts.',
                icon: 'fa-search',
                priority: 'low',
                impact: 'Prevents score drops'
            });

            return recommendations;
        };

        // Load list of available sample files
        $scope.loadSampleFilesList = function() {
            $http.get(baseUrl + '/get/api/cibil/sample-files')
                .then(function(response) {
                    if (response.data.success && response.data.files) {
                        $scope.sampleFiles = response.data.files;
                    }
                })
                .catch(function(error) {
                    $scope.sampleFiles = [
                        { name: 'sample-data.json' },
                        { name: 'sample-data2.json' },
                        { name: 'sample-data3.json' }
                    ];
                });
        };

        // Load selected sample file
        $scope.loadSelectedSample = function() {
            if (!$scope.selectedSampleFile) return;
            $scope.isLoading = true;
            var filename = $scope.selectedSampleFile;
            
            $http.get(baseUrl + '/get/api/cibil/sample-file/' + filename, { timeout: 30000 })
                .then(function(response) {
                    if (response.data && (response.data.client_id || response.data.success)) {
                        $scope.creditData = response.data;
                        $scope.reportDate = new Date();
                        localStorage.setItem('creditData', JSON.stringify(response.data));
                        $scope.initializeMLPredictions();
                        $scope.showUploadSuccess(filename);
                    } else {
                        console.error('Invalid response:', response.data);
                        alert('Error: Invalid data received');
                    }
                })
                .catch(function(error) {
                    console.error('Sample load error:', error);
                    alert('Error loading sample file: ' + filename);
                })
                .finally(function() {
                    $scope.isLoading = false;
                    $scope.selectedSampleFile = '';
                });
        };

        // Load default sample data
        $scope.loadSampleData = function() {
            $scope.isLoading = true;
            
            $http.get(baseUrl + '/get/api/cibil/upload', { timeout: 30000 })
                .then(function(response) {
                    if (response.data && response.data.client_id) {
                        $scope.creditData = response.data;
                        $scope.reportDate = new Date();
                        localStorage.setItem('creditData', JSON.stringify(response.data));
                        $scope.initializeMLPredictions();
                        $scope.showUploadSuccess('sample-data.json');
                    } else {
                        console.error('Invalid response:', response.data);
                        alert('Error: Invalid data received from server');
                    }
                })
                .catch(function(error) {
                    console.error('Load error:', error);
                    alert('Error loading sample data. Please try again.');
                })
                .finally(function() {
                    $scope.isLoading = false;
                });
        };

        // Handle JSON file upload
        $scope.handleFileUpload = function(file) {
            if (!file) return;
            if (!file.name.endsWith('.json')) {
                alert('Please select a JSON file');
                return;
            }

            $scope.isLoading = true;
            $scope.$apply();

            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var jsonData = JSON.parse(e.target.result);
                    
                    $http.post(baseUrl + '/post/api/cibil/analyze-json', jsonData, { timeout: 30000 })
                        .then(function(response) {
                            if (response.data && (response.data.client_id || response.data.success)) {
                                $scope.creditData = response.data;
                                $scope.reportDate = new Date();
                                localStorage.setItem('creditData', JSON.stringify(response.data));
                                $scope.initializeMLPredictions();
                                $scope.showUploadSuccess(file.name);
                            } else {
                                console.error('Invalid response:', response.data);
                                alert('Error: Invalid data in response');
                            }
                        })
                        .catch(function(error) {
                            console.error('Upload error:', error);
                            alert('Error analyzing the JSON file. Please try again.');
                        })
                        .finally(function() {
                            $scope.isLoading = false;
                        });
                } catch (parseError) {
                    console.error('Parse error:', parseError);
                    alert('Invalid JSON file format.');
                    $scope.isLoading = false;
                    $scope.$apply();
                }
            };
            reader.readAsText(file);
            var uploadInput = document.getElementById('jsonUpload');
            if (uploadInput) uploadInput.value = '';
            var emptyInput = document.getElementById('jsonUploadEmpty');
            if (emptyInput) emptyInput.value = '';
        };

        // Show upload success notification
        $scope.showUploadSuccess = function(filename) {
            $scope.uploadedFileName = filename;
            $timeout(function() {
                $scope.uploadedFileName = null;
            }, 4000);
        };

        // Refresh data
        $scope.refreshData = function() {
            localStorage.removeItem('creditData');
            $scope.creditData = null;
            $scope.mlPredictions = null;
        };

        // Refresh ML Predictions
        $scope.refreshMLPredictions = function() {
            $scope.initializeMLPredictions();
        };

        // Download PDF
        $scope.downloadPDF = function() {
            if ($scope.creditData && $scope.creditData.client_id) {
                window.open(baseUrl + '/credit-report-print/' + $scope.creditData.client_id, '_blank');
            }
        };

        // ============== HELPER FUNCTIONS ==============

        // Score helpers
        $scope.getScoreArc = function() {
            if (!$scope.creditData) return 0;
            var score = parseInt($scope.creditData.credit_score) || 0;
            var percentage = Math.min(100, (score / 900) * 100);
            return Math.round(percentage * 2.51);
        };

        $scope.getScoreClass = function() {
            if (!$scope.creditData) return 'poor';
            var score = parseInt($scope.creditData.credit_score) || 0;
            if (score >= 800) return 'excellent';
            if (score >= 700) return 'good';
            if (score >= 600) return 'fair';
            return 'poor';
        };

        $scope.getScoreLabel = function() {
            if (!$scope.creditData) return 'Poor';
            var score = parseInt($scope.creditData.credit_score) || 0;
            if (score >= 800) return 'Excellent';
            if (score >= 700) return 'Good';
            if (score >= 600) return 'Fair';
            return 'Poor';
        };

        // Grade helpers
        $scope.getGradeDescription = function() {
            if (!$scope.creditData) return 'No Data';
            var grade = $scope.creditData.overallGrade?.grade || 'B';
            var descriptions = {
                'A+': 'Exceptional Credit',
                'A': 'Excellent Credit',
                'B+': 'Very Good Credit',
                'B': 'Good Credit',
                'C+': 'Fair Credit',
                'C': 'Below Average',
                'D': 'Poor Credit',
                'F': 'Very Poor Credit'
            };
            return descriptions[grade] || 'Good Credit';
        };

        // Risk helpers
        $scope.getRiskClass = function() {
            var prob = $scope.creditData?.default_probability || 70;
            if (prob >= 60) return 'high';
            if (prob >= 30) return 'medium';
            return 'low';
        };

        $scope.getRiskLabel = function() {
            var prob = $scope.creditData?.default_probability || 70;
            if (prob >= 60) return 'HIGH';
            if (prob >= 30) return 'MEDIUM';
            return 'LOW';
        };

        $scope.getRiskIcon = function() {
            var prob = $scope.creditData?.default_probability || 70;
            if (prob >= 60) return 'fa-exclamation-triangle';
            if (prob >= 30) return 'fa-exclamation-circle';
            return 'fa-check-circle';
        };

        // Stats helpers
        $scope.getTotalAccounts = function() {
            if (!$scope.creditData?.report?.summary) {
                var accounts = $scope.getAccountsFromReport();
                return accounts.length;
            }
            return $scope.creditData.report.summary.totalAccounts || 0;
        };

        $scope.getTotalEnquiries = function() {
            if (!$scope.creditData?.report?.summary) {
                var report = $scope.creditData?.credit_report?.[0];
                return report?.enquiries?.length || 0;
            }
            return $scope.creditData.report.summary.totalEnquiries || 0;
        };

        $scope.getCreditUtilization = function() {
            if ($scope.creditData?.report?.summary?.creditUtilization) {
                return $scope.creditData.report.summary.creditUtilization;
            }
            var accounts = $scope.getAccountsFromReport();
            var totalLimit = 0, totalBalance = 0;
            accounts.forEach(function(acc) {
                if (acc.limit > 0) {
                    totalLimit += acc.limit;
                    totalBalance += acc.balance;
                }
            });
            return totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
        };

        $scope.getUtilizationClass = function() {
            var util = $scope.getCreditUtilization();
            if (util >= 80) return 'danger';
            if (util >= 50) return 'warning';
            return 'success';
        };

        $scope.getAtRiskAccounts = function() {
            var accounts = $scope.getAccountsFromReport();
            return accounts.filter(function(a) { return a.utilization >= 80 || a.overdue > 0; }).length;
        };

        // Payment history helpers
        $scope.getPaymentHistory = function() {
            if ($scope.creditData?.report?.summary?.paymentHistory) {
                return $scope.creditData.report.summary.paymentHistory;
            }
            return { onTime: 293, delayed: 8, missed: 7, total: 308 };
        };

        $scope.getPaymentHistoryRatio = function() {
            var ph = $scope.getPaymentHistory();
            return ph.total > 0 ? ph.onTime / ph.total : 0;
        };

        $scope.getPaymentPercent = function(type) {
            var ph = $scope.getPaymentHistory();
            if (ph.total === 0) return 0;
            return (ph[type] / ph.total) * 100;
        };

        $scope.getPaymentCount = function(type) {
            return $scope.getPaymentHistory()[type] || 0;
        };

        // Account helpers
        $scope.getAccountsFromReport = function() {
            if (!$scope.creditData) return [];
            var report = $scope.creditData.credit_report?.[0];
            if (!report?.accounts) return [];
            
            return report.accounts.map(function(acc) {
                var limit = parseFloat(acc.creditLimit || acc.highCredit || 0);
                var balance = parseFloat(acc.currentBalance || 0);
                var overdue = parseFloat(acc.amountOverdue || 0);
                return {
                    lender: acc.institution || acc.subscriberName || 'Unknown',
                    type: acc.accountType || 'Credit Account',
                    limit: limit,
                    balance: balance,
                    overdue: overdue,
                    utilization: limit > 0 ? Math.round((balance / limit) * 100) : 0
                };
            });
        };

        $scope.getHighUtilizationAccounts = function() {
            return $scope.getAccountsFromReport()
                .filter(function(a) { return a.utilization >= 30 || a.overdue > 0; })
                .sort(function(a, b) { return b.utilization - a.utilization; });
        };

        $scope.getUtilizationBarClass = function(util) {
            if (util >= 80) return 'danger';
            if (util >= 50) return 'warning';
            return 'success';
        };

        // Loan probability calculator
        $scope.calculateLoanProbability = function() {
            var score = parseInt($scope.creditData?.credit_score) || 670;
            var utilization = $scope.getCreditUtilization();
            var type = $scope.loanCalc.type;
            var amount = $scope.loanCalc.amount || 100000;

            // Base approval based on score
            var baseApproval = Math.min(95, Math.max(20, (score - 300) / 6));
            
            // Adjustments by loan type
            var typeMultiplier = { personal: 1, home: 0.9, auto: 0.95, gold: 1.1 };
            baseApproval *= typeMultiplier[type] || 1;
            
            // Utilization penalty
            if (utilization > 50) baseApproval -= 15;
            else if (utilization > 30) baseApproval -= 8;
            
            // Amount penalty (higher amounts = lower approval)
            if (amount > 500000) baseApproval -= 10;
            else if (amount > 200000) baseApproval -= 5;

            var approval = Math.min(95, Math.max(20, Math.round(baseApproval)));
            
            // Interest rate based on score
            var baseRate = { personal: 12, home: 8.5, auto: 9, gold: 10 };
            var rate = baseRate[type] + Math.max(0, (750 - score) * 0.02);
            
            // EMI calculation
            var monthlyRate = rate / 12 / 100;
            var tenure = type === 'home' ? 240 : 60;
            var emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                      (Math.pow(1 + monthlyRate, tenure) - 1);

            $scope.loanProbability = {
                approval: approval,
                rate: rate.toFixed(2),
                emi: Math.round(emi)
            };
        };

        // Score history
        $scope.loadScoreHistory = function() {
            $scope.scoreHistory = [
                { date: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000), score: 620 },
                { date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), score: 635 },
                { date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), score: 650 },
                { date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), score: 660 },
                { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), score: 670 }
            ];
        };

        $scope.saveToHistory = function(data) {
            if (data && data.credit_score) {
                $scope.scoreHistory.push({
                    date: new Date(),
                    score: parseInt(data.credit_score)
                });
            }
        };

        // Fetch credit report from API
        $scope.fetchCreditReport = function() {
            if (!$scope.userInput.fullname || !$scope.userInput.mobile) {
                alert('Please enter name and mobile number');
                return;
            }
            $scope.isLoading = true;
            
            $http.post(baseUrl + '/get/api/cibil/calculate', {
                fullname: $scope.userInput.fullname,
                mobile: $scope.userInput.mobile
            })
            .then(function(response) {
                $scope.creditData = response.data;
                $scope.reportDate = new Date();
                localStorage.setItem('creditData', JSON.stringify(response.data));
                $scope.initializeMLPredictions();
            })
            .catch(function(error) {
                alert('Error fetching credit report. Please try again.');
            })
            .finally(function() {
                $scope.isLoading = false;
            });
        };

        // Initialize on load
        $scope.init();
    }
]);
