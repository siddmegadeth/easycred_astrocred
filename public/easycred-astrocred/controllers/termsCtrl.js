app.controller('termsCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'utility', function($scope, $rootScope, $timeout, stateManager, utility) {


    $timeout(function() {
        // $rootScope.$on('request_error', function(event, data) {
        //     error('request_error');
        //     $scope.loaderTerms.hide();

        // });
        ons.ready(function() {
            warn('Init termsCtrl Ready');
            warn('Verify Check Page');
            $scope.profile = stateManager.getProfile();
            log($scope.profile);
            $scope.consent = false;
            $scope.loaderTerms.show();
            utility.fetchTerms()
                .then(function(resp) {
                    $scope.loaderTerms.hide();
                    warn('Fetch terms :');
                    log(resp);
                    $scope.terms = resp.data;

                });

        });

    });


    $scope.acceptTerms = function(consent) {
        if (consent) {
            ons.notification.toast('Please Wait', { timeout: 2000 });
            utility.acceptTerms($scope.profile.profile, consent)
                .then(function(resp) {
                    warn('Consent Acceptance Resp');
                    log(resp);
                    if (resp.data.status && resp.data.isReady) {
                        stateManager.saveProfile(resp.data.data);
                        $scope.myNavigator.resetToPage('verify.html');
                        ons.notification.toast('Successfully updated Terms And Conditions', { timeout: 2000 });
                    } else {
                        ons.notification.toast('Not Able To Update Terms', { timeout: 2000 });
                    }
                });
        } else {
            ons.notification.alert('Consent Is Required To Continue');
        }
    };


}])