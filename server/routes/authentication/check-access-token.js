(function() {


    app.post("/check/access/token", verifyJWT, function(req, resp) {
        log("/check/access/token");
        try {

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