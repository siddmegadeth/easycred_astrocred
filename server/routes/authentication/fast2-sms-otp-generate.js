(function() {




    async function generateSMSFast2SMSOTP(mobile) {

        return new Promise(function(approve, reject) {
            try {



                log("Original :");
                log(mobile);
                var generatedOTP = generateOTP(6);
                log("After Split :");
                log(mobile);

                log('SMS Sending For Indian Number on SMS and Whatsapp');

                //var fastSMSNumber = mobile.split("+91")[1];;
                log("Generated OTP : " + generatedOTP);


                var generated_otp = generateOTP(6);
                var url = 'https://www.fast2sms.com/dev/bulkV2?authorization=' + process.env.FAST_2_SMS_ACCESSTOKEN + '&route=dlt&sender_id=ECRED&message=195022&numbers=' + mobile + '&variables_values=' + generated_otp;
                log('Generated URL');
                log(url);
                ProfileFormModel.findOne({ "profile_info.mobile": mobile }, function(errFound, found) {

                    if (errFound) {
                        log(errFound);
                        reject({ message: 'Error Occured Finding OTP', status: false, isOTPSuccess: false });
                    }

                    if (found) {
                        log('Used Found. Update User');

                        ProfileFormModel.update({ "profile_info.mobile": mobile }, { "fast2sms.otp": generated_otp }, { upsert: true, new: true }, function(errUpdate, updated) {
                            if (errUpdate) {
                                reject({ message: 'Error Occured Updating OTP', status: false, isOTPSuccess: false });
                            }
                            log('Updating OTP As User Found');
                            log('Updated Profile :');
                            log(updated);

                            axios({
                                    url: url,
                                    method: 'GET'
                                })
                                .then(function(respAxios) {
                                    log('OTP Response :');
                                    log(respAxios.data);
                                    approve({ message: 'OTP Sent Successfully', status: true, isOTPSuccess: true });

                                })
                                .catch(function(errAxios) {
                                    log('Error Axios :');
                                    reject({ message: 'Error Axios', data: errAxios, isOTPSuccess: false });
                                })

                        });


                    } else {
                        log('Used Not Found. Create User');
                        var model = new ProfileFormModel({
                            profile_info: {
                                mobile: mobile
                            },
                            fast2sms: {
                                otp: generated_otp
                            },
                            type: {
                                provider: 'fast2sms'
                            },
                            isMobileAdded: true
                        });

                        model.save(function(errSave, saved) {

                            if (errSave) {
                                reject({ message: 'Error Occured Saving New User', status: false, data: errSave, isOTPGenerated: false });
                            }
                            log('Saved Profile :');
                            log(saved);
                            axios({
                                    url: url,
                                    method: 'GET'
                                })
                                .then(function(respAxios) {
                                    log('OTP Response :');
                                    log(respAxios.data);
                                    approve({ message: 'OTP Sent Successfully', status: true, isOTPSuccess: true });

                                })
                                .catch(function(errAxios) {
                                    log('Error Axios Save :');
                                    reject({ message: 'Error Axios', data: errAxios, isOTPSuccess: false });
                                })


                        });

                    }

                })

            } catch (errException) {
                log('Exception :');
                log(errException);
                reject({ message: 'Error Occured As Exception Occured', status: false, isOTPSuccess: false });

            }

        });

    }



    app.get("/get/auth/otp/send/fast2sms", async function(req, resp) {
        log("/get/auth/otp/send/fast2sms");
        try {
            var mobile = req.query.mobile || req.body.mobile || req.params["mobile"];
            if (mobile) {

                if (mobile && mobile.indexOf("+91") != -1) {
                    mobile = mobile.split("+91")[1];
                }
                log('Mobile :' + mobile);
                var value = await generateSMSFast2SMSOTP(mobile);
                resp.send(value);
            } else {
                resp.send({ status: false, message: 'Params Missing.Mobile Number Is Missing', isOTPSuccess: false });

            }
        } catch (errException) {
            log('Exception Route :');
            log(errException);
            resp.send(errException);
        }
    });

})()






// fast2sms.sendMessage(options).then(function(respOtp) {
//     log(respOtp);
//     resp.send(respOtp);
// });