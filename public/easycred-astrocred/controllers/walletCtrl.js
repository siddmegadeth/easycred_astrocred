app.controller('walletCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'mmtc', 'sandbox', 'profileEvent', 'stateManagerMMTC', function($scope, $rootScope, $timeout, stateManager, mmtc, sandbox, profileEvent, stateManagerMMTC) {



    $timeout(function() {
        $scope.profile = stateManager.getProfile();
        $scope.mmtcProfile = stateManagerMMTC.getProfile();
        $scope.goldPrice = $scope.myNavigator.topPage.data.goldPrice;

        warn('customerRefNo : ' + $scope.mmtcProfile.customerRefNo);
        socket.emit('request-mmtc-getquote-gold', { type: 'BUY' });

        $scope.getOrderHistory();
        $scope.getPorfolio();

    });

    $scope.reload = function($done) {
        $scope.getPorfolio($done, true);
    };

    getGoldRate = function(balance, cb) {
        var rate = stateManagerMMTC.calculateMetalBuy(balance, $scope.goldPrice, 'Q');
        cb(rate);
    }

    $scope.getPorfolio = function($done, isReload) {

        mmtc.customers.getPortfolio($scope.mmtcProfile.customerRefNo)
            .then(function(resp) {
                warn(' getPortfolio Resp');
                log(resp);
                if (resp.data && resp.data.status) {
                    $scope.portfolioBalance = resp.data.data;
                    getGoldRate($scope.portfolioBalance.balances[0].balQuantity, function(resp) {
                        log(resp);
                        $scope.goldRate = resp;
                    });

                    if (isReload) {
                        $done();
                    }
                    // stateManagerMMTC.calculateMetalBuy($scope.portfolioBalance.balances[0].balQuantity, $scope.goldPrice, 'Q');

                }

            });

    };

    $scope.getOrderHistory = function() {

        mmtc.trade.getOrderHistory($scope.mmtcProfile.customerRefNo)
            .then(function(resp) {
                warn(' getOrderHistory Resp');
                log(resp);
                if (resp.data && resp.data.status) {
                    $scope.orderHistory = resp.data.data;
                }


            });

    };


}])