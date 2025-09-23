(function() {


    app.get("/get/auth/otp/cancel/fast2sms", function(req, resp) {
        log("/get/auth/otp/cancel/fast2sms");
        var otp = req.query.otp || req.body.otp || req.params["otp"];
        //var request_id = req.query.request_id || req.body.request_id || req.params["request_id"];
        var mobile = req.query.mobile || req.body.mobile || req.params["mobile"];

        log('Mobile :' + mobile);
        log('OTP :' + otp);

        var generatedOTP = generateOTP(6);
        ProfileFormModel.update({ "profile_info.mobile": mobile }, { "fast2sms.otp": generatedOTP }, { upsert: true }, function(errUpdate, updated) {
            if (errUpdate) {
                resp.send({ message: 'Error Occured', status: false });
            }
            if (updated) {
                log('Updating OTP with new code when Cancelled');
                resp.send({ message: 'OTP Cancelled Successfully', status: true, data: { otpCancelled: true } });
            } else {
                log('Unable TO Cancel/Reset OTP');
                resp.send({ message: 'Not Able To Cancel Current OTP', status: false, data: { otpCancelled: false } });
            }

        });


    });

})()






// fast2sms.sendMessage(options).then(function(respOtp) {
//     log(respOtp);
//     resp.send(respOtp);
// });