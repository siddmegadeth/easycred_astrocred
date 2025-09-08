(function() {



    async function removeProfile(mobile) {
        return new Promise(function(approve, reject) {

            ProfileModel.deleteOne({ "profile_info.mobile": mobile }, function(errRemoved, removed) {

                if (errRemoved) {
                    log('Error Remove ProfileModel');
                    log(errRemoved);
                }
                log('Removed Profile');
                log(removed);
                approve(removed);

            });

        });

    }

    async function removeMMTCProfile(profile) {
        return new Promise(function(approve, reject) {

            MMTCModel.findByIdAndDelete({ profile: profile }, function(errRemoved, removed) {

                if (errRemoved) {
                    log('Error Remove MMTCModel');
                    log(errRemoved);
                    reject(errRemoved)
                }
                log('Removed MMTC Profile');
                approve(removed);

            });

        });

    }
    async function removeJusPayLoanProfile(profile) {
        return new Promise(function(approve, reject) {

            JUSPayRetaiLoanModel.findByIdAndDelete({ profile: profile }, function(errRemoved, removed) {

                if (errRemoved) {
                    log('Error Remove removeJusPayLoanProfile');
                    log(errRemoved);
                    reject(errRemoved)
                }
                log('Removed JusPay Profile');
                approve(removed);

            });

        });

    }



    app.get("/get/profile/remove", function(req, resp) {
        log("/get/profile/remove");
        try {
            var mobile = req.body.mobile || req.query.mobile || req.params["mobile"];
            log('mobile : ' + mobile);

            var promise = [];
            promise.push(removeProfile(mobile));
            /// promise.push(removeJusPayLoanProfile(profile));
            /// promise.push(removeMMTCProfile(profile));

            Promise.all(promise)
                .then(function(success) {

                    resp.send({ data: success, status: true, message: 'Removed Profile' });
                })
                .catch(function(catchErr) {
                    log('Catch Error Promise :');
                    resp.send({ data: catchErr, status: false, message: 'Catch Error ' });

                });


        } catch (err) {
            log('Catch Error :');
            log(err);
            resp.send({ status: false, message: 'Error Catch Block', data: err });
        }
    });

})();