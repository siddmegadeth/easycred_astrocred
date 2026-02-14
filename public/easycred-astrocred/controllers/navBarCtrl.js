app.controller('navbarCtrl', ['$location', '$timeout', '$scope', '$http', 'stateManager', '$rootScope', 'authentication', function($location, $timeout, $scope, $http, stateManager, $rootScope, authentication) {

    $scope.subscriptionPlan = null;

    $timeout(function() {

        $rootScope.$on('init-navbar', function(e, value) {
            warn('init-navbar');
        });

        // Load current subscription for plan badge (demo: shown when logged in)
        if (stateManager.isUserLogggedIn()) {
            $http.get('/api/subscription/current').then(function(res) {
                if (res.data.success && res.data.subscription) {
                    $scope.subscriptionPlan = res.data.subscription.plan;
                    $scope.subscriptionPlanName = res.data.subscription.planName || res.data.subscription.plan;
                }
            }).catch(function() {});
        }
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