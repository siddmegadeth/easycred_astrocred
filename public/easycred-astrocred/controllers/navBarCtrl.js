app.controller('navbarCtrl', ['$location', '$timeout', '$scope', 'stateManager', '$rootScope', function($location, $timeout, $scope, stateManager, $rootScope) {

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
        stateManager.clearLocalStorage();
        window.location.reload();
        $location.url("/login");
    }



}]);