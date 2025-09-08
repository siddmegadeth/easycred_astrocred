app.controller('applyOnBehalfCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'juspay', function($scope, $rootScope, $timeout, stateManager, juspay) {
    $timeout(function() {

        $scope.init();

    });

    $scope.init = function() {
        $scope.profile = stateManager.getProfile();
        $scope.juspay = {};

        $scope.juspay.employmentType = "SALARIED";
        $scope.monthlyIncome = 18000;

        $scope.initLoginMobile();
    }

    $scope.initLoginMobile = function() {
        const input = document.getElementById("behalfMobile");
        //input.className = "text-input text-input--material";
        log(input);
        $scope.iti = window.intlTelInput(input, {
            formatOnDisplay: true,
            nationalMode: true,
            initialCountry: 'in',
            onlyCountries: ['in'],
            placeholderNumberType: 'MOBILE',
            showFlags: true,
            separateDialCode: false,
            strictMode: false,
            useFullscreenPopup: true,
            autoPlaceholder: 'aggressive',
            placeHolder: "Mobile Number"
        });
        $scope.iti.setCountry("in");
    }


    function createDateFromDDMMYYYY(dateString) {
        const parts = dateString.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);

        return new Date(year, month, day);
    }

    $scope.completeJusPayProfile = function(juspay_profile) {

        if ($scope.iti.isValidNumber()) {

            juspay_profile.mobile = $scope.iti.getNumber();
            $scope.juspayLoader.show();
            log(juspay_profile);
            //$scope.juspay.dob = $scope.juspay.dob.toISOString().substring(0, 10);
            log(juspay_profile);


            var sender = {
                profile: $scope.profile.profile,
                email: $scope.profile.profile_info.email,
                mobile: $scope.profile.profile_info.mobile,
                fullname: $scope.profile.profile_info.fullname
            };

            juspay.applyOnBehalf(sender, juspay_profile)
                .then(function(resp) {
                    $scope.juspayLoader.hide();
                    warn('JUSPAY PROFILE ON BEHALF SENT/COMPLETED :');
                    log(resp)

                    if (resp.data.status && resp.data.isSuccess) {

                        ons.notification.alert('Successfully sent a Magic Link to ' + juspay.fullname + '. Now they can apply for a Personal/Consumer Loan using a Magic Link')
                            .then(function() {
                                $scope.init();
                                $scope.myNavigator.popPage();
                            });
                    } else {
                        ons.notification.alert(resp.data.message);
                    }

                });
        } else {
            ons.notification.alert('Mobile Number Is Not Valid')

        }
    };

    $scope.editGender = function(gender) {
        $scope.juspay.gender = gender;
        log($scope.juspay);
    }

    $scope.editMaritalStatus = function(maritalStatus) {
        $scope.juspay.maritalStatus = maritalStatus;
        log($scope.juspay);
    }
    $scope.editemploymentType = function(editemploymentType) {
        $scope.juspay.editemploymentType = editemploymentType;
        log($scope.juspay);
    }
}])