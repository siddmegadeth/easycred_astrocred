(function() {



    async function generateWAFast2SMSOTP(mobile) {

        return new Promise(function(approve, reject) {
            try {


                var generated_otp = generateOTP(6);
                var url = 'https://www.fast2sms.com/dev/whatsapp?authorization=' + process.env.FAST_2_WHATSAPP_ACCESSTOKEN + '&message_id=3366&numbers=' + mobile + '&variables_values=' + generated_otp;
                log('Generated URL');
                log(url);
                ProfileModel.findOne({ "profile_info.mobile": mobile }, function(errFound, found) {

                    if (errFound) {
                        log(errFound);
                        reject({ message: 'Error Occured Finding OTP', status: false, isOTPSuccess: false });
                    }

                    if (found) {
                        log('Used Found. Update User');

                        ProfileModel.update({ "profile_info.mobile": mobile }, { "fast2sms.otp": generated_otp }, { upsert: true, new: true }, function(errUpdate, updated) {
                            if (errUpdate) {
                                reject({ message: 'Error Occured Updating OTP', status: false, isOTPSuccess: false });
                            }
                            log('Updating OTP As User Found');
                            log('Updated Profile :');
                            log(updated);


                            request({ url: url, qs: {} }, function(err, response, body) {
                                if (err) {
                                    console.log(err)
                                    reject({ message: 'Error Occured Updating OTP', status: false, isOTPSuccess: false });
                                }
                                body = JSON.parse(body);
                                log(body);
                                log("Get OTP STATUS : " + body.return);
                                if (body.return) {
                                    log('OTP Sent.Profile Updated With Exisiting User');
                                    approve({ message: 'OTP Sent Successfully', status: true, isOTPSuccess: true });

                                } else {
                                    log(body.message);
                                    approve({ message: 'OTP Not Sent ', status: true, isOTPSuccess: false });
                                }

                            });



                        });


                    } else {
                        log('Used Not Found. Create User');
                        var model = new ProfileModel({
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
                            request({ url: url, qs: {} }, function(err, response, body) {
                                if (err) {
                                    console.log(err)
                                    reject({ message: 'Error Occured Creating User OTP', status: false, isOTPSuccess: false });
                                }
                                body = JSON.parse(body);
                                log(body);
                                log("Get OTP STATUS : " + body.return);
                                if (body.return) {
                                    log('OTP Sent.New User Created');
                                    approve({ message: 'OTP Sent Successfully. New User Created', status: true, isOTPSuccess: true });

                                } else {
                                    log(body.message);
                                    approve({ message: 'OTP Not Sent And No User Created', status: true, isOTPSuccess: false });
                                }

                            });

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



    app.get("/get/auth/otp/fast2sms/whatsapp/business", async function(req, resp) {
        log("/get/auth/otp/fast2sms/whatsapp/business");
        try {
            var mobile = req.query.mobile || req.body.mobile || req.params["mobile"];
            if (mobile) {

                if (mobile && mobile.indexOf("+91") != -1) {
                    mobile = mobile.split("+91")[1];
                }
                log('Mobile :' + mobile);
                var value = await generateWAFast2SMSOTP(mobile);
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