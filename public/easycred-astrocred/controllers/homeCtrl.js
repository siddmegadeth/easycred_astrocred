app.controller('homeCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', '$location', function($scope, $rootScope, $timeout, stateManager, $location) {



    $timeout(function() {


        if (stateManager.isUserLogggedIn()) {
            var userProfile = stateManager.getProfile();
            log('User Profile :');
            log(userProfile);

            if (stateManager.isProfileCompleted()) {
                log('Profile Completed :');


                if (userProfile.consent.isTermsAccepted) {
                    if (stateManager.isKYCCompleted()) {

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


    });


}])