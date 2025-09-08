app.controller('dashboardKycCtrl', ['$scope', '$rootScope', 'stateManager', '$timeout', 'utility', 'profileEvent', 'kyc', 'juspay', function($scope, $rootScope, stateManager, $timeout, utility, profileEvent, kyc, juspay) {


    $timeout(function() {


        ons.ready(function() {
            warn('Init dashboardKycCtrl Ready');


            if (window.matchMedia('(display-mode: standalone)').matches) {
                console.log("This is running as standalone.");
                // $scope.registerWebNotification();
            } else {
                console.log("This is running in browser.");
                // $scope.registerWebNotificationPWA();
            }
            // $scope.pageLoaded = false;
            // window.addEventListener("load", function(event) {
            //     $scope.pageLoaded = true;
            //     warn('Page Loaded ' + $scope.pageLoaded);
            // })

            $scope.initDashboard();

        })
    }, 300);


    $rootScope.$on('updated-kyc', function(event, data) {
        warn('Updated KYC Event :');
        log(event);
        log(data);
        ons.notification.toast('KYC Completed', { timeout: 2000 });
        $scope.fetchUpdatedProfile();

    });
    $rootScope.$on('exception-occured', function(event, data) {
        warn('dashboard exception-occured :');
        log(event);
        log(data);

    });




    $scope.initDashboard = function() {

        $timeout(function() {
            $scope.isUserLogggedIn = stateManager.isUserLogggedIn();
            if (stateManager.isUserLogggedIn()) {
                $scope.profileDashboard = stateManager.getProfile();
                if (!stateManager.isProfileCompleted()) {
                    $scope.myNavigator.resetToPage('profile-complete.html');
                } else {

                    if (stateManager.isKYCCompleted()) {
                        $scope.myNavigator.resetToPage('dashboard.html', {
                            animation: 'lift'
                        });
                    } else {
                        $scope.profileEventLoad(false);
                    }
                }
                //$scope.checkKYCStatus(false);
            } else {
                $timeout(function() {
                    ons.notification.alert('User Not Logged In')
                        .then(function() {
                            stateManager.clearLocalStorage();
                            $scope.myNavigator.resetToPage('login.html');

                        });
                })
            }

        }, 100)
    }


    $scope.reload = function($done) {

        if (stateManager.isUserLogggedIn()) {
            warn('Logged IN :');
            $scope.profileEventLoad(true, $done);

            //$scope.checkKYCStatus(false);
        } else {
            $timeout(function() {
                warn('Not Logged IN :');

                ons.notification.alert('User Not Logged In')
                    .then(function() {
                        stateManager.clearLocalStorage();
                        $scope.myNavigator.resetToPage('login.html');

                    });
            })
        }

    }


    $scope.profileEventLoad = function(reload, $done) {
        profileEvent.fetchProfile($scope.profileDashboard.profile)
            .then(function(resp) {
                warn('reload Profile');
                log(resp);
                $scope.profileDashboard = resp.data.data;
                stateManager.saveProfile(resp.data.data);
                if (reload) {
                    $done();
                }
            })
    }



    $scope.fetchUpdatedProfile = function() {
        profileEvent.fetchProfile($scope.profileDashboard.profile)
            .then(function(resp) {
                warn('fetchUpdatedProfile Profile');
                log(resp);
                $timeout(function() {
                    $scope.profileDashboard = resp.data.data;
                    stateManager.saveProfile(resp.data.data);
                })

            })
    };




    $scope.completeKYC = function(tuple) {
        warn('completeKYC');

        if ($scope.profileDashboard.consent.isAadharAccepted) {


            $scope.myNavigator.pushPage('kyc-complete.html', {
                        animation: 'slide',
                        data: {
                            isEdit: tuple
                        }
                    },

                )
                .then(function() {

                })
        } else {
            warn('Consent Is Required');

            $scope.myNavigator.resetToPage('kyc-consent.html', {});
        }
    };



    $scope.registerWebNotification = function() {
        warn('notification-vendor');
        //manually ask for notification permissions (invoked automatically if needed and allowRequest=true)
        webNotification.requestPermission(function onRequest(granted) {
            if (granted) {
                warn('Permission Granted.');
                webNotification.showNotification('Example Notification', {
                    body: 'Notification Text...',
                    icon: 'my-icon.ico',
                    onClick: function onNotificationClicked() {
                        console.log('Notification clicked.');
                    },
                    autoClose: 4000 //auto close the notification after 4 seconds (you can manually close it via hide function)
                }, function onShow(error, hide) {
                    if (error) {
                        window.alert('Unable to show notification: ' + error.message);
                    } else {
                        console.log('Notification Shown.');

                        setTimeout(function hideNotification() {
                            console.log('Hiding notification....');
                            hide(); //manually close the notification (you can skip this if you use the autoClose option)
                        }, 5000);
                    }
                });

            } else {
                console.log('Permission Not Granted.');
            }
        });

    }


    $scope.openProfile = function() {
        $scope.myNavigator.pushPage('profile.html', {
            animation: 'slide'
        }).then(function() {
            warn('Page Push Complete');
        })
    }




    $scope.openAadhar = function() {
        if ($scope.profileDashboard.isProfileCompleted) {

            if ($scope.profileDashboard.consent.isAadharAccepted) {

                $scope.myNavigator.pushPage('aadhar.html', {
                    animation: 'slide'
                });
            } else {
                warn('Consent Is Required');
                $scope.myNavigator.resetToPage('kyc-consent.html', {});
            }

        } else {
            ons.notification.alert('Complete PAN Verification First');


        }
    }


    $scope.gotoDashboardAfterKYC = function() {
        $scope.myNavigator.resetToPage('dashboard.html', {
            animation: 'lift'
        });
    }


    $scope.replace = function(str) {
        const len = str.length,
            output = []

        for (let i = 0; i < len; i += 4) {
            output.push(
                str.slice(i, i + 4)
                .padStart(i + 4)
                .padEnd(len)
            )
        }

        var digit = output[0].replaceAll(/\s/g, '') + "  " + output[1].replaceAll(/\s/g, '') + "  " + output[2].replaceAll(/\s/g, '');
        return digit;

    }



}])