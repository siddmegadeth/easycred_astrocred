(function() {


    async function fetchAadharFromPAN(pan_number) {

        return new Promise(function() {

            try {

                log("fetchAadharFromPAN");
                // pan_number = req.params.pan_number || req.query.pan_number;

                if (pan_number) {


                    var URL = process.env.SUREPASS_URL + "/api/v1/pan/pan-to-aadhaar";
                    log('URL :' + URL);

                    const options = {
                        method: 'POST',
                        url: URL,
                        headers: {
                            "accept": 'application/json',
                            "Authorization": 'Bearer ' + process.env.SUREPASS_TOKEN,
                            "content-type": 'application/json'
                        },
                        data: {
                            "pan_number": pan_number
                        }
                    };
                    axios(options)
                        .then(function(response) {
                            log('response Success : ');
                            log(response);
                            log(response.data);
                            approve(response.data); //send original and new fresh link while updating the same to DB
                        })
                        .catch(function(errorResp) {
                            log('Response Error :');
                            log(errorResp);
                            reject(errorResp);
                        });
                } else {
                    reject({ status: false });
                }

            } catch (errorCatch) {
                reject(errorCatch);
            }

        })

    }


    async function fetchPanFromMobile(mobile, fullname) {

        try {
            log('fetchPanFromMobile');

            if (mobile && fullname) {
                var URL = process.env.SUREPASS_URL + "/api/v1/pan/mobile-to-pan";
                log('URL :' + URL);

                const options = {
                    method: 'POST',
                    url: URL,
                    headers: {
                        "accept": 'application/json',
                        "Authorization": 'Bearer ' + process.env.SUREPASS_TOKEN,
                        "content-type": 'application/json'
                    },
                    data: {
                        "name": fullname,
                        "mobile_no": mobile
                    }
                };
                axios(options)
                    .then(function(response) {
                        log('response Success : ');
                        log(response);
                        log(response.data);
                        approve(response.data); //send original and new fresh link while updating the same to DB
                    })
                    .catch(function(errorResp) {
                        log('Response Error :');
                        log(errorResp);
                        reject(errorResp);
                    });

            } else {
                reject({ status: false });
            }
        } catch (catchError) {
            reject(catchError);
        }
    }




    app.get("/get/surepass/pan/aadhar/from/mobile", function(req, resp) {
        log("/get/surepass/pan/aadhar/from/mobile");
        profile = req.params.profile || req.query.profile;
        mobile = req.params.mobile || req.query.mobile;
        fullname = req.params.fullname || req.query.fullname;

        resp.send(200);
    })








})();