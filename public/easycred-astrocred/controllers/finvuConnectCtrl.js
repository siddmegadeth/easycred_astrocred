app.controller('finvuConnectCtrl', ['$scope', '$http', '$location', 'stateManager', '$interval', function ($scope, $http, $location, stateManager, $interval) {
    'use strict';

    $scope.step = 1;
    $scope.loading = false;
    $scope.mobile = stateManager.getProfile()?.mobile || '';
    $scope.aaHandle = $scope.mobile + '@finvu';
    $scope.selectedBank = '';
    $scope.consentId = null;
    $scope.banks = [
        { id: 'HDFC', name: 'HDFC Bank', logo: 'assets/banks/hdfc.png' },
        { id: 'ICICI', name: 'ICICI Bank', logo: 'assets/banks/icici.png' },
        { id: 'SBI', name: 'State Bank of India', logo: 'assets/banks/sbi.png' },
        { id: 'AXIS', name: 'Axis Bank', logo: 'assets/banks/axis.png' },
        { id: 'KOTAK', name: 'Kotak Mahindra Bank', logo: 'assets/banks/kotak.png' }
    ];

    // Initiate Consent
    $scope.initiateConsent = function () {
        if (!$scope.aaHandle) {
            alert('Please enter a valid Account Aggregator handle');
            return;
        }

        $scope.loading = true;
        $http.post('/api/finvu/consent/initiate', {
            mobile: $scope.mobile,
            handle: $scope.aaHandle
        }).then(function (response) {
            if (response.data.success) {
                $scope.consentId = response.data.data.consentId;
                $scope.step = 2;
                $scope.startPolling();
                // Simulate SMS sent
                $scope.consentLink = `https://finvu.in/consent/${$scope.consentId}`;
            } else {
                alert('Failed to initiate consent: ' + response.data.message);
            }
        }).catch(function (error) {
            console.error('Consent Init Error:', error);
            alert('Something went wrong. Please try again.');
        }).finally(function () {
            $scope.loading = false;
        });
    };

    // Poll for Consent Status
    $scope.startPolling = function () {
        var pollCount = 0;
        var maxPolls = 60; // 5 minutes

        var pollInterval = $interval(function () {
            pollCount++;
            if (pollCount > maxPolls) {
                $interval.cancel(pollInterval);
                $scope.step = 3; // Timeout/Manual check
                return;
            }

            // In a real app, we check status here. 
            // For now, we simulate success after 10 seconds if user claims to have approved
            // Or we check a status endpoint
            /*
            $http.get('/api/finvu/consent/status/' + $scope.consentId).then(...)
            */
        }, 5000);

        // Cleanup on destroy
        $scope.$on('$destroy', function () {
            $interval.cancel(pollInterval);
        });
    };

    // Simulate Approval (Development Only)
    $scope.simulateApproval = function () {
        $scope.loading = true;
        // Call the webhook manually to simulate FinVu calling us
        $http.post('/api/finvu/webhook/consent', {
            consentId: $scope.consentId,
            status: 'ACTIVE'
        }).then(function (response) {
            $scope.step = 3; // Success
            $scope.loadLinkedAccounts();
        }).finally(function () {
            $scope.loading = false;
        });
    };

    $scope.loadLinkedAccounts = function () {
        // Fetch accounts specific to FinVu to show summary
    };

    $scope.goToDashboard = function () {
        $location.path('/financial-dashboard');
    };

}]);
