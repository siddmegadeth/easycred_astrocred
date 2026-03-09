    (function() {




        async function AadharVerification(aadhaar_number) {
            return new Promise(function(approve, reject) {

                const headers = {
                    'x-api-key': process.env.SANDBOX_CLIENTID,
                    'authorization': app.get("SANDBOX_ACCESS_TOKEN"),
                    'x-api-version': '2.0',
                    'content-type': 'application/json'
                };

                var endpoint_url;

                if (process.env.SANDBOX_ENV == 'PROD') {
                    endpoint_url = process.env.SANDBOX_URL + '/kyc/aadhaar/okyc/otp'

                    data = {
                        '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.otp.request',
                        "aadhaar_number": aadhaar_number,
                        "consent": "y",
                        "reason": "For KYC"
                    }
                } else {
                    endpoint_url = process.env.SANDBOX_URL + '/kyc/aadhaar/okyc/otp'

                    data = {
                        '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.otp.request',
                        "aadhaar_number": "123456789012",
                        "consent": "y",
                        "reason": "For KYC"
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

        app.get('/get/sandbox/generate/aadhar/card/otp/kyc', function(req, resp) {
            log('/get/sandbox/generate/aadhar/card/otp/kyc');
            try {

                aadhaar_number = req.params.aadhaar_number || req.query.aadhaar_number;

                log('aadhaar_number :');
                log(aadhaar_number);

                var promise = [];
                promise.push(AadharVerification(aadhaar_number));


                Promise.all(promise)
                    .then(function(success) {
                        log('-------------------------------------------------------');
                        log('Verification AADHAR Result :');
                        log(success);
                        log('-------------------------------------------------------');
                        log('Connection closed AADHAR KYC :');
                        resp.send({ aadhar: success[0].data });
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