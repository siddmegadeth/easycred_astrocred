app.controller('kycCompleteCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'utility', 'sandbox', 'kyc', function($scope, $rootScope, $timeout, stateManager, utility, sandbox, kyc) {



    $timeout(function() {
        $scope.initPage();
        // $rootScope.$on('request_error', function(event, data) {
        //     error('request_error');
        //     $scope.loaderKYC.hide();

        // });

        // $rootScope.$on('loader_show', function(event, data) {
        //     warn('Loader Show');
        //     $scope.loaderKYC.show();
        // });

        // $rootScope.$on('loader_hide', function(event, data) {
        //     warn('loader_hide Show');
        //     $scope.loaderKYC.hide();


        // });

        // $rootScope.$on('exception-occured', function(event, data) {
        //       warn('kycController exception-occured :');
        //       log(event);
        //       log(data);
        //       $scope.loaderKYC.hide();
        //       $scope.myNavigator.popPage()
        //           .then(function() {
        //               ons.notification.alert("Try Again Later");
        //           });

        //   });

    });

    $scope.initPage = function() {
        warn('Update And Verify KYC :');
        $scope.isEdit = $scope.myNavigator.topPage.data.isEdit || false;
        warn('Is KYC Edit :');
        log($scope.isEdit);

        $scope.kyc = {};
        $scope.kyc.pancard = {};
        $scope.kyc.aadhar = {};
        $scope.kyc.bank_kyc = {};
        log($scope.kyc);
        $scope.profile = stateManager.getProfile();
        log($scope.profile);

        $scope.messageOutput = {};

        $scope.messageOutput.pan = {};
        $scope.messageOutput.pan.isVerified = false;

        $scope.messageOutput.bank = {};
        $scope.messageOutput.bank.isVerified = false;

        $scope.messageOutput.aadhar = {};
        $scope.messageOutput.aadhar.isVerified = false;

        if (!$scope.isEdit) {
            warn('Load KYC In Read Only Format');
            ons.notification.alert('KYC Verification Is Successfully Completed');
            $scope.loadKYCReadOnly();
        }
    }

    $scope.gotoDashboard = function() {
        $scope.myNavigator.resetToPage('dashboard-kyc.html', { animation: 'slide' });

    }


    $scope.loadKYCReadOnly = function() {
        warn('Load KYC Read Only :');
        log($scope.profile.kyc);
        $scope.kyc.pancard.pan_card = $scope.profile.kyc.pancard.pan_card;
        $scope.kyc.pancard.date_of_birth = $scope.profile.kyc.pancard.date_of_birth;
        $scope.kyc.aadhar.aadhar_card = $scope.profile.kyc.aadhar.aadhar_card;
        $scope.kyc.bank_kyc.account_number = $scope.profile.kyc.bank_kyc.account_number;
        $scope.kyc.bank_kyc.ifsc_code = $scope.profile.kyc.bank_kyc.ifsc_code;
        log($scope.kyc);
    }

    $scope.reload = function($done) {
        $done();
    }


    $scope.formatDate = function(format) {
        var today = new Date(format);
        var yyyy = today.getFullYear();
        let mm = today.getMonth() + 1; // Months start at 0!
        let dd = today.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        var formattedToday = dd + '/' + mm + '/' + yyyy;
        warn('formattedToday :');
        log(formattedToday);
        return formattedToday;
    }



    $scope.kycMessagingPAN = function(kyc) {

        warn('KYC Messaging PAN :');
        log(kyc);
        if (kyc.pan.isVerified) {
            if (kyc.pan && kyc.pan.status_code == 200 || kyc.pan.status_code == '200') {
                if (kyc.pan.data.status == 'valid') {
                    if (kyc.pan.data && kyc.pan.data.category == 'individual' && kyc.pan.data.name_as_per_pan_match & kyc.pan.data.date_of_birth_match) {


                        $scope.messageOutput.pan.message = 'PAN Successfully Verified';
                        $scope.messageOutput.pan.isVerified = true;

                        // if (kyc.pan.data.aadhaar_seeding_status == 'na' || kyc.pan.data.aadhaar_seeding_status == 'n') {

                        //     $scope.messageOutput.pan.message = 'Aadhar is Not PAN Linked But Verified';
                        //     $scope.messageOutput.pan.isVerified = true;

                        //     // 
                        //     $scope.messageOutput.aadhar.message = 'Aadhar is Not PAN Linked But Verified';
                        //     $scope.messageOutput.aadhar.isVerified = true;

                        // } else if (kyc.pan.data.aadhaar_seeding_status == 'Y' || kyc.pan.data.aadhaar_seeding_status == 'y') {
                        //     $scope.messageOutput.pan.message = 'PAN Successfully Verified';
                        //     $scope.messageOutput.pan.isVerified = true;
                        //     // 
                        //     $scope.messageOutput.aadhar.message = 'Aadhar is PAN Linked';
                        //     $scope.messageOutput.aadhar.isVerified = true;
                        // }
                    } else {

                        if (kyc.pan.data.category != 'individual') {
                            $scope.messageOutput.pan.message = 'Only Individual PAN Is Supported';
                            $scope.messageOutput.pan.isVerified = false;
                            // $scope.messageOutput.aadhar.message = 'Cannot Proceed With Aadhar Verification';
                            // $scope.messageOutput.aadhar.isVerified = false;

                        } else if (kyc.pan.data.name_as_per_pan_match) {
                            $scope.messageOutput.pan.message = 'PAN Name Mismatch. Cannot Verify PAN Number';
                            $scope.messageOutput.pan.isVerified = false;
                            // $scope.messageOutput.aadhar.message = 'Cannot Proceed With Aadhar Verification';
                            // $scope.messageOutput.aadhar.isVerified = false;
                        } else if (kyc.pan.data.date_of_birth_match) {
                            $scope.messageOutput.pan.message = 'PAN Date Of Birth Mismatch. Cannot Verify PAN Number';
                            $scope.messageOutput.pan.isVerified = false;
                            // $scope.messageOutput.aadhar.message = 'Cannot Proceed With Aadhar Verification';
                            // $scope.messageOutput.aadhar.isVerified = false;
                        }

                    }
                } else {
                    $scope.messageOutput.pan.message = 'PAN Number Is Invalid Or Not Verified';
                    $scope.messageOutput.pan.isVerified = false;
                    // $scope.messageOutput.aadhar.message = 'Cannot Proceed With Aadhar Verification';
                    // $scope.messageOutput.aadhar.isVerified = false;

                }

            } else {

                if (kyc.pan && kyc.pan.status_code == 400 || kyc.pan.status_code == 401) {
                    $scope.messageOutput.pan.message = "Error Occured During Verification.Try Again Later";
                    $scope.messageOutput.pan.isVerified = false;
                    // $scope.messageOutput.aadhar.message = 'Aadhar is not PAN Linked.Cannot Be Verified As Error Occured.Try Again Later';
                    // $scope.messageOutput.aadhar.isVerified = false;
                } else if (kyc.pan && !kyc.pan.isVerified) {
                    $scope.messageOutput.pan.message = kyc.pan.data.message;
                    $scope.messageOutput.pan.isVerified = false;
                } else {
                    $scope.messageOutput.pan.message = kyc.pan.data.message;
                    $scope.messageOutput.pan.isVerified = false;
                }

            }

            // $scope.kycModal.show();


            $timeout(function() {
                log($scope.messageOutput);
                ons.notification.alert($scope.messageOutput.pan.message)
                    .then(function() {
                        $scope.kycComplete();

                    });
            });

        } else {
            log("Error Occured During Verification.Try Again Later");
            // $scope.kycModal.show();

            $scope.messageOutput.pan.message = "Error Occured During Verification.Try Again Later";
            $scope.messageOutput.pan.isVerified = false;
            // $scope.messageOutput.aadhar.message = 'Aadhar Cannot Be Verified As Error Occured.Try Again Later';
            // $scope.messageOutput.aadhar.isVerified = false;
            $timeout(function() {
                log($scope.messageOutput);
                ons.notification.alert($scope.messageOutput.pan.message)
                    .then(function() {});
            });


        }

    }



    $scope.kycMessagingPANViaSurePass = function(kyc) {

        warn('KYC Messaging PAN :');
        log(kyc.pan);
        if (kyc.pan.isVerified) {
            if (kyc.pan && kyc.pan.status_code == 200 || kyc.pan.status_code == '200') {
                if (kyc.pan.status == 'valid') {
                    if (kyc.pan.verification && kyc.pan.verification.category == 'individual' && kyc.pan.verification.name_as_per_pan_match & kyc.pan.verification.date_of_birth_match) {


                        $scope.messageOutput.pan.message = 'PAN Successfully Verified';
                        $scope.messageOutput.pan.isVerified = true;

                        // if (kyc.pan.verification.aadhaar_seeding_status == 'na' || kyc.pan.verification.aadhaar_seeding_status == 'n') {

                        //     $scope.messageOutput.pan.message = 'Aadhar is Not PAN Linked But Verified';
                        //     $scope.messageOutput.pan.isVerified = true;

                        //     // 
                        //     $scope.messageOutput.aadhar.message = 'Aadhar is Not PAN Linked But Verified';
                        //     $scope.messageOutput.aadhar.isVerified = true;

                        // } else if (kyc.pan.verification.aadhaar_seeding_status == 'Y' || kyc.pan.verification.aadhaar_seeding_status == 'y') {
                        //     $scope.messageOutput.pan.message = 'PAN Successfully Verified';
                        //     $scope.messageOutput.pan.isVerified = true;
                        //     // 
                        //     $scope.messageOutput.aadhar.message = 'Aadhar is PAN Linked';
                        //     $scope.messageOutput.aadhar.isVerified = true;
                        // }
                    } else {

                        if (kyc.pan.verification.category != 'individual') {
                            $scope.messageOutput.pan.message = 'Only Individual PAN Is Supported';
                            $scope.messageOutput.pan.isVerified = false;
                            // $scope.messageOutput.aadhar.message = 'Cannot Proceed With Aadhar Verification';
                            // $scope.messageOutput.aadhar.isVerified = false;

                        } else if (kyc.pan.verification.name_as_per_pan_match) {
                            $scope.messageOutput.pan.message = 'PAN Name Mismatch. Cannot Verify PAN Number';
                            $scope.messageOutput.pan.isVerified = false;
                            // $scope.messageOutput.aadhar.message = 'Cannot Proceed With Aadhar Verification';
                            // $scope.messageOutput.aadhar.isVerified = false;
                        } else if (kyc.pan.verification.date_of_birth_match) {
                            $scope.messageOutput.pan.message = 'PAN Date Of Birth Mismatch. Cannot Verify PAN Number';
                            $scope.messageOutput.pan.isVerified = false;
                            // $scope.messageOutput.aadhar.message = 'Cannot Proceed With Aadhar Verification';
                            // $scope.messageOutput.aadhar.isVerified = false;
                        }

                    }
                } else {
                    $scope.messageOutput.pan.message = 'PAN Number Is Invalid Or Not Verified';
                    $scope.messageOutput.pan.isVerified = false;
                    // $scope.messageOutput.aadhar.message = 'Cannot Proceed With Aadhar Verification';
                    // $scope.messageOutput.aadhar.isVerified = false;

                }

            } else {

                if (kyc.pan && kyc.pan.status_code == 400 || kyc.pan.status_code == 401) {
                    $scope.messageOutput.pan.message = "Error Occured During Verification.Try Again Later";
                    $scope.messageOutput.pan.isVerified = false;
                    $scope.messageOutput.aadhar.message = 'Aadhar is not PAN Linked.Cannot Be Verified As Error Occured.Try Again Later';
                    $scope.messageOutput.aadhar.isVerified = false;
                } else if (kyc.pan && !kyc.pan.isVerified) {
                    $scope.messageOutput.pan.message = kyc.pan.verification.message;
                    $scope.messageOutput.pan.isVerified = false;
                } else {
                    $scope.messageOutput.pan.message = kyc.pan.verification.message;
                    $scope.messageOutput.pan.isVerified = false;
                }

            }

            //$scope.kycModal.show();


            $timeout(function() {
                log($scope.messageOutput);
                ons.notification.alert($scope.messageOutput.pan.message)
                    .then(function() {
                        $scope.kycComplete();

                    });
            });

        } else {
            log("Error Occured During Verification.Try Again Later");
            //  $scope.kycModal.show();

            $scope.messageOutput.pan.message = "Error Occured During Verification.Try Again Later";
            $scope.messageOutput.pan.isVerified = false;
            // $scope.messageOutput.aadhar.message = 'Aadhar Cannot Be Verified As Error Occured.Try Again Later';
            // $scope.messageOutput.aadhar.isVerified = false;

            $timeout(function() {
                log($scope.messageOutput);
                ons.notification.alert($scope.messageOutput.pan.message)
                    .then(function() {

                    });
            });
        }

    }



    $scope.completeAndVerifyKYC = function(kycForm) {

        warn('Update And Verify KYC :');
        log(kycForm);
        kycForm.aadhar = {};
        //kycForm.aadhar.aadhar_card = $scope.aadhar_first.toString() + $scope.aadhar_middle.toString() + $scope.aadhar_last.toString();
        //kycForm.bank_kyc.isVerified = utility.validateBankAccountNumber(kycForm.bank_kyc.account_number) && utility.validateIFSCCode(kycForm.bank_kyc.ifsc_code);
        kycForm.pancard.isVerified = utility.validatePANCard(kycForm.pancard.pan_card.toUpperCase());
        log($scope.profile);

        log(kycForm);

        //kycForm.bank_kyc.isVerified &&
        if (kycForm.pancard.isVerified) {
            $scope.loaderKYC.show();

            var kycProfile = {};
            kycProfile.profile = $scope.profile.profile;
            kycProfile.email = $scope.profile.profile_info.email;
            kycProfile.mobile = $scope.profile.profile_info.mobile;
            kycProfile.name = $scope.profile.profile_info.fullname;
            log('KYC PROFILE DATA :');
            log(kycProfile);
            kycForm.pancard.date_of_birth = $scope.formatDate(kycForm.pancard.date_of_birth);
            kycForm.pancard.pan_card = kycForm.pancard.pan_card.toUpperCase();
            log('KYC FORM DATA :');
            log(kycForm);
            var checkDate = new Date(kycForm.pancard.date_of_birth);

            if (typeof(kycForm.pancard.date_of_birth) != undefined || typeof(kycForm.pancard.date_of_birth) != 'undefined' || kycForm.pancard.date_of_birth != "NaN/NaN/NaN") {
                sandbox.verifyKYC(kycProfile, kycForm, false)
                    .then(function(resp) {
                        $scope.loaderKYC.hide();
                        warn('KYC Validation :');
                        log(resp);
                        if (resp.data);

                        if (resp.data.switch.isSurePassAPI) {
                            $scope.kycMessagingPANViaSurePass(resp.data);
                        } else {
                            $scope.kycMessagingPAN(resp.data);
                        }

                        $scope.tupleIfSuccessVerification = {
                            pan: resp.data.pan,
                            ifsc: resp.data.ifsc,
                            bank: resp.data.bank,
                        };

                        $scope.original_kyc = resp.data.original_kyc;

                    });

            } else {
                $scope.loaderKYC.hide();

                ons.notification.alert('Select Formatted Date');

            }
        } else {
            if (!kycForm.pancard.isVerified) {
                ons.notification.alert('Could Not Verify KYC As PAN Number Is Invalid');
            }
            // if (!kycForm.bank_kyc.isVerified) {
            //     ons.notification.alert('Could Not Verify KYC As IFSC/Bank Account Number Is Invalid');
            // }
        }

    }


    $scope.kycComplete = function() {
        warn('Finally Upodate And Close KYC');
        log($scope.tupleIfSuccessVerification);
        warn('Original KYC');
        log($scope.original_kyc);


        $scope.original_kyc.pancard.verification = $scope.tupleIfSuccessVerification.pan.data;
        $scope.original_kyc.aadhar.aadhaar_seeding_status = $scope.tupleIfSuccessVerification.pan.data.aadhaar_seeding_status;
        // $scope.original_kyc.bank_kyc.verification = {};
        //$scope.original_kyc.bank_kyc.verification = $scope.tupleIfSuccessVerification.bank.data;
        // $scope.original_kyc.bank_kyc.verification.ifsc = $scope.tupleIfSuccessVerification.ifsc.data;

        warn('Final KYC Before Upload');
        log($scope.original_kyc);
        kyc.completeKYC($scope.profile.profile, $scope.original_kyc)
            .then(function(resp) {
                warn('KYC Completion  :');
                log(resp);
                if (resp.data);
                $rootScope.$emit('updated-kyc', { data: resp.data });
                $timeout(function() {
                    if (stateManager.isKYCCompleted()) {
                        $scope.myNavigator.resetToPage('dashboard.html', {
                            animation: 'lift'
                        });
                    } else {
                        $scope.myNavigator.resetToPage('dashboard-kyc.html', {
                            animation: 'lift'
                        });
                    }

                }, 300)

            });

    }





    $scope.kycModalResetAndClose = function() {

        $scope.kycModal.hide()
    }
}])