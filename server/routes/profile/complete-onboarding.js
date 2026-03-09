(function() {

    async function completeOnboarding(profile) {
        try {
            log('Before Updating :');
            log(profile);

            var isUpdated = await ProfileModel.findOneAndUpdate({ mobile: profile.mobile }, {
                isOnboardingComplete: true,
                profile_info: profile.profile_info,
                kyc: profile.kyc,
                consent: profile.consent,
                communication: profile.communication,
                props: profile.props,
                account: {
                    isAccountActive: true
                }
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
            // Handle both string (JSON) and already-parsed object
            if (typeof profile === 'string') {
                profile = JSON.parse(profile);
            }
            if (!profile || typeof profile !== 'object') {
                return resp.status(400).send({ status: false, message: 'Invalid or missing profile data' });
            }

            var onboard = await completeOnboarding(profile);
            resp.send(onboard);

        } catch (err) {
            log('completeOnboarding route error:', err.message || err);
            resp.status(500).send({ status: false, message: err.message || 'Server error', data: err });
        }
    });


})();