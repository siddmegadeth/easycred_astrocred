app.controller('kycConsentCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'utility', '$document', function($scope, $rootScope, $timeout, stateManager, utility, $document) {


    $timeout(function() {

        warn('InitkycConcentCtrl Ready');
        warn('Verify Check Page');
        $scope.profile = stateManager.getProfile();
        log($scope.profile);

        if ($scope.profile.consent && $scope.profile.consent.isAadharAccepted && $scope.profile.consent.isPanAccepted) {
            log('KYC Completed');
            $scope.myNavigator.pushPage('dashboard.html');
        } else {
            log('KYC Not Completed');

            $scope.consent = false;
            $scope.loadConsentForm();
        }

    }, 100);

    $scope.loadConsentForm = function() {
        $scope.loaderConsent.show();

        utility.fetchConcentForm()
            .then(function(resp) {
                warn('Fetch fetchConcentForm :');
                $scope.loaderConsent.hide();

                log(resp);
                $scope.consent = resp.data;

            });
    }

    $scope.declineConsentKYC = function() {

        $scope.myNavigator.resetToPage('dashboard-kyc.html');

    }
    $scope.acceptConsentKYC = function(consent) {
        if (consent) {
            ons.notification.toast('Please Wait', { timeout: 2000 });
            $scope.loaderConsent.show();

            utility.giveKYCConcent($scope.profile.profile, consent)
                .then(function(resp) {
                    warn('Consent Acceptance Resp');
                    log(resp);
                    $scope.loaderConsent.hide();
                    if (resp.data.status && resp.data.isReady) {
                        stateManager.saveProfile(resp.data.data);
                        $scope.myNavigator.pushPage('kyc-complete.html', {
                            data: {
                                isEdit: true
                            }
                        });
                        //  ons.notification.alert('Successfully updated KYC Consent');
                    } else {
                        ons.notification.toast('Not Able To Update KYC Consent.Try Again Later');
                    }
                });
        } else {
            ons.notification.alert('Consent Is Required To Continue');
        }
    };


}])