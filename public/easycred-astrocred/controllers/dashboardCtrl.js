app.controller('dashboardCtrl', ['$scope', '$rootScope', 'stateManager', '$timeout', 'utility', 'profileEvent', 'kyc', 'juspay', function($scope, $rootScope, stateManager, $timeout, utility, profileEvent, kyc, juspay) {


    $timeout(function() {


        ons.ready(function() {
            warn('Init Dashboard Ready');


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
            //$scope.startIntro();
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

    $rootScope.$on('updated-profile', function(event, data) {
        warn('dashboard exception-occured :');
        log(event);
        log(data);
        $scope.fetchUpdatedProfile();
    });

    $scope.startIntro = function() {
        introJs.tour().setOptions({
            steps: [{
                    title: 'Welcome',
                    intro: 'Lets start basic for Easycred application'
                },
                {
                    title: 'Content ',
                    element: document.querySelector('.dashboard-content'),
                    intro: 'This is your loan application active and expired loan application'
                },
                {
                    title: 'Quick Actions',
                    element: document.querySelector('.action-cards'),
                    intro: 'This is your loan application and gold/silver links panel. Click either one to get started'
                },
                {
                    title: 'Loans/Digital Gold',
                    element: document.querySelector('.quick-actions'),
                    intro: 'to create and apply for personal loan or Digital Gold.click on Either Link'
                }
            ]
        }).start();

        introJs.tour().setOption("dontShowAgain", true).start();




    }

    $scope.initDashboard = function() {

        $timeout(function() {
            $scope.isUserLogggedIn = stateManager.isUserLogggedIn();
            if (stateManager.isUserLogggedIn()) {
                $scope.profileDashboard = stateManager.getProfile();
                if (!stateManager.isProfileCompleted()) {
                    $scope.myNavigator.resetToPage('profile-complete.html');
                } else {
                    $scope.profileEventLoad(false);
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
                $scope.loanStatistics(reload, $done);


            })
    }

    $scope.loanStatistics = function(reload, $done) {

        juspay.loanStatistics($scope.profileDashboard.profile)
            .then(function(resp) {
                warn('Loan Statistics : ');
                log(resp);
                if (resp.data.status && resp.data.isReady) {

                    $scope.linksCount = resp.data.data;
                } else {

                }

                if (reload) {
                    $done();
                }
            });
    };





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




    $scope.registerWebNotificationPWA = function() {
        navigator.serviceWorker.register('serviceWorker.js').then(function(registration) {
            webNotification.showNotification('Welcome', {
                serviceWorkerRegistration: registration,
                body: 'Welcome To Easycred',
                icon: 'assets/favicon.ico',
                actions: [{
                        action: 'Start',
                        title: 'Start'
                    },
                    {
                        action: 'Stop',
                        title: 'Stop'
                    }
                ],
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
        });



    }


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


    $scope.openGoldSilver = function() {

        if ($scope.profileDashboard.isProfileCompleted) {

            $scope.aadhaar_number = $scope.replace($scope.profileDashboard.kyc.aadhar.aadhar_card);
            if ($scope.profileDashboard.kyc.isAadharVerified) {
                //ons.notification.toast('Aadhar Number Verified', { timeout: 2000 });
                $scope.myNavigator.pushPage('gold-silver.html', {
                    animation: 'lift'
                });
            } else {
                $scope.myNavigator.pushPage('aadhar.html', {
                    animation: 'slide'
                });
                ons.notification.alert('Aadhar Number Not Verified');
            }



        } else {
            ons.notification.alert('Complete KYC');

        }
    }

    $scope.openRetailLoan = function(type) {
        if ($scope.profileDashboard.isProfileCompleted) {



            if ($scope.profileDashboard.isJuspayProfileCompleted) {


                $scope.myNavigator.pushPage('retail-loan.html', {
                    animation: 'slide',
                    data: {
                        retailType: type
                    }
                }).then(function() {
                    warn('Page Push Complete');
                })

            } else {
                ons.notification.confirm('To continue or start a new loan application, We would request you to kindly fill out few more information. You can always edit few fields from Profile Section')
                    .then(function(click) {
                        log(click);

                        if (click == 1) {
                            $scope.myNavigator.pushPage('juyspay-onboarding.html', {
                                animation: 'lift',
                                data: {
                                    isEdit: false
                                }
                            });
                        }

                    });
            }
        } else {
            ons.notification.alert('Complete KYC');

        }
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




    $scope.gotoDigitalMetal = function() {
        //$scope.myNavigator.pushPage('gold-silver.html', {});
        $scope.myNavigator.pushPage('gold-verify.html', { animation: 'slide' });
    }


}])