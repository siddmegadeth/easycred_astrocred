app.controller('homeCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', function($scope, $rootScope, $timeout, stateManager) {



    $timeout(function() {
        $rootScope.$on('request_error', function(event, data) {
            error('request_error');
            $scope.loader.hide();

        });
    });


}])