app.controller('customerStatusCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'juspay', function($scope, $rootScope, $timeout, stateManager, juspay) {
    $timeout(function() {


        warn('customerStatusCtrl Loan Type :');
        $scope.loanIntentId = $scope.myNavigator.topPage.data.loanIntentId;
        $scope.loanIntentIdAlias = $scope.myNavigator.topPage.data.loanIntentIdAlias;
        $scope.loanLinkExpiryTime = $scope.myNavigator.topPage.data.loanLinkExpiryTime;
        $scope.created_at = $scope.myNavigator.topPage.data.created_at;
        $scope.merchantId = $scope.myNavigator.topPage.data.merchantId;


        log('loanIntentId : ' + $scope.loanIntentId);
        log('loanIntentIdAlias : ' + $scope.loanIntentIdAlias);
        log('loanLinkExpiryTime : ' + $scope.loanLinkExpiryTime);
        log('merchantId : ' + $scope.merchantId);

        $scope.isUserLogggedIn = stateManager.isUserLogggedIn();
        if (stateManager.isUserLogggedIn()) {
            $scope.profileRetail = stateManager.getProfile();


            if ($scope.loanIntentId) {
                $scope.loaderCustomerStatus.show();

                $scope.checkStatusOnLoad();

            } else {
                ons.notification.alert('Loan Application Number Not Found')
                    .then(function() {
                        $scope.myNavigator.popPage();
                    });

            }


        } else {
            $timeout(function() {
                ons.notification.alert('User Not Logged In')
                    .then(function() {
                        stateManager.clearLocalStorage();
                        $scope.myNavigator.resetToPage('login.html');

                    });
            })
        }


    });
    $scope.reload = function($done) {
        $scope.fetchCustomerStatus(true, $done);
    }



    $scope.$on('fetch-customer-status', function() {
        warn('fetch-customer-status');
        $scope.fetchCustomerStatus(false);

    });


    $scope.checkStatusOnLoad = function() {
        juspay.customerStatus($scope.profileRetail.profile, $scope.profileRetail.universal_customer_id,$scope.profileRetail.profile_info.email, $scope.loanIntentId)
            .then(function(resp) {
                $scope.loaderCustomerStatus.hide();

                warn('Customer Loan Application Status:');
                log(resp);
                if (resp.data && resp.data.isReady) {
                    if (resp.data.data.loanApplications.length != 0) {
                        log('Status Exist');
                        $scope.customerAppStatus = resp.data.data;
                        log($scope.customerAppStatus);
                    } else {
                        log('Pop Page');
                        $timeout(function() {
                            ons.notification.alert('You Do Not Have Any Active Loan Application In Progress')
                            .then(function() {
                                $scope.myNavigator.popPage();
                            })

                        }, 100);
                    }
                } else {
                    log('Pop Page');
                    $timeout(function() {
                        ons.notification.alert('You Do Not Have Any Active Loan Application In Progress')
                        .then(function() {
                            $scope.myNavigator.popPage();
                        })

                    }, 100);
                }

            });
    }



    $scope.fetchCustomerStatus = function(isReload, $done) {
        juspay.customerStatus($scope.profileRetail.profile, $scope.profileRetail.universal_customer_id, $scope.profileRetail.profile_info.email, $scope.loanIntentId)
            .then(function(resp) {
                $scope.loaderCustomerStatus.hide();

                warn('Customer Loan Application Status:');
                log(resp);
                if (resp.data.status && resp.data.data.loanApplications && resp.data.data.loanApplications.length != 0) {
                    $scope.customerAppStatus = resp.data.data;
                    log($scope.customerAppStatus);
                } else {
                    ons.notification.alert('Not Able To Fetchg Customer Loan Status');
                }
                if (isReload) {
                    $done();
                }
            });
    }

    $scope.openLoanLink = function(link) {


        ons.openActionSheet({
            title: 'Loan Application ' + link.loanIntentIdAlias || 'ECPL',
            cancelable: true,
            buttons: [
                'View Application Status',
                'Continue Loan Application',

                {
                    label: 'Cancel',
                    modifier: 'destructive'
                }
            ]
        }).then(function(index) {

            if (index == 0) {

            } else if (index == 1) {
                var linkWindow = window.open(link.loanLink, "_blank", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=yes, width=" + window.screen.availWidth, "height=" + window.screen.availHeight);

                var timer = setInterval(function() {
                    if (linkWindow.closed) {
                        clearInterval(timer);
                        warn('closed Loan Link');
                        log(link);
                    }
                }, 1000);
            }

        })


    };

    $scope.openLoanStatusDialog = function(status) {
        warn('Advance Loan Status :');

        if (status) {
            log(status);
            $scope.loanStatusDialog.show();
            $scope.statusAdvance = status;
        } else {
            //ons.notification.alert('You Do Not Have Any Loan Details');
        }

    }

    $scope.closeLoanStatusDialog = function() {
        warn('Close Loan Status :');
        loanStatusDialog.hide()
    }
}])