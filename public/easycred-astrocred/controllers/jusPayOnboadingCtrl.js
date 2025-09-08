app.controller('jusPayOnboadingCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'juspay', function($scope, $rootScope, $timeout, stateManager, juspay) {
    $timeout(function() {

        $scope.profile = stateManager.getProfile();
        $scope.juspay = {};
        $scope.juspay.dob = createDateFromDDMMYYYY($scope.profile.kyc.pancard.date_of_birth);
        $scope.juspay.pan = $scope.profile.kyc.pancard.pan_card;
        $scope.juspay.phone = $scope.profile.profile_info.mobile;
        $scope.juspay.email = $scope.profile.profile_info.email;

        $scope.juspay.employmentType = "SALARIED";

        $scope.monthlyIncome = 18000;
        $scope.isEdit = $scope.myNavigator.topPage.data.isEdit || false;
        warn('IS EDIT : ' + $scope.isEdit);
        if ($scope.isEdit) {
            $scope.juspay = $scope.profile.juspay_profile;
        }

    });


    function createDateFromDDMMYYYY(dateString) {
        const parts = dateString.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);

        return new Date(year, month, day);
    }

    $scope.completeJusPayProfile = function(juspay_profile) {
        $scope.juspayLoader.show();

        if (!$scope.isEdit) {
            $scope.juspay.dob = $scope.juspay.dob.toISOString().substring(0, 10);
        }
        log(juspay_profile);

        juspay.completeProfile($scope.profile.profile, juspay_profile)
            .then(function(resp) {
                $scope.juspayLoader.hide();
                warn('JUSPAY PROFILE COMPLETED :');
                log(resp)

                if (resp.data.status && resp.data.isSuccess) {

                    stateManager.saveProfile(resp.data.data);
                    $rootScope.$emit('updated-profile', { data: resp.data });
                    ons.notification.alert('Successfully updated. Now you can apply for a Personal/Consumer Loan')
                        .then(function() {
                            $scope.myNavigator.popPage();
                        });
                } else {
                    ons.notification.alert(resp.data.message);
                }

            });
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