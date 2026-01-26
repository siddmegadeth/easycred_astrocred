app.controller('loginCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'authentication', '$window', '$location', function($scope, $rootScope, $timeout, stateManager, authentication, $window, $location) {

    // Initialize scope variables
    $scope.message = {};
    $scope.isLoading = false;
    $scope.isVerifying = false;
    $scope.isValidPhone = false;
    $scope.phoneLastDigits = '****';
    $scope.mobileNumber = '';

    $timeout(function() {
        warn('Init loginCtrl Ready - Premium UI');

        if (stateManager.isUserLogggedIn()) {
            var userProfile = stateManager.getProfile();
            log('User Profile:', userProfile);

            if (stateManager.isProfileCompleted()) {
                log('Profile Completed - Redirecting to home');
                if (userProfile.consent && userProfile.consent.isTermsAccepted) {
                    $location.path("/home");
                } else {
                    $location.path("/home");
                }
            } else {
                log('Profile Not Completed');
                $scope.messageModal = new bootstrap.Modal(document.getElementById("messageModal"), {});
                $scope.message.header = 'Complete Your Profile';
                $scope.message.content = 'Please complete your profile to access all features.';
                $scope.messageModal.show();
            }
        } else {
            $timeout(function() {
                log('User not logged in - Showing login form');
                $scope.initLoginMobile();
                $scope.otpModal = new bootstrap.Modal(document.getElementById("otpModal"), {});
                $scope.initToasts();
            });
        }
    });

    // Initialize toast notifications
    $scope.initToasts = function() {
        $scope.successToast = {
            show: function() {
                $('#successToast').addClass('show');
                setTimeout(function() {
                    $('#successToast').removeClass('show');
                }, 3000);
            }
        };
        $scope.errorToast = {
            show: function(message) {
                $('#errorMessage').text(message || 'Something went wrong');
                $('#errorToast').addClass('show');
                setTimeout(function() {
                    $('#errorToast').removeClass('show');
                }, 4000);
            }
        };
    };

    $scope.gotoOnboarding = function() {
        $scope.messageModal.hide();
        $location.path("profile/complete");
    };

    $scope.initLoginMobile = function() {
        const input = document.getElementById("loginMobileNumber");
        if (!input) return;
        
        log('Initializing mobile input');
        
        // For the new premium UI, we handle input differently
        // The +91 is shown separately in the UI
        $scope.iti = {
            getNumber: function() {
                return '+91' + ($scope.mobileNumber || input.value.replace(/\D/g, ''));
            },
            isValidNumber: function() {
                var num = input.value.replace(/\D/g, '');
                return num.length === 10;
            },
            getSelectedCountryData: function() {
                return { dialCode: '91', iso2: 'in', name: 'India' };
            }
        };

        // Listen for input changes
        input.addEventListener('input', function(e) {
            var val = e.target.value.replace(/\D/g, '');
            if (val.length > 10) val = val.slice(0, 10);
            e.target.value = val;
            $scope.mobileNumber = val;
            $scope.isValidPhone = val.length === 10;
            $scope.phoneLastDigits = val.length >= 4 ? val.slice(-4) : '****';
            $scope.$apply();
        });
    }




    // Resend OTP with premium feedback
    $scope.resendOTP = function() {
        log('Resending OTP...');
        
        if (!$scope.iti || !$scope.iti.isValidNumber()) {
            $scope.errorToast.show('Invalid mobile number');
            return;
        }

        $scope.isLoading = true;
        var telemetric = { country_code: $scope.iti.getSelectedCountryData() };
        
        authentication.generateOTP($scope.iti.getNumber(), telemetric)
            .then(function(resp) {
                $scope.isLoading = false;
                log('Resend OTP Response:', resp);
                
                if (resp.data.status && resp.data.isOTPSuccess) {
                    // Reset countdown
                    var countdown = 60;
                    $('#countdown').text(countdown);
                    $('#resendTimer').show();
                    $('#resendLink').hide();
                    
                    var timer = setInterval(function() {
                        countdown--;
                        $('#countdown').text(countdown);
                        if (countdown <= 0) {
                            clearInterval(timer);
                            $('#resendTimer').hide();
                            $('#resendLink').fadeIn();
                        }
                    }, 1000);
                } else {
                    $scope.errorToast.show(resp.data.message || 'Failed to resend OTP');
                }
            })
            .catch(function(err) {
                $scope.isLoading = false;
                $scope.errorToast.show('Network error. Please try again.');
            });
    };

    // Generate OTP with premium loading state
    $scope.generateOTP = function() {
        log('Generate OTP clicked');
        
        if (!$scope.iti || !$scope.iti.isValidNumber()) {
            $scope.errorToast.show('Please enter a valid 10-digit mobile number');
            // Add shake animation to input
            $('.astro-input-group').addClass('shake');
            setTimeout(function() {
                $('.astro-input-group').removeClass('shake');
            }, 500);
            return;
        }

        $scope.isLoading = true;
        $scope.NavProgress = true;
        
        var telemetric = { country_code: $scope.iti.getSelectedCountryData() };
        
        authentication.generateOTP($scope.iti.getNumber(), telemetric)
            .then(function(resp) {
                $scope.isLoading = false;
                $scope.NavProgress = false;
                log('Generate OTP Response:', resp);

                if (resp.data.status && resp.data.isOTPSuccess) {
                    // Update progress steps
                    $('.astro-step').eq(0).addClass('completed');
                    $('.astro-step').eq(1).addClass('active');
                    
                    // Show OTP modal
                    $scope.otpModal.show();
                    log('OTP sent successfully');
                } else {
                    $scope.errorToast.show(resp.data.message || 'Failed to send OTP');
                }
            })
            .catch(function(err) {
                $scope.isLoading = false;
                $scope.NavProgress = false;
                log('Generate OTP Error:', err);
                $scope.errorToast.show('Network error. Please check your connection.');
            });
    };

    // Cancel OTP request
    $scope.cancelOTP = function() {
        if ($scope.timeoutVairable) {
            clearTimeout($scope.timeoutVairable);
        }
        if ($scope.request_id) {
            authentication.cancelOTPRequestNexmo($scope.request_id).then(function(resp) {
                log('OTP Cancelled:', resp);
            });
        }
    };

    // Validate OTP with premium feedback
    $scope.validateOTP = function(otp1, otp2, otp3, otp4, otp5, otp6) {
        var otp = (otp1 || '') + (otp2 || '') + (otp3 || '') + (otp4 || '') + (otp5 || '') + (otp6 || '');
        log('Validating OTP:', otp.length + ' digits');

        if (!$scope.iti || !$scope.iti.isValidNumber()) {
            $scope.errorToast.show('Session expired. Please try again.');
            $scope.otpModal.hide();
            return;
        }

        if (otp.length !== 6) {
            $scope.errorToast.show('Please enter complete 6-digit OTP');
            // Shake animation
            $('.astro-otp-inputs').addClass('shake');
            setTimeout(function() {
                $('.astro-otp-inputs').removeClass('shake');
            }, 500);
            return;
        }

        $scope.isVerifying = true;

        authentication.validateOTP($scope.iti.getNumber(), otp)
            .then(function(resp) {
                $scope.isVerifying = false;
                log('Validate OTP Response:', resp);

                if (resp.data.status && resp.data.otpVerified) {
                    // Success animation
                    $('.astro-otp-icon i').removeClass('fa-shield-alt').addClass('fa-check');
                    $('.astro-otp-icon').addClass('success');
                    
                    // Update progress
                    $('.astro-step').eq(1).addClass('completed');
                    $('.astro-step').eq(2).addClass('active');
                    
                    // Save user data
                    var userProfile = resp.data.data;
                    stateManager.saveProfile(userProfile);
                    stateManager.saveAccessToken(resp.data.access_token);
                    
                    // Show success toast
                    $scope.successToast.show();

                    // Redirect after animation
                    $timeout(function() {
                        $scope.otpModal.hide();
                        if (userProfile.isProfileCompleted) {
                            $location.path("/home");
                        } else {
                            $location.path("profile/complete");
                        }
                    }, 1500);

                } else {
                    // Error animation
                    $('.astro-otp-inputs').addClass('shake error');
                    setTimeout(function() {
                        $('.astro-otp-inputs').removeClass('shake error');
                    }, 500);
                    
                    // Clear OTP inputs
                    $('.astro-otp-digit').val('').removeClass('filled');
                    $('.astro-otp-digit').first().focus();
                    
                    $scope.errorToast.show(resp.data.message || 'Invalid OTP. Please try again.');
                }
            })
            .catch(function(err) {
                $scope.isVerifying = false;
                log('Validate OTP Error:', err);
                $scope.errorToast.show('Verification failed. Please try again.');
            });
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