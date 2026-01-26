app.controller('homeCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', '$location', 'authentication', 'cibilCore', 'productionMode', 'astroAI', 'surePass', function ($scope, $rootScope, $timeout, stateManager, $location, authentication, cibilCore, productionMode, astroAI, surePass) {

    // #region agent log
    $scope.$on('$viewContentLoaded', function () {
        setTimeout(function () {
            fetch('http://127.0.0.1:7244/ingest/f843917b-97b2-459f-8899-9885ac655872', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'homeCtrl.js:$viewContentLoaded', message: 'Template loaded, checking CSS after enhancement', data: { timestamp: Date.now() }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'B' }) }).catch(() => { });
            var testCard = document.querySelector('.card');
            var cardComputed = testCard ? window.getComputedStyle(testCard) : null;
            var btnPrimary = document.querySelector('.btn-primary');
            var btnPrimaryComputed = btnPrimary ? window.getComputedStyle(btnPrimary) : null;
            var badgeAi = document.querySelector('.badge-ai');
            var badgeComputed = badgeAi ? window.getComputedStyle(badgeAi) : null;
            var navActive = document.querySelector('.nav-tabs .nav-link.active');
            var navComputed = navActive ? window.getComputedStyle(navActive) : null;
            fetch('http://127.0.0.1:7244/ingest/f843917b-97b2-459f-8899-9885ac655872', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'homeCtrl.js:$viewContentLoaded', message: 'Enhanced CSS verification', data: { cardBorderRadius: cardComputed?.borderRadius, cardBoxShadow: cardComputed?.boxShadow?.substring(0, 60), btnPrimaryBg: btnPrimaryComputed?.background?.substring(0, 100), badgeAiBg: badgeComputed?.background?.substring(0, 100), navActiveColor: navComputed?.color, navActiveBorderBottom: navComputed?.borderBottom }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'C' }) }).catch(() => { });
        }, 500);
    });
    // #endregion

    $timeout(function () {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/f843917b-97b2-459f-8899-9885ac655872', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'homeCtrl.js:$timeout', message: 'Controller init started', data: { timestamp: Date.now() }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
        // #endregion


        if (stateManager.isUserLogggedIn()) {
            $scope.userProfile = stateManager.getProfile();
            log('User Profile :', $scope.userProfile);

            // Update credit data with user info immediately
            if ($scope.userProfile) {
                $scope.creditData.name = $scope.userProfile.profile_info?.fullname || $scope.userProfile.profile_info?.name || 'User';
                $scope.creditData.pan = $scope.userProfile.kyc?.pan_number || 'N/A';
                $scope.creditData.mobile = $scope.userProfile.profile_info?.mobile || $scope.userProfile.mobile || '';
                $scope.creditData.email = $scope.userProfile.profile_info?.email || '';
            }

            // Always load dashboard data, even if profile not complete (will show available data)
            $scope.loadDashboardData();
            
            // Check if profile needs completion
            if (!stateManager.isProfileCompleted()) {
                warn('Profile not complete. Redirect to profile completion after dashboard loads...');
                $timeout(function() {
                    $location.path("profile/complete");
                }, 2000); // Give 2 seconds to see dashboard before redirecting
            }
        } else {
            $location.path("login");
        }

        $rootScope.$on('request_error', function (event, data) {
            $scope.loaderHide();
        });
    });

    $scope.loadDashboardData = function () {
        $scope.loaderShow = true;
        $scope.chartsInitialized = false;

        cibilCore.getAnalysis().then(function (res) {
            if (res.data.success) {
                const data = res.data;
                $scope.creditData = {
                    credit_score: data.credit_score,
                    name: $scope.userProfile?.profile_info?.fullname || $scope.userProfile?.profile_info?.name || 'User',
                    pan: $scope.userProfile?.kyc?.pan_number || data.user_info?.pan || 'N/A',
                    mobile: $scope.userProfile?.profile_info?.mobile || $scope.userProfile?.mobile || ''
                };

                // Ensure name matches logged in user, not sandbox data
                if (data.user_info) {
                    data.user_info.name = $scope.creditData.name;
                }

                $scope.paymentOnTime = data.payment_history?.on_time_percentage || 65;
                $scope.creditUtilization = data.utilization?.percentage || 48;
                $scope.recentEnquiries = data.enquiries?.recent_count || 7;
                $scope.creditAge = data.age?.total_years || 4.2;
                $scope.defaultAccounts = data.defaults?.count || 4;
                $scope.defaultProbability = data.default_probability || 38;
                $scope.creditWorthiness = data.credit_worthiness || 6.2;
                $scope.totalExposure = data.total_exposure || 485566;
                $scope.totalOverdue = data.total_overdue || 48018;
                $scope.loanEligibility = data.loan_eligibility || '₹5-10L';

                $scope.riskAssessment = {
                    level: data.risk_level || 'medium-high',
                    probability: data.default_probability || 38
                };

                // Map accounts
                if (data.accounts && data.accounts.length > 0) {
                    $scope.accounts = data.accounts.map(acc => ({
                        accountNumber: acc.mask_account_number || acc.accountNumber,
                        bank: acc.member_name || acc.bank,
                        type: acc.account_type || acc.type,
                        currentBalance: acc.current_balance || acc.currentBalance,
                        amountOverdue: acc.overdue_amount || acc.amountOverdue,
                        status: acc.account_status || acc.status,
                        risk: acc.risk_category || acc.risk,
                        lastPaymentDate: acc.last_payment_date
                    }));
                    $scope.filteredAccounts = $scope.accounts;
                }

                // Chart data for dynamic rendering
                $scope.chartData = {
                    scoreBreakdown: data.score_breakdown || {
                        payment_history: 30,
                        credit_utilization: 25,
                        credit_age: 20,
                        credit_mix: 15,
                        new_credit: 10
                    },
                    paymentHistory: data.payment_trend || [85, 80, 75, 65, 60, 65]
                };

                // Initialize charts after a short delay to ensure DOM is ready
                $timeout(function () {
                    initializeCharts();
                }, 100);
            }
        }).catch(function (err) {
            console.error('Local analysis not found. Attempting to fetch from Surepass (Sandbox)...', err);

            var mobile = $scope.userProfile?.profile_info?.mobile || $scope.userProfile?.mobile || $scope.userProfile?.userId;
            var name = $scope.userProfile?.profile_info?.fullname || $scope.userProfile?.profile_info?.name || 'User';

            // Function to use fallback data if everything fails
            var useFallback = function () {
                console.warn('Using fallback/demo data with user information.');
                $scope.creditData = {
                    credit_score: null,
                    client_id: null,
                    name: name,
                    pan: $scope.userProfile?.kyc?.pan_number || 'Not provided',
                    mobile: mobile
                };
                
                // Set demo/placeholder values
                $scope.paymentOnTime = null;
                $scope.creditUtilization = null;
                $scope.recentEnquiries = null;
                $scope.creditAge = null;
                $scope.defaultAccounts = 0;
                $scope.defaultProbability = null;
                $scope.creditWorthiness = null;
                $scope.totalExposure = null;
                $scope.totalOverdue = null;
                $scope.loanEligibility = 'Complete profile to check';
                
                $scope.riskAssessment = {
                    level: "not-assessed",
                    probability: null
                };
                
                $scope.accounts = [];
                $scope.filteredAccounts = [];
                
                initializeChartsWithDefaults();
                $scope.loaderShow = false;
            };

            if (mobile) {
                // Fetch from Surepass
                surePass.cibil(mobile, name).then(function (res) {
                    if (res.data && (res.data.status || res.data.success)) {
                        console.log('Surepass data fetched successfully. Uploading to backend...');

                        // normalize and upload
                        var rawData = res.data.data || res.data;
                        var normalized = cibilCore.normalizeData(rawData);

                        // OVERWRITE Sandbox Identity with User Identity
                        if (normalized) {
                            normalized.name = name;
                            normalized.mobile = mobile;
                            normalized.user_info = normalized.user_info || {};
                            normalized.user_info.name = name;
                            normalized.user_info.mobile = mobile;

                            // If user has a PAN, use it. Otherwise keep sandbox PAN (IVZPK2103N)
                            if ($scope.userProfile?.kyc?.pan_number) {
                                normalized.pan = $scope.userProfile.kyc.pan_number;
                                normalized.user_info.pan = $scope.userProfile.kyc.pan_number;
                            }
                        }

                        cibilCore.uploadData(normalized).then(function () {
                            console.log('Data uploaded. Reloading dashboard...');
                            // Retry loading dashboard data (without recursion loop hopefully)
                            // Manually call success logic to avoid re-triggering this block infinitely if something is weird
                            cibilCore.getBasicAnalysis(mobile).then(function (res2) {
                                if (res2 && res2.data) {
                                    // Success - populate scope
                                    var data = res2.data;
                                    $scope.creditData = {
                                        credit_score: data.credit_score,
                                        name: name,
                                        pan: data.user_info?.pan || $scope.userProfile?.kyc?.pan_number || 'N/A',
                                        mobile: mobile
                                    };
                                    // Populate other fields (simplified for brevity, main parts)
                                    $scope.paymentOnTime = data.payment_analysis?.onTimePercentage || 65;
                                    $scope.creditUtilization = data.credit_utilization || 48;
                                    $scope.chartData = {
                                        scoreBreakdown: data.detailed_analysis?.component_grades || {},
                                        paymentHistory: data.detailed_analysis?.payment_analysis?.history || [700, 710, 720]
                                    };
                                    $timeout(function () { initializeCharts(); }, 100);
                                    $scope.loaderShow = false;
                                } else {
                                    useFallback();
                                }
                            }).catch(useFallback);

                        }).catch(function (e) {
                            console.error('Upload failed', e);
                            useFallback();
                        });
                    } else {
                        console.warn('Surepass fetch returned false status');
                        useFallback();
                    }
                }).catch(function (e) {
                    console.error('Surepass fetch failed', e);
                    useFallback();
                });
            } else {
                useFallback();
            }
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



    // Test with real sample data
    $scope.testWithSampleData = function () {
        var sampleData = {
            data: {
                client_id: "credit_report_cibil_jIifktiYhrHTbZcMdlsU",
                mobile: "9708016996",
                pan: "IVZPK2103N",
                name: "SHIV KUMAR",
                credit_score: "670",
                // ... rest of sample data
            }
        };

        // 1. Normalize data first
        var normalizedData = cibilCore.normalizeData(sampleData.data);

        // 2. Upload data
        cibilCore.uploadData(normalizedData)
            .then(function (response) {
                console.log('✅ Upload successful:', response.data);

                // 3. Get analysis
                return cibilCore.getAnalysis({ pan: 'IVZPK2103N' });
            })
            .then(function (response) {
                console.log('✅ Analysis successful:', response.data);

                // 4. Get risk assessment
                return cibilCore.getRiskAssessment({ pan: 'IVZPK2103N' });
            })
            .then(function (response) {
                console.log('✅ Risk assessment successful:', response.data);

                // 5. Add to score history
                return cibilCore.addScoreToHistory({
                    client_id: "credit_report_cibil_jIifktiYhrHTbZcMdlsU",
                    pan: "IVZPK2103N",
                    mobile: "9708016996",
                    name: "SHIV KUMAR",
                    score: 670,
                    grade: "B",
                    source: "upload"
                });
            })
            .then(function (response) {
                console.log('✅ Score history updated:', response.data);

                // 6. Check health
                return cibilCore.checkHealth();
            })
            .then(function (response) {
                console.log('✅ Health check successful:', response.data);

                $scope.testResults = 'All tests passed successfully!';
            })
            .catch(function (error) {
                console.error('❌ Test failed:', error);
                $scope.testResults = 'Test failed: ' + error.message;
            });
    };


    // In your AngularJS controller
    $scope.runScoreSimulation = function () {
        warn('runScoreSimulation : ');

        cibilCore.runScoreSimulation({
            pan: 'IVZPK2103N',
            simulation_type: 'optimistic',
            months: 24
        })
            .then(function (response) {
                warn('runScoreSimulation : ');
                $scope.simulationResults = response.data;
                $scope.monthlyProjections = response.data.monthly_projections;
                $scope.keyActions = response.data.quick_actions;
            });
    };

    // Quick simulation
    $scope.quickSimulation = function () {
        warn('quickSimulation : ');

        cibilCore.quickSimulation({ pan: 'IVZPK2103N' })
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

    // Chart initialization with dynamic data
    function initializeCharts() {
        if ($scope.chartsInitialized) return; // Prevent re-initialization

        // Score Breakdown Chart
        var scoreCanvas = document.getElementById('scoreBreakdownChart');
        if (scoreCanvas) {
            var scoreCtx = scoreCanvas.getContext('2d');
            var breakdown = $scope.chartData?.scoreBreakdown || {
                payment_history: 30, credit_utilization: 25, credit_age: 20, credit_mix: 15, new_credit: 10
            };

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

        // Payment History Chart
        var paymentCanvas = document.getElementById('paymentHistoryChart');
        if (paymentCanvas) {
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

        var baseUrl = productionMode.getMode();
        var url = baseUrl + '/get/api/cibil/generate-pdf';
        var queryString = Object.keys(identifiers).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(identifiers[key]);
        }).join('&');

        if (queryString) {
            url += '?' + queryString;
        }

        window.open(url, '_blank');
    };

    $scope.downloadASTROCREDReport = function () {
        var identifiers = $scope.getUserIdentifiers();
        if (!identifiers.pan && !identifiers.mobile && !identifiers.email) {
            alert('Please complete your profile with PAN, Mobile, or Email to download reports.');
            return;
        }

        var baseUrl = productionMode.getMode();
        var url = baseUrl + '/get/api/cibil/astrocred-report-pdf';
        var queryString = Object.keys(identifiers).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(identifiers[key]);
        }).join('&');

        if (queryString) {
            url += '?' + queryString;
        }

        window.open(url, '_blank');
    };

    $scope.downloadMultiBureau = function () {
        var identifiers = $scope.getUserIdentifiers();
        if (!identifiers.pan && !identifiers.mobile && !identifiers.email) {
            alert('Please complete your profile with PAN, Mobile, or Email to download reports.');
            return;
        }

        var baseUrl = productionMode.getMode();
        var url = baseUrl + '/get/api/multi-bureau/generate-pdf';
        var queryString = Object.keys(identifiers).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(identifiers[key]);
        }).join('&');

        if (queryString) {
            url += '?' + queryString;
        }

        window.open(url, '_blank');
    };

    $scope.generateComprehensiveReport = function () {
        alert('Generating comprehensive credit analysis report...');
        console.log('Comprehensive report generation');
    };

    $scope.connectFinvu = function () {
        alert('Finvu integration coming soon!');
        console.log('Finvu connection requested');
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