/**
 * FinVu Connect Controller
 * Handles bank account linking via FinVu Account Aggregator
 */
app.controller('finvuConnectCtrl', ['$scope', '$http', '$timeout', 'stateManager', '$location', '$window', 'authentication',
function($scope, $http, $timeout, stateManager, $location, $window, authentication) {
    
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
    $scope.returnFromConsent = false;

    // Refresh profile from server so we have latest finvu state (avoid stale localStorage)
    function refreshProfileThen(fn) {
        authentication.getProfileMe().then(function(response) {
            if (response.data && response.data.success && response.data.profile) {
                stateManager.saveProfile(response.data.profile);
            }
            if (fn) fn();
        }).catch(function() { if (fn) fn(); });
    }

    // Initialize
    $timeout(function() {
        $scope.checkServiceStatus();
        var params = $location.search();
        if (params.return === '1' || params.return === 'true') {
            $scope.returnFromConsent = true;
            $scope.consentInitiated = true;
            $scope.consentStatus = 'PENDING';
            if ($window.opener) {
                try { $window.opener.location.reload(); } catch (e) {}
                $window.close();
            }
        }
        refreshProfileThen(function() { $scope.checkExistingConnection(); });
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

    // Check if user already has connected: use saved consent + cached data; only call FinVu when needed
    $scope.checkExistingConnection = function() {
        var profile = stateManager.getProfile();
        if (!profile || !profile.mobile) return;

        // If profile says FinVu is linked, try cached dashboard first (no API call)
        if (profile.finvu && profile.finvu.isLinked) {
            $scope.isConnected = true;
            $scope.consentInitiated = true;
            $scope.consentStatus = 'ACTIVE';
            $scope.consentHandleId = profile.finvu.consentHandleId || profile.finvu.consentHandle;
            $scope.consentId = profile.finvu.consentId;
            $scope.loadFinancialData();
            return;
        }

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
                        // Need sessionId for fetch: trigger FI request first, then poll, then fetch
                        $scope.triggerFIRequest();
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

    // Trigger FI Request after consent is ACCEPTED (backend can fill consentId from profile if needed)
    $scope.triggerFIRequest = function() {
        var profile = stateManager.getProfile();
        var consentHandleToUse = $scope.consentHandleId || $scope.consentHandle;
        if (!consentHandleToUse || !profile || !profile.mobile) {
            alert('Missing consent or profile. Please complete consent flow first.');
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
        console.log('[finvuConnectCtrl] Consent ID:', $scope.consentId, 'Consent Handle ID:', consentHandleToUse);

        $http.post('/api/finvu/fi/request', {
            mobile: profile.mobile,
            consentId: $scope.consentId || null,
            consentHandleId: consentHandleToUse,
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
                $scope.fetchedAt = $scope.financialData.fetchedAt || new Date();
                $scope.normalizeFinancialData();
                $scope.buildChartData();
                $timeout(function() { $scope.initCharts(); }, 300);
                console.log('[finvuConnectCtrl] Financial Data loaded:', {
                    accountCount: $scope.financialData.accounts.length,
                    transactionCount: $scope.financialData.transactions.length,
                    totalBalance: $scope.financialData.summary.totalBalance
                });
            } else {
                // Session expired or missing: get new session then fetch (no alert)
                if (response.data.code === 'MISSING_SESSION') {
                    var profile = stateManager.getProfile();
                    if (profile && profile.finvu && (profile.finvu.consentHandleId || profile.finvu.consentHandle)) {
                        $scope.consentHandleId = profile.finvu.consentHandleId || profile.finvu.consentHandle;
                        $scope.consentId = profile.finvu.consentId;
                        $scope.triggerFIRequest();
                        return;
                    }
                }
                console.error('[finvuConnectCtrl] Fetch failed:', response.data);
                alert(response.data.message || 'Failed to fetch financial data');
            }
        }).catch(function(err) {
            $scope.isRefreshing = false;
            console.error('[finvuConnectCtrl] Fetch error:', err);
            var msg = (err.data && err.data.message) ? err.data.message : 'Failed to fetch financial data. Please try again.';
            if (err.data && err.data.code === 'MISSING_SESSION') {
                var profile = stateManager.getProfile();
                if (profile && profile.finvu && (profile.finvu.consentHandleId || profile.finvu.consentHandle)) {
                    $scope.consentHandleId = profile.finvu.consentHandleId || profile.finvu.consentHandle;
                    $scope.consentId = profile.finvu.consentId;
                    $scope.triggerFIRequest();
                    return;
                }
            }
            alert(msg);
        });
    };

    // Load existing financial data (from dashboard cache when connected)
    $scope.loadFinancialData = function() {
        var profile = stateManager.getProfile();
        if (!profile || !profile.mobile) return;

        $http.get('/api/finvu/dashboard?mobile=' + profile.mobile).then(function(response) {
            if (response.data.success && response.data.data) {
                // Use saved data from DB – no FinVu API call
                $scope.isConnected = true;
                $scope.financialData = response.data.data;
                $scope.fetchedAt = response.data.data.fetchedAt;
                $scope.normalizeFinancialData();
                $scope.buildChartData();
                $timeout(function() { $scope.initCharts(); }, 300);
            } else {
                // No cache: need sessionId then fetch. Use saved consent (triggerFIRequest) so we don't show "Missing consentHandle"
                if ($scope.consentHandleId || $scope.consentHandle || (profile.finvu && (profile.finvu.consentHandleId || profile.finvu.consentHandle))) {
                    $scope.consentHandleId = $scope.consentHandleId || $scope.consentHandle || (profile.finvu && (profile.finvu.consentHandleId || profile.finvu.consentHandle));
                    $scope.consentId = $scope.consentId || (profile.finvu && profile.finvu.consentId);
                    $scope.triggerFIRequest();
                } else {
                    $scope.fetchFinancialData();
                }
            }
        }).catch(function() {
            if ($scope.consentHandleId || (stateManager.getProfile() || {}).finvu) {
                $scope.consentHandleId = $scope.consentHandleId || (stateManager.getProfile().finvu && (stateManager.getProfile().finvu.consentHandleId || stateManager.getProfile().finvu.consentHandle));
                $scope.consentId = $scope.consentId || (stateManager.getProfile().finvu && stateManager.getProfile().finvu.consentId);
                $scope.triggerFIRequest();
            } else {
                $scope.fetchFinancialData();
            }
        });
    };

    $scope.normalizeFinancialData = function() {
        if (!$scope.financialData) return;
        if (!$scope.financialData.summary) $scope.financialData.summary = {};
        var s = $scope.financialData.summary;
        s.totalBalance = s.totalBalance || $scope.financialData.totalBalance || 0;
        s.avgMonthlyIncome = s.avgMonthlyIncome || 0;
        s.avgMonthlyExpense = s.avgMonthlyExpense || 0;
        s.savingsRate = s.savingsRate || 0;
        if (!Array.isArray($scope.financialData.accounts)) $scope.financialData.accounts = [];
        if (!Array.isArray($scope.financialData.transactions)) $scope.financialData.transactions = [];
    };

    // Chart data derived from transactions
    $scope.chartData = {};
    $scope.finvuCharts = [];

    $scope.buildChartData = function() {
        var txns = ($scope.financialData && $scope.financialData.transactions) ? $scope.financialData.transactions : [];
        var income = 0, expense = 0;
        var byMode = {};
        var byMonth = {};
        txns.forEach(function(t) {
            var amt = parseFloat(t.amount) || 0;
            if ((t.type || '').toUpperCase() === 'CREDIT') income += amt; else expense += amt;
            var mode = (t.mode || 'OTHER').toUpperCase();
            byMode[mode] = (byMode[mode] || 0) + amt;
            var d = t.date ? new Date(t.date) : new Date();
            var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0 };
            if ((t.type || '').toUpperCase() === 'CREDIT') byMonth[key].income += amt; else byMonth[key].expense += amt;
        });
        var months = Object.keys(byMonth).sort();
        $scope.chartData = {
            incomeVsExpense: { income: income, expense: expense },
            byMode: byMode,
            byMonth: months.map(function(m) { return { month: m, income: byMonth[m].income, expense: byMonth[m].expense }; })
        };
    };

    $scope.initCharts = function() {
        if (typeof Chart === 'undefined') return;
        $scope.destroyCharts();
        var txns = ($scope.financialData && $scope.financialData.transactions) || [];
        if (txns.length === 0) return;

        var cd = $scope.chartData;
        var defaultColors = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

        var incomeExpenseEl = document.getElementById('finvuIncomeExpenseChart');
        if (incomeExpenseEl && cd.incomeVsExpense) {
            var c1 = new Chart(incomeExpenseEl.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Income', 'Expense'],
                    datasets: [{ data: [cd.incomeVsExpense.income, cd.incomeVsExpense.expense], backgroundColor: ['#22c55e', '#ef4444'] }]
                },
                options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
            });
            $scope.finvuCharts.push(c1);
        }

        var byModeEl = document.getElementById('finvuByModeChart');
        if (byModeEl && cd.byMode && Object.keys(cd.byMode).length > 0) {
            var labels = Object.keys(cd.byMode);
            var values = labels.map(function(k) { return cd.byMode[k]; });
            var c2 = new Chart(byModeEl.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{ data: values, backgroundColor: defaultColors.slice(0, labels.length) }]
                },
                options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right' } } }
            });
            $scope.finvuCharts.push(c2);
        }

        var trendEl = document.getElementById('finvuTrendChart');
        if (trendEl && cd.byMonth && cd.byMonth.length > 0) {
            var c3 = new Chart(trendEl.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: cd.byMonth.map(function(m) { return m.month; }),
                    datasets: [
                        { label: 'Income', data: cd.byMonth.map(function(m) { return m.income; }), backgroundColor: 'rgba(34,197,94,0.7)' },
                        { label: 'Expense', data: cd.byMonth.map(function(m) { return m.expense; }), backgroundColor: 'rgba(239,68,68,0.7)' }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'top' } } }
            });
            $scope.finvuCharts.push(c3);
        }
    };

    $scope.destroyCharts = function() {
        $scope.finvuCharts.forEach(function(chart) { if (chart && chart.destroy) chart.destroy(); });
        $scope.finvuCharts = [];
    };

    // Refresh data (re-fetch from Finvu and update cache)
    $scope.refreshData = function() {
        if ($scope.consentHandleId || $scope.consentHandle || (stateManager.getProfile() || {}).finvu) {
            $scope.consentHandleId = $scope.consentHandleId || $scope.consentHandle || (stateManager.getProfile().finvu && (stateManager.getProfile().finvu.consentHandleId || stateManager.getProfile().finvu.consentHandle));
            $scope.consentId = $scope.consentId || (stateManager.getProfile().finvu && stateManager.getProfile().finvu.consentId);
            $scope.triggerFIRequest();
        } else {
            $scope.fetchFinancialData();
        }
    };

    // Disconnect FinVu and clear all saved data (start fresh)
    $scope.disconnectFinvu = function() {
        if (!confirm('Disconnect FinVu? Your saved bank link and cached data will be cleared. You can connect again from scratch.')) return;
        var profile = stateManager.getProfile();
        if (!profile || !profile.mobile) { alert('Not logged in'); return; }
        $http.post('/api/finvu/disconnect', { mobile: profile.mobile }).then(function(response) {
            if (response.data.success) {
                refreshProfileThen(function() {
                    $scope.isConnected = false;
                    $scope.consentInitiated = false;
                    $scope.consentStatus = null;
                    $scope.financialData = null;
                    $scope.consentHandleId = null;
                    $scope.consentId = null;
                    $scope.checkExistingConnection();
                });
                alert(response.data.message || 'Disconnected. You can connect again from scratch.');
            } else {
                alert(response.data.message || 'Disconnect failed');
            }
        }).catch(function(err) {
            alert((err.data && err.data.message) || 'Disconnect failed');
        });
    };

}]);
