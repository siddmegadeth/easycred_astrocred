app.controller('expiredLoanCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'juspay', function($scope, $rootScope, $timeout, stateManager, juspay) {
    $timeout(function() {

        $rootScope.$on('request_error', function(event, data) {
            error('request_error');
            $scope.loaderExpired.hide();
        });


        $scope.loanJourney = [];
        warn('Retail Loan Type Expired :');
        $scope.expiredLoan = $scope.myNavigator.topPage.data.expiredLinks || [];
        log($scope.expiredLoan);


        $scope.isUserLogggedIn = stateManager.isUserLogggedIn();
        if (stateManager.isUserLogggedIn()) {
            $scope.profileRetail = stateManager.getProfile();
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








    $scope.openLoanLink = function(link) {

        warn('Selected Loan');
        log(link);
        ons.openActionSheet({
            title: 'Loan Application ' + link.loanIntentIdAlias || 'ECPL',
            cancelable: true,
            buttons: [
                'View',
                {
                    label: 'Cancel',
                    modifier: 'destructive'
                }
            ]
        }).then(function(index) {
            warn('Selected Loan Application :');
            log(index);
            juspay.updateLoanStatus($scope.profileRetail.profile, link.loanIntentId)
                .then(function(resp) {
                    warn('updateLoanStatus :');
                    log(resp);

                    if (resp.data.status && resp.data.continueLoanApplication) {

                        warn('Selected Loan Application :');
                        log(index);
                        if (index == 0) {

                            $scope.myNavigator.pushPage('customer-status.html', {
                                animation: 'slide',
                                data: {
                                    loanIntentId: link.loanIntentId,
                                    loanIntentIdAlias: link.loanIntentIdAlias || 'ECPL',
                                    loanLinkExpiryTime: link.loanLinkExpiryTime,
                                    created_at: link.created_at,
                                    merchantId: link.payload.merchantId
                                }
                            })

                        } else if (index == 1) {
                            var linkWindow = window.open(link.loanLink, "_blank", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=yes, width=" + window.screen.availWidth, "height=" + window.screen.availHeight);

                            var timer = setInterval(function() {
                                if (linkWindow.closed) {
                                    clearInterval(timer);
                                    warn('closed Loan Link');
                                    $scope.fetchLoans(false);
                                }
                            }, 1000);
                        }

                    } else {
                        ons.notification.alert('Loan Application Has Been Rejected By Lender');
                    }
                });

        })
    };


}])