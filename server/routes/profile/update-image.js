(function() {




    async function updateProfileBackgroundImage(profile, background_image) {

        return new Promise(function(approve, reject) {

            log("----------Final Profile JSON Before Background Update -----------");
            log(profile);
            ProfileModel.findOneAndUpdate({ "profile": profile }, {
                "profile_info.background_image": background_image
            }, { upsert: true, new: true }, function(errorUpdate, updated) {
                if (errorUpdate) {
                    reject({ status: false, message: 'Error Occured Updating BackgroundUser Profile', isProfileUpdated: false, data: errorUpdate });
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
                    approve({ status: true, message: 'Successfully Updated Background Profile', isProfileUpdated: true, data: updated });
                } else {
                    // resp.cookie('website_access_token', token, {
                    //     maxAge: Date.now()
                    // });
                    approve({ status: true, message: 'Not Able To Update Background Profile', isProfileUpdated: false, data: [] });

                }
            });


        });
    }


    app.post("/post/profile/update/background/image", function(req, resp) {
        log("/post/profile/update/background/image");
        var profile = req.body.profile || req.query.profile;
        var background_image = req.body.background_image || req.query.background_image;
        log("profile To Update Background Image:");
        log(background_image);
        log("---------- profile -----------");
        log(profile);
        background_image = JSON.parse(background_image);
        log("profile To Update Background Image:");
        log(background_image);
        log("---------- profile -----------");
        log(profile);

        var promise = [];
        promise.push(updateProfileBackgroundImage(profile, background_image));

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