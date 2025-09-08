app.controller('offlineCtrl', ['$scope', '$rootScope', '$timeout', function($scope, $rootScope, $timeout) {


    $timeout(function() {
        Offline.options = {
            checkOnLoad: true,
            interceptRequests: true,
            reconnect: {
                // How many seconds should we wait before rechecking.
                initialDelay: 3,
                delay: 10
                // How long should we wait between retries.
            },
            requests: true,
            game: false
        };

        Offline.on('confirmed-up', function() {
            log("confirmed Up");
            $timeout(function() {

                $scope.myNavigator.resetToPage('dashboard.html', { animation: 'lift' });
            });

        });
        Offline.on('confirmed-down', function() {
            log("confirmed down");
        });
    });

    $scope.retryForOnline = function() {
        var offline = Offline.check();
        warn("Check Network Status :");
        log(offline);
        var condition = navigator.onLine ? true : false;
        console.log(condition);
        if (condition) {
            warn("Online");
            $timeout(function() {
                $scope.myNavigator.resetToPage('dashboard.html', { animation: 'lift' });
            });
        } else {
            warn("Offline :");
            ons.notification.toast({
                message: 'No network Detected',
                timeout: 4000,
                buttonLabel: 'Dismiss'
            });
        }

    }

}])