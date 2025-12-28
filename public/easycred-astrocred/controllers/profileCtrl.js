app.controller('profileCtrl', ['$location', '$timeout', '$scope', 'stateManager', '$rootScope', function($location, $timeout, $scope, stateManager, $rootScope) {

    $timeout(function() {
        warn('Init profileCtrl Ready');
        $scope.message = {};
        if (stateManager.isUserLogggedIn()) {
            $scope.profile = stateManager.getProfile();
            log('User Profile :');
            log($scope.profile);

            if (stateManager.isProfileCompleted()) {


            } else {
                log('Profile Not Completed');
                $scope.messageModal = new bootstrap.Modal(document.getElementById("messageModal"), {});
                //var toast = document.getElementById('successToast');
                //$scope.toastSuccess = new bootstrap.Toast(toast);
                $scope.message.header = 'Profile Not Complete';
                $scope.message.content = 'Profile Page is currently unavailable.Complete Onboarding First';
                $scope.messageModal.show();

            }
        } else {
            stateManager.clearLocalStorage();
            $location.path("/login");
        }
    });

    $scope.gotoOnboarding = function() {
        $scope.messageModal.hide();
        $location.path("profile/complete");

    }


}]);