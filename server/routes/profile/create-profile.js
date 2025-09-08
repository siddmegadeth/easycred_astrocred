(function() {



    async function verifyIfEmailExist(params) {

        return new Promise(function(approve, reject) {

            log("verifyIfEmailExist");
            if (params.admin.isProfileResetDone) {
                log('Admin Profile Reset Done:');
                approve({ status: true, message: 'Email/Profile Reset By Admin. Complete Onboarding', isEmailExist: false, data: [] });

            } else {
                log('Direct Check. No Admin Profile Reset Done. First Time User Found:');
                ProfileModel.findOne({ "profile_info.email": params.profile_info.email }, function(errFound, found) {

                    if (errFound) {
                        log('Error Occured verifyIfEmailExist reject : ');
                        log(errFound);
                        reject({ status: false, message: 'Error Occured Finding Estore/EMail Before Creating Profile', isEmailExist: false, data: errFound });
                    }

                    if (found) {
                        approve({ status: true, message: 'Email Found/Exist.Please Select A New Email Id', isEmailExist: true, data: [] });
                    } else {
                        approve({ status: true, message: 'Email Does Not Exist', isEmailExist: false, data: [] });

                    }

                });
            }

        });

    }



    async function updateProfile(params) {

        return new Promise(function(approve, reject) {

            var profile = params.profile;
            delete params.profile;

            log("---------updateProfile--------------");
            ProfileModel.findOneAndUpdate({ profile: profile }, params, { upsert: true, new: true }, function(errUpdate, updated) {

                if (errUpdate) {
                    log('Error Occured reject : ');
                    log(errUpdate);
                    reject({ status: false, message: 'Error Occured Updating Profile', isProfileCompleted: false, data: errUpdate });
                }

                if (updated) {
                    approve({ status: false, message: 'Success.Updating Profile', isProfileCompleted: true, data: updated });
                } else {
                    approve({ status: false, message: 'Not Able To Update Profile', isProfileCompleted: false, data: [] });

                }

            });

        });

    };




    /**
     * @swagger
     * /post/user/onboarding/complete/profile:
     *   post:
     *     summary: Complete user onboarding by creating or updating a profile
     *     tags: [Profile]
     *     description: >
     *       Creates a new user profile or updates an existing one after verifying that the email address is not already in use.
     *       The 'profile' parameter in the request should be a stringified JSON object.
     *       This JSON string, when parsed, should contain a top-level 'profile' field (used as a unique identifier for the database query)
     *       and a 'profile_info.email' field, among other profile details.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               profile:
     *                 type: string
     *                 description: |
     *                   A stringified JSON object representing the profile data.
     *                   When parsed, this JSON should include:
     *                   - `profile`: (string) A unique identifier for the profile (e.g., user ID, session ID). This is used to query the database.
     *                   - `profile_info`: (object) An object containing at least:
     *                     - `email`: (string) The user's email address.
     *                   And any other fields to be stored in the profile document.
     *                 example: '{"profile": "user_xyz_123", "profile_info": {"email": "newuser@example.com", "name": "Jane Doe"}, "preferences": {"theme": "dark"}}'
     *         application/x-www-form-urlencoded:
     *           schema:
     *             type: object
     *             properties:
     *               profile:
     *                 type: string
     *                 description: |
     *                   A stringified JSON object representing the profile data. (See application/json example for structure).
     *                 example: '{"profile": "user_xyz_123", "profile_info": {"email": "newuser@example.com", "name": "Jane Doe"}}'
     *     responses:
     *       '200':
     *         description: Outcome of the profile creation/update attempt.
     *         content:
     *           application/json:
     *             schema:
     *               oneOf: # The response structure varies
     *                 - type: object # Email already exists
     *                   properties:
     *                     status:
     *                       type: boolean
     *                       example: false
     *                     message:
     *                       type: string
     *                       example: "Not Able To Create User Profile As Email ID Already Exist"
     *                     isProfileCompleted:
     *                       type: boolean
     *                       example: false
     *                     data:
     *                       type: array
     *                       example: []
     *                 - type: object # Profile created/updated successfully
     *                   properties:
     *                     status:
     *                       type: boolean
     *                       example: true
     *                     message:
     *                       type: string
     *                       example: "Profile Created"
     *                     isProfileCompleted:
     *                       type: boolean
     *                       example: true
     *                     data: # This is the nested response from updateProfile function
     *                       type: object
     *                       properties:
     *                         status:
     *                           type: boolean
     *                           example: false # This inner status seems to be from a different context
     *                         message:
     *                           type: string
     *                           example: "Success.Updating Profile"
     *                         isProfileCompleted:
     *                           type: boolean
     *                           example: true
     *                         data:
     *                           type: object # The actual profile document
     *                           example: { "_id": "mongoDbId", "profile": "user_xyz_123", "profile_info": {"email": "newuser@example.com", "name": "Jane Doe"} }
     *                 - type: object # Error during processing (e.g., database error)
     *                   properties:
     *                     status:
     *                       type: boolean
     *                       example: false
     *                     message:
     *                       type: string
     *                       example: "Error Occured Updating Profile"
     *                     isProfileCompleted: # or isEmailExist for email check errors
     *                       type: boolean
     *                       example: false
     *                     data:
     *                       type: object # Error details
     */
    app.post("/post/user/onboarding/complete/profile", function(req, resp) {
        log("/post/user/onboarding/complete/profile");
        var profile = req.body.profile || req.query.profile || req.params["profile"];
        profile = JSON.parse(profile);
        log("---------------------");
        log(profile);
        log("---------------------");

        var profileCheck = [];
        profileCheck.push(verifyIfEmailExist(profile));

        Promise.all(profileCheck)
            .then(function(storeSuccess) {

                if (storeSuccess[0].isEmailExist) {

                    resp.send({ status: false, message: 'Not Able To Create User Profile As Email ID Already Exist', isProfileCompleted: false, data: [] });


                } else {
                    log("Check If  Exist Or Not");

                    var profileCreate = [];

                    profile.universal_customer_id = createUniversalCustomerId(profile.profile_info.email);
                    profileCreate.push(updateProfile(profile));

                    Promise.all(profileCreate)
                        .then(function(profileCreateSuccess) {
                            
                            // Send Welcome Email after successful profile creation
                            try {
                                if (profileCreateSuccess[0] && profileCreateSuccess[0].data && profileCreateSuccess[0].data.profile_info && profileCreateSuccess[0].data.profile_info.email) {
                                    sendWelcomeEmail(profileCreateSuccess[0].data)
                                        .then(function(emailResult) {
                                            log('Welcome Email Sent Successfully for new profile');
                                        })
                                        .catch(function(emailError) {
                                            log('Error sending welcome email for new profile:', emailError);
                                            // Don't fail profile creation if email fails
                                        });
                                }
                            } catch (emailException) {
                                log('Exception in sending welcome email for new profile:', emailException);
                                // Don't fail profile creation if email fails
                            }

                            resp.send({ status: true, message: 'Profile Created', isProfileCompleted: true, data: profileCreateSuccess[0] });


                        })
                        .catch(function(storeErrorCreate) {
                            log('Error Occured storeErrorCreate : ');
                            log(storeErrorCreate);
                            resp.send(storeErrorCreate);

                        });
                }

            })
            .catch(function(storeError) {
                log('Error Occured storeError : ');
                log(storeError);
                resp.send(storeError);

            });
    });

})();