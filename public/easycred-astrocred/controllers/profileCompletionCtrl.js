app.controller('profileCompletionCtrl', ['$location', '$timeout', '$scope', 'stateManager', '$rootScope', 'profileOperations', 'utility', 'surePass', 'cibilCore', function($location, $timeout, $scope, stateManager, $rootScope, profileOperations, utility, surePass, cibilCore) {

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

    $scope.fetchPANFromMobile = function(mobile, fullname) {
        warn('fetchPANFromMobile :');
        surePass.getPanFromMobile(mobile, fullname)
            .then(function(resp) {
                warn('getPanFromMobile :');
                log(resp);
            });
    };

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

        // if (!$scope.profile.profile_info.date_of_birth || !$scope.validateDOB($scope.profile.profile_info.date_of_birth)) {
        //     $scope.errors.date_of_birth = 'You must be at least 18 years old';
        // }

        // if (!$scope.profile.profile_info.gender) {
        //     $scope.errors.gender = 'Please select your gender';
        // }

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
            warn('No Error Found. Move To Next Step');
            $scope.profile.isProfileCompleted = true;
            surePass.getPanFromMobile($scope.profile.mobile, $scope.profile.profile_info.fullname)
                .then(function(resp) {
                    warn('getPanFromMobile :');
                    log(resp);
                    $scope.profile.kyc.pan_number = resp.data.data.pan_number;
                    $scope.profile.kyc.aadhaar_seeding_status = resp.data.data_advance.aadhaar_seeding_status;
                    $scope.profile.kyc.pan_advance = resp.data.data_advance;
                    $scope.profile.kyc.aadhaar_number_masked = resp.data.data_advance.pan_details.masked_aadhaar;
                    $scope.profile.kyc.aadhaar_linked = resp.data.data_advance.pan_details.aadhaar_linked;
                    $scope.profile.kyc.father_name = resp.data.data_advance.pan_details.father_name;
                    $scope.profile.kyc.dob_verified = resp.data.data_advance.pan_details.dob_verified;
                    //
                    $scope.profile.account.category = resp.data.data_advance.pan_details.category;
                    //
                    $scope.profile.profile_info.date_of_birth = resp.data.data_advance.pan_details.dob;

                    if (resp.data.data_advance.pan_details.gender == 'M') {
                        $scope.profile.profile_info.gender = "MALE";
                    } else if (resp.data.data_advance.pan_details.gender == 'F') {
                        $scope.profile.profile_info.gender = "FEMALE";
                    } else {
                        $scope.profile.profile_info.gender = "OTHER";
                    }

                    $scope.profile.kyc.isPanVerified = true;
                    warn('Final Profile Before Step 2 :');
                    log($scope.profile);
                    $scope.goToStep(2);
                });
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
        //if (!$scope.profile.kyc.aadhaar_number || !utility.validateAadharNumber($scope.profile.kyc.aadhaar_number)) {

        if (!$scope.profile.kyc.aadhaar_number_masked) {
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

    // Final submission with CIBIL fetch
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
        }
        
            warn('Final Profile :');
            log($scope.profile);
        
        // Validate basic fields
        if (!$scope.validateEmail($scope.profile.profile_info.email) || 
            !$scope.validateMobile($scope.profile.profile_info.mobile) || 
            !$scope.validateDOB($scope.profile.profile_info.date_of_birth) || 
            !$scope.validatePincode($scope.profile.props.pincode)) {
            alert('Profile validation failed. Please check Email/Mobile/Address.');
            return;
        }

                $scope.profile.profile_info.isProfileCompleted = true;
                $scope.profile.isOnboardingComplete = true;
                $scope.isSubmitting = true;
                $scope.isComplete = false;
        $scope.isFetchingCIBIL = false;
        $scope.cibilFetchError = null;

        // Step 1: Complete profile onboarding
                profileOperations.completeOnboarding($scope.profile)
                    .then(function(resp) {
                warn('completeOnboarding Success:');
                        log(resp);
                        stateManager.saveProfile(resp.data.data);
                $scope.profile = resp.data.data;
                
                // Step 2: Fetch CIBIL score (if consent given)
                if ($scope.profile.consent.pan && $scope.profile.consent.aadhaar) {
                    $scope.isFetchingCIBIL = true;
                    $scope.cibilStatus = 'Fetching your credit score...';
                    
                    return $scope.fetchCIBILScore();
                } else {
                        $scope.isSubmitting = false;
                        $scope.isComplete = true;
                    return Promise.resolve({ skipped: true });
                }
            })
            .then(function(cibilResult) {
                $scope.isSubmitting = false;
                $scope.isFetchingCIBIL = false;
                $scope.isComplete = true;
                
                if (cibilResult && !cibilResult.skipped) {
                    $scope.cibilFetched = true;
                    $scope.cibilScore = cibilResult.credit_score;
                    $scope.cibilGrade = cibilResult.overallGrade?.grade || 'N/A';
                }
                
                log('Profile and CIBIL completed:', $scope.isComplete);
            })
            .catch(function(err) {
                $scope.isSubmitting = false;
                $scope.isFetchingCIBIL = false;
                $scope.cibilFetchError = err.message || 'Failed to fetch credit score';
                warn('Error in profile completion:', err);
                
                // Still mark as complete - user can retry CIBIL fetch later
                $scope.isComplete = true;
            });
    };

    // Fetch CIBIL score using SurePass
    $scope.fetchCIBILScore = function() {
        return new Promise(function(resolve, reject) {
            // Use the CIBIL service to fetch from SurePass
            var params = {
                mobile: $scope.profile.profile_info.mobile || $scope.profile.mobile,
                fullname: $scope.profile.profile_info.fullname,
                pan: $scope.profile.kyc.pan_number
            };
            
            warn('Fetching CIBIL with params:', params);
            
            // First try the new POST endpoint
            cibilCore.fetchFromSurePass(params)
                .then(function(response) {
                    log('CIBIL Fetch Response:', response);
                    
                    if (response.data.status) {
                        // Success - store the data
                        var cibilData = response.data.data;
                        $scope.profile.cibil = {
                            credit_score: cibilData.credit_score,
                            fetchedAt: new Date().toISOString(),
                            mode: response.data.mode || 'production'
                        };
                        
                        // Update profile with CIBIL data
                        stateManager.saveProfile($scope.profile);
                        
                        // Now run analysis
                        return cibilCore.getAnalysis({
                            pan: params.pan,
                            mobile: params.mobile
                    });
            } else {
                        throw new Error(response.data.message || 'CIBIL fetch failed');
                    }
                })
                .then(function(analysisResp) {
                    log('CIBIL Analysis:', analysisResp);
                    resolve(analysisResp.data.data || { credit_score: $scope.profile.cibil?.credit_score });
                })
                .catch(function(err) {
                    warn('CIBIL Fetch Error:', err);
                    reject(err);
                });
        });
    };

    // Retry CIBIL fetch (for error recovery)
    $scope.retryCIBILFetch = function() {
        $scope.cibilFetchError = null;
        $scope.isFetchingCIBIL = true;
        $scope.cibilStatus = 'Retrying credit score fetch...';
        
        $scope.fetchCIBILScore()
            .then(function(result) {
                $scope.isFetchingCIBIL = false;
                $scope.cibilFetched = true;
                $scope.cibilScore = result.credit_score;
                $scope.cibilGrade = result.overallGrade?.grade || 'N/A';
            })
            .catch(function(err) {
                $scope.isFetchingCIBIL = false;
                $scope.cibilFetchError = err.message || 'Failed to fetch credit score. Please try again.';
            });
    };

    $scope.goToDashboard = function() {
        log('Redirecting to dashboard...');
        // In real app: window.location.href = '#/dashboard';
        $timeout(function() {
            $location.path("home");
        }, 500);
    };




}]);