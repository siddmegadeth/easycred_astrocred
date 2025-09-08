app.controller('goldVerifyCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'mmtc', 'stateManagerMMTC', function($scope, $rootScope, $timeout, stateManager, mmtc, stateManagerMMTC) {



    $timeout(function() {

        $scope.promise = [];

        $scope.profile = stateManager.getProfile();

        //$scope.syncProfile();
        $scope.isMMTCAccountCreated = false;
      
        clearInterval($scope.myInterval);
        $scope.loaderGoldVerify.show();

        if (stateManagerMMTC.isProfileExist()) {
            warn('Profile Exist With MMTC And Found Locally. So Fetch MMTC Profile From localStorage');

            if (stateManagerMMTC.isMMTCAccountCreated()) {
                $scope.profileMMTC = stateManagerMMTC.getProfile();

                warn('MMTC Profile Is Created As Per Profile Model');
                $scope.createProfile = stateManagerMMTC.getProfile();
                $scope.isMMTCAccountCreated = true;
                warn('Profile MMTC From localStorage');
                log($scope.createProfile);
                //get portfolio and redirect to gold dashboard
                $scope.getPortfolio();

            } else {

                warn('MMTC Profile Is Not Created As Per Profile Model.So Directly Create One Profile');
                $scope.createProfileMMTC();
            }
        } else {

            warn('Profile Does Not Exist With MMTC. So Fetch Updated MMTC Profile');
            $scope.checkProfile();
        }


    });

    $scope.initCore = function() {

        socket.on('response-mmtc-customer-portfolio-success', function(incoming) {
            warn('response-mmtc-customer-portfolio-success');
            log(incoming);
            if (incoming.isSuccess) {
                $scope.customerPortfolio = incoming;
            } else {
                $scope.customerPortfolio = {
                    "customerName": "Siddharth Chandra",
                    "kycStatus": "Y",
                    "balances": [{
                            "balQuantity": "0.0000",
                            "currencyPair": "XAU/INR",
                            "blockedQuantity": "0.0000"
                        },
                        {
                            "balQuantity": "0.0000",
                            "currencyPair": "XAG/INR",
                            "blockedQuantity": "0.0000"
                        }
                    ]
                };

            }
        });
    }


    $scope.checkProfile = function() {
        //this syncProfile will only check if customerRefNo mapped/created or not and sync with DB with customerRefNo from mmtc 
        mmtc.customers.checkIfMMTCProfileExist($scope.profile.profile, $scope.profile.profile_info.mobile)
            .then(function(resp) {
                warn('mmtc checkIfMMTCProfileExist Profile :');
                log(resp);

                if (resp.data && resp.data.status && resp.data.isProfileCreated) {

                    $scope.isMMTCAccountCreated = true;
                    $scope.createProfile = resp.data.data;
                    warn('Profile MMTC From API');
                    log($scope.createProfile);
                    warn('mmtc syncProfile Profile :');

                    $scope.syncProfile();

                } else {
                    ons.notification.toast('Please Wait.Creating Profile With MMTC', { timeout: 2000 });
                    $scope.createProfileMMTC();
                }


            });
    }





    $scope.createProfileMMTC = function() {
        //this getProfile will create a updated mmtc data and sync with db

        mmtc.customers.createProfile($scope.profile.profile)
            .then(function(resp) {

                $timeout(function() {
                    warn('mmtc createProfile Profile :');
                    log(resp);
                    if (resp.data && resp.data.status && resp.data.isProfileCreated) {
                        $scope.createProfile = resp.data.data;
                        $scope.syncProfile();

                    } else {
                        ons.notification.toast('Not Able To Fetch Profile', { timeout: 2000 });
                    }

                })

            });

    }

    // would contain 2 array at 0 for saveMMTCProfileData and at 1 for updateProfileWithMMTC

    $scope.syncProfile = function() {
        mmtc.customers.syncProfile($scope.profile.profile, $scope.profile.profile_info.mobile, $scope.createProfile)
            .then(function(resp) {

                $timeout(function() {
                    warn('mmtc syncProfile Profile/MMTC :');
                    log(resp.data);

                    if (resp.data.isProfileCreated && resp.data.status) {
                        stateManagerMMTC.saveProfile(resp.data.mmtc);
                        stateManager.saveProfile(resp.data.profile);
                        //get portfolio and redirect to gold dashboard
                        $scope.getPortfolio();
                    } else {
                        ons.notification.toast('Not Able To Fetch Sync Profile', { timeout: 2000 });
                    }

                })

            });

    }




    $scope.getMMTCProfile = function(isReload, $done) {
        //this getProfile will create a updated mmtc data and sync with db

        mmtc.customers.getProfile($scope.profileMMTC.customerRefNo, $scope.profile.profile_info.mobile)
            .then(function(resp) {

                $timeout(function() {
                    warn('mmtc getProfile Profile :');
                    log(resp);
                    if (resp.data && resp.data.status && resp.data.isCreated) {
                        $scope.createProfile = resp.data.data.data;
                        //get portfolio and redirect to gold dashboard
                        $scope.getPortfolio();
                    } else {
                        ons.notification.toast('Not Able To Fetch Profile', { timeout: 2000 });
                    }

                    if (isReload) {
                        $done();
                    }
                })

            });

    }




    $scope.getPortfolio = function(isReload, $done) {
        //this getProfile will create a updated mmtc data and sync with db

        mmtc.customers.getPortfolio($scope.profile.mmtc.customerRefNo)
            .then(function(resp) {

                $timeout(function() {
                    warn('mmtc customer getPortfolio :');
                    log(resp);
                    if (resp.data && resp.data.status && resp.data.isSuccess) {
                        $scope.portfolio = resp.data;
                        $scope.gotoGoldDashboard(resp.data);
                    } else {
                        ons.notification.toast('You Have No Purchases. Please Wait', { timeout: 2000 });
                        $scope.gotoGoldDashboard(resp.data);

                    }

                    if (isReload) {
                        $done();
                    }
                })

            });

    }


    $scope.gotoGoldDashboard = function(portfolio) {

        $timeout(function() {
            $scope.myNavigator.resetToPage('gold-silver.html', {
                animation: 'slide',
                data: {
                    portfolio: portfolio
                }
            });
        }, 500);

    }


}])