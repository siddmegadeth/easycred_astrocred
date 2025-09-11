app.controller('loginCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'authentication', '$window', function($scope, $rootScope, $timeout, stateManager, authentication, $window) {


    // $rootScope.$on('request_error', function(event, data) {
    //     error('request_error');
    //     $scope.loader.hide();

    // });
    //$scope.dialog.show();
    $timeout(function() {}, 300);

    window.onload = function() {
        warn('Init loginCtrl Ready');

        if (stateManager.isUserLogggedIn()) {
            var userProfile = stateManager.getProfile();
            log('User Profile :');
            log(userProfile);

            if (stateManager.isProfileCompleted()) {
                log('Profile Completed :');


                if (userProfile.consent.isTermsAccepted) {
                    if (stateManager.isKYCCompleted()) {

                    } else {}

                } else {
                    //$scope.myNavigator.resetToPage('terms.html', {});
                }
            } else {
                log('Profile Not Completed :');
                // $location.path("/profile-complete");
                //$scope.myNavigator.resetToPage('profile-complete.html', {});
            }
        } else {
            $timeout(function() {
                $scope.initLoginMobile();
            }, 300)

        }

    };



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




    $scope.initCounter = function() {
        $scope.timeLeft = 30;
        var timerId = setInterval(countdown, 1000);

        function countdown() {
            $timeout(function() {
                if ($scope.timeLeft == 0) {
                    clearTimeout(timerId);
                    // doSomething();
                } else {
                    log($scope.timeLeft + ' seconds remaining');
                    $scope.timeLeft--;
                }
            })
        }
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
                    if (resp.data.status && resp.data.isOTPSuccess) {
                        ons.notification.toast('Successfully Sent OTP', {
                            cancelable: true,
                            animation: 'ascend',
                            timeout: 4000
                        });
                    } else {
                        ons.notification.alert(resp.data.message);
                    }
                });

        } else {
            ons.notification.alert('Only mobile number is supported');
        }
    }


    $scope.generateOTP = function() {


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
                    if (resp.data.status && resp.data.isOTPSuccess) {
                        ons.notification.toast('Successfully Sent OTP', {
                            cancelable: true,
                            animation: 'ascend',
                            timeout: 4000
                        });
                        $scope.openOTPModal();
                        $scope.initCounter();
                        ons.notification.toast('OTP Successfully Generated And Sent To Mobile Number On WhatsApp', { timeout: 4000 });
                    } else {
                        ons.notification.alert(resp.data.message);
                    }
                });

        } else {
            ons.notification.alert('Only mobile number is supported');
        }
    };

    $scope.openOTPModal = function() {
        warn('Opening OTP Modal');
        $scope.dialog.show();
    }

    $scope.closeOTP = function() {
        $scope.dialog.hide();
    }


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
            $scope.loaderLogin.show();
            authentication.authenticateWABusinessOtp($scope.iti.getNumber(), otp)
                .then(function(resp) {
                    log(resp);
                    $scope.loaderLogin.hide();

                    if (resp.data.status && resp.data.otpVerified) {
                        ons.notification.toast("OTP Successfully Verified", { timeout: 2000 });
                        warn("Update Status :");
                        log(resp);
                        const state = stateManager.getProfile();
                        var userProfile = resp.data.data;
                        stateManager.saveProfile(resp.data.data);
                        stateManager.saveAccessToken(resp.data.access_token);

                        if (userProfile.consent.isTermsAccepted) {

                            if (userProfile.isProfileCompleted) {


                                if (userProfile.fullname) {
                                    ons.notification.toast('Welcome ' + userProfile.fullname || 'User', { timeout: 5000 });
                                } else {
                                    ons.notification.toast('Welcome ', { timeout: 5000 });
                                }
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
                                $scope.myNavigator.resetToPage('profile-complete.html', {});
                            }

                        } else {
                            $scope.myNavigator.resetToPage('terms.html', {});
                        }

                    } else {
                        ons.notification.alert(resp.data.message);

                    }

                });
        } else {
            ons.notification.alert('OTP Param Missing');

        }

    }


    $scope.gotoLogin = function() {
        stateManager.clearLocalStorage();
        clearTimeout($scope.timeoutVairable);
        $scope.myNavigator.resetToPage('login.html', {
            animation: window.onsenAnimation.lift
        });
    }




    // OTP handling
    $scope.otp1 = $scope.otp2 = $scope.otp3 = $scope.otp4 = $scope.otp5 = $scope.otp6 = '';

    $scope.getFullOTP = function() {
        return $scope.otp1 + $scope.otp2 + $scope.otp3 + $scope.otp4 + $scope.otp5 + $scope.otp6;
    };

    $scope.handleKeyDown = function(index, event) {
        var key = event.key;
        var otpBoxes = document.querySelectorAll('.otp-box');

        // Handle backspace
        if (key === 'Backspace') {
            // Clear current box if empty and move to previous
            if (!otpBoxes[index - 1].value && index > 1) {
                $timeout(function() {
                    otpBoxes[index - 2].focus();
                });
            }
            return;
        }

        // Allow only numeric keys
        if (!/^[0-9]$/.test(key)) {
            event.preventDefault();
            return;
        }

        // Auto move to next box when a digit is entered
        $timeout(function() {
            if (index < 6 && otpBoxes[index - 1].value) {
                otpBoxes[index].focus();
            }
            $scope.otp = $scope.getFullOTP();
        });
    };

    $scope.handlePaste = function(event) {
        event.preventDefault();
        var pasteData = event.clipboardData.getData('text/plain').trim();

        if (/^\d{6}$/.test(pasteData)) {
            var otpBoxes = document.querySelectorAll('.otp-box');
            for (var i = 0; i < 6; i++) {
                $scope['otp' + (i + 1)] = pasteData[i];
                otpBoxes[i].value = pasteData[i];
            }
            $scope.otp = pasteData;
            otpBoxes[5].focus();
        }
    };

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



    document.addEventListener('DOMContentLoaded', function() {
        const inputs = document.querySelectorAll('.otp-input');
        const form = document.getElementById('otp-form');
        const resend = document.getElementById('resend');
        const timer = document.querySelector('.timer');

        let countdown = 60;

        // Focus management for OTP inputs
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                const nextIndex = parseInt(this.dataset.index) + 1;

                if (this.value.length === 1 && nextIndex < inputs.length) {
                    inputs[nextIndex].focus();
                }

                // Update filled state
                if (this.value !== '') {
                    this.classList.add('filled');
                } else {
                    this.classList.remove('filled');
                }
            });

            input.addEventListener('keydown', function(e) {
                const currentIndex = parseInt(this.dataset.index);

                if (e.key === 'Backspace' && this.value === '' && currentIndex > 0) {
                    inputs[currentIndex - 1].focus();
                }
            });
        });

        // Form submission
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            let otp = '';
            inputs.forEach(input => {
                otp += input.value;
            });

            if (otp.length === 6) {
                // Show loading state
                const button = form.querySelector('button');
                button.classList.add('is-loading');

                // Simulate verification process
                setTimeout(() => {
                    button.classList.remove('is-loading');
                    alert(`OTP ${otp} verified successfully!`);
                    // Here you would typically redirect or proceed with the verified user
                }, 1500);
            } else {
                alert('Please enter a complete 6-digit code');
            }
        });

        // Resend countdown timer
        function updateTimer() {
            timer.textContent = countdown;

            if (countdown > 0) {
                countdown--;
                setTimeout(updateTimer, 1000);
            } else {
                resend.innerHTML = 'Resend code';
                resend.classList.add('has-text-primary');
            }
        }

        // Initial timer start
        updateTimer();

        // Resend functionality
        resend.addEventListener('click', function() {
            if (countdown === 0) {
                // Reset timer
                countdown = 60;
                updateTimer();

                // Simulate sending a new code
                alert('A new verification code has been sent to your email.');

                // Clear existing inputs
                inputs.forEach(input => {
                    input.value = '';
                    input.classList.remove('filled');
                });

                // Focus on first input
                inputs[0].focus();
            }
        });
    });






}])