(function() {
    app.get("/get/terms/conditions/accept", function(req, resp) {
        log("/get/terms/conditions/accept");
        var profile = req.params.profile || req.body.profile || req.query.profile;
        var consent = req.params.consent || req.body.consent || req.query.consent;

        if (profile && consent) {
            if (consent == 0) {
                consent = false;
            } else if (consent == 1) {
                consent = true;
            }
            log('Profile : ' + profile);
            log('Consent : ' + consent);

            ProfileModel.findOneAndUpdate({ profile: profile }, {
                "consent.isTermsAccepted": consent
            }, { upsert: true, new: true }, function(errUpdate, updated) {

                if (errUpdate) {
                    resp.send({ status: false, isReady: false, message: 'Error Update Terms' });
                }

                resp.send({ status: true, isReady: true, message: 'Updated Terms And Conditions', data: updated });

            });

        } else {
            resp.send({ status: false, isReady: false, message: 'Params Missing' });
        }

    });

})();