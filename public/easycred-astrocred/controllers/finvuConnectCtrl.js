/**
 * FinVu Connect Controller
 * Handles bank account linking via FinVu Account Aggregator
 */
app.controller('finvuConnectCtrl', ['$scope', '$http', '$timeout', 'stateManager',
function($scope, $http, $timeout, stateManager) {
    
    console.log('FinVu Connect Controller Initialized');

    // State
    $scope.isConnected = false;
    $scope.isInitiating = false;
    $scope.isRefreshing = false;
    $scope.consentInitiated = false;
    $scope.consentStatus = null;
    $scope.financialData = null;
    $scope.serviceStatus = { mode: 'loading' };
    $scope.selectedBanks = [];

    // Supported banks
    $scope.supportedBanks = [
        { code: 'HDFC', name: 'HDFC Bank', selected: false },
        { code: 'ICICI', name: 'ICICI Bank', selected: false },
        { code: 'SBI', name: 'State Bank', selected: false },
        { code: 'AXIS', name: 'Axis Bank', selected: false },
        { code: 'KOTAK', name: 'Kotak Bank', selected: false },
        { code: 'YES', name: 'Yes Bank', selected: false },
        { code: 'IDFC', name: 'IDFC First', selected: false },
        { code: 'PNB', name: 'PNB', selected: false },
        { code: 'BOB', name: 'Bank of Baroda', selected: false }
    ];

    // Initialize
    $timeout(function() {
        $scope.checkServiceStatus();
        $scope.checkExistingConnection();
    });

    // Check FinVu service status
    $scope.checkServiceStatus = function() {
        $http.get('/api/finvu/status').then(function(response) {
            $scope.serviceStatus = response.data;
            console.log('FinVu Service Status:', response.data);
        }).catch(function(err) {
            $scope.serviceStatus = { mode: 'sandbox', configured: false };
        });
    };

    // Check if user already has connected accounts
    $scope.checkExistingConnection = function() {
        var profile = stateManager.getProfile();
        if (!profile || !profile.mobile) return;

        $http.get('/api/finvu/summary?mobile=' + profile.mobile).then(function(response) {
            if (response.data.success && response.data.summary.accountCount > 0) {
                $scope.isConnected = true;
                $scope.loadFinancialData();
            } else {
                // Check consent status
                $http.get('/api/finvu/consent/status?mobile=' + profile.mobile).then(function(consentResp) {
                    if (consentResp.data.success && consentResp.data.status === 'ACTIVE') {
                        $scope.consentInitiated = true;
                        $scope.consentStatus = 'ACTIVE';
                        $scope.loadFinancialData();
                    } else if (consentResp.data.status === 'PENDING') {
                        $scope.consentInitiated = true;
                        $scope.consentStatus = 'PENDING';
                    }
                });
            }
        });
    };

    // Initiate consent
    $scope.initiateConsent = function() {
        var profile = stateManager.getProfile();
        if (!profile || !profile.mobile) {
            alert('Please complete your profile first');
            return;
        }

        $scope.isInitiating = true;

        $http.post('/api/finvu/consent/initiate', {
            mobile: profile.mobile,
            handle: profile.mobile + '@finvu'
        }).then(function(response) {
            $scope.isInitiating = false;
            
            if (response.data.success) {
                $scope.consentInitiated = true;
                $scope.consentStatus = 'PENDING';
                
                // If sandbox mode, consent is immediately active
                if (response.data.data.mode === 'sandbox' || response.data.data.mode === 'sandbox_fallback') {
                    $scope.consentStatus = 'ACTIVE';
                    // Auto-proceed to data fetch
                    $timeout(function() {
                        $scope.fetchFinancialData();
                    }, 1000);
                } else if (response.data.data.redirectUrl) {
                    // Redirect to consent manager
                    window.open(response.data.data.redirectUrl, '_blank');
                }
            } else {
                alert(response.data.message || 'Failed to initiate consent');
            }
        }).catch(function(err) {
            $scope.isInitiating = false;
            // Sandbox fallback
            $scope.consentInitiated = true;
            $scope.consentStatus = 'ACTIVE';
            $timeout(function() {
                $scope.fetchFinancialData();
            }, 1000);
        });
    };

    // Toggle bank selection
    $scope.toggleBank = function(bank) {
        if (!$scope.consentInitiated) return;
        
        bank.selected = !bank.selected;
        $scope.selectedBanks = $scope.supportedBanks.filter(function(b) {
            return b.selected;
        });
    };

    // Proceed with selected banks
    $scope.proceedWithBanks = function() {
        if ($scope.selectedBanks.length === 0) {
            alert('Please select at least one bank');
            return;
        }
        
        $scope.fetchFinancialData();
    };

    // Fetch financial data
    $scope.fetchFinancialData = function() {
        var profile = stateManager.getProfile();
        if (!profile || !profile.mobile) return;

        $scope.isRefreshing = true;

        $http.post('/api/finvu/data/fetch', {
            mobile: profile.mobile
        }).then(function(response) {
            $scope.isRefreshing = false;
            
            if (response.data.success) {
                $scope.isConnected = true;
                $scope.financialData = response.data.data;
                console.log('Financial Data:', $scope.financialData);
            } else {
                alert(response.data.message || 'Failed to fetch financial data');
            }
        }).catch(function(err) {
            $scope.isRefreshing = false;
            console.error('Fetch error:', err);
        });
    };

    // Load existing financial data
    $scope.loadFinancialData = function() {
        $scope.fetchFinancialData();
    };

    // Refresh data
    $scope.refreshData = function() {
        $scope.fetchFinancialData();
    };

}]);
