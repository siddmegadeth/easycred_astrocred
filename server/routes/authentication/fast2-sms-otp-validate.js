(function() {

    async function validateMobileFromEasycred(mobile) {

        return new Promise(function(approve, reject) {
            try {
                axios({
                        url: 'https://retail.easycred.co.in/get/webhooks/fetch/profile?mobile=' + mobile,
                        method: 'GET'
                    })
                    .then(function(resp) {

                        if (resp.data.isSuccess) {
                            approve({ status: true, isSuccess: true, data: resp.data });
                        } else {
                            approve({ status: true, isSuccess: false, data: [] });
                        }
                    })
                    .catch(function(errResp) {
                        reject({ status: false, isSuccess: false, data: errResp });


                    });

            } catch (catchErr) {
                reject({ status: false, message: 'Not Able To Fetch Profile As Catch.Error ', isSuccess: false, data: catchErr });
            }

        });
    }
    app.get("/get/auth/otp/validate/fast2sms", async function(req, resp) {
        log("/get/auth/otp/validate/fast2sms");
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



                // Check if MongoDB is connected
                if (mongoose.connection.readyState !== 1) {
                    log('MongoDB not connected. ReadyState:', mongoose.connection.readyState);
                    return resp.send({
                        message: 'Database connection error. Please try again later.',
                        status: false,
                        data: { error: 'MongoDB not connected' },
                        otpVerified: false
                    });
                }

                var isProfile = await ProfileFormModel.findOne({ "profile_info.mobile": mobile, "fast2sms.otp": otp })

                if (isProfile) {
                    var token = createJWT(isProfile);

                    resp.cookie('easycred_astrocred_app_access_token', token, {
                        httpOnly: true,
                        secure: true,
                        maxAge: 15 * 60 * 1000
                    });

                    resp.send({ message: 'OTP Validated', status: true, data: isProfile, otpVerified: true, access_token: token });

                } else {
                    log('OTP Not Validated ');
                    resp.send({ message: 'OTP Not Validated ', status: true, data: {}, otpVerified: false, access_token: undefined });
                }


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