(function() {
    app.get("/get/consent/kyc/accept", function(req, resp) {
        log("/get/consent/kyc/accept");
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
                "consent.isAadharAccepted": consent,
                "consent.isPanAccepted": consent,
                "consent.created_at_aadhar": Date.now(),
                "consent.created_at_pan": Date.now()
            }, { upsert: true, new: true }, function(errUpdate, updated) {

                if (errUpdate) {
                    resp.send({ status: false, isReady: false, message: 'Error Update Terms' });
                }

                resp.send({ status: true, isReady: true, message: 'Updated KYC Consent', data: updated });

            });

        } else {
            resp.send({ status: false, isReady: false, message: 'Params Missing' });
        }

    });

})();