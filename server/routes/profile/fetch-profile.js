(function() {


    /**
     * @swagger
     * /get/auth/fetch/updated/profile:
     *   get:
     *     summary: Fetch an updated user profile
     *     tags: [Profile]
     *     description: Retrieves the profile information for a given profile identifier.
     *     parameters:
     *       - in: query
     *         name: profile
     *         schema:
     *           type: string
     *         required: true
     *         description: The identifier of the profile to fetch. This could be a profile ID or a unique user identifier.
     *         example: "user123_profile_abc"
     *     responses:
     *       '200':
     *         description: Profile fetch status and data.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: boolean
     *                   description: True if the operation was processed, false if an error occurred during the promise handling (though the HTTP status might still be 200 in some error cases based on the code).
     *                 message:
     *                   type: string
     *                   description: A descriptive message about the outcome.
     *                   example: "Successfully Fetched Profile"
     *                 isFound:
     *                   type: boolean
     *                   description: True if the profile was found, false otherwise.
     *                 data:
     *                   type: object # Or array if not found
     *                   description: The profile data if found, or an empty array if not found or an error occurred.
     *                   example: { "_id": "someMongoId", "profile": "user123_profile_abc", "name": "John Doe" }
     *       '500': # Implied, though the current catch block sends the error object with a 200 status.
     *         description: Internal server error if promise rejects unexpectedly.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: boolean
     *                   example: false
     *                 message:
     *                   type: string
     *                   example: "Error Occured Fetching Profile"
     *                 isFound:
     *                   type: boolean
     *                   example: false
     *                 data:
     *                   type: object # Error object
     */





    async function fetchUpdatedProfile(profile) {

        return new Promise(function(approve, reject) {
            log(profile);
            ProfileModel.findOne({ profile: profile }, function(errorFound, found) {
                if (errorFound) {
                    reject({ status: false, message: 'Error Occured Fetching Profile', isFound: false, data: errorFound });
                }

                if (found) {

                    approve({ status: true, message: 'Successfully Fetched Profile', isFound: true, data: found });
                } else {
                    approve({ status: true, message: 'Not Able To Fetch Profile', isFound: false, data: [] });
                }
            });


        });
    }


    app.get("/get/auth/fetch/updated/profile", function(req, resp) {
        log("/get/auth/fetch/updated/profile");
        var profile = req.body.profile || req.query.profile;
        log('Profile : ' + profile);
        var promise = [];
        promise.push(fetchUpdatedProfile(profile));

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