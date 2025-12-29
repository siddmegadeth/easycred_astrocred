(function() {

    app.get("/get/auth/otp/validate/fast2sms", async function(req, resp) {

        log("/get/auth/otp/validate/fast2sms");

        try {

            var otp = req.query.otp || req.body.otp;
            var mobile = req.query.mobile || req.body.mobile;

            if (!otp || !mobile) {
                return resp.send({
                    message: 'Params Missing',
                    status: false,
                    otpVerified: false
                });
            }

            if (mobile.indexOf("+91") !== -1) {
                mobile = mobile.split("+91")[1];
            }

            if (mongoose.connection.readyState !== 1) {
                return resp.send({
                    message: 'Database connection error',
                    status: false,
                    otpVerified: false
                });
            }

            var isProfile = await ProfileModel.findOne({
                mobile: mobile,
                "fast2sms.otp": otp
            });

            if (!isProfile) {
                return resp.send({
                    message: 'OTP Not Validated',
                    status: true,
                    otpVerified: false
                });
            }

            /* ===========================
               SESSION BINDING (CRITICAL)
            ============================ */

            req.session.userId = mobile;
            req.session.mobile = mobile;
            req.session.isAuthenticated = true;
            req.session.loginTime = new Date();
            req.session.device = req.headers['user-agent'];
            req.session.ip = req.ip;

            /* ===========================
               JWT (Stateless Auth)
            ============================ */

            var token = createJWT({
                userId: mobile,
                sessionId: req.sessionID
            });

            resp.cookie(
                'easycred_astrocred_app_access_token',
                token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    maxAge: 15 * 60 * 1000
                }
            );

            resp.send({
                message: 'OTP Validated',
                status: true,
                otpVerified: true,
                sessionId: req.sessionID,
                access_token: token,
                data: isProfile
            });

        } catch (errException) {

            log(errException);

            resp.send({
                message: 'Exception Occurred',
                status: false,
                otpVerified: false
            });
        }

    });

})();