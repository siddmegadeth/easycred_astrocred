app.controller('profileCompletionCtrl', ['$location', '$timeout', '$scope', 'stateManager', '$rootScope', function($location, $timeout, $scope, stateManager, $rootScope) {

    $timeout(function() {
        warn('Init profileCompletionCtrl Ready');

        $scope.currentStep = 1;
        $scope.isComplete = false;
        $scope.isSubmitting = false;
        $scope.applicationId = 'APP' + Date.now().toString().slice(-8);

        // Set max DOB date (18 years ago)
        const today = new Date();
        $scope.maxDOBDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
            .toISOString().split('T')[0];

        // Initialize profile object
        $scope.profile = {
            fullname: '',
            email: '',
            mobile: '',
            dob: '',
            gender: '',
            maritalStatus: '',
            employmentType: '',
            monthlyIncome: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India',
            countryCode: '+91',
            panNumber: '',
            aadhaarNumber: '',
            emailUpdates: true,
            smsUpdates: true
        };

        // Initialize consent
        $scope.consent = {
            terms: false,
            aadhaar: false,
            pan: false
        };

        // Initialize documents
        $scope.panDocument = { file: null };
        $scope.aadhaarDocument = { file: null };
        $scope.selfieDocument = { file: null };

        // Initialize errors
        $scope.errors = {};

        if (stateManager.isUserLogggedIn()) {
            $scope.profile = stateManager.getProfile();
            log('User Profile :');
            log($scope.profile);
            window.onload = function() {
                // Initialize on load
                $scope.initializeProfile();
            }
        } else {
            stateManager.clearLocalStorage();
            $location.path("/login");
        }
    });



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

    $scope.validateFile = function(file, maxSizeMB = 2) {
        if (!file) return false;
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        const maxSize = maxSizeMB * 1024 * 1024;

        if (!validTypes.includes(file.type)) {
            return 'Invalid file type. Please upload JPG, PNG, or PDF';
        }

        if (file.size > maxSize) {
            return `File too large. Maximum size is ${maxSizeMB}MB`;
        }

        return true;
    };

    // Step validations
    $scope.validateStep1 = function() {
        $scope.errors = {};

        if (!$scope.profile.fullname || $scope.profile.fullname.length < 2) {
            $scope.errors.fullname = 'Please enter a valid full name';
        }

        if (!$scope.profile.email || !$scope.validateEmail($scope.profile.email)) {
            $scope.errors.email = 'Please enter a valid email address';
        }

        if (!$scope.profile.mobile || !$scope.validateMobile($scope.profile.mobile)) {
            $scope.errors.mobile = 'Please enter a valid 10-digit mobile number';
        }

        if (!$scope.profile.dob || !$scope.validateDOB($scope.profile.dob)) {
            $scope.errors.dob = 'You must be at least 18 years old';
        }

        if (!$scope.profile.gender) {
            $scope.errors.gender = 'Please select your gender';
        }

        if (!$scope.profile.maritalStatus) {
            $scope.errors.maritalStatus = 'Please select marital status';
        }

        if (!$scope.profile.employmentType) {
            $scope.errors.employmentType = 'Please select employment type';
        }

        if (!$scope.profile.monthlyIncome) {
            $scope.errors.monthlyIncome = 'Please select monthly income range';
        }

        if (Object.keys($scope.errors).length === 0) {
            $scope.goToStep(2);
        }
    };

    $scope.validateStep2 = function() {
        $scope.errors = {};

        if (!$scope.profile.addressLine1 || $scope.profile.addressLine1.length < 5) {
            $scope.errors.addressLine1 = 'Please enter a valid address';
        }

        if (!$scope.profile.city || $scope.profile.city.length < 2) {
            $scope.errors.city = 'Please enter a valid city name';
        }

        if (!$scope.profile.state) {
            $scope.errors.state = 'Please select your state';
        }

        if (!$scope.profile.pincode || !$scope.validatePincode($scope.profile.pincode)) {
            $scope.errors.pincode = 'Please enter a valid 6-digit pincode';
        }

        if (!$scope.profile.country) {
            $scope.errors.country = 'Please select your country';
        }

        if (Object.keys($scope.errors).length === 0) {
            $scope.goToStep(3);
        }
    };

    // Document validations
    $scope.validatePanDocument = function(file) {
        const result = $scope.validateFile(file);
        if (result === true) {
            $scope.panDocument.file = file;
            $scope.errors.panDocument = null;
        } else {
            $scope.errors.panDocument = result;
        }
    };

    $scope.validateAadhaarDocument = function(file) {
        const result = $scope.validateFile(file);
        if (result === true) {
            $scope.aadhaarDocument.file = file;
            $scope.errors.aadhaarDocument = null;
        } else {
            $scope.errors.aadhaarDocument = result;
        }
    };

    $scope.validateSelfieDocument = function(file) {
        if (!file) return;
        const result = $scope.validateFile(file, 5);
        if (result === true) {
            $scope.selfieDocument.file = file;
            $scope.errors.selfieDocument = null;
        } else {
            $scope.errors.selfieDocument = result;
        }
    };

    $scope.validateStep3 = function() {
        $scope.errors = {};

        if (!$scope.panDocument.file) {
            $scope.errors.panDocument = 'Please upload PAN card document';
        }

        if (!$scope.profile.panNumber || !$scope.validatePAN($scope.profile.panNumber)) {
            $scope.errors.panNumber = 'Please enter a valid PAN number';
        }

        if (!$scope.aadhaarDocument.file) {
            $scope.errors.aadhaarDocument = 'Please upload Aadhaar card document';
        }

        if (!$scope.profile.aadhaarNumber || !$scope.validateAadhaar($scope.profile.aadhaarNumber)) {
            $scope.errors.aadhaarNumber = 'Please enter a valid 12-digit Aadhaar number';
        }

        if (!$scope.selfieDocument.file) {
            $scope.errors.selfieDocument = 'Please upload a selfie for verification';
        }

        if (Object.keys($scope.errors).length === 0) {
            $scope.goToStep(4);
        }
    };

    // Final submission
    $scope.submitProfile = function() {
        $scope.errors = {};

        if (!$scope.consent.terms) {
            $scope.errors.terms = 'You must accept the Terms of Service';
        }

        if (!$scope.consent.aadhaar) {
            $scope.errors.aadhaarConsent = 'Aadhaar consent is required for KYC verification';
        }

        if (!$scope.consent.pan) {
            $scope.errors.panConsent = 'PAN consent is required for financial verification';
        }

        if (Object.keys($scope.errors).length > 0) {
            return;
        }

        $scope.isSubmitting = true;

        // Simulate API call
        $timeout(function() {
            $scope.isSubmitting = false;
            $scope.isComplete = true;

            // In real app, this would be an API call
            console.log('Profile submitted:', $scope.profile);
            console.log('Consent:', $scope.consent);
            console.log('Documents uploaded');
        }, 2000);
    };

    $scope.goToDashboard = function() {
        alert('Redirecting to dashboard...');
        // In real app: window.location.href = '#/dashboard';
    };




}]);