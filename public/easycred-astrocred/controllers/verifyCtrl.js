app.controller('verifyCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'utility', 'geoIPServices', function($scope, $rootScope, $timeout, stateManager, utility, geoIPServices) {


    $timeout(function() {

        $rootScope.$on('force-logout', function() {

            warn('Force Logout :');
            stateManager.clearLocalStorage();
            $scope.myNavigator.resetToPage('login.html', {
                data: {
                    refresh: true
                }
            });

        });


        ons.ready(function() {
            warn('Init verifyCtrl Ready');
            warn('Verify Check Page');
            $scope.getCountryByIP();
            warn('Mobile Browser Detected :');

            if (stateManager.isAccessTokenFound()) {
                if (stateManager.isUserLogggedIn()) {
                    var userProfile = stateManager.getProfile();
                    log('User Profile :');
                    log(userProfile);
                    if (stateManager.isProfileCompleted()) {

                        if (utility.isMobileBrowser()) {

                            // if (userProfile.isJuspayProfileCompleted) {
                                if (userProfile.consent.isTermsAccepted) {
                                    if (stateManager.isKYCCompleted()) {
                                        $scope.myNavigator.resetToPage('dashboard.html', {
                                            animation: 'lift'
                                        });
                                    } else {
                                        $scope.myNavigator.resetToPage('dashboard-kyc.html', {
                                            animation: 'lift'
                                        });
                                    }
                                } else {
                                    $scope.myNavigator.resetToPage('terms.html', {});
                                }

                            // } else {
                            //     ons.notification.alert('Due to changes in EASYCRED App. You are required to login in again')
                            //         .then(function() {
                            //             stateManager.clearLocalStorage();
                            //             $scope.myNavigator.resetToPage('login.html', {
                            //                 data: {
                            //                     refresh: true
                            //                 }
                            //             });

                            //         });
                            // }

                        } else {
                            warn('Desktop Browser Detected :');
                            log("/desktop/not/supported" + "?storename=" + userProfile.store_name);
                            location.href = encodeURI("/desktop/not/supported");
                        }

                    } else {
                        if (utility.isMobileBrowser()) {
                            // $location.path("/profile-complete");


                            if (userProfile.consent.isTermsAccepted) {
                                $scope.myNavigator.resetToPage('profile-complete.html', {});
                            } else {
                                $scope.myNavigator.resetToPage('terms.html', {});
                            }



                        } else {
                            warn('Desktop Browser Detected :');
                            log("/desktop/not/supported" + "?storename=" + userProfile.store_name);
                            location.href = encodeURI("/desktop/not/supported" + "?storename=" + userProfile.store_name);
                        }
                    }
                } else {

                    if (utility.isMobileBrowser()) {
                        // $location.path("/profile-complete");

                        $scope.refresh = $scope.myNavigator.topPage.data.refresh || false;
                        error('Page Refresh VerifyCtrl : ');
                        log($scope.refresh);
                        if ($scope.refresh) {
                            // reload page 
                            window.location.reload();
                            // $location.path("/profile-complete");
                            $timeout(function() {
                                stateManager.clearLocalStorage();
                                $scope.myNavigator.resetToPage('login.html', {
                                    data: {
                                        refresh: true
                                    }
                                });
                            })
                        } else {
                            $timeout(function() {
                                stateManager.clearLocalStorage();
                                $scope.myNavigator.resetToPage('login.html', {
                                    data: {
                                        refresh: true
                                    }
                                });
                            })
                        }

                    } else {
                        warn('Desktop Browser Detected :');
                        log("/desktop/not/supported" + "?storename=");
                        location.href = encodeURI("/desktop/not/supported");
                    }

                }
            } else {
                $timeout(function() {
                    stateManager.clearLocalStorage();
                    $scope.myNavigator.resetToPage('login.html', {
                        data: {
                            refresh: true
                        }
                    });
                })
            }
        });

    });


    $rootScope.$on('progress_loader_hide', function(event, data) {
        warn('progress_loader_hide Show');
    });


    $scope.getCountryByIP = function() {
        utility.getSupportedCountries()
            .then(function(resp) {
                warn('Supported Countries :');
                log(resp);
                stateManager.saveSupportedCountry(resp.data);


            });
        geoIPServices.getGeoFromIP(function(resp) {
            warn('Your Current IP Is');
            log(resp);
            if (stateManager.isCountryCodeExist()) {
                warn('Country Code  Exist');
                if (!stateManager.isCurrencyExist()) {
                    utility.getCurrencyCode(resp)
                        .then(function(respCurrency) {
                            warn('Getting Currency Code globalCtrl');
                            log(resp)
                            stateManager.saveCurrencyCode(respCurrency.data.data);

                        });
                }
            } else {
                warn('Country Code Does Not Exist');
                stateManager.saveCountryCode(resp);
                if (!stateManager.isCurrencyExist()) {
                    utility.getCurrencyCode(resp)
                        .then(function(respCurrency) {
                            warn('Getting Currency Code globalCtrl');
                            log(respCurrency)
                            stateManager.saveCurrencyCode(respCurrency.data.data);

                        });
                }
            }

        });
    }



    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

}])