app.controller('profileCtrl', ['$location', '$timeout', '$scope', 'stateManager', '$rootScope', function($location, $timeout, $scope, stateManager, $rootScope) {

    $timeout(function() {
        warn('Init profileCtrl Ready');

        if (stateManager.isUserLogggedIn()) {
            $scope.profile = stateManager.getProfile();
            log('User Profile :');
            log($scope.profile);
        } else {
            stateManager.clearLocalStorage();
            $location.path("/login");
        }
    });


}]);