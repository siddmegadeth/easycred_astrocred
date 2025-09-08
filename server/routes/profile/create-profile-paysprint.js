(function() {



    async function updateProfileWithCustID(profile, customer_id) {
        return new Promise(function(approve, reject) {

            log('-------------------------updateProfileWithCustID-------------------------------');
            ProfileModel.findOne({ "profile": profile, "paysprint.isPaySprintAccountCreated": true }, function(errFound, found) {

                if (errFound) {
                    log('Error Occured reject : ');
                    log(errFound);
                    reject({ status: false, message: 'Error Occured Finding  Profile', isCreated: false, data: errFound });
                }
                log("updateProfileWithCustID Result :");
                log(found);
                if (found) {
                    approve({ status: true, message: 'Profile Found And customer_id Found', isCreated: true, data: found });
                } else {
                    ProfileModel.findOneAndUpdate({ "profile": profile }, {
                        "paysprint.isPaySprintAccountCreated": true,
                        "paysprint.customer_id": customer_id
                    }, { upsert: true, new: true }, function(errUpdate, updated) {

                        if (errUpdate) {
                            log('Error errUpdate reject : ');
                            log(errUpdate);
                            reject({ status: false, message: 'Error Occured Updating Profile', isCreated: false, data: errUpdate });
                        }
                        log("findOneAndUpdate Result :");
                        log(updated);
                        if (updated) {
                            approve({ status: true, message: 'Profile Found And customer_id Is Updated', isCreated: true, data: updated });
                        } else {
                            approve({ status: true, message: 'Profile Not Found', isCreated: false, data: [] });

                        }

                    });

                }

            });
        });

    }


    async function createProfilePaySprintSchema(profile, customer_id, create_profile) {
        return new Promise(function(approve, reject) {

            log('----------------------createProfilePaySprintSchema---------------------------');

            PaySprintModel.findOne({ "profile": profile, "isPaySprintAccountCreated": true }, function(errFound, found) {

                if (errFound) {
                    log('Error Occured reject : ');
                    log(errFound);
                    reject({ status: false, message: 'Error Occured Finding  Pay Sprint Profile', isCreated: false, data: errFound });
                }
                log("updateProfileWithCustID Result :");
                log(found);
                if (found) {
                    approve({ status: true, message: 'Pay Sprint Profile Found  Found', isCreated: true, data: found });
                } else {
                    var tuple_profile = {};
                    tuple_profile.profile = profile;
                    tuple_profile.universal_customer_id = profile;
                    tuple_profile.customer_id = customer_id;
                    tuple_profile.isPaySprintAccountCreated = true;
                    tuple_profile.create_profile = {};
                    tuple_profile.create_profile = create_profile;


                    var tupleToSave = new PaySprintModel(tuple_profile);
                    tupleToSave.save(function(errSave, saved) {

                        if (errSave) {
                            log('Error errSave reject : ');
                            log(errSave);
                            reject({ status: false, message: 'Error Occured Saving Pay Sprint Profile', isCreated: false, data: errSave });
                        }
                        approve({ status: true, message: 'Pay Sprint Profile Saved', isCreated: true, data: saved });

                    });

                }

            });
        });

    }




    app.post("/post/paysprint/create/profile", function(req, resp) {
        log("/post/paysprint/create/profile");
        var profile = req.body.profile || req.query.profile || req.params["profile"];
        var customer_id = req.body.customer_id || req.query.customer_id || req.params["customer_id"];
        var create_profile = req.body.create_profile || req.query.create_profile || req.params["create_profile"];

        var create_profile = JSON.parse(create_profile);

        log("---------profile ------------");
        log(profile);
        log("---------customer_id ------------");
        log(customer_id);
        log("---------create_profile ------------");
        log(create_profile);
        log("---------------------");
        var promise = [];
        promise.push(updateProfileWithCustID(profile, customer_id));
        promise.push(createProfilePaySprintSchema(profile, customer_id, create_profile));

        Promise.all(promise)
            .then(function(successResp) {
                resp.send(successResp[0]);
            })
            .catch(function(errorResp) {
                log('Catch Error :');
                log(errorResp);
                resp.send(errorResp);
            });
    });

})();