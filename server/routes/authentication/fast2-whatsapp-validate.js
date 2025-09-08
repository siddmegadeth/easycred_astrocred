(function() {


    async function changeOnceAuthenticated(mobile) {

        return new Promise(function(approve, reject) {
            try {


                var generated_otp = generateOTP(4);


            } catch (errException) {
                log('Exception :');
                log(errException);
                reject({ message: 'Error Occured As Exception Occured', status: false, isOTPSuccess: false });

            }

        });

    }
    app.get("/get/auth/otp/fast2sms/whatsapp/business/validate", function(req, resp) {
        log("/get/auth/otp/fast2sms/whatsapp/business/validate");
        try {

            var otp = req.query.otp || req.body.otp || req.params["otp"];
            var mobile = req.query.mobile || req.body.mobile || req.params["mobile"];
            if (mobile && otp) {

                if (mobile && mobile.indexOf("+91") != -1) {
                    mobile = mobile.split("+91")[1];
                }



                log('Mobile :' + mobile);
                log('OTP :' + otp);

                log('Mobile :' + mobile);
                log('OTP :' + otp);
                // 

                ProfileModel.findOne({ "profile_info.mobile": mobile, "fast2sms.otp": otp }, function(errFound, found) {
                    if (errFound) {
                        log('Error Found :');
                        log(errFound);
                        resp.send({ message: 'Error Occured', status: false, data: errFound });
                    }

                    if (found) {
                        log('Found Profile.OTP Match : ');
                        log(found.fast2sms.otp);
                        var token = createJWT(found);
                        resp.send({ message: 'OTP Validated', status: true, data: found, otpVerified: true, access_token: token });
                    } else {
                        log('Found Not Profile : ');
                        resp.send({ message: 'OTP Not Validated', status: true, data: {}, otpVerified: false, access_token: undefined });
                    }

                });
            } else {
                resp.send({ message: 'Params Missing.Either Mobile Number Or OTP Is Missing ', status: false, data: {}, otpVerified: false });
            }

        } catch (errException) {
            log('Exception :');
            log(errException);
            resp.send({ message: 'Exception Occured', status: false, data: errException, otpVerified: false });

        }
    });

})()






// fast2sms.sendMessage(options).then(function(respOtp) {
//     log(respOtp);
//     resp.send(respOtp);
// });