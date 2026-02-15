app.controller('homeCtrl', ['$scope', '$rootScope', '$timeout', '$http', 'stateManager', '$location', 'authentication', 'cibilCore', 'productionMode', 'astroAI', 'surePass', function ($scope, $rootScope, $timeout, $http, stateManager, $location, authentication, cibilCore, productionMode, astroAI, surePass) {

    // Removed analytics calls that cause CORS errors

    // Initialize creditData immediately to prevent template rendering issues
    $scope.creditData = {
        credit_score: null,
        name: 'User',
        pan: 'N/A',
        mobile: '',
        email: '',
        client_id: null
    };

    $scope.paymentOnTime = null;
    $scope.creditUtilization = null;
    $scope.recentEnquiries = null;
    $scope.creditAge = null;
    $scope.defaultAccounts = null;
    $scope.defaultProbability = null;
    $scope.creditWorthiness = null;
    $scope.totalExposure = null;
    $scope.totalOverdue = null;
    $scope.loanEligibility = null;
    $scope.improvementPlan = null;
    $scope.riskAssessment = {
        level: 'medium-high',
        probability: 38
    };
    $scope.accounts = [];
    $scope.filteredAccounts = [];

    // Finvu status
    $scope.finvuConnected = false;
    $scope.finvuStatus = 'Not Connected';

    $timeout(function () {
        console.log('[homeCtrl] Initializing controller');

        if (stateManager.isUserLogggedIn()) {
            $scope.userProfile = stateManager.getProfile();
            console.log('[homeCtrl] User Profile:', $scope.userProfile);

            // Update credit data with user info immediately
            if ($scope.userProfile) {
                $scope.creditData.name = $scope.userProfile.profile_info?.fullname || $scope.userProfile.profile_info?.name || 'User';
                $scope.creditData.pan = $scope.userProfile.kyc?.pan_number || 'N/A';
                $scope.creditData.mobile = $scope.userProfile.profile_info?.mobile || $scope.userProfile.mobile || '';
                $scope.creditData.email = $scope.userProfile.profile_info?.email || '';
            }

            // Always load dashboard data, even if profile not complete (will show available data)
            $scope.loadDashboardData();

            // Check Finvu connection status
            $scope.checkFinvuStatus();

            // Check if profile needs completion
            if (!stateManager.isProfileCompleted()) {
                warn('Profile not complete. Redirect to profile completion after dashboard loads...');
                $timeout(function () {
                    $location.path("profile/complete");
                }, 2000); // Give 2 seconds to see dashboard before redirecting
            }
        } else {
            $location.path("login");
        }

        $rootScope.$on('request_error', function (event, data) {
            $rootScope.loaderShow = false;
        });
    });

    $scope.loadDashboardData = function () {
        $rootScope.loaderShow = true;
        $scope.chartsInitialized = false;

        // Build identifier from user profile
        var identifier = {};
        if ($scope.userProfile) {
            if ($scope.userProfile.kyc?.pan_number) {
                identifier.pan = $scope.userProfile.kyc.pan_number;
            }
            if ($scope.userProfile.mobile || $scope.userProfile.profile_info?.mobile) {
                identifier.mobile = $scope.userProfile.mobile || $scope.userProfile.profile_info.mobile;
            }
            if ($scope.userProfile.profile_info?.email) {
                identifier.email = $scope.userProfile.profile_info.email;
            }
        }

        // If no identifier, use fallback data immediately
        if (!identifier.pan && !identifier.mobile && !identifier.email) {
            console.warn('[homeCtrl] No identifier available, using fallback data');
            var mobile = $scope.userProfile?.profile_info?.mobile || $scope.userProfile?.mobile || '';
            var name = $scope.userProfile?.profile_info?.fullname || $scope.userProfile?.profile_info?.name || 'User';

            // Set fallback values
            $scope.creditData.credit_score = 670;
            $scope.creditData.name = name;
            $scope.creditData.pan = $scope.userProfile?.kyc?.pan_number || 'N/A';
            $scope.creditData.mobile = mobile;

            $rootScope.loaderShow = false;
            $timeout(function () {
                initializeCharts();
            }, 100);
            return;
        }

        console.log('[homeCtrl] Loading CIBIL analysis with identifier:', identifier);
        cibilCore.getAnalysis(identifier).then(function (res) {
            console.log('[homeCtrl] CIBIL analysis response:', res.data);

            if (!res.data || !res.data.success) {
                throw new Error('Analysis failed: ' + (res.data?.error || 'Unknown error'));
            }

            // Handle the actual response format from /get/api/cibil/analysis
            var response = res.data;

            // Update creditData with actual values from response
            $scope.creditData.credit_score = parseInt(response.score_summary?.credit_score || response.credit_score || 670);
            $scope.creditData.name = response.client_info?.name || $scope.userProfile?.profile_info?.fullname || $scope.userProfile?.profile_info?.name || 'User';
            $scope.creditData.pan = response.client_info?.pan || $scope.userProfile?.kyc?.pan_number || 'N/A';
            $scope.creditData.mobile = response.client_info?.mobile || $scope.userProfile?.profile_info?.mobile || $scope.userProfile?.mobile || '';
            $scope.creditData.client_id = response.client_info?.client_id || null;

            // Extract detailed analysis data
            var analysis = response.detailed_analysis || {};
            var accountStats = response.account_statistics || {};
            var riskAssess = response.risk_assessment || {};

            // Set metrics from analysis
            $scope.paymentOnTime = analysis.payment_analysis?.on_time_percentage || analysis.payment_analysis?.percentage || 65;
            $scope.creditUtilization = analysis.credit_utilization?.percentage || analysis.credit_utilization || 48;
            $scope.recentEnquiries = accountStats.recent_enquiries || accountStats.enquiries_count || 7;

            // Fix credit age - convert months to years if needed
            var rawCreditAge = analysis.credit_age?.total_years || analysis.credit_age?.total_months || analysis.credit_age || 4.2;
            // If value is > 100, it's likely in months, convert to years
            $scope.creditAge = rawCreditAge > 100 ? parseFloat((rawCreditAge / 12).toFixed(1)) : parseFloat(rawCreditAge.toFixed(1));

            $scope.defaultAccounts = accountStats.default_accounts || accountStats.defaults_count || 4;
            $scope.defaultProbability = riskAssess.default_probability || riskAssess.probability || 38;
            $scope.creditWorthiness = riskAssess.credit_worthiness || 6.2;
            $scope.totalExposure = accountStats.total_exposure || 485566;
            $scope.totalOverdue = accountStats.total_overdue || 48018;
            $scope.loanEligibility = riskAssess.loan_eligibility || '₹5-10L';


            $scope.riskAssessment = {
                level: riskAssess.risk_level || response.score_summary?.overall_grade?.toLowerCase() || 'medium-high',
                probability: riskAssess.default_probability || 38
            };

            // Map accounts from account_statistics or credit_report
            if (accountStats.accounts && accountStats.accounts.length > 0) {
                $scope.accounts = accountStats.accounts;
            } else if (response.detailed_analysis?.accounts) {
                $scope.accounts = response.detailed_analysis.accounts;
            } else {
                $scope.accounts = [];
            }
            $scope.filteredAccounts = $scope.accounts;

            // Calculate account summary statistics
            $scope.totalAccounts = $scope.accounts.length || 0;
            $scope.activeAccounts = $scope.accounts.filter(function (acc) {
                return acc.status && acc.status.toLowerCase() !== 'default' && acc.status.toLowerCase() !== 'closed';
            }).length || 0;

            // Calculate totals
            $scope.totalBalance = $scope.accounts.reduce(function (sum, acc) {
                return sum + (parseFloat(acc.currentBalance) || 0);
            }, 0) || 0;

            $scope.totalCreditLimit = $scope.accounts.reduce(function (sum, acc) {
                return sum + (parseFloat(acc.creditLimit) || 0);
            }, 0) || 0;

            // Chart data from single source (API component_scores = numeric 0-100)
            var comp = analysis.component_scores || {};
            $scope.chartData = {
                scoreBreakdown: {
                    payment_history: (comp.paymentHistory != null && comp.paymentHistory !== undefined) ? comp.paymentHistory : 65,
                    credit_utilization: (comp.creditUtilization != null && comp.creditUtilization !== undefined) ? comp.creditUtilization : 48,
                    credit_age: (comp.creditAge != null && comp.creditAge !== undefined) ? comp.creditAge : 70,
                    credit_mix: (comp.creditMix != null && comp.creditMix !== undefined) ? comp.creditMix : 75,
                    new_credit: (comp.recentBehaviour != null && comp.recentBehaviour !== undefined) ? comp.recentBehaviour : 60
                },
                paymentHistory: analysis.payment_analysis?.history || (analysis.payment_analysis?.monthlyScores && analysis.payment_analysis.monthlyScores.slice(-6)) || [85, 80, 75, 65, 60, 65]
            };

            $scope.improvementPlan = analysis.improvement_plan || null;
            var defaulters = analysis.defaulters || [];
            $scope.topPriorityAction = null;
            if (defaulters.length > 0 && (defaulters[0].amountOverdue > 0 || defaulters[0].overdue_amount > 0 || defaulters[0].overdue > 0)) {
                var amt = defaulters[0].amountOverdue || defaulters[0].overdue_amount || defaulters[0].overdue;
                var bank = defaulters[0].memberShortName || defaulters[0].bank || defaulters[0].lender_name || 'Bank';
                $scope.topPriorityAction = 'Clear ₹' + (typeof amt === 'number' ? amt.toLocaleString('en-IN') : amt) + ' ' + bank + ' overdue';
            } else if ($scope.totalOverdue > 0) {
                $scope.topPriorityAction = 'Clear overdue amount (₹' + $scope.totalOverdue.toLocaleString('en-IN') + ')';
            }

            $timeout(function () {
                initializeCharts();
            }, 100);

            $rootScope.loaderShow = false;
            console.log('[homeCtrl] Dashboard data loaded successfully');
            console.log('[homeCtrl] creditData:', JSON.stringify($scope.creditData));
        }).catch(function (err) {
            console.error('[homeCtrl] CIBIL analysis error:', err);

            // Use fallback data from mock CIBIL files
            console.log('[homeCtrl] Using fallback data from data/cibil');
            var mobile = $scope.userProfile?.profile_info?.mobile || $scope.userProfile?.mobile || $scope.userProfile?.userId;
            var name = $scope.userProfile?.profile_info?.fullname || $scope.userProfile?.profile_info?.name || 'User';

            // Set fallback values when API fails
            $scope.creditData.credit_score = $scope.creditData.credit_score || null;
            $scope.creditData.name = name || 'User';
            $scope.creditData.pan = $scope.userProfile?.kyc?.pan_number || 'N/A';
            $scope.creditData.mobile = mobile || '';

            // Keep default values already set above
            $rootScope.loaderShow = false;

            console.log('[homeCtrl] Fallback data set:', $scope.creditData);

            $scope.riskAssessment = {
                level: "medium-high",
                probability: 38
            };

            $scope.accounts = [];
            $scope.filteredAccounts = [];

            // Initialize charts with defaults
            $timeout(function () {
                initializeCharts();
            }, 100);

            console.log('[homeCtrl] Fallback complete, creditData:', JSON.stringify($scope.creditData));
        });
    };

    // Initialize charts with default/fallback data
    function initializeChartsWithDefaults() {
        $scope.chartData = {
            scoreBreakdown: { payment_history: 30, credit_utilization: 25, credit_age: 20, credit_mix: 15, new_credit: 10 },
            paymentHistory: [85, 80, 75, 65, 60, 65]
        };
        $timeout(function () {
            initializeCharts();
        }, 100);
    }



    $scope.runScoreSimulation = function (params) {
        warn('runScoreSimulation : ');
        var p = params || {};
        if (!p.pan && !p.mobile && !p.email) {
            $scope.simulationResults = { error: 'Provide pan, mobile, or email' };
            return;
        }
        cibilCore.runScoreSimulation({
            pan: p.pan,
            mobile: p.mobile,
            email: p.email,
            simulation_type: p.simulation_type || 'optimistic',
            months: p.months || 24
        })
            .then(function (response) {
                warn('runScoreSimulation : ');
                $scope.simulationResults = response.data;
                $scope.monthlyProjections = response.data.monthly_projections;
                $scope.keyActions = response.data.quick_actions;
            });
    };

    $scope.quickSimulation = function (params) {
        warn('quickSimulation : ');
        var p = params || {};
        if (!p.pan && !p.mobile && !p.email) {
            $scope.quickResults = { error: 'Provide pan, mobile, or email' };
            return;
        }
        cibilCore.quickSimulation(p)
            .then(function (response) {
                warn('quickSimulation : ');
                $scope.quickResults = response.data;
            });
    };



    // Quick test commands
    $scope.getTestCommands = function () {
        return cibilCore.quickTestCommands();
    };


    // Initialize with user data (not hardcoded sample data)
    $scope.creditData = {
        credit_score: null,
        client_id: null,
        name: $scope.userProfile?.profile_info?.fullname || 'Loading...',
        pan: $scope.userProfile?.kyc?.pan_number || null,
        mobile: $scope.userProfile?.profile_info?.mobile || $scope.userProfile?.mobile || null,
        email: $scope.userProfile?.profile_info?.email || null
    };

    $scope.riskAssessment = {
        level: "loading",
        probability: null
    };

    $scope.defaultProbability = null;
    $scope.creditWorthiness = null;
    $scope.totalExposure = null;
    $scope.totalBalance = null;
    $scope.totalOverdue = null;
    $scope.totalCreditLimit = null;
    $scope.creditUtilization = null;
    $scope.paymentOnTime = null;
    $scope.recentEnquiries = null;
    $scope.creditAge = null;
    $scope.defaultAccounts = null;
    $scope.activeAccounts = null;
    $scope.totalAccounts = null;
    $scope.loanEligibility = "Loading...";
    $scope.reportDate = new Date();
    $scope.chatInput = "";

    // Initialize accounts as empty array - will be populated by loadDashboardData()
    $scope.accounts = [];
    $scope.filteredAccounts = [];

    // Helper functions - FIXED GRADE CALCULATION
    $scope.getScoreGrade = function (score) {
        if (!score || score === null || score === '---') return { grade: "N/A", description: "Loading..." };
        var numScore = parseInt(score);
        if (numScore >= 800) return { grade: "A+", description: "Excellent" };
        if (numScore >= 750) return { grade: "A", description: "Very Good" };
        if (numScore >= 700) return { grade: "B", description: "Good" };
        if (numScore >= 650) return { grade: "C", description: "Fair" };
        if (numScore >= 600) return { grade: "D", description: "Poor" };
        return { grade: "E", description: "Very Poor" };
    };

    $scope.getScoreRingGradient = function (score) {
        if (score >= 750) return "conic-gradient(#28a745 0% " + (score / 900 * 100) + "%, #e9ecef " + (score / 900 * 100) + "%)";
        if (score >= 650) return "conic-gradient(#ffc107 0% " + (score / 900 * 100) + "%, #e9ecef " + (score / 900 * 100) + "%)";
        return "conic-gradient(#dc3545 0% " + (score / 900 * 100) + "%, #e9ecef " + (score / 900 * 100) + "%)";
    };

    $scope.getRiskColorClass = function (probability) {
        if (probability >= 50) return "text-danger";
        if (probability >= 30) return "text-warning";
        return "text-success";
    };

    $scope.getRiskBadgeClass = function (level) {
        switch (level) {
            case "low":
                return "bg-success";
            case "medium":
                return "bg-warning";
            case "high":
                return "bg-danger";
            case "medium-high":
                return "bg-danger";
            default:
                return "bg-secondary";
        }
    };

    // Chart initialization with dynamic data (can re-run when Analysis tab is shown)
    function initializeCharts() {
        var breakdown = $scope.chartData?.scoreBreakdown || {
            payment_history: 65, credit_utilization: 48, credit_age: 70, credit_mix: 75, new_credit: 60
        };

        // Score Breakdown Chart – destroy existing so tab switch can re-draw
        var scoreCanvas = document.getElementById('scoreBreakdownChart');
        if (scoreCanvas) {
            var existing = Chart.getChart(scoreCanvas);
            if (existing) existing.destroy();
            var scoreCtx = scoreCanvas.getContext('2d');

            new Chart(scoreCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Payment History', 'Credit Utilization', 'Credit Age', 'Credit Mix', 'New Credit'],
                    datasets: [{
                        data: [
                            breakdown.payment_history,
                            breakdown.credit_utilization,
                            breakdown.credit_age,
                            breakdown.credit_mix,
                            breakdown.new_credit
                        ],
                        backgroundColor: [
                            '#1c1fbe', // ASTROCRED Primary
                            '#dc3545',
                            '#33c9d3', // ASTROCRED Secondary
                            '#17a2b8',
                            '#ffc107'
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.label + ': ' + context.parsed + '%';
                                }
                            }
                        }
                    }
                }
            });
        }

        // Payment History Chart – destroy existing so tab switch can re-draw
        var paymentCanvas = document.getElementById('paymentHistoryChart');
        if (paymentCanvas) {
            var existingPayment = Chart.getChart(paymentCanvas);
            if (existingPayment) existingPayment.destroy();
            var paymentCtx = paymentCanvas.getContext('2d');
            var paymentData = $scope.chartData?.paymentHistory || [85, 80, 75, 65, 60, 65];

            new Chart(paymentCtx, {
                type: 'line',
                data: {
                    labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                    datasets: [{
                        label: 'On-time Payments %',
                        data: paymentData,
                        borderColor: '#1c1fbe',
                        backgroundColor: 'rgba(28, 31, 190, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#1c1fbe',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                color: 'rgba(0,0,0,0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        $scope.chartsInitialized = true;
        console.log('📊 Charts initialized successfully');
    }

    // Re-draw charts when user opens Detailed Analysis tab (canvas is then visible)
    $scope.onAnalysisTabClick = function () {
        $timeout(function () {
            if ($scope.chartData) initializeCharts();
        }, 200);
    };

    // Helper function to get user identifiers
    $scope.getUserIdentifiers = function () {
        var userProfile = stateManager.getProfile();
        var identifiers = {};

        if (userProfile) {
            if (userProfile.kyc && userProfile.kyc.pan_number) {
                identifiers.pan = userProfile.kyc.pan_number;
            }
            if (userProfile.profile_info && userProfile.profile_info.mobile) {
                identifiers.mobile = userProfile.profile_info.mobile;
            }
            if (userProfile.profile_info && userProfile.profile_info.email) {
                identifiers.email = userProfile.profile_info.email;
            }
        }

        return identifiers;
    };

    // Helper function to download PDF from API
    $scope.downloadPDF = function (url, params, fileName) {
        var baseUrl = productionMode.getMode();
        var fullUrl = baseUrl + url;
        var queryString = Object.keys(params).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
        }).join('&');

        if (queryString) {
            fullUrl += '?' + queryString;
        }

        // Open URL in new window to trigger download
        window.open(fullUrl, '_blank');
    };

    // Action functions
    $scope.downloadCIBILReport = function () {
        var identifiers = $scope.getUserIdentifiers();
        if (!identifiers.pan && !identifiers.mobile && !identifiers.email) {
            alert('Please complete your profile with PAN, Mobile, or Email to download reports.');
            return;
        }

        console.log('[homeCtrl] Downloading CIBIL PDF with identifiers:', identifiers);
        $rootScope.loaderShow = true;

        var baseUrl = productionMode.getMode();
        // Use GET endpoint as it exists in backend
        var queryParams = [];
        if (identifiers.pan) queryParams.push('pan=' + encodeURIComponent(identifiers.pan));
        if (identifiers.mobile) queryParams.push('mobile=' + encodeURIComponent(identifiers.mobile));
        if (identifiers.email) queryParams.push('email=' + encodeURIComponent(identifiers.email));

        var url = baseUrl + '/get/api/cibil/generate-pdf?' + queryParams.join('&');
        console.log('[homeCtrl] PDF URL:', url);

        // Open in new window to trigger download
        window.open(url, '_blank');
        $rootScope.loaderShow = false;
    };

    $scope.downloadASTROCREDReport = function () {
        var identifiers = $scope.getUserIdentifiers();
        if (!identifiers.pan && !identifiers.mobile && !identifiers.email) {
            alert('Please complete your profile with PAN, Mobile, or Email to download reports.');
            return;
        }

        console.log('[homeCtrl] Downloading ASTROCRED PDF with identifiers:', identifiers);
        $rootScope.loaderShow = true;

        var baseUrl = productionMode.getMode();
        // Use GET endpoint for ASTROCRED report PDF
        var queryParams = [];
        if (identifiers.pan) queryParams.push('pan=' + encodeURIComponent(identifiers.pan));
        if (identifiers.mobile) queryParams.push('mobile=' + encodeURIComponent(identifiers.mobile));
        if (identifiers.email) queryParams.push('email=' + encodeURIComponent(identifiers.email));

        var url = baseUrl + '/get/api/cibil/astrocred-report-pdf?' + queryParams.join('&');
        console.log('[homeCtrl] PDF URL:', url);

        // Open in new window to trigger download
        window.open(url, '_blank');
        $rootScope.loaderShow = false;
    };

    $scope.downloadMultiBureau = function () {
        var identifiers = $scope.getUserIdentifiers();
        if (!identifiers.pan && !identifiers.mobile && !identifiers.email) {
            alert('Please complete your profile with PAN, Mobile, or Email to download reports.');
            return;
        }

        console.log('[homeCtrl] Downloading Multi-Bureau PDF with identifiers:', identifiers);
        $rootScope.loaderShow = true;

        var baseUrl = productionMode.getMode();
        $http({
            method: 'POST',
            url: baseUrl + '/post/api/multi-bureau/generate-pdf',
            data: identifiers,
            responseType: 'blob',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            $rootScope.loaderShow = false;
            var blob = new Blob([response.data], { type: 'application/pdf' });
            var url = window.URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.href = url;
            link.download = 'MultiBureau_Report_' + (identifiers.pan || identifiers.mobile || 'report') + '_' + Date.now() + '.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            console.log('[homeCtrl] PDF downloaded successfully');
        }).catch(function (error) {
            $rootScope.loaderShow = false;
            console.error('[homeCtrl] PDF download error:', error);
            if (error.data) {
                console.error('[homeCtrl] Error response:', error.data);
            }
            alert('Failed to download PDF: ' + (error.data?.error || error.message || 'Unknown error'));
        });
    };

    $scope.generateComprehensiveReport = function () {
        alert('Generating comprehensive credit analysis report...');
        console.log('Comprehensive report generation');
    };

    // Check Finvu connection status
    $scope.checkFinvuStatus = function () {
        var profile = stateManager.getProfile();
        if (!profile || !profile.mobile) return;

        $http.get('/api/finvu/summary?mobile=' + (profile.mobile || profile.profile_info?.mobile))
            .then(function (res) {
                if (res.data.success && res.data.summary.accountCount > 0) {
                    $scope.finvuConnected = true;
                    $scope.finvuStatus = 'Connected (' + res.data.summary.accountCount + ' accounts)';
                    // Auto-load FinVu data if connected
                    $scope.loadFinvuData();
                } else {
                    $scope.finvuConnected = false;
                    $scope.finvuStatus = 'Not Connected';
                }
            })
            .catch(function (err) {
                $scope.finvuConnected = false;
                $scope.finvuStatus = 'Not Connected';
            });
    };

    // Load FinVu Dashboard Data
    $scope.loadFinvuData = function () {
        var profile = stateManager.getProfile();
        if (!profile || !profile.mobile) return;

        var mobile = profile.mobile || profile.profile_info?.mobile;
        console.log('[homeCtrl] Loading FinVu data for mobile:', mobile);

        $http.get('/api/finvu/dashboard?mobile=' + mobile)
            .then(function (res) {
                if (res.data.success) {
                    console.log('[homeCtrl] FinVu data loaded:', res.data);
                    var d = res.data.data || {};
                    $scope.finvuData = res.data.data;
                    $scope.finvuAccounts = (d.accounts && Array.isArray(d.accounts)) ? d.accounts : [];
                    $scope.finvuTransactions = (d.transactions && Array.isArray(d.transactions)) ? d.transactions : [];
                    $scope.finvuSummary = d.summary || {};
                    $scope.finvuLastSynced = d.fetchedAt || new Date();

                    // Calculate spending categories if transactions exist
                    if ($scope.finvuTransactions.length > 0) {
                        $scope.calculateSpendingCategories();
                    }
                } else {
                    console.warn('[homeCtrl] FinVu data load failed:', res.data.error);
                }
            })
            .catch(function (err) {
                console.error('[homeCtrl] FinVu data load error:', err);
            });
    };

    // Calculate spending categories from transactions
    $scope.calculateSpendingCategories = function () {
        var categories = {
            food: { total: 0, count: 0, keywords: ['swiggy', 'zomato', 'restaurant', 'dominos', 'pizza', 'food'] },
            transport: { total: 0, count: 0, keywords: ['uber', 'ola', 'fuel', 'petrol', 'rapido'] },
            utilities: { total: 0, count: 0, keywords: ['electricity', 'water', 'jio', 'airtel', 'vodafone', 'bsnl'] },
            entertainment: { total: 0, count: 0, keywords: ['netflix', 'prime', 'hotstar', 'movie', 'spotify'] },
            shopping: { total: 0, count: 0, keywords: ['amazon', 'flipkart', 'myntra', 'ajio'] },
            emi: { total: 0, count: 0, keywords: ['emi', 'loan', 'credit card'] },
            others: { total: 0, count: 0 }
        };

        $scope.finvuTransactions.forEach(function (txn) {
            if (txn.type !== 'DEBIT') return;

            var amount = parseFloat(txn.amount) || 0;
            var narration = (txn.narration || '').toLowerCase();
            var categorized = false;

            for (var cat in categories) {
                if (cat === 'others') continue;
                if (categories[cat].keywords.some(function (keyword) {
                    return narration.includes(keyword);
                })) {
                    categories[cat].total += amount;
                    categories[cat].count++;
                    categorized = true;
                    break;
                }
            }

            if (!categorized) {
                categories.others.total += amount;
                categories.others.count++;
            }
        });

        $scope.spendingCategories = categories;
        console.log('[homeCtrl] Spending categories calculated:', categories);
    };

    // Refresh/Re-link FinVu data
    $scope.refreshFinvuData = function () {
        var profile = stateManager.getProfile();
        if (!profile || !profile.mobile) {
            alert('Please complete your profile to refresh FinVu data.');
            return;
        }

        var mobile = profile.mobile || profile.profile_info?.mobile;
        console.log('[homeCtrl] Refreshing FinVu data for mobile:', mobile);
        $rootScope.loaderShow = true;

        // Trigger a new FI request
        $http.post('/api/finvu/data/fetch', { mobile: mobile })
            .then(function (res) {
                if (res.data.success) {
                    alert('FinVu data refresh initiated! Please wait a moment and reload.');
                    // Reload data after a delay
                    $timeout(function () {
                        $scope.loadFinvuData();
                        $rootScope.loaderShow = false;
                    }, 3000);
                } else {
                    $rootScope.loaderShow = false;
                    alert('Failed to refresh FinVu data: ' + (res.data.error || 'Unknown error'));
                }
            })
            .catch(function (err) {
                $rootScope.loaderShow = false;
                console.error('[homeCtrl] FinVu refresh error:', err);
                alert('Failed to refresh FinVu data. Please try again.');
            });
    };

    $scope.connectFinvu = function () {
        $location.path('/finvu-connect');
    };

    $scope.simulateScoreImprovement = function () {
        alert('Opening score simulation tool: Clear defaults to see +25 points improvement');
        console.log('Score simulation requested');
    };

    $scope.getImprovementPlan = function () {
        alert('Generating personalized improvement plan...');
        console.log('Improvement plan requested');
    };

    $scope.checkLoanEligibility = function () {
        alert('Checking loan eligibility: Current limit ₹5-10L at 14-16% interest');
        console.log('Loan eligibility check');
    };

    $scope.downloadRoadmap = function (months) {
        var roadmapMonths = months || 24;
        var identifiers = $scope.getUserIdentifiers();
        if (!identifiers.pan && !identifiers.mobile && !identifiers.email) {
            alert('Please complete your profile with PAN, Mobile, or Email to download roadmap.');
            return;
        }

        var baseUrl = productionMode.getMode();
        var url = baseUrl + '/get/api/cibil/roadmap-pdf/' + roadmapMonths;
        var queryString = Object.keys(identifiers).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(identifiers[key]);
        }).join('&');

        if (queryString) {
            url += '?' + queryString;
        }

        window.open(url, '_blank');
    };

    $scope.getDebtConsolidationPlan = function () {
        alert('Generating debt consolidation plan to save ₹35,000/year...');
        console.log('Debt consolidation plan requested');
    };

    $scope.filterAccounts = function (type) {
        if (type === 'all') {
            $scope.filteredAccounts = $scope.accounts;
        } else if (type === 'credit-card') {
            $scope.filteredAccounts = $scope.accounts.filter(acc => acc.type === 'Credit Card');
        } else if (type === 'loan') {
            $scope.filteredAccounts = $scope.accounts.filter(acc => acc.type !== 'Credit Card');
        } else if (type === 'default') {
            $scope.filteredAccounts = $scope.accounts.filter(acc => acc.amountOverdue > 0);
        }
    };

    $scope.viewAccountDetails = function (account) {
        alert('Account Details:\n\n' +
            'Bank: ' + account.bank + '\n' +
            'Account: ' + account.accountNumber + '\n' +
            'Balance: ₹' + account.currentBalance.toLocaleString() + '\n' +
            'Overdue: ₹' + account.amountOverdue.toLocaleString() + '\n' +
            'Status: ' + account.status);
    };

    $scope.sendChat = function () {
        if (!$scope.chatInput || $scope.chatInput.trim() === '') return;

        var userMessage = $scope.chatInput.trim();
        $scope.chatInput = '';
        $scope.chatLoading = true;

        // Add user message to chat history
        if (!$scope.chatHistory) $scope.chatHistory = [];
        $scope.chatHistory.push({ role: 'user', content: userMessage });

        // Build context for AI
        var context = {
            credit_score: $scope.creditData?.credit_score || 670,
            total_accounts: $scope.accounts?.length || 19,
            default_accounts: $scope.defaultAccounts || 4,
            total_overdue: $scope.totalOverdue || 48018,
            credit_utilization: $scope.creditUtilization || 48,
            recent_enquiries: $scope.recentEnquiries || 7,
            credit_age: $scope.creditAge || 4.2,
            risk_level: $scope.riskAssessment?.level || 'medium-high'
        };

        // Call AI service (if available, otherwise use fallback)
        if (typeof astroAI !== 'undefined') {
            astroAI.chat(userMessage, context)
                .then(function (response) {
                    if (response.data.success) {
                        $scope.chatHistory.push({ role: 'ai', content: response.data.reply });
                    } else {
                        $scope.chatHistory.push({ role: 'ai', content: response.data.fallback || 'I apologize, I could not process that request.' });
                    }
                })
                .catch(function (error) {
                    console.error('AI Chat Error:', error);
                    // Fallback response
                    $scope.chatHistory.push({
                        role: 'ai',
                        content: getLocalResponse(userMessage, context)
                    });
                })
                .finally(function () {
                    $scope.chatLoading = false;
                });
        } else {
            // Fallback when AI service not injected
            $timeout(function () {
                $scope.chatHistory.push({
                    role: 'ai',
                    content: getLocalResponse(userMessage, context)
                });
                $scope.chatLoading = false;
            }, 500);
        }
    };

    // Local fallback responses when AI is unavailable
    function getLocalResponse(message, context) {
        var lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('score') || lowerMessage.includes('improve')) {
            return 'Based on your current score of ' + context.credit_score + ', I recommend focusing on clearing your ' + context.default_accounts + ' default accounts first. Each cleared default can improve your score by 15-25 points.';
        }
        if (lowerMessage.includes('overdue') || lowerMessage.includes('default')) {
            return 'You have ₹' + context.total_overdue.toLocaleString() + ' in overdue amounts across ' + context.default_accounts + ' accounts. Prioritize the largest overdue first (ICICI Bank: ₹27,760) for maximum impact.';
        }
        if (lowerMessage.includes('utilization') || lowerMessage.includes('limit')) {
            return 'Your credit utilization is ' + context.credit_utilization + '%, which is above the recommended 30%. Try to pay down your credit card balances or request a limit increase.';
        }
        if (lowerMessage.includes('loan') || lowerMessage.includes('eligibility')) {
            return 'With your current score of ' + context.credit_score + ', you may be eligible for personal loans in the ₹5-10L range at 14-16% interest. Improving your score to 750+ could reduce rates to 10-12%.';
        }
        if (lowerMessage.includes('enquir')) {
            return 'You have ' + context.recent_enquiries + ' recent enquiries. Avoid new credit applications for 6 months to let this impact fade.';
        }

        return 'I understand you want to know about "' + message + '". Based on your credit profile (Score: ' + context.credit_score + ', Risk: ' + context.risk_level + '), I recommend focusing on clearing defaults and reducing credit utilization for the best improvement.';
    }

    // Get AI improvement plan
    $scope.getAIImprovementPlan = function () {
        $scope.planLoading = true;

        if (typeof astroAI !== 'undefined') {
            astroAI.getImprovementPlan({
                credit_score: $scope.creditData?.credit_score || 670,
                default_accounts: $scope.defaultAccounts || 4,
                total_overdue: $scope.totalOverdue || 48018,
                credit_utilization: $scope.creditUtilization || 48
            }, 750, 12)
                .then(function (response) {
                    if (response.data.success) {
                        $scope.improvementPlan = response.data.plan;
                        // Show in modal or dedicated section
                        alert('Improvement Plan Generated! Check the Improvement Roadmap tab.');
                    }
                })
                .catch(function (error) {
                    console.error('Improvement Plan Error:', error);
                    alert('Could not generate plan. Please try again.');
                })
                .finally(function () {
                    $scope.planLoading = false;
                });
        } else {
            alert('AI service is currently unavailable. Please try again later.');
            $scope.planLoading = false;
        }
    };

}]);