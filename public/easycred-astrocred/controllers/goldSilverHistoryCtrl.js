app.controller('goldSilverHistoryCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'mmtc', 'stateManagerMMTC', function($scope, $rootScope, $timeout, stateManager, mmtc, stateManagerMMTC) {



    $timeout(function() {
        $scope.profile = stateManager.getProfile();
        $scope.header = $scope.myNavigator.topPage.data.header;
        $scope.historySilver = [];
        $scope.historyGold = [];
        $scope.timelineLabel = [];
        $scope.timelineData = [];

        if ($scope.header == 'GOLD') {
            mmtc.prices.goldPriceHistory('1M')
                .then(function(resp) {
                    warn('Gold Prices For 1 Last Month');
                    log(resp)
                    if (resp.data.status && resp.data.isSuccess) {
                        resp.data.data.forEach(function(tuple) {

                            var date = $scope.convertToDate(tuple.date_time);
                            $scope.historyGold.push({
                                buy_pretax: tuple.buy_pretax,
                                date_time: date
                            });
                            $scope.timelineLabel.push(date);
                            $scope.timelineData.push(tuple.buy_pretax);
                        });
                        $scope.chartInit();
                    } else {
                        ons.notification.toast('Gold Historical Data Cannot Be Fetched', { timeout: 3000 });
                    }

                    warn('Historical sanitized Data Gold :');
                    log($scope.historyGold);

                });
        } else if ($scope.header == 'SILVER') {

            mmtc.prices.silverPriceHistory('1M')
                .then(function(resp) {
                    warn('Silver Prices For 1 Last Month');
                    log(resp)

                    if (resp.data.status && resp.data.isSuccess) {
                        resp.data.data.forEach(function(tuple) {

                            var date = $scope.convertToDate(tuple.date_time);
                            $scope.historySilver.push({
                                buy_pretax: tuple.buy_pretax,
                                date_time: date
                            });
                            $scope.timelineLabel.push(date);
                            $scope.timelineData.push(tuple.buy_pretax);
                        });
                        $scope.chartInit();
                    } else {
                        ons.notification.toast('Silver Historical Data Cannot Be Fetched', { timeout: 3000 });
                    }


                    warn('Historical sanitized Data Silver :');
                    log($scope.historySilver);
                });
        } else {
            log('No Metal Params Found');
        }

    }, 100);



    $scope.convertToDate = function(yyyymmdd) {
        // Extract year, month, and day from the string
        const year = parseInt(yyyymmdd.substring(0, 4), 10);
        const month = parseInt(yyyymmdd.substring(4, 6), 10) - 1; // Months are 0-indexed in JS
        const day = parseInt(yyyymmdd.substring(6, 8), 10);

        // Create and return a new Date object
        return new Date(year, month, day).toLocaleDateString();
    }


    $scope.chartInit = function() {
        warn('Timeline :');
        log($scope.timelineLabel);

        warn('Timeline Data :');
        log($scope.timelineData);
        // 1. Bar Chart Data
        $scope.datasetOverride = [{
                label: "Bar chart",
                borderWidth: 1,
                type: 'bar'
            },
            {
                label: "Line chart",
                borderWidth: 3,
                hoverBackgroundColor: "rgba(255,99,132,0.4)",
                hoverBorderColor: "rgba(255,99,132,1)",
                type: 'line'
            }
        ];

        $scope.options = {
            scales: {
                yAxes: [{
                    id: 'y-axis-1',
                    type: 'linear',
                    display: true,
                    position: 'left'
                }]
            }
        };

    }

}])