app.controller('profileCompletionCtrl', ['$location', '$timeout', '$scope', 'stateManager', '$rootScope', 'profileOperations', 'utility', function($location, $timeout, $scope, stateManager, $rootScope, profileOperations, utility) {

    $timeout(function() {
        warn('Init profileCompletionCtrl Ready');

        $scope.currentStep = 1;
        $scope.isComplete = false;
        $scope.isSubmitting = false;

        // Set max DOB date (18 years ago)
        const today = new Date();
        $scope.maxDOBDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
            .toISOString().split('T')[0];

        // Initialize profile object

        // Initialize consent


        // Initialize documents
        $scope.panDocument = { file: null };
        $scope.aadhaarDocument = { file: null };
        $scope.selfieDocument = { file: null };

        // Initialize errors
        $scope.errors = {};

        if (stateManager.isUserLogggedIn()) {
            $scope.profile = {};
            $scope.profile.profile_info = {};
            $scope.profile.props = {};
            $scope.profile.kyc = {};



            // $scope.profile.consent = {
            //     terms: false,
            //     aadhaar: false,
            //     pan: false
            // };

            $scope.profile = stateManager.getProfile();

            $scope.profile.consent = {};
            $scope.profile.consent.terms = false;
            $scope.profile.consent.aadhaar = false;
            $scope.profile.consent.pan = false;
            $scope.profile.communication = {};


            log('User Profile :');
            log($scope.profile);
            if (stateManager.isUserLogggedIn()) {
                // Initialize on load
                if (stateManager.isProfileCompleted()) {
                    log('Profile Complete');
                    $location.path("home");
                } else {
                    log('Profile Not Complete');
                    $scope.initLoginMobile();
                }
            } else {
                log('Not Logged In');
                stateManager.clearLocalStorage();
                $location.path("login");

            }

        } else {
            stateManager.clearLocalStorage();
            $location.path("/login");
        }
    });


    $scope.initLoginMobile = function() {
        const input = document.getElementById("mobileNumber");
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

    // Navigation
    $scope.goToStep = function(step) {
        $scope.currentStep = step;
        $scope.errors = {};
    };

    // File input trigger
    $scope.triggerFileInput = function(inputId) {
        document.getElementById(inputId).click();
    };

    // Validation functions
    $scope.validateEmail = function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    $scope.validateMobile = function(mobile) {
        return /^[6-9]\d{9}$/.test(mobile);
    };

    $scope.validateDOB = function(dob) {
        const dobDate = new Date(dob);
        const today = new Date();
        const age = today.getFullYear() - dobDate.getFullYear();
        return age >= 18;
    };

    $scope.validatePincode = function(pincode) {
        return /^\d{6}$/.test(pincode);
    };

    $scope.validatePAN = function(pan) {
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
    };

    $scope.validateAadhaar = function(aadhaar) {
        return /^\d{12}$/.test(aadhaar);
    };


    // Step validations
    $scope.validateStep1 = function() {
        $scope.errors = {};

        if (!$scope.profile.profile_info.fullname || $scope.profile.profile_info.fullname.length < 2) {
            $scope.errors.fullname = 'Please enter a valid full name';
        }

        if (!$scope.profile.profile_info.email || !$scope.validateEmail($scope.profile.profile_info.email)) {
            $scope.errors.email = 'Please enter a valid email address';
        } else {
            $scope.profile.profile_info.isEmailAdded = true;
        }

        if (!$scope.profile.profile_info.mobile || !$scope.validateMobile($scope.profile.profile_info.mobile)) {
            $scope.errors.mobile = 'Please enter a valid 10-digit mobile number';
        } else {
            $scope.profile.profile_info.isMobileAdded = true;
        }

        if (!$scope.profile.profile_info.date_of_birth || !$scope.validateDOB($scope.profile.profile_info.date_of_birth)) {
            $scope.errors.date_of_birth = 'You must be at least 18 years old';
        }

        if (!$scope.profile.profile_info.gender) {
            $scope.errors.gender = 'Please select your gender';
        }

        if (!$scope.profile.profile_info.maritalStatus) {
            $scope.errors.maritalStatus = 'Please select marital status';
        }

        if (!$scope.profile.profile_info.employmentType) {
            $scope.errors.employmentType = 'Please select employment type';
        }

        if (!$scope.profile.profile_info.monthlyIncome) {
            $scope.errors.monthlyIncome = 'Please select monthly income range';
        }



        if (Object.keys($scope.errors).length === 0) {
            $scope.profile.isProfileCompleted = true;
            $scope.goToStep(2);
        }
    };

    $scope.validateStep2 = function() {
        $scope.errors = {};

        if (!$scope.profile.props.addressLine1 || $scope.profile.props.addressLine1.length < 5) {
            $scope.errors.addressLine1 = 'Please enter a valid address';
        }

        if (!$scope.profile.props.city || $scope.profile.props.city.length < 2) {
            $scope.errors.city = 'Please enter a valid city name';
        }

        if (!$scope.profile.props.state) {
            $scope.errors.state = 'Please select your state';
        }

        if (!$scope.profile.props.pincode || !$scope.validatePincode($scope.profile.props.pincode)) {
            $scope.errors.pincode = 'Please enter a valid 6-digit pincode';
        }

        if (!$scope.profile.props.country) {
            $scope.errors.country = 'Please select your country';
        }

        if (Object.keys($scope.errors).length === 0) {
            $scope.goToStep(3);
        }
    };


    $scope.validateStep3 = function() {
        $scope.errors = {};



        if (!$scope.profile.kyc.pan_number || !utility.validatePANCard($scope.profile.kyc.pan_number)) {
            $scope.errors.pan_number = 'Please enter a valid PAN number';
        } else {
            $scope.profile.kyc.isPanVerified = true;
        }

        if (!$scope.profile.kyc.aadhaar_number || !utility.validateAadharNumber($scope.profile.kyc.aadhaar_number)) {
            $scope.errors.aadhaar_number = 'Please enter a valid 12-digit Aadhaar number';
        } else {
            $scope.profile.kyc.isAadharVerified = true;
        }

        if ($scope.profile.kyc.isPanVerified && $scope.profile.kyc.isAadharVerified) {
            $scope.profile.kyc.isKYCCompleted = true;
        } else {
            $scope.profile.kyc.isKYCCompleted = false;
        }

        if (Object.keys($scope.errors).length === 0) {
            $scope.goToStep(4);
        }
    };

    // Final submission
    $scope.submitProfile = function() {
        $scope.errors = {};
        log($scope.profile.consent);
        if (!$scope.profile.consent.terms) {
            $scope.errors.terms = 'You must accept the Terms of Service';
        }

        if (!$scope.profile.consent.aadhaar) {
            $scope.errors.aadhaarConsent = 'Aadhaar consent is required for KYC verification';
        }

        if (!$scope.profile.consent.pan) {
            $scope.errors.panConsent = 'PAN consent is required for financial verification';
        }

        if (Object.keys($scope.errors).length > 0) {
            return;
        } else {
            // Simulate API call
            if ($scope.validateEmail($scope.profile.profile_info.email) && $scope.validateMobile($scope.profile.profile_info.mobile) && $scope.validateDOB($scope.profile.profile_info.date_of_birth) && $scope.validatePincode($scope.profile.props.pincode)) {
                $scope.profile.profile_info.isProfileCompleted = true;
                $scope.profile.isOnboardingComplete = true;

                $timeout(function() {
                    $scope.isSubmitting = true;
                    $scope.isComplete = false;
                    profileOperations.completeOnboarding($scope.profile)
                        .then(function(resp) {
                            warn('completeOnboarding :');
                            log(resp);
                            stateManager.saveProfile(resp.data.data);
                            $scope.isSubmitting = false;
                            $scope.isComplete = true;
                            log('Profile submitted:', $scope.isComplete);
                        });
                });
            } else {
                alert('Profile Such Email/Mobile/Address Is Not Valid');
            }


        }
    };

    $scope.goToDashboard = function() {
        alert('Redirecting to dashboard...');
        // In real app: window.location.href = '#/dashboard';
    };




}]);