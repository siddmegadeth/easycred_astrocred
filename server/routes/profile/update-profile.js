(function() {




    async function editProfile(profile) {

        return new Promise(function(approve, reject) {
            var profileUpdate = profile.profile;
            var universal_customer_id = profile.universal_customer_id;
            delete profile.universal_customer_id;
            delete profile.profile;
            delete profile._id;
            delete profile.common;
            delete profile.admin;
            delete profile.consent;
            delete profile.kyc;
            delete profile.mmtc;
            delete profile.payments;
            delete profile.type;
            delete profile.isKYCCompleted;
            delete profile.isProfileCompleted;
            profile.updated_at = Date.now();

            log('Profile ID : ' + profileUpdate);
            log("----------Final Profile JSON Before Update -----------");
            log(profile);
            ProfileModel.findOneAndUpdate({ "universal_customer_id": profileUpdate }, profile, { upsert: true, new: true }, function(errorUpdate, updated) {
                if (errorUpdate) {
                    reject({ status: false, message: 'Error Occured Editing And Updating User Profile', isProfileUpdated: false, data: errorUpdate });
                }

                if (updated) {

                    // var jwt = createJWTWebsite(updated);
                    //var token = jwt.token;
                    // resp.cookie('website_access_token', token, {
                    //     maxAge: jwt.expires,
                    //     secure: true,
                    //     httpOnly: true,
                    //     sameSite: 'lax'
                    // });
                    approve({ status: true, message: 'Successfully Edited And Updated User Profile', isProfileUpdated: true, data: updated });
                } else {
                    // resp.cookie('website_access_token', token, {
                    //     maxAge: Date.now()
                    // });
                    approve({ status: true, message: 'Not Able To Edit And Update User Profile', isProfileUpdated: false, data: [] });

                }
            });


        });
    }


    app.post("/post/user/onboarding/edit/update/profile", function(req, resp) {
        log("/post/user/onboarding/edit/update/profile");
        var profile = req.body.profile || req.query.profile;
        profile = JSON.parse(profile);
        log("profile To Edit And Update :");
        log(profile);
        log("---------------------");
        log(profile);

        var promise = [];
        promise.push(editProfile(profile));

        Promise.all(promise)
            .then(function(respSuccess) {
                resp.send(respSuccess[0]);

            })
            .catch(function(respError) {
                log("Error Detected");
                log(respError);
                resp.send(respError);
            });
    });

})();