app.controller('profileCtrl', ['$location', '$timeout', '$scope', 'stateManager', '$rootScope', 'authentication', function ($location, $timeout, $scope, stateManager, $rootScope, authentication) {

    $timeout(function () {
        warn('Init profileCtrl Ready');
        $scope.message = {};
        if (stateManager.isUserLogggedIn()) {

            // Load initial from local storage
            $scope.profile = stateManager.getProfile();

            // Refresh from server
            authentication.getMe().then(function (response) {
                if (response.data && response.data.success) {
                    $scope.profile = response.data.profile;
                    stateManager.saveProfile($scope.profile);
                    log('Profile Refreshed: ', $scope.profile);
                }
            }).catch(function (err) {
                console.error('Failed to refresh profile:', err);
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