app.controller('aadharVerifyCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'sandbox', 'kyc', function($scope, $rootScope, $timeout, stateManager, sandbox, kyc) {



    $timeout(function() {

        $scope.profile = stateManager.getProfile();
        // $scope.loaderAadhar.show();
        $scope.disableAadhar = false;
        warn('Is Aadhar Verified :');
        log($scope.profile);
        $scope.verifyInit(false);


        // $rootScope.$on('loader_show', function(event, data) {
        //     warn('Loader Show');
        //     $scope.loaderAadhar.show();
        // });

        // $rootScope.$on('loader_hide', function(event, data) {
        //     warn('loader_hide Show');
        //     $scope.loaderAadhar.hide();

        // });

        $rootScope.$on('request_error', function(event, data) {
            error('request_error');
            $scope.loaderAadhar.hide();

        });
    });



    $scope.verifyInit = function(isReload, $done) {



        $scope.aadhaar_number = $scope.replace($scope.profile.kyc.aadhar.aadhar_card);
        if ($scope.profile.kyc.isAadharVerified) {
            ons.notification.toast('Aadhar Verified', { timeout: 2000 });
        } else {
            $scope.generateDialog.show();
            ons.notification.toast('Aadhar Not Verified', { timeout: 2000 });
        }

        if (isReload) {
            $done();
        }
    }

    $scope.replace = function(str) {
        const len = str.length,
            output = []

        for (let i = 0; i < len; i += 4) {
            output.push(
                str.slice(i, i + 4)
                .padStart(i + 4)
                .padEnd(len)
            )
        }

        var digit = output[0].replaceAll(/\s/g, '') + "  " + output[1].replaceAll(/\s/g, '') + "  " + output[2].replaceAll(/\s/g, '');
        return digit;

    }

    $scope.generateOTP = function() {
        $scope.validateDialog.hide();
        $scope.loaderAadhar.show();
        $scope.disableAadhar = true;
        sandbox.initAadharVerification($scope.profile.kyc.aadhar.aadhar_card)
            .then(function(resp) {
                $scope.loaderAadhar.hide();
                warn('AAdhar Response :');
                log(resp);
                if (resp.data && resp.data.aadhar && resp.data.aadhar.code == 200) {
                    $scope.aadhaarResponse = resp.data;
                    ons.notification.toast('OTP Successfully Sent On Your Registered Mobile Number', { timeout: 2000 });
                    $scope.validateDialog.show();
                    $scope.generateDialog.hide();
                } else {
                    ons.notification.toast('OTP Not Sent Your Registered Mobile Number', { timeout: 2000 });
                    $scope.disableAadhar = false;


                }
                log($scope.aadhaarResponse);

            });
    }

    $scope.closeValidateDialog = function() {
        if ($scope.profile.kyc.isAadharVerified) {
            ons.notification.toast('Aadhar Verified', { timeout: 2000 });
        } else {
            $scope.generateDialog.show();
            $scope.validateDialog.hide();
            $scope.disableAadhar = false;
            ons.notification.toast('Aadhar Not Verified', { timeout: 2000 });

        }
    }

    $scope.verifyAadharOTP = function(otp) {
        warn('OTP :');
        log(otp);

        log(otp);
        if (otp && otp != undefined) {
            $scope.validateDialog.hide();
            log("reference_id " + $scope.aadhaarResponse.aadhar.data.reference_id);
            log("otp : " + otp);

            sandbox.validateAadharOTP(otp, $scope.aadhaarResponse.aadhar.data.reference_id)
                .then(function(resp) {
                    warn('AAdhar validateAadharOTP Response :');
                    log(resp);

                    if (resp.data && resp.data.aadhar && resp.data.aadhar.status_code == 200 && resp.data.aadhar.isVerified) {
                        $scope.aadhaarValidated = resp.data;
                        ons.notification.toast('Aadhar Number Successfully Validated', { timeout: 2000 });
                        log($scope.aadhaarValidated);
                        //$scope.profile.kyc.isAadharVerified = $scope.aadhaarValidated.aadhar.isVerified;
                        $scope.updateVerifiedAadhar(resp.data);
                    } else {
                        ons.notification.alert('Not Able To Validate Aadhar Number As Error Occcured');
                        $scope.disableAadhar = false;
                        $scope.generateDialog.show();

                    }




                });
        } else {
            ons.notification.toast('OTP Is Required.Please Generate An OTP', { timeout: 2000 });

        }

    }
    $scope.updateVerifiedAadhar = function(aadhar) {
        kyc.updateVerifiedAadhar($scope.profile.profile, aadhar)
            .then(function(resp) {
                warn('Updated Aadhar Card Verified :');
                log(resp);
                if (resp.data && resp.data.isVerified) {
                    $scope.profile = resp.data.data;
                    stateManager.saveProfile(resp.data.data);
                    $rootScope.$emit('updated-kyc', { data: resp.data });
                    $scope.myNavigator.popPage();
                    ons.notification.toast('Aadhar Number Successfully Updated', { timeout: 2000 });

                } else {
                    ons.notification.toast('Aadhar Number Cannot Be Updated.Some Error Occured.Please Try Again', { timeout: 2000 });
                    $scope.generateDialog.show();
                }
            });
    }

    $scope.goBack = function() {
        $scope.disableAadhar = false;
        $scope.generateDialog.hide();
        $scope.myNavigator.popPage();
    }

    $scope.reload = function($done) {
        ons.notification.toast('reload Is done in gold/silver', { timeout: 2000 });
        $scope.verifyInit(true, $done);

    }


}])