(function() {

    async function completeOnboarding(profile) {
        try {
            log('Before Updating :');
            log(profile);

            var isUpdated = await ProfileModel.findOneAndUpdate({ mobile: profile.mobile }, {
                customerId: profile.customerId,
                isOnboardingComplete: true,
                profile_info: profile.profile_info,
                kyc: profile.kyc,
                consent: profile.consent,
                communication: profile.communication
            }, { upsert: true, new: true });

            log('Update Status :');
            log(isUpdated);

            if (isUpdated) {
                log('Profile Successfully Updated');
                return ({ status: true, isSuccess: true, message: 'Profile Successfully Updated', data: isUpdated });
            } else {
                log('Profile Cannot Be Updated');
                return ({ status: true, isSuccess: true, message: 'Profile Cannot Be Updated', data: {} });
            }
        } catch (err) {
            log('Profile Not Created As Error Occured');
            log(err);
            return ({ status: false, isSuccess: false, message: 'Profile Not Created As Error Occured', data: err });
        }

    };

    app.post('/post/profile/complete/customer/onboarding', async function(req, resp) {
        try {
            log('/post/profile/complete/customer/onboarding');
            var profile = req.body.profile || req.query.profile || req.params["profile"];
            profile = JSON.parse(profile);

            var onboard = await completeOnboarding(profile);
            resp.send(onboard);

        } catch (err) {
            resp.send(err);
        }
    });


})();