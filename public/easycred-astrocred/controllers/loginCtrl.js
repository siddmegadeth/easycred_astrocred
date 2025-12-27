app.controller('loginCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'authentication', '$window', '$location', function($scope, $rootScope, $timeout, stateManager, authentication, $window, $location) {


    // $rootScope.$on('request_error', function(event, data) {
    //     error('request_error');
    //     $scope.loader.hide();

    // });
    //$scope.dialog.show();
    $timeout(function() {
        warn('Init loginCtrl Ready');
        $scope.message = {};

        if (stateManager.isUserLogggedIn()) {
            var userProfile = stateManager.getProfile();
            log('User Profile :');
            log(userProfile);

            if (stateManager.isProfileCompleted()) {
                log('Profile Completed :');


                if (userProfile.consent.isTermsAccepted) {
                    if (stateManager.isKYCCompleted()) {

                    } else {}

                } else {}
            } else {
                log('Profile Not Completed :');
                $location.path("/profile-complete");

                log('Profile Not Completed');
                $scope.messageModal = new bootstrap.Modal(document.getElementById("messageModal"), {});
                //var toast = document.getElementById('successToast');
                //$scope.toastSuccess = new bootstrap.Toast(toast);
                $scope.message.header = 'Profile Not Complete';
                $scope.message.content = 'Profile Page is currently unavailable.Complete Onboarding First';
                $scope.messageModal.show();
            }
        } else {
            $timeout(function() {
                log('Not Logged :');
                $scope.initLoginMobile();

                $scope.otpModal = new bootstrap.Modal(document.getElementById("otpModal"), {});
                var toast = document.getElementById('successToast');
                $scope.toastSuccess = new bootstrap.Toast(toast);

            })

        }
    });


    $scope.gotoOnboarding = function() {
        $scope.messageModal.hide();
        $location.path("profile/complete");

    }


    $scope.initLoginMobile = function() {
        const input = document.getElementById("loginMobileNumber");
        //input.className = "text-input text-input--material";
        log(input);
        $scope.iti = window.intlTelInput(input, {
            formatOnDisplay: true,
            nationalMode: true,
            initialCountry: 'in',
            onlyCountries: ['in'],
            placeholderNumberType: 'MOBILE',
            showFlags: false,
            separateDialCode: false,
            strictMode: false,
            useFullscreenPopup: true,
            autoPlaceholder: 'aggressive',
            placeHolder: "Mobile Number"
        });
        $scope.iti.setCountry("in");
    }




    $scope.resendOTP = function() {

        log($scope.iti.getNumber());
        log($scope.iti.isValidNumber());
        if ($scope.iti.isValidNumber()) {
            $scope.loaderLogin.show();
            $scope.NavProgress = true;
            authentication.generateOTP($scope.iti.getNumber())
                .then(function(resp) {
                    warn('Generate OTP :');
                    $scope.loaderLogin.hide();
                    log(resp);
                    $scope.NavProgress = false;

                    warn(resp.data.message);
                    if (resp.data.status && resp.data.isOTPSuccess) {} else {
                        alert(resp.data.message);
                    }
                });

        } else {
            alert('Only mobile number is supported');
        }
    }


    $scope.generateOTP = function() {


        log($scope.iti.getNumber());
        log($scope.iti.isValidNumber());

        if ($scope.iti.isValidNumber()) {

            $scope.NavProgress = true;
            authentication.generateOTP($scope.iti.getNumber())
                .then(function(resp) {
                    warn('Generate OTP :');
                    log(resp);
                    $scope.NavProgress = false;

                    warn(resp.data.message);
                    if (resp.data.status && resp.data.isOTPSuccess) {

                        $scope.otpModal.show();
                        log('OTP Successfully Generated And Sent To Mobile Number On WhatsApp', { timeout: 4000 });
                    } else {
                        alert(resp.data.message);
                    }
                });

        } else {
            alert('Only mobile number is supported');
        }
    };


    $scope.cancelOTP = function() {

        if ($scope.timeoutVairable) {
            warn('Timeout Cleared:');
            clearTimeout($scope.timeoutVairable);
        }
        log($scope.request_id);
        authentication.cancelOTPRequestNexmo($scope.request_id).then(function(respOTPCancel) {
            counterDialog.hide();
            warn('OTP Cancelled Resonse : ');
            log(respOTPCancel);

        });
    }



    $scope.validateOTP = function(otp1, otp2, otp3, otp4, otp5, otp6) {
        log(otp1, otp2, otp3, otp4, otp5, otp6);
        var otp = otp1 + otp2 + otp3 + otp4 + otp5 + otp6;
        warn('OTP List :');
        log(otp);
        log($scope.iti.getNumber());
        if ($scope.iti.isValidNumber() && otp.length == 6) {
            authentication.validateOTP($scope.iti.getNumber(), otp)
                .then(function(resp) {
                    log(resp);

                    if (resp.data.status && resp.data.otpVerified) {
                        $scope.otpModal.hide();
                        warn("Update Status :");
                        log(resp);
                        var userProfile = resp.data.data;
                        const state = stateManager.getProfile();
                        stateManager.saveProfile(resp.data.data);
                        stateManager.saveAccessToken(resp.data.access_token);
                        $scope.otpModal.hide();

                        if (userProfile.isProfileCompleted) {
                            $location.path("/home");
                        } else {

                            log('Profile Not Completed');
                            $location.path("profile/complete");

                        }

                    } else {
                        alert(resp.data.message);
                    }

                });
        } else {
            alert('OTP Param Missing');

        }

    }




    function generateRequestId() {
        const alphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
        const idLength = 21;
        let id = '';

        // Create a typed array of random values
        const randomValues = new Uint8Array(idLength);
        crypto.getRandomValues(randomValues);

        // Build the ID string
        for (let i = 0; i < idLength; i++) {
            id += alphabet[randomValues[i] % alphabet.length];
        }

        return id;
    }





}])