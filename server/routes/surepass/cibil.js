(function() {


    async function getMobileToPAN(fullname, mobile) {


        return new Promise(function(approve, reject) {

            try {

                log("getMobileToPAN");

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
                            log('response Success getMobileToPAN : ');
                            log(response);
                            approve(response.data); //send original and new fresh link while updating the same to DB
                        })
                        .catch(function(errorResp) {
                            log('Response Error getMobileToPAN :');
                            log(errorResp.status);
                            reject(errorResp);
                        });

                } else {
                    reject({ status: false });
                }
            } catch (catchError) {
                reject(catchError);
            }


        });

    };


    async function getPANComprehensive(pan_number) {


        return new Promise(function(approve, reject) {

            try {

                log("getPANComprehensive");

                if (mobile && fullname) {
                    var URL = process.env.SUREPASS_URL + "/api/v1/pan/pan-comprehensive-plus";
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
                            "id_number": pan_number
                        }
                    };
                    axios(options)
                        .then(function(response) {
                            log('response Success getPANComprehensive : ');
                            log(response);
                            approve(response.data); //send original and new fresh link while updating the same to DB
                        })
                        .catch(function(errorResp) {
                            log('Response Error getPANComprehensive :');
                            log(errorResp.status);
                            reject(errorResp);
                        });

                } else {
                    reject({ status: false });
                }
            } catch (catchError) {
                reject(catchError);
            }


        });

    };

    async function fetchCIBIL(params) {

        return new Promise(function(approve, reject) {
            try {

                log("fetchCIBIL : ");
                var URL = process.env.SUREPASS_URL + "/api/v1/credit-report-cibil/fetch-report";
                log('URL :' + URL);

                log('Params For CIBIL Report :');
                log(params);

                const options = {
                    method: 'POST',
                    url: URL,
                    headers: {
                        "accept": 'application/json',
                        "Authorization": 'Bearer ' + process.env.SUREPASS_TOKEN,
                        "content-type": 'application/json'
                    },
                    data: {
                        "mobile": params.mobile,
                        "pan": params.pan,
                        "name": params.name,
                        "gender": params.gender,
                        "consent": "Y"
                    }
                };
                axios(options)
                    .then(function(response) {
                        log('response Success fetchCIBIL : ');
                        approve(response.data); //send original and new fresh link while updating the same to DB
                    })
                    .catch(function(errorResp) {
                        log('Response Error fetchCIBIL :');
                        log(errorResp.status);
                        reject(errorResp);
                    })

            } catch (catchError) {
                reject(catchError);
            }
        });
    }


    app.get("/get/check/credit/report/cibil", async function(req, resp) {
        log("/get/check/credit/report/cibil");


        profile = req.params.profile || req.query.profile;
        mobile = req.params.mobile || req.query.mobile;
        fullname = req.params.fullname || req.query.fullname;

        var URL = process.env.SUREPASS_URL + "/api/v1/credit-report-cibil/fetch-report";
        log('URL :' + URL);

        if (mobile && fullname) {
            var panMobile = await getMobileToPAN(fullname, mobile); // Assuming a Mongoose model
            log('getMobileToPAN :');
            log(panMobile);
            if (panMobile.success && panMobile.status_code == 200) {

                var panComp = await getPANComprehensive(panMobile.data.pan_number); // Assuming a Mongoose model
                log('getPANComprehensive :');
                log(panComp);

                if (panComp.success && panComp.status_code == 200) {

                    var gender;
                    if (panComp.data.pan_details.gender == "M") {
                        gender = 'male';
                    }
                    if (panComp.data.pan_details.gender == "F") {
                        gender = 'female';
                    }

                    // fetch CIBIL Docs
                    var cibilParams = {
                        mobile: mobile,
                        pan: panComp.data.pan_number,
                        name: panComp.data.pan_details.full_name,
                        gender: gender,
                        consent: "Y"
                    };

                    log('CIBIL PARAMS :');
                    log(cibilParams);

                    var cibilResp = await fetchCIBIL(cibilParams); // Assuming a Mongoose model

                    log(' CIBIL Resp cibilResp :');
                    log(cibilResp);
                    if (cibilResp.success && cibilResp.status_code == 200 || cibilResp.status == 422) {

                        resp.send({ cibil: cibilResp.data, pan_comprehensive: panComp, params: cibilParams, status: true })

                    } else {
                        resp.send({ status: false, message: 'Not Able To Fetch API Data For fetchCIBIL :', pan_comprehensive: panComp, params: cibilParams, });

                    }


                } else {
                    resp.send({ status: false, message: 'Not Able To Fetch API Data For getPANComprehensive :' });

                }

            } else {
                resp.send({ status: false, message: 'Not Able To Fetch API Data For getMobileToPAN :' });

            }

        } else {
            resp.send({ status: false, message: 'Params Missing' });
        }

    })

})();



// http://localhost:5001/get/check/credit/report/cibil?fullname=Siddharth%20Chandra&mobile=8600869205

// "accounts": [
//             {
//                 "index": "T001",
//                 "memberShortName": "NOT DISCLOSED",
//                 "accountType": "08",
//                 "ownershipIndicator": 1,
//                 "dateOpened": "1751794151234",
//                 "lastPaymentDate": "1751794153837",
//                 "dateReported": "1751794151234",
//                 "highCreditAmount": 11111111,
//                 "currentBalance": 79926,
//                 "paymentHistory": "DSFSDFSDFSDFNSDKFHSJKDBNFJSHIDUFBSDIBFIUSDBFUIBCSDBCSUIHZDFIOESBF",
//                 "paymentStartDate": "1751794151012",
//                 "paymentEndDate": "1751794153837",
//                 "creditFacilityStatus": "00",
//                 "collateralType": "00",
//                 "interestRate": 13.5,
//                 "paymentTenure": 24,
//                 "emiAmount": 3182,
//                 "paymentFrequency": "03",
//                 "actualPaymentAmount": 73557
//             }],
//             "enquiries": [
//             {
//                 "index": "I001",
//                 "enquiryDate": "1751794155674",
//                 "memberShortName": "FINTELLIGENCE",
//                 "enquiryPurpose": "05",
//                 "enquiryAmount": 49500
//             }]