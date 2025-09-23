(function() {

    app.post("/check/access/token", function(req, resp) {
        log("/check/access/token");
        try {
            token = req.cookies.easycred_astrocred_app_access_token;
            if (token) {
                payload = jwt.decode(token, process.env.ACCESSTOKEN_SECRET);
                if (payload.exp <= moment().unix()) {

                    log("Token Has Expired :");
                    return resp.status(200).json({
                        status: false,
                        isLoggedIn: false,
                        message: 'token expired'
                    });
                } else {
                    log('Token Validated.Checking Route Access');
                    return resp.status(200).json({
                        status: true,
                        isLoggedIn: true,
                        message: 'token valid'
                    });
                }
            } else {
                return resp.status(200).json({
                    status: false,
                    isLoggedIn: false,
                    message: 'token not found'
                });
            }
        } catch (err) {
            log("Error Occured");
            log(err);
            return resp.status(200).json({
                status: false,
                isLoggedIn: false,
                message: 'token not found as error occured'
            });

        }
    });

})()

//easycred_admin_access_token