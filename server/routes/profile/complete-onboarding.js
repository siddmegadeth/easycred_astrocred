(function() {


    app.post('/post/profile/complete/customer/onboarding', function(req, resp) {
        try {

            log('/post/profile/complete/customer/onboarding');
            var profile = req.body.profile || req.query.profile || req.params["profile"];
            log(profile);
            profile = JSON.parse(profile);
            log(profile);
            resp.send(profile);

        } catch (err) {
            resp.send(err);
        }
    });


})();