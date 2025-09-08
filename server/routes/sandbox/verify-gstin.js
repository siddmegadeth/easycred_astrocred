    (function() {


        async function GSTVerification(gst_number) {
            return new Promise(function(approve, reject) {

                const headers = {
                    'x-api-key': process.env.SANDBOX_CLIENTID_LIVE,
                    'authorization': app.get("SANDBOX_ACCESS_TOKEN"),
                    'x-accept-cache': false
                };
                log('Headers :');
                log(headers);

                log(process.env.SANDBOX_LIVE_URL + '/gst/compliance/public/gstin/search');
                axios({
                        url: process.env.SANDBOX_LIVE_URL + '/gst/compliance/public/gstin/search',
                        headers: headers,
                        method: 'POST',
                        data: {
                            gstin: gst_number
                        }
                    })
                    .then(function(success) {
                        log('RESP GST Verification');
                        log(success.data.data);


                        if (success.data && success.data.data && success.data.data.status_cd == 1) {
                            log('GST STATUS : ' + success.data.data.data.sts);
                            // now check iof GST is Active or Not
                            if (success.data.data.data.sts == "Active") {

                                approve({ status: true, isVerified: true, message: 'GST ACTIVE AND VERIFIED', data: success.data.data.data, isActive: true });
                            } else if (success.data.data.data.sts == "Cancelled") {

                                approve({ status: true, isVerified: false, message: 'GST NOT ACTIVE', data: success.data.data.data, isActive: false });
                            } else {
                                approve({ status: true, isVerified: false, message: 'GST NOT CORRECT', data: success.data.data.data, isActive: false });
                            }

                        } else {
                            approve({ status: true, isVerified: false, message: 'GST DATA NOT AVAILABLE', data: success.data, isActive: false });
                        }
                    })
                    .catch(function(error) {
                        log('RESP ERROR GST Verification');
                        log(error.data);
                        approve({ status: false, isVerified: false, message: 'BAD REQUEST', data: [], isActive: false });

                    })

            });

        }

        // http://localhost:8001/get/sandbox/validate/retailer/gstin?gstin=10 AAGCF0269F1Z5
        // http://localhost:8001/get/sandbox/validate/retailer/gstin?gstin=27AALCR4866P1ZD
        app.get("/get/sandbox/validate/retailer/gstin", function(req, resp) {
            log("/get/sandbox/validate/retailer/gstin");
            gstin = req.params.gstin || req.query.gstin;
            if (gstin) {
                log('GST :' + gstin);
                var promise = [];
                promise.push(GSTVerification(gstin));

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
            } else {
                resp.send({ status: false, isVerified: false, message: 'GST Params Missing', data: [], isActive: false });

            }
        });

    })();