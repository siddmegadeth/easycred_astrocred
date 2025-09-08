    (function() {




        async function AadharValidateOTP(otp, reference_id) {
            return new Promise(function(approve, reject) {

                const headers = {
                    'x-api-key': process.env.SANDBOX_CLIENTID,
                    'authorization': app.get("SANDBOX_ACCESS_TOKEN"),
                    'x-api-version': '2.0',
                    'content-type': 'application/json'
                };

                var endpoint_url;

                if (process.env.SANDBOX_ENV == 'PROD') {
                    endpoint_url = process.env.SANDBOX_URL + '/kyc/aadhaar/okyc/otp/verify'

                    data = {
                        '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.request',
                        "reference_id": reference_id,
                        "otp": otp
                    }
                } else {
                    endpoint_url = process.env.SANDBOX_URL + '/kyc/aadhaar/okyc/otp/verify'

                    data = {
                        '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.request',
                        "reference_id": "1234567",
                        "otp": "121212"
                    }
                }
                log('AADHAR Endpoint :');
                log(endpoint_url);
                log('AADHAR Data :');
                log(data);


                axios({
                        url: endpoint_url,
                        headers: headers,
                        method: 'POST',
                        data: data
                    }).then(function(success) {

                        if (success.status != 200) {
                            log('AADHAR Error Occured :');
                            log(error);
                            approve({ status: false, isVerified: false, message: 'AADHAR ERROR', data: error, status_code: success.status });
                        }
                        log("AADHAR Response Success");
                        approve({ status: true, isVerified: true, message: 'AADHAR Verified', data: success.data, status_code: success.status });

                    })
                    .catch(function(err) {
                        log('AADHAR Error Occured Catch Block :');

                        approve({ status: false, isVerified: false, message: 'ERROR AADHAR VERIFICATION', data: err, status_code: 400 });

                    });

            });

        }






        // http: //localhost:8001/get/sandbox/validate/retailer/kyc?
        // ifsc=ICIC0002390&
        // gstin=27AALCR4866P1ZD&
        // virtual_address=8600869205@upi
        // &name=siddharth chandra&
        // mobile=8600869205&
        // account_number=003101586417&
        //http://localhost:5001/get/sandbox/verify/kyc/aadhar/card?aadhaar_number=713919645161

        app.get('/get/sandbox/validate/aadhar/card/kyc/otp', function(req, resp) {
            log('/get/sandbox/validate/aadhar/card/kyc/otp');
            try {

                otp = req.params.otp || req.query.otp || req.body.otp;
                reference_id = req.params.reference_id || req.query.reference_id || req.body.reference_id;

                log('otp :');
                log(otp);
                log('reference_id :');
                log(reference_id);
                var promise = [];
                promise.push(AadharValidateOTP(otp, reference_id));


                Promise.all(promise)
                    .then(function(success) {
                        log('-------------------------------------------------------');
                        log('Verification AADHAR Result :');
                        log(success);
                        log('-------------------------------------------------------');
                        log('Connection closed AADHAR KYC :');
                        resp.send({ aadhar: success[0] });
                    }).catch(function(error) {
                        log('ERROR  VALIDATION AADHAR :');
                        log(error);
                        log('Connection closed AADHAR KYC ERROR :');

                        resp.send(error);
                    })

            } catch (errorException) {
                log('ERROR  Exception :');
                log('Connection closed KYC AADHAR Exception :');
                resp.send({ status: false, isVerified: false, message: 'exception Error', data: errorException });

            }
        });

    })();


    // curl--request POST\
    // --url https: //api.sandbox.co.in/authenticate \
    //     --header 'accept: application/json'\
    //     --header 'x-api-key: key_test_xtXkIkQ9KIz7CvSVp1nTPQV6uF3mpJVM'\
    //     --header 'x-api-secret: secret_test_Rygp5BSmk7u7OifXv9KmxEql1lZAUcDr'



    // curl -u <YOUR_KEY>:<YOUR_SECRET> \
    // -X POST https://api.razorpay.com/v1/contacts \
    // -H "Content-Type: application/json" \
    // -d '{
    //   "name":"Gaurav Kumar",
    //   "email":"gaurav.kumar@example.com",
    //   "contact":"9000090000",
    //   "type":"employee",
    //   "reference_id":"Acme Contact ID 12345",
    //   "notes":{
    //     "notes_key_1":"Tea, Earl Grey, Hot",
    //     "notes_key_2":"Tea, Earl Grey… decaf."
    //   }
    // }'