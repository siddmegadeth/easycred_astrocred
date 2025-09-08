app.controller('viewInventoryCtrl', ['$scope', '$rootScope', 'stateManager', '$timeout', 'entityManager', function($scope, $rootScope, stateManager, $timeout, entityManager) {


    $timeout(function() {

        ons.ready(function() {
            $scope.viewProduct = {};

            $scope.viewInventory = $scope.myNavigator.topPage.data.view_inventory;
            log($scope.viewInventory);

        });

    });
   

}])