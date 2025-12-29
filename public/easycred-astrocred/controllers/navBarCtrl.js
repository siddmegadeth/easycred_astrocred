app.controller('navbarCtrl', ['$location', '$timeout', '$scope', 'stateManager', '$rootScope', 'authentication', function($location, $timeout, $scope, stateManager, $rootScope, authentication) {

    $timeout(function() {

        $rootScope.$on('init-navbar', function(e, value) {
            warn('init-navbar');
        });


    });


    $scope.isActive = function(viewLocation) {
        //log(viewLocation);
        //log($location.path());
        return viewLocation === $location.path();
    };

    $scope.logout = function() {
        authentication.logout()
            .then(function(resp) {
                warn('Logout :');
                log(resp);
                stateManager.clearLocalStorage();
                $location.path("login");
            });
    }



}]);