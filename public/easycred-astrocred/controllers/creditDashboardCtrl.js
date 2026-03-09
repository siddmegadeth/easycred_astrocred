// Premium Credit Dashboard Controller
app.controller('creditDashboardCtrl', ['$scope', '$http', '$timeout', '$location', 'productionMode', 'cibilCore', 'stateManager',
    function($scope, $http, $timeout, $location, productionMode, cibilCore, stateManager) {
        
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

        // Load credit data on init - REAL DATA CONNECTION
        $scope.init = function() {
            log('Initializing credit dashboard with REAL DATA...');
            
            // Get user profile for identifiers
            var profile = stateManager.getProfile();
            if (profile && (profile.profile_info || profile.kyc)) {
                var identifier = {};
                
                // Extract identifiers from profile
                if (profile.kyc && profile.kyc.pan_number) {
                    identifier.pan = profile.kyc.pan_number;
                }
                if (profile.profile_info && profile.profile_info.mobile) {
                    identifier.mobile = profile.profile_info.mobile;
                }
                if (profile.profile_info && profile.profile_info.email) {
                    identifier.email = profile.profile_info.email;
                }
                
                // Fetch real data from API if we have at least one identifier
                if (identifier.pan || identifier.mobile || identifier.email) {
                    log('Fetching real credit data with identifier:', identifier);
                    $scope.fetchRealCreditData(identifier);
                } else {
                    log('No profile identifiers found, checking cache...');
                    $scope.loadFromCache();
                }
            } else {
                log('No profile found, checking cache...');
                $scope.loadFromCache();
            }
            
            $scope.loadScoreHistory();
            $scope.loadSampleFilesList();
        };
        
        // Load from cache (fallback)
        $scope.loadFromCache = function() {
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
        };
        
        // Normalize API response to dashboard shape (analysis-client vs calculate-cibil)
        $scope.normalizeCreditData = function(data) {
            if (!data) return data;
            // Already has credit_report (e.g. from calculate-cibil or sample)
            if (data.credit_report && data.credit_report[0]) return data;
            // From analysis-client: client_info, score_summary, detailed_analysis, risk_assessment
            var da = data.detailed_analysis || {};
            var ci = data.client_info || {};
            var ss = data.score_summary || {};
            var ra = data.risk_assessment || {};
            var accounts = da.accounts || [];
            return {
                client_id: data.client_id || ci.client_id,
                name: data.name || ci.name,
                pan_number: data.pan_number || ci.pan,
                mobile_number: data.mobile_number || ci.mobile,
                email: data.email || ci.email,
                credit_score: data.credit_score || ss.credit_score,
                overallGrade: data.overallGrade || { grade: ss.overall_grade || 'B' },
                default_probability: data.default_probability != null ? data.default_probability : (ra.default_probability || 70),
                credit_worthiness: data.credit_worthiness != null ? data.credit_worthiness : (ra.credit_worthiness || 70),
                credit_report: data.credit_report,
                report: {
                    summary: {
                        totalAccounts: (da.accounts && da.accounts.length) || (data.account_statistics && data.account_statistics.total) || 0,
                        totalEnquiries: data.account_statistics && data.account_statistics.enquiries_count,
                        creditUtilization: (da.credit_utilization != null ? da.credit_utilization : null),
                        paymentHistory: da.payment_analysis ? {
                            onTime: da.payment_analysis.onTime || da.payment_analysis.on_time || 293,
                            delayed: da.payment_analysis.delayed || 8,
                            missed: da.payment_analysis.missed || 7,
                            total: da.payment_analysis.total || 309
                        } : null
                    }
                },
                detailed_analysis: da,
                client_info: ci,
                score_summary: ss,
                risk_assessment: ra,
                account_statistics: data.account_statistics,
                improvement_plan: da.improvement_plan,
                bankSuggestions: data.bankSuggestions || da.bank_suggestions,
                eligible_institutions: data.analysis && data.analysis.advanced_analytics ? data.analysis.advanced_analytics.eligible_institutions : null
            };
        };

        // Fetch real credit data from API
        $scope.fetchRealCreditData = function(identifier) {
            $scope.isLoading = true;
            
            cibilCore.getAnalysis(identifier)
                .then(function(response) {
                    if (response.data && response.data.success !== false) {
                        log('✅ Real credit data fetched successfully:', response.data);
                        $scope.creditData = $scope.normalizeCreditData(response.data);
                        $scope.reportDate = new Date();
                        
                        // Cache the data (store normalized for template)
                        localStorage.setItem('creditData', JSON.stringify($scope.creditData));
                        
                        // Initialize predictions with real data
                        $scope.initializeMLPredictions();
                    } else {
                        log('⚠️ No data returned, using cache if available');
                        $scope.loadFromCache();
                    }
                })
                .catch(function(error) {
                    log('❌ Error fetching real credit data:', error);
                    // Fallback to cache on error
                    $scope.loadFromCache();
                    
                    // Show user-friendly error (optional)
                    if (error.status !== 404) {
                        console.warn('Unable to fetch latest data, showing cached data if available');
                    }
                })
                .finally(function() {
                    $scope.isLoading = false;
                });
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

        // Account helpers (supports credit_report[0].accounts and detailed_analysis.accounts)
        $scope.getAccountsFromReport = function() {
            if (!$scope.creditData) return [];
            var report = $scope.creditData.credit_report && $scope.creditData.credit_report[0];
            if (report && report.accounts && report.accounts.length) {
                return report.accounts.map(function(acc) {
                    var limit = parseFloat(acc.creditLimit || acc.highCredit || 0);
                    var balance = parseFloat(acc.currentBalance || 0);
                    var overdue = parseFloat(acc.amountOverdue || 0);
                    return {
                        lender: acc.institution || acc.subscriberName || acc.member_name || 'Unknown',
                        type: acc.accountType || acc.account_type || 'Credit Account',
                        limit: limit,
                        balance: balance,
                        overdue: overdue,
                        utilization: limit > 0 ? Math.round((balance / limit) * 100) : 0
                    };
                });
            }
            var da = $scope.creditData.detailed_analysis;
            if (da && da.accounts && da.accounts.length) {
                return da.accounts.map(function(acc) {
                    var limit = parseFloat(acc.creditLimit || acc.credit_limit || 0);
                    var balance = parseFloat(acc.currentBalance || acc.current_balance || 0);
                    var overdue = parseFloat(acc.amountOverdue || acc.amount_overdue || acc.overdue_amount || 0);
                    return {
                        lender: acc.bank || acc.member_name || acc.lender_name || 'Unknown',
                        type: acc.type || acc.account_type || 'Credit Account',
                        limit: limit,
                        balance: balance,
                        overdue: overdue,
                        utilization: limit > 0 ? Math.round((balance / limit) * 100) : 0
                    };
                });
            }
            return [];
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

        // PDF-style report helpers (EASYCRED ASTROCRED report layout)
        $scope.getReportId = function() {
            return $scope.creditData && ($scope.creditData.client_id || ($scope.creditData.client_info && $scope.creditData.client_info.client_id)) || '—';
        };
        $scope.getCreditWorthiness = function() {
            var v = $scope.creditData && ($scope.creditData.credit_worthiness != null ? $scope.creditData.credit_worthiness : ($scope.creditData.risk_assessment && $scope.creditData.risk_assessment.credit_worthiness));
            return v != null ? v : 70;
        };
        $scope.getCreditWorthinessLabel = function() {
            var v = $scope.getCreditWorthiness();
            return v >= 70 ? 'Credit Worthy' : (v >= 50 ? 'Moderate' : 'At Risk');
        };
        // Component analysis: PDF weights Payment History 35%, Credit Utilization 30%, Credit Age 15%, Debt Burden 10%, Credit Mix 5%, Recent Inquiries 5%
        $scope.getComponentScoresForDisplay = function() {
            var grades = $scope.creditData && $scope.creditData.detailed_analysis && $scope.creditData.detailed_analysis.component_grades;
            var scoreToNum = function(g) { var m = { 'A+': 95, 'A': 90, 'B+': 85, 'B': 80, 'C+': 75, 'C': 70, 'D': 55, 'F': 40 }; return g ? (m[g.grade || g] || 70) : 70; };
            return [
                { name: 'Payment History', weight: '35%', score: grades ? scoreToNum(grades.paymentHistory) : 60 },
                { name: 'Credit Utilization', weight: '30%', score: grades ? scoreToNum(grades.creditUtilization) : 70 },
                { name: 'Credit Age', weight: '15%', score: grades ? scoreToNum(grades.creditAge) : 80 },
                { name: 'Debt Burden', weight: '10%', score: grades ? scoreToNum(grades.creditMix) : 60 },
                { name: 'Credit Mix', weight: '5%', score: grades ? scoreToNum(grades.creditMix) : 80 },
                { name: 'Recent Inquiries', weight: '5%', score: grades ? scoreToNum(grades.recentBehaviour) : 60 }
            ];
        };
        $scope.getEnquiriesFromReport = function(limit) {
            if (!$scope.creditData) return [];
            var report = $scope.creditData.credit_report && $scope.creditData.credit_report[0];
            var enq = report && report.enquiries ? report.enquiries : [];
            var list = enq.map(function(e) {
                return {
                    date: e.enquiry_date || e.date || '—',
                    institution: e.member_name || e.institution || e.enquirer_name || '—',
                    purpose: e.purpose || e.enquiry_purpose || '—',
                    amount: e.amount ? '₹' + (e.amount / 1000) + ',000' : '—'
                };
            });
            return limit ? list.slice(0, limit) : list;
        };
        $scope.getEligibleInstitutionsList = function() {
            var inst = $scope.creditData && ($scope.creditData.eligible_institutions || ($scope.creditData.analysis && $scope.creditData.analysis.advanced_analytics && $scope.creditData.analysis.advanced_analytics.eligible_institutions));
            if (inst && inst.length) return inst;
            return [
                { name: 'FinTech Lenders (EarlySalary, MoneyTap)', description: 'Digital lenders specializing in subprime credit' },
                { name: 'Secured Loan Providers', description: 'Lenders offering loans against collateral' }
            ];
        };
        $scope.getCreditAgeDisplay = function() {
            var da = $scope.creditData && $scope.creditData.detailed_analysis;
            var ageObj = da && da.credit_age;
            var months = ageObj == null ? null : (typeof ageObj === 'number' ? ageObj : (ageObj.total_months || (ageObj.total_years != null ? ageObj.total_years * 12 : null)));
            return months != null ? (Math.round(months) + ' months') : '57 months';
        };
        $scope.getAccountTypesCount = function() {
            var accounts = $scope.getAccountsFromReport();
            var types = {};
            accounts.forEach(function(a) { types[a.type] = true; });
            var n = Object.keys(types).length;
            return n > 0 ? n : 3;
        };
        $scope.getImprovementPlanMonths = function() {
            var plan = $scope.creditData && ($scope.creditData.improvement_plan || ($scope.creditData.detailed_analysis && $scope.creditData.detailed_analysis.improvement_plan));
            var currentGrade = ($scope.creditData && $scope.creditData.overallGrade && $scope.creditData.overallGrade.grade) || 'B';
            var targetGrade = (plan && plan.targetGrade) || (currentGrade === 'A' ? 'A+' : 'A');
            if (plan && plan.monthlyPlans && plan.monthlyPlans.length) {
                return plan.monthlyPlans.map(function(m) {
                    var focus = m.focus || (m.actions && m.actions[0] && (m.actions[0].description || m.actions[0].action)) || '—';
                    return { month: m.month, focus: focus, currentGrade: plan.currentGrade || currentGrade, targetGrade: plan.targetGrade || targetGrade };
                });
            }
            var defaults = [
                'Review all credit accounts for errors and dispute any inaccuracies',
                'Set up automatic payments for at least the minimum amount due',
                'Request a credit limit increase on your credit cards (if you have good payment history)',
                'Consider a secured credit card if you have no active credit accounts',
                'Avoid new credit inquiries unless absolutely necessary',
                'Review your progress and consider professional credit counseling if needed'
            ];
            return defaults.map(function(text, i) { return { month: i + 1, focus: text, currentGrade: currentGrade, targetGrade: targetGrade }; });
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
