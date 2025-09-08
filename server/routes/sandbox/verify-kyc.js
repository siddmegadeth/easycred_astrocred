    (function() {



        async function IFSCVerification(ifsc) {
            return new Promise(function(approve, reject) {

                const headers = {
                    'x-api-key': process.env.SANDBOX_CLIENTID,
                    'authorization': app.get("SANDBOX_ACCESS_TOKEN")
                }
                var endpoint_url;

                if (process.env.SANDBOX_ENV == 'PROD') {


                    endpoint_url = process.env.SANDBOX_URL + '/bank/' + ifsc;
                } else {
                    endpoint_url = process.env.SANDBOX_URL + '/bank/HDFC0001234';
                }

                axios({
                        url: endpoint_url,
                        headers: headers,
                        method: 'GET'
                    }).then(function(success) {

                        if (success.status != 200) {
                            log('IFSC Error Occured :');
                            log(error);
                            approve({ status: false, isVerified: false, message: 'IFSC ERROR', data: error, status_code: success.status });
                        }
                        log("IFSC Response Success");
                        approve({ status: true, isVerified: true, message: 'IFSC Verified', data: success.data, status_code: success.status });

                    })
                    .catch(function(err) {
                        approve({ status: false, isVerified: false, message: 'ERROR IFSC VERIFICATION', data: err, status_code: 400 });

                    });

            });

        }






        async function BankVerification(bank_details) {
            try {
                return new Promise(function(approve, reject) {
                    const headers = {
                        'x-api-key': process.env.SANDBOX_CLIENTID,
                        'authorization': app.get("SANDBOX_ACCESS_TOKEN"),
                        'x-accept-cache': false
                    };

                    var endpoint_url;

                    if (process.env.SANDBOX_ENV == 'PROD') {
                        endpoint_url = process.env.SANDBOX_URL + '/bank/' + bank_details.ifsc + '/accounts/' + bank_details.account_number + '/penniless-verify?name=' + bank_details.name + "&mobile=" + bank_details.mobile
                    } else {
                        endpoint_url = process.env.SANDBOX_URL + '/bank/SBIN0021745/accounts/60100123456781/penniless-verify';
                    }

                    log(endpoint_url);
                    axios({
                            url: endpoint_url,
                            headers: headers,
                            method: 'GET'
                        }).then(function(success) {

                            if (success.status != 200) {
                                log('BANK Error Occured :');
                                log(error);
                                approve({ status: false, isVerified: false, message: 'BANK ERROR', data: error, status_code: success.status });
                            }
                            log("BankVerification Response Success");
                            approve({ status: true, isVerified: true, message: 'BANK Verified', data: success.data.data, status_code: success.status });
                        })
                        .catch(function(err) {
                            approve({ status: false, isVerified: false, message: 'ERROR BANK VERIFICATION', data: err, status_code: 400 });

                        });


                });
            } catch (exception) {
                approve({ status: false, isVerified: false, message: 'BANK NOT VERIFIED AS EXCEPTION OCCURED', data: exception, status_code: 400 });

            }
        }


        async function PanVerification(pan_tuple) {
            return new Promise(function(approve, reject) {
                try {
                    if (pan_tuple.date_of_birth == 'NaN/NaN/NaN' || pan_tuple.date_of_birth == 'undefined' || pan_tuple.date_of_birth == undefined) {
                        approve({ status: false, isVerified: false, message: 'PAN NOT VERIFIED AS DOB INVALID', data: [] });
                    } else {
                        log(process.env.SANDBOX_URL + '/kyc/pan/verify');
                        var data = {};
                        if (process.env.SANDBOX_ENV == 'PROD') {
                            data = {
                                '@entity': pan_tuple.entity,
                                "name_as_per_pan": pan_tuple.name_as_per_pan,
                                "date_of_birth": pan_tuple.date_of_birth,
                                "consent": pan_tuple.consent,
                                "reason": pan_tuple.reason,
                                "pan": pan_tuple.pan
                            }
                        } else {
                            data = {
                                "@entity": "in.co.sandbox.kyc.pan_verification.request",
                                "pan": "XXXPX1234A",
                                "name_as_per_pan": "John Ronald Doe",
                                "date_of_birth": "11/11/2001",
                                "consent": "Y",
                                "reason": "For onboarding customers"
                            }
                        }

                        const options = {
                            method: 'POST',
                            url: process.env.SANDBOX_URL + '/kyc/pan/verify',
                            headers: {
                                'x-api-key': process.env.SANDBOX_CLIENTID,
                                'authorization': app.get("SANDBOX_ACCESS_TOKEN"),
                                'accept': 'application/json',
                                'x-accept-cache': 'true',
                                'content-type': 'application/json'
                            },
                            data: data
                        };
                        log('Options :');
                        log(options);
                        axios(options)
                            .then(function(success) {
                                if (success.status != 200) {
                                    log('Error Occured :');
                                    log(error);
                                    approve({ status: false, isVerified: false, message: 'PAN ERROR', data: error, status_code: success.status });

                                }
                                log("PanVerification Response Success");
                                approve({ status: true, isVerified: true, message: 'PAN Verified', data: success.data.data, status_code: success.status });

                            })
                            .catch(function(errPAN) {
                                log('PAN Catch Error : ');
                                log(errPAN);
                                approve({ status: false, isVerified: false, message: 'ERROR PAN VERIFICATION', data: errPAN, status_code: 400 });

                            });
                    }
                } catch (exception) {
                    approve({ status: false, isVerified: false, message: 'PAN NOT VERIFIED AS EXCEPTION OCCURED', data: exception, status_code: 400 });

                }

            });

        }





        // http: //localhost:8001/get/sandbox/validate/retailer/kyc?
        // ifsc=ICIC0002390&
        // gstin=27AALCR4866P1ZD&
        // virtual_address=8600869205@upi
        // &name=siddharth chandra&
        // mobile=8600869205&
        // account_number=003101586417&


        app.post('/post/sandbox/verify/kyc', function(req, resp) {
            log('/post/sandbox/verify/kyc');
            try {

                kyc = req.params.kyc || req.query.kyc;
                profile = req.params.profile || req.query.profile;
                profile = JSON.parse(profile);
                kyc = JSON.parse(kyc);

                log('Profile :');
                log(profile);
                log('kyc :');
                log(kyc);

                // var bank = {};
                // bank.ifsc = kyc.bank_kyc.ifsc_code;
                // bank.account_number = kyc.bank_kyc.account_number;
                // bank.name = profile.name;
                // bank.mobile = profile.mobile;

                pan_card = {};
                pan_card.pan = kyc.pancard.pan_card;
                pan_card.name_as_per_pan = profile.name;
                pan_card.date_of_birth = kyc.pancard.date_of_birth;
                pan_card.consent = "Y";
                pan_card.reason = "For Onboarding Customer Post KYC Verification";
                pan_card.entity = "in.co.sandbox.kyc.pan_verification.request";


                log('PAN :');
                log(pan_card);
                log('------------------------------------');

                var promise = [];
                //promise.push(IFSCVerification(bank.ifsc));
                // promise.push(BankVerification(bank));
                promise.push(PanVerification(pan_card));


                Promise.all(promise)
                    .then(function(success) {
                        log('-------------------------------------------------------');
                        log('Verification Result :');
                        log(success);
                        log('-------------------------------------------------------');
                        log('Connection closed KYC :');

                        if (success[0].status && success[0].isVerified) {

                            resp.send({ ifsc: {}, pan: success[0], original_kyc: kyc });
                        } else {
                            success[0].message = success[0].message + ' AxiosError: Request failed with status code 403';
                            resp.send({ ifsc: {}, pan: success[0], original_kyc: kyc });

                        }
                    }).catch(function(error) {
                        log('ERROR  VALIDATION :');
                        log(error);
                        log('Connection closed KYC ERROR :');

                        resp.send(error);
                    })

            } catch (errorException) {
                log('ERROR  Exception :');
                log('Connection closed KYC Exception :');
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