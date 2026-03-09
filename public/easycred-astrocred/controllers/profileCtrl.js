app.controller('profileCtrl', ['$location', '$timeout', '$scope', 'stateManager', '$rootScope', 'authentication', function ($location, $timeout, $scope, stateManager, $rootScope, authentication) {

    $timeout(function () {
        warn('Init profileCtrl Ready');
        $scope.message = {};
        $scope.cibilProfile = null;
        $scope.analysisSummary = null;
        if (stateManager.isUserLogggedIn()) {

            // Load initial from local storage
            $scope.profile = stateManager.getProfile();

            // Fetch full profile (user + CIBIL-derived + analysis summary) from server
            authentication.getProfileMe().then(function (response) {
                if (response.data && response.data.success) {
                    $scope.profile = response.data.profile;
                    $scope.cibilProfile = response.data.cibilProfile || null;
                    $scope.analysisSummary = response.data.analysisSummary || null;
                    stateManager.saveProfile($scope.profile);
                    log('Profile Refreshed (with CIBIL): ', $scope.profile);
                }
            }).catch(function (err) {
                console.error('Failed to refresh profile:', err);
                // Keep existing profile from state
            });

            log('User Profile :', $scope.profile);

            if (stateManager.isProfileCompleted()) {
                // Profile is complete
            } else {
                log('Profile Not Completed');
                $scope.messageModal = new bootstrap.Modal(document.getElementById("messageModal"), {});
                $scope.message.header = 'Profile Not Complete';
                $scope.message.content = 'Profile Page is currently unavailable.Complete Onboarding First';
                $scope.messageModal.show();
            }
        } else {
            stateManager.clearLocalStorage();
            $location.path("/login");
        }
    });

    $scope.gotoOnboarding = function () {
        $scope.messageModal.hide();
        $location.path("profile/complete");
    }

    $scope.connectFinVu = function () {
        $location.path('/finvu-connect');
    };

}]);