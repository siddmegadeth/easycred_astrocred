app.controller('profileCompleteCtrl', ['$scope', '$rootScope', '$timeout', 'profileEvent', 'stateManager', 'utility', function($scope, $rootScope, $timeout, profileEvent, stateManager, utility) {

    $timeout(function() {
        // $rootScope.$on('request_error', function(event, data) {
        //     error('request_error');
        //     $scope.loader.hide();
        // });


        warn('Init profileCompleteCtrl Ready');
        if (stateManager.isUserLogggedIn()) {
            $scope.isEdit = $scope.myNavigator.topPage.data.isEdit || false;
            log($scope.isEdit);
            if ($scope.isEdit) {
                warn('Init profileCompleteCtrl EDIT');
                $scope.userProfile = stateManager.getProfile();
                $scope.isDisabled = true;
                $scope.initMapBox();
                // $scope.initPhone();

                log($scope.userProfile);

            } else {

                warn('Init profileCompleteCtrl FRESH');
                $scope.userProfile = stateManager.getProfile();
                $scope.userProfile.common = {};
                $scope.createProfile = {};
                $scope.isDisabled = false;
                $scope.initMapBox();
                // $scope.initPhone();
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



    $scope.initPhone = function() {
        const input = document.getElementById("mobile");
        log(input);
        $scope.iti = window.intlTelInput(input, {
            formatOnDisplay: true,
            nationalMode: true,
            onlyCountries: ['in'],
            placeholderNumberType: 'MOBILE',
            separateDialCode: false,
            autoPlaceholder: 'aggressive',
            initialCountry: 'in',
            separateDialCode: true,
            customPlaceholder: function() {
                return $scope.userProfile.profile_info.mobile;
            },
        });
    }


    $scope.initMapBox = function() {
        log("initMapBox");
        const countryCode = stateManager.getCountryCode();
        warn('Country Code :');
        log(countryCode);
        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            types: 'country,region,place,postcode',
            countries: countryCode.iso2,
            placeholder: 'Add Your Current City/Place'
        });
        if (document.getElementById("geocoderProfileComplete")) {

            const ele = document.getElementById("geocoderProfileComplete");
            ele.remove();
            const newEle = document.createElement("div");
            newEle.id = "geocoderProfileComplete";
            newEle.className = "user-onboarding form-control";
            document.getElementById("geocoderProfileContainer").appendChild(newEle);
            geocoder.addTo('#geocoderProfileComplete');
        } else {
            geocoder.addTo('#geocoderProfileComplete');
        }

        // Get the geocoder results container.
        $scope.userProfile.common.location = document.getElementById('result');
        log($scope.userProfile.common);

        // Add geocoder result to container.
        geocoder.on('result', (e) => {
            // $scope.onboarding.location = JSON.stringify(e.result, null, 2);
            $scope.userProfile.common.location = e.result;
            $scope.userProfile.common.isLocationAdded = true;
            log($scope.userProfile);
            log($scope.userProfile.common);
        });

        // Clear results container when search is cleared.
        geocoder.on('clear', () => {
            $scope.userProfile.common.location = {};
            $scope.userProfile.common.isLocationAdded = false;
        });

    }


    $scope.updateProfile = function() {
        warn('Start Social Media Login');
        warn('User Profile :');
        log($scope.userProfile);
        $scope.loader.show();
        const state = stateManager.getProfile();

        if ($scope.userProfile.common.location) {
            delete $scope.userProfile.common.location.bbox;
            delete $scope.userProfile.common.location.properties;
            delete $scope.userProfile.common.location.place_type;
            $scope.userProfile.common.countryCode = stateManager.getCountryCode();
            $scope.userProfile.common.isCountryCodeAdded = true;

            $scope.userProfile.common.currency = stateManager.getCurrencyCode();
            $scope.userProfile.common.isCurrencyAdded = true;
            //$scope.userProfile.common.countryData = $scope.iti.getSelectedCountryData();
            $scope.userProfile.profile_info.props = $scope.userProfile.profile_info.props;

            if ($scope.userProfile.profile_info.email) {
                $scope.userProfile.profile_info.isEmailAdded = true;
            }

            if ($scope.userProfile.profile_info.props) {

                if ($scope.userProfile.profile_info.props.facebook) {
                    $scope.userProfile.profile_info.props.isFacebookAdded = true;
                } else {
                    $scope.userProfile.profile_info.props.isFacebookAdded = false;
                }

                if ($scope.userProfile.profile_info.props.twitter) {
                    $scope.userProfile.profile_info.props.isTwitterAdded = true;
                } else {
                    $scope.userProfile.profile_info.props.isTwitterAdded = false;
                }

                if ($scope.userProfile.profile_info.props.instagram) {
                    $scope.userProfile.profile_info.props.isInstagramAdded = true;
                } else {
                    $scope.userProfile.profile_info.props.isInstagramAdded = false;
                }

            }

            warn('Business Profile Type :');
            log($scope.userProfile);
            log('Is Edit : ' + $scope.isEdit);
            if ($scope.isEdit) {
                $scope.updateProfileWhenReady($scope.userProfile);
            } else {
                $scope.userProfile.isProfileCompleted = true;
                $scope.createProfileWhenReady($scope.userProfile);
            }
        } else {
            ons.notification.alert('Profile Not Complete.Add Location');
            log("Params Missing");
            $scope.loader.hide();

        }


    };


    $scope.updateProfileWhenReady = function(createProfile) {
        profileEvent.editProfile(createProfile)
            .then(function(resp) {
                warn('Updated Profile :');
                log(resp);
                $scope.loader.hide();

                if (resp.data.status && resp.data.isProfileUpdated) {
                    stateManager.saveProfile(resp.data.data);
                    $scope.userProfile = stateManager.getProfile();
                    $rootScope.$emit('profile-updated', {});
                    ons.notification.alert('Profile Successfully Updated')
                        .then(function() {
                            $scope.myNavigator.popPage();
                        })

                } else {
                    warn('Unable To Update Propfile');
                    ons.notification.alert(resp.data.message);
                }
            });
    }


    $scope.createProfileWhenReady = function(createProfile) {
        profileEvent.completeProfile(createProfile)
            .then(function(resp) {
                warn('Created Profile :');
                log(resp);
                $scope.loader.hide();

                if (resp.data.status && resp.data.isProfileCompleted) {
                    stateManager.saveProfile(resp.data.data.data);
                    ons.notification.alert('Welcome ' + resp.data.data.data.profile_info.fullname);

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
                    warn('Unable To Update Propfile');
                    ons.notification.alert(resp.data.message);

                }
            });
    }







}])