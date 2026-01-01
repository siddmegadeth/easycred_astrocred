app.controller('homeCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', '$location', 'authentication', 'cibilCore', function($scope, $rootScope, $timeout, stateManager, $location, authentication, cibilCore) {



    $timeout(function() {


        if (stateManager.isUserLogggedIn()) {
            var userProfile = stateManager.getProfile();
            log('User Profile :');
            log(userProfile);

            if (stateManager.isProfileCompleted()) {
                log('Profile Completed :');


                if (userProfile.consent.isTermsAccepted) {
                    if (stateManager.isKYCCompleted()) {
                        window.onload = function() {
                            console.log('ASTROCRED Platform Initialized with Real CIBIL Data');
                            console.log('Client: SHIV KUMAR (PAN: IVZPK2103N)');
                            console.log('Credit Score: 670');
                            console.log('Default Accounts: 4');
                            console.log('Total Overdue: ₹48,018');
                            $scope.runScoreSimulation();
                            initializeCharts();
                            $scope.quickSimulation();
                            $scope.testWithSampleData();
                        }

                    } else {}

                } else {}
            } else {
                log('Profile Not Completed :');
                $location.path("profile/complete");
            }
        } else {
            $location.path("login");

        }

        $rootScope.$on('request_error', function(event, data) {
            error('request_error');
            $scope.loader.hide();
        });
        authentication.getMe()
            .then(function(resp) {
                warn('getMe :');
                log(resp);
            })

    });



    // Test with real sample data
    $scope.testWithSampleData = function() {
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
            .then(function(response) {
                console.log('✅ Upload successful:', response.data);

                // 3. Get analysis
                return cibilCore.getAnalysis({ pan: 'IVZPK2103N' });
            })
            .then(function(response) {
                console.log('✅ Analysis successful:', response.data);

                // 4. Get risk assessment
                return cibilCore.getRiskAssessment({ pan: 'IVZPK2103N' });
            })
            .then(function(response) {
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
            .then(function(response) {
                console.log('✅ Score history updated:', response.data);

                // 6. Check health
                return cibilCore.checkHealth();
            })
            .then(function(response) {
                console.log('✅ Health check successful:', response.data);

                $scope.testResults = 'All tests passed successfully!';
            })
            .catch(function(error) {
                console.error('❌ Test failed:', error);
                $scope.testResults = 'Test failed: ' + error.message;
            });
    };


    // In your AngularJS controller
    $scope.runScoreSimulation = function() {
        warn('runScoreSimulation : ');

        cibilCore.runScoreSimulation({
                pan: 'IVZPK2103N',
                simulation_type: 'optimistic',
                months: 24
            })
            .then(function(response) {
                warn('runScoreSimulation : ');
                $scope.simulationResults = response.data;
                $scope.monthlyProjections = response.data.monthly_projections;
                $scope.keyActions = response.data.quick_actions;
            });
    };

    // Quick simulation
    $scope.quickSimulation = function() {
        warn('quickSimulation : ');

        cibilCore.quickSimulation({ pan: 'IVZPK2103N' })
            .then(function(response) {
                warn('quickSimulation : ');
                $scope.quickResults = response.data;
            });
    };



    // Quick test commands
    $scope.getTestCommands = function() {
        return cibilCore.quickTestCommands();
    };


    // Initialize with sample data
    $scope.creditData = {
        credit_score: 670,
        client_id: "credit_report_cibil_jIifktiYhrHTbZcMdlsU",
        name: "SHIV KUMAR",
        pan: "IVZPK2103N",
        mobile: "9708016996",
        email: "MANGALDHAWANI@GMAIL.COM"
    };

    $scope.riskAssessment = {
        level: "medium-high",
        probability: 38
    };

    $scope.defaultProbability = 38;
    $scope.creditWorthiness = 6.2;
    $scope.totalExposure = 485566;
    $scope.totalBalance = 485566;
    $scope.totalOverdue = 48018;
    $scope.totalCreditLimit = 1009915;
    $scope.creditUtilization = 48;
    $scope.paymentOnTime = 65;
    $scope.recentEnquiries = 7;
    $scope.creditAge = 4.2;
    $scope.defaultAccounts = 4;
    $scope.activeAccounts = 11;
    $scope.totalAccounts = 19;
    $scope.loanEligibility = "₹5-10L";
    $scope.reportDate = new Date();
    $scope.chatInput = "";

    // Sample accounts data
    $scope.accounts = [{
            accountNumber: "0000000028669955",
            bank: "ICICI BANK",
            type: "Credit Card",
            currentBalance: 64522,
            amountOverdue: 27760,
            status: "Default",
            lastPaymentDate: "2025-04-06",
            risk: "high"
        },
        {
            accountNumber: "0007478830007967886",
            bank: "RBL BANK",
            type: "Credit Card",
            currentBalance: 73959,
            amountOverdue: 15029,
            status: "Default",
            lastPaymentDate: "2025-08-02",
            risk: "high"
        },
        {
            accountNumber: "9406188002698052",
            bank: "KOTAK BANK",
            type: "Credit Card",
            currentBalance: 39846,
            amountOverdue: 3131,
            status: "Warning",
            lastPaymentDate: "2025-07-20",
            risk: "medium"
        },
        {
            accountNumber: "152000005020843",
            bank: "AXIS BANK",
            type: "Credit Card",
            currentBalance: 35418,
            amountOverdue: 2099,
            status: "Warning",
            lastPaymentDate: "2025-07-24",
            risk: "medium"
        },
        {
            accountNumber: "P4L6PPT8546837",
            bank: "BAJAJ FIN LTD",
            type: "Personal Loan",
            currentBalance: 126298,
            amountOverdue: 0,
            status: "Good",
            lastPaymentDate: "2025-08-02",
            risk: "low"
        }
    ];

    $scope.filteredAccounts = $scope.accounts;

    // Helper functions
    $scope.getScoreGrade = function(score) {
        if (score >= 800) return { grade: "A+", description: "Excellent" };
        if (score >= 750) return { grade: "A", description: "Very Good" };
        if (score >= 700) return { grade: "B", description: "Good" };
        if (score >= 650) return { grade: "C", description: "Fair" };
        if (score >= 600) return { grade: "D", description: "Poor" };
        return { grade: "E", description: "Very Poor" };
    };

    $scope.getScoreRingGradient = function(score) {
        if (score >= 750) return "conic-gradient(#28a745 0% " + (score / 900 * 100) + "%, #e9ecef " + (score / 900 * 100) + "%)";
        if (score >= 650) return "conic-gradient(#ffc107 0% " + (score / 900 * 100) + "%, #e9ecef " + (score / 900 * 100) + "%)";
        return "conic-gradient(#dc3545 0% " + (score / 900 * 100) + "%, #e9ecef " + (score / 900 * 100) + "%)";
    };

    $scope.getRiskColorClass = function(probability) {
        if (probability >= 50) return "text-danger";
        if (probability >= 30) return "text-warning";
        return "text-success";
    };

    $scope.getRiskBadgeClass = function(level) {
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

    // Chart initialization
    function initializeCharts() {
        // Score Breakdown Chart
        var scoreCtx = document.getElementById('scoreBreakdownChart').getContext('2d');
        new Chart(scoreCtx, {
            type: 'doughnut',
            data: {
                labels: ['Payment History', 'Credit Utilization', 'Credit Age', 'Credit Mix', 'New Credit'],
                datasets: [{
                    data: [30, 25, 20, 15, 10],
                    backgroundColor: [
                        '#28a745',
                        '#dc3545',
                        '#007bff',
                        '#17a2b8',
                        '#ffc107'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
        });

        // Payment History Chart
        var paymentCtx = document.getElementById('paymentHistoryChart').getContext('2d');
        new Chart(paymentCtx, {
            type: 'line',
            data: {
                labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                datasets: [{
                    label: 'On-time Payments %',
                    data: [85, 80, 75, 65, 60, 65],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // Action functions
    $scope.downloadCIBILReport = function() {
        alert('Downloading official CIBIL report for SHIV KUMAR (PAN: IVZPK2103N)...');
        console.log('CIBIL report download initiated');
    };

    $scope.downloadASTROCREDReport = function() {
        alert('Generating ASTROCRED analysis report with AI insights...');
        console.log('ASTROCRED report generation initiated');
    };

    $scope.downloadMultiBureau = function() {
        alert('Multi-bureau report requires Premium subscription');
        console.log('Multi-bureau report requested');
    };

    $scope.generateComprehensiveReport = function() {
        alert('Generating comprehensive credit analysis report...');
        console.log('Comprehensive report generation');
    };

    $scope.connectFinvu = function() {
        alert('Finvu integration coming soon!');
        console.log('Finvu connection requested');
    };

    $scope.simulateScoreImprovement = function() {
        alert('Opening score simulation tool: Clear defaults to see +25 points improvement');
        console.log('Score simulation requested');
    };

    $scope.getImprovementPlan = function() {
        alert('Generating personalized improvement plan...');
        console.log('Improvement plan requested');
    };

    $scope.checkLoanEligibility = function() {
        alert('Checking loan eligibility: Current limit ₹5-10L at 14-16% interest');
        console.log('Loan eligibility check');
    };

    $scope.downloadRoadmap = function() {
        alert('Downloading 24-month improvement roadmap PDF...');
        console.log('Roadmap download requested');
    };

    $scope.getDebtConsolidationPlan = function() {
        alert('Generating debt consolidation plan to save ₹35,000/year...');
        console.log('Debt consolidation plan requested');
    };

    $scope.filterAccounts = function(type) {
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

    $scope.viewAccountDetails = function(account) {
        alert('Account Details:\n\n' +
            'Bank: ' + account.bank + '\n' +
            'Account: ' + account.accountNumber + '\n' +
            'Balance: ₹' + account.currentBalance.toLocaleString() + '\n' +
            'Overdue: ₹' + account.amountOverdue.toLocaleString() + '\n' +
            'Status: ' + account.status);
    };

    $scope.sendChat = function() {
        if ($scope.chatInput.trim() === '') return;

        // Simulate AI response
        var responses = [
            "Based on your credit profile, I recommend focusing on clearing the ICICI Bank overdue first for maximum impact.",
            "Your credit utilization is high at 48%. Try to reduce it below 30% by paying down balances.",
            "Avoid any new credit applications for the next 6 months to reduce enquiry impact.",
            "Consider a debt consolidation loan at 12.5% to save on interest from your high-rate credit cards.",
            "Set up payment reminders for all accounts to ensure no more delays occur."
        ];

        var randomResponse = responses[Math.floor(Math.random() * responses.length)];

        alert('AI Assistant: ' + randomResponse);
        $scope.chatInput = '';
    };


}]);