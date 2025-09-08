(function() {


    async function fetchAndFormatProfileForConfirmation(profile) {

        return new Promise(function(approve, reject) {

            log("---------fetchAndFormatProfile--------------");
            ProfileModel.findOne({ profile: profile }, function(errFound, found) {

                if (errFound) {
                    log('Error Occured KYC reject : ');
                    log(errFound);
                    reject(errFound);
                }

                if (found) {
                    log('Biling State :');
                    log(found.kyc.aadhar.verification.data.address.state);
                    log('delivery_state State :');
                    log(found.kyc.aadhar.verification.data.address.state);

                    var customer = {
                        "mobile": parseInt(found.profile_info.mobile),
                        "name": found.profile_info.fullname.toString(),
                        "email": found.profile_info.email.toString(),
                        "billing_address_line1": found.kyc.aadhar.verification.data.full_address.toString(),
                        "billing_address_line2": found.kyc.aadhar.verification.data.full_address.toString(),
                        "billing_city": found.kyc.aadhar.verification.data.address.vtc.toString(),
                        "billing_state": found.kyc.aadhar.verification.data.address.state.toString(),
                        "billing_statecode": mapStateCode(found.kyc.aadhar.verification.data.address.state),
                        "billing_zip": found.kyc.aadhar.verification.data.address.pincode.toString(),
                        "billing_country": found.kyc.aadhar.verification.data.address.country.toString(),
                        "pan_number": found.kyc.pancard.pan_card.toString(),
                        "billing_mobile": found.profile_info.mobile.toString(),
                        "delivery_address_line1": found.kyc.aadhar.verification.data.full_address.toString(),
                        "delivery_address_line2": found.kyc.aadhar.verification.data.full_address.toString(),
                        "delivery_city": found.kyc.aadhar.verification.data.address.vtc.toString(),
                        "delivery_statecode": mapStateCode(found.kyc.aadhar.verification.data.address.state),
                        "delivery_state": found.kyc.aadhar.verification.data.address.state.toString(),
                        "delivery_zip": found.kyc.aadhar.verification.data.address.pincode.toString(),
                        "delivery_country": found.kyc.aadhar.verification.data.address.country.toString(),
                        "delivery_mobile": found.profile_info.mobile.toString(),
                    };
                    log("Customers :");
                    log(customer);

                    approve(customer);
                } else {
                    approve({});

                }

            });

        });

    };





    app.post("/post/paysprint/confirm/profile", function(req, resp) {
        try {
            log("/post/paysprint/confirm/profile");
            var profile = req.params.profile || req.body.profile || req.query.profile;

            if (profile) {

                var promise = [];
                promise.push(fetchAndFormatProfileForConfirmation(profile));


                Promise.all(promise)
                    .then(function(successResp) {
                        resp.send({ status: true, isReady: true, data: successResp[0], status_code: 200 });
                    })
                    .catch(function(errorResp) {
                        log('Catch Error :');
                        log(errorResp);
                        resp.send({ status: false, isReady: false, data: errorResp, message: 'Error Found', status_code: 401 });
                    });

            } else {
                log('Params Error :');
                resp.send({ status: false, isReady: false, message: 'Params Not Found', data: [], status_code: 404 });

            }
        } catch (catchErr) {
            log('Catch Error :');
            log(catchErr);
            resp.send({ status: false, isReady: false, data: catchErr, message: 'Error Found Catch', status_code: 401 });

        }
    });
})();