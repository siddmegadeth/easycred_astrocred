app.controller('logoutCtrl', ['$location', '$timeout', '$scope', 'stateManager', '$rootScope', 'authentication', function ($location, $timeout, $scope, stateManager, $rootScope, authentication) {

    $timeout(function () {
        // Clear client side session
        stateManager.clearLocalStorage();
        $rootScope.currentUser = null;

        // Optional: Call backend logout if needed
        authentication.logout().then(function () {
            console.log('Backend logout complete');
        }).finally(function () {
            $timeout(function () {
                $location.path("/login");
            }, 500);
        });
    });

}]);