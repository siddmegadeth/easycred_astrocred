    (function() {




        async function UPIVerification(upiInstance) {
            try {
                return new Promise(function(approve, reject) {

                    const headers = {
                        'x-api-key': process.env.SANDBOX_CLIENTID_LIVE,
                        'authorization': app.get("SANDBOX_ACCESS_TOKEN"),
                        'x-accept-cache': false
                    };

                    log(upiInstance);

                    log(process.env.SANDBOX_LIVE_URL + '/bank/upi/' + upiInstance.virtual_address + "?name=" + upiInstance.name);
                    axios({
                            url: process.env.SANDBOX_LIVE_URL + '/bank/upi/' + upiInstance.virtual_address + "?name=" + upiInstance.name,
                            headers: headers,
                            method: 'GET'
                        })
                        .then(function(success) {
                            log(success.data);
                            if (success.data && success.data.data) {

                                if (success.data.data && success.data.data.account_exists) {
                                    approve({ status: true, isVerified: true, message: 'UPI VERIFIED', data: success.data, isActive: true });

                                } else {
                                    approve({ status: true, isVerified: false, message: 'UPI NOT VERIFIED.CHECK UPI NUMBER', data: success.data, isActive: false });

                                }
                            } else {
                                approve({ status: true, isVerified: false, message: 'UPI NOT NOT AVAILABLE', data: success.data, isActive: false });

                            }
                        })
                        .catch(function(error) {
                            log('RESP ERROR UPI Verification');
                            approve({ status: false, isVerified: false, message: 'UPI NOT VERIFIED', data: error, isActive: false });
                        })

                });
            } catch (exception) {
                approve({ status: false, isVerified: false, message: 'UPI NOT VERIFIED AS EXCEPTION OCCURED', data: exception, isActive: false });

            }

        }





        // http://localhost:8001/get/sandbox/validate/retailer/virtual/address?virtual_address=8600869205@upi&name=siddharth chandra
        app.get("/get/sandbox/validate/retailer/virtual/address", function(req, resp) {
            log("/get/sandbox/validate/retailer/virtual/address");
            virtual_address = req.params.virtual_address || req.query.virtual_address;
            name = req.params.name || req.query.name;

            log('virtual_address :' + virtual_address);
            log('name :' + name);

            var promise = [];
            promise.push(UPIVerification({ virtual_address: virtual_address, name: name }));

            var verification = {};
            verification.data = {};
            verification.isVerified = false;
            verification.status = false;

            Promise.all(promise)
                .then(function(success) {
                    // resp.send(success);

                    verification.data = success[0].data;
                    verification.isVerified = success[0].isVerified;
                    verification.status = success[0].status;
                    verification.message = success[0].message;
                    verification.isActive = success[0].isActive;

                    log(verification);
                    resp.send(verification);
                })
                .catch(function(error) {
                    log('ERROR  VALIDATION :');
                    resp.send(error);
                })
        });

    })();