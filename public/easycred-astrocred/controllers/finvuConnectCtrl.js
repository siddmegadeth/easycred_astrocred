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

    // Bank selection removed - banks are selected in Finvu consent window
    // No need to maintain bank list here

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
                    var status = consentResp.data.status || '';
                    var approved = status === 'ACTIVE' || status === 'ACCEPTED';
                    if (consentResp.data.success && approved) {
                        $scope.consentInitiated = true;
                        $scope.consentStatus = status === 'ACCEPTED' ? 'ACCEPTED' : 'ACTIVE';
                        $scope.consentId = consentResp.data.consentId;
                        $scope.consentHandleId = consentResp.data.consentHandle || consentResp.data.consentHandleId;
                        // Load financial data if consent is approved
                        $scope.loadFinancialData();
                    } else if (consentResp.data.status === 'PENDING' || consentResp.data.status === 'REQUESTED') {
                        $scope.consentInitiated = true;
                        $scope.consentStatus = 'PENDING';
                        $scope.consentHandleId = consentResp.data.consentHandle || consentResp.data.consentHandleId;
                        // Continue polling if pending
                        $scope.pollConsentStatus();
                    }
                }).catch(function(err) {
                    console.error('Error checking consent status:', err);
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
                $scope.consentHandle = response.data.data.consentHandle || response.data.data.consentHandleId;
                $scope.consentHandleId = response.data.data.consentHandleId || response.data.data.consentHandle;
                
                // If sandbox mode, consent is immediately active
                if (response.data.data.mode === 'sandbox' || response.data.data.mode === 'sandbox_fallback') {
                    $scope.consentStatus = 'ACTIVE';
                    // Auto-proceed to data fetch
                    $timeout(function() {
                        $scope.fetchFinancialData();
                    }, 1000);
                } else if (response.data.data.redirectUrl) {
                    // Store redirect URL and open it
                    $scope.redirectUrl = response.data.data.redirectUrl;
                    // Open in new window/tab
                    var consentWindow = window.open(response.data.data.redirectUrl, '_blank', 'width=800,height=600');
                    
                    // Poll for consent status after user completes consent
                    $scope.pollConsentStatus();
                }
            } else {
                alert(response.data.message || 'Failed to initiate consent');
            }
        }).catch(function(err) {
            $scope.isInitiating = false;
            console.error('Consent initiation error:', err);
            alert('Failed to initiate consent. Please try again.');
        });
    };

    // Poll consent status until ACCEPTED
    $scope.pollConsentStatus = function() {
        var consentHandleToUse = $scope.consentHandleId || $scope.consentHandle;
        if (!consentHandleToUse) return;
        
        var profile = stateManager.getProfile();
        var pollInterval = setInterval(function() {
            $http.get('/api/finvu/consent/status', {
                params: {
                    consentHandle: consentHandleToUse,
                    mobile: profile.mobile
                }
            }).then(function(response) {
                if (response.data.success) {
                    $scope.consentStatus = response.data.status;
                    $scope.consentId = response.data.consentId;
                    // Update consentHandleId if provided
                    if (response.data.consentHandle || response.data.consentHandleId) {
                        $scope.consentHandleId = response.data.consentHandleId || response.data.consentHandle;
                    }
                    
                    if (response.data.status === 'ACCEPTED' || response.data.status === 'ACTIVE') {
                        clearInterval(pollInterval);
                        $scope.consentStatus = response.data.status;
                        // Trigger FI request
                        $scope.triggerFIRequest();
                    } else if (response.data.status === 'REJECTED' || response.data.status === 'EXPIRED') {
                        clearInterval(pollInterval);
                        alert('Consent was ' + response.data.status.toLowerCase() + '. Please try again.');
                    }
                }
            }).catch(function(err) {
                console.error('[finvuConnectCtrl] Consent status check error:', err);
            });
        }, 3000); // Poll every 3 seconds
        
        // Stop polling after 5 minutes
        setTimeout(function() {
            clearInterval(pollInterval);
        }, 300000);
    };

    // Trigger FI Request after consent is ACCEPTED
    $scope.triggerFIRequest = function() {
        var profile = stateManager.getProfile();
        if (!$scope.consentId || !$scope.consentHandleId) {
            alert('Missing consent information');
            return;
        }

        $scope.isRefreshing = true;

        // Use date range that matches consent - typically last 6 months for demo
        // The date range MUST match what was consented in the Finvu window
        var dateTo = new Date();
        var dateFrom = new Date();
        // Use last 6 months to match typical consent range
        dateFrom.setMonth(dateFrom.getMonth() - 6);
        
        // Format dates properly for Finvu API (ISO format)
        var dateFromISO = dateFrom.toISOString();
        var dateToISO = dateTo.toISOString();

        console.log('[finvuConnectCtrl] Triggering FI request with date range:', dateFromISO, 'to', dateToISO);
        console.log('[finvuConnectCtrl] Consent ID:', $scope.consentId, 'Consent Handle ID:', $scope.consentHandleId);

        $http.post('/api/finvu/fi/request', {
            mobile: profile.mobile,
            consentId: $scope.consentId,
            consentHandleId: $scope.consentHandleId,
            dateTimeRangeFrom: dateFromISO,
            dateTimeRangeTo: dateToISO
        }).then(function(response) {
            if (response.data.success) {
                $scope.sessionId = response.data.data.sessionId;
                // Poll FI status until READY
                $scope.pollFIStatus();
            } else {
                $scope.isRefreshing = false;
                alert(response.data.message || 'Failed to trigger FI request');
            }
        }).catch(function(err) {
            $scope.isRefreshing = false;
            console.error('FI request error:', err);
            alert('Failed to trigger FI request. Please try again.');
        });
    };

    // Poll FI Status until READY
    $scope.pollFIStatus = function() {
        if (!$scope.sessionId || !$scope.consentId || !$scope.consentHandleId) return;
        
        var profile = stateManager.getProfile();
        var pollInterval = setInterval(function() {
            $http.get('/api/finvu/fi/status', {
                params: {
                    mobile: profile.mobile,
                    consentHandleId: $scope.consentHandleId,
                    consentId: $scope.consentId,
                    sessionId: $scope.sessionId
                }
            }).then(function(response) {
                if (response.data.success && response.data.data) {
                    var fiStatus = response.data.data.fiRequestStatus;
                    
                    if (fiStatus === 'READY') {
                        clearInterval(pollInterval);
                        $scope.isRefreshing = false;
                        // Now fetch the actual data
                        $scope.fetchFinancialData();
                    } else if (fiStatus === 'FAILED' || fiStatus === 'ERROR') {
                        clearInterval(pollInterval);
                        $scope.isRefreshing = false;
                        alert('FI request failed. Please try again.');
                    }
                    // Otherwise continue polling
                }
            }).catch(function(err) {
                console.error('FI status check error:', err);
            });
        }, 5000); // Poll every 5 seconds
        
        // Stop polling after 10 minutes
        setTimeout(function() {
            clearInterval(pollInterval);
            if ($scope.isRefreshing) {
                $scope.isRefreshing = false;
                alert('FI request is taking longer than expected. Please check again later.');
            }
        }, 600000);
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

        // Use consentHandleId and sessionId if available
        var requestBody = {
            mobile: profile.mobile
        };
        
        // Use consentHandleId (preferred) or consentHandle for API calls
        var consentHandleToUse = $scope.consentHandleId || $scope.consentHandle;
        if (consentHandleToUse && $scope.sessionId) {
            requestBody.consentHandle = consentHandleToUse;
            requestBody.sessionId = $scope.sessionId;
        }

        $http.post('/api/finvu/data/fetch', requestBody).then(function(response) {
            $scope.isRefreshing = false;
            
            console.log('[finvuConnectCtrl] Fetch response:', response.data);
            
            if (response.data.success && response.data.data) {
                $scope.isConnected = true;
                $scope.financialData = response.data.data;
                
                // Ensure summary exists with defaults
                if (!$scope.financialData.summary) {
                    $scope.financialData.summary = {};
                }
                $scope.financialData.summary.totalBalance = $scope.financialData.summary.totalBalance || $scope.financialData.totalBalance || 0;
                $scope.financialData.summary.avgMonthlyIncome = $scope.financialData.summary.avgMonthlyIncome || 0;
                $scope.financialData.summary.avgMonthlyExpense = $scope.financialData.summary.avgMonthlyExpense || 0;
                $scope.financialData.summary.savingsRate = $scope.financialData.summary.savingsRate || 0;
                
                // Ensure arrays exist
                if (!Array.isArray($scope.financialData.accounts)) {
                    $scope.financialData.accounts = [];
                }
                if (!Array.isArray($scope.financialData.transactions)) {
                    $scope.financialData.transactions = [];
                }
                
                console.log('[finvuConnectCtrl] Financial Data loaded:', {
                    accountCount: $scope.financialData.accounts.length,
                    transactionCount: $scope.financialData.transactions.length,
                    totalBalance: $scope.financialData.summary.totalBalance
                });
            } else {
                console.error('[finvuConnectCtrl] Fetch failed:', response.data);
                alert(response.data.message || 'Failed to fetch financial data');
            }
        }).catch(function(err) {
            $scope.isRefreshing = false;
            console.error('[finvuConnectCtrl] Fetch error:', err);
            console.error('[finvuConnectCtrl] Error details:', err.data || err.message);
            alert('Failed to fetch financial data. Please try again.');
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
