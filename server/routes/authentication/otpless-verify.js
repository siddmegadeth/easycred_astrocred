(function() {



    /**
     * @swagger
     * /auth/otp/less:
     *   post:
     *     tags:
     *       - Authentication
     *     summary: Authenticate user via OTP-less flow
     *     description: Validates an OTP-less token, creates or updates a user profile, and sets session cookies.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               user:
     *                 type: object
     *                 properties:
     *                   token:
     *                     type: string
     *                     description: The OTP-less token received from the client.
     *                     example: "abcdef123456"
     *                 required:
     *                   - token
     *             required:
     *               - user
     *         application/x-www-form-urlencoded:
     *           schema:
     *             type: object
     *             properties:
     *               user:
     *                 type: string
     *                 description: A JSON stringified user object containing the token. e.g., {"token":"abcdef123456"}
     *     responses:
     *       200:
     *         description: Authentication successful or profile creation status.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: boolean
     *                   example: true
     *                 isVerified:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: "Verified"
     *                 data:
     *                   type: object
     *                   properties:
     *                     message:
     *                       type: string
     *                     status:
     *                       type: boolean
     *                     data:
     *                       type: object
     *                     isVerified:
     *                       type: boolean
     *                     access_token:
     *                       type: string
     *       500:
     *         description: Internal server error or failed authentication/profile creation.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: boolean
     *                   example: true
     *                 isVerified:
     *                   type: boolean
     *                   example: false
     *                 message:
     *                   type: string
     *                   example: "Failed To Authenticate Using OTP"
     *                 data:
     *                   type: array
     */

    // async function loginActivityLog(user, fingerprint) {

    //     return new Promise(function(approve, reject) {
    //         log('---------ActivityModel-----------');
    //         log('IP  :');
    //         log(ip);
    //         log('Mobile : ' + user.identities[0].identityValue);
    //         var mobile = user.identities[0].identityValue.split("91")[1];
    //         log('Mobile : ' + mobile);
    //         log('userAgentString : ' + userAgentString);
    //         // Get client IP address (handles proxies)
    //         if (ip.includes(',')) {
    //             ip = ip.split(',')[0].trim();
    //         }

    //         // IPv4 mapped IPv6 addresses handling
    //         if (ip.substr(0, 7) === "::ffff:") {
    //             ip = ip.substr(7);
    //         }
    //         log('IP :');
    //         log(ip);
    //         if (ip == '::1') {
    //             log('Localhost Detected : ', ip);
    //             approve({ message: 'Localhost Detected', data: ip });
    //         } else {
    //             // Get user agent and parse it
    //             var agent = useragent.parse(userAgentString);

    //             // Get basic geo info from local database
    //             var geo = geoip.lookup(ip) || {};
    //             log('GEO IP Look UP :');
    //             log(geo);
    //             // Enhanced geo data from external API (ip-api.com)
    //             axios({
    //                     url: `http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`,
    //                     method: 'GET'
    //                 })
    //                 .then(function(respIP) {
    //                     log('IP Check Resp :');
    //                     log(respIP);
    //                     if (respIP.data && respIP.data.status === 'success') {
    //                         var enhancedGeo = {};
    //                         enhancedGeo = respIP.data;
    //                         // Prepare response data
    //                         var responseData = {
    //                             mobile_number: mobile,
    //                             ip: ip,
    //                             timestamp: new Date().toISOString(),
    //                             location: {
    //                                 localDatabase: {
    //                                     country: geo.country,
    //                                     region: geo.region,
    //                                     city: geo.city,
    //                                     timezone: geo.timezone,
    //                                     ll: geo.ll || [null, null],
    //                                     metro: geo.metro || null,
    //                                     area: geo.area || null
    //                                 },
    //                                 enhancedData: enhancedGeo || null
    //                             },
    //                             network: {
    //                                 isp: enhancedGeo.isp || null,
    //                                 organization: enhancedGeo.org || null,
    //                                 as: enhancedGeo.as || null,
    //                                 asname: enhancedGeo.asname || null,
    //                                 reverse: enhancedGeo.reverse || null
    //                             },
    //                             deviceCharacteristics: {
    //                                 mobile: enhancedGeo.mobile || false,
    //                                 proxy: enhancedGeo.proxy || false,
    //                                 hosting: enhancedGeo.hosting || false
    //                             },
    //                             browser: {
    //                                 family: agent.family,
    //                                 version: agent.toVersion(),
    //                                 os: agent.os.toString(),
    //                                 device: agent.device.toString(),
    //                                 source: userAgentString
    //                             },
    //                             headers: headers
    //                         };
    //                         log('---------------------------------------enhancedGeo---------------------------------------------------------');
    //                         log(enhancedGeo);
    //                         log('------------------------------------------------------------------------------------------------');

    //                         ActivityModel.findOneAndUpdate({ mobile: mobile }, {
    //                             $push: {
    //                                 activity: responseData
    //                             }
    //                         }, { upsert: true, new: true }, function(errUpdate, updated) {

    //                             if (errUpdate) {
    //                                 log('Error Updated Existing Log');
    //                                 approve(responseData);
    //                             }

    //                             if (updated) {
    //                                 log('Updated Existing Log');
    //                                 approve(responseData);

    //                             } else {
    //                                 log('Createting New Log');
    //                                 var tuple = {};
    //                                 tuple.mobile = mobile;
    //                                 tuple.activity = [];
    //                                 tuple.activity.push(responseData);
    //                                 var tupleLog = new ActivityModel(tuple);
    //                                 tupleLog.save(function(errSave, saved) {

    //                                     if (errSave) {
    //                                         log('Error Saving New Log');
    //                                         approve(errSave);
    //                                     }
    //                                     log('Saved New Log');
    //                                     approve(responseData);
    //                                 });
    //                             }
    //                         });
    //                     }

    //                 })
    //                 .catch(function(errAxios) {
    //                     log('Error Axios :');
    //                     log(errAxios);
    //                     approve({ message: 'Error Axios', data: errAxios });
    //                 })
    //         }
    //     });


    // };

    async function otpLessAuthValidate(user) {

        return new Promise(function(approve, reject) {
            log('---------otpLessAuthValidate-----------');
            log('---------OTPLESS PARAMS-----------');
            log({
                client_id: process.env.OTPLESS_CLIENTID,
                client_secret: process.env.OTPLESS_SECRET,
                token: user.token
            });
            log('--------------------');
            const params = new URLSearchParams({
                client_id: process.env.OTPLESS_CLIENTID,
                client_secret: process.env.OTPLESS_SECRET,
                token: user.token
            });
            axios.post('https://auth.otpless.app/auth/userInfo', params)
                .then(function(responseSuccess) {
                    log('RESP Success OTPLESS otpLessAuthValidate');
                    log(responseSuccess.data);
                    approve(responseSuccess);
                })
                .catch(function(responseError) {
                    log('RESP Error OTPLESS otpLessAuthValidate');
                    log(responseError);
                    reject(responseError);
                })

        })

    };



    async function createProfileOTPLESS(user) {

        return new Promise(function(approve, reject) {
            log('---------createProfileOTPLESS-----------');
            log(user);
            mobile = user.phone_number.split("+91")[1];
            log("Mobile : " + mobile);

            ProfileModel.findOne({ "profile_info.mobile": mobile }, function(errFound, found) {
                if (errFound) {
                    reject({ message: 'Error Occured', status: true, data: errFound, isVerified: false, access_token: undefined });
                }

                if (found) {
                    log('Found User');
                    var token = createJWT(found);
                    log(token);
                    approve({ message: 'Varified Validated', status: true, data: found, isVerified: true, access_token: token });

                } else {
                    log('User Not Found.Create User');
                    // create new user
                    var tuple = new ProfileModel({
                        profile_info: {
                            mobile: mobile,
                            isMobileAdded: true
                        },
                        type: {
                            provider: 'otpless',
                            profileType: 'individual',
                            businessType: 'D2C',
                            network: user.network
                        }
                    });
                    log(tuple);

                    tuple.save(function(errSave, saved) {

                        if (errSave) {
                            log('Error Save Merchant Store');
                            log(errSave);
                            reject({ message: 'Error Occured Saving New Profile', status: false, isVerified: false, data: errSave });
                        }

                        // Send Welcome Email for new OTPless user (only if email is available)
                        try {
                            if (saved && saved.profile_info && saved.profile_info.email) {
                                sendWelcomeEmail(saved)
                                    .then(function(emailResult) {
                                        log('Welcome Email Sent Successfully for new OTPless user');
                                    })
                                    .catch(function(emailError) {
                                        log('Error sending welcome email for new OTPless user:', emailError);
                                    });
                            }
                        } catch (emailException) {
                            log('Exception in sending welcome email for new OTPless user:', emailException);
                            
                        }

                        var token = createJWT(saved);
                        log(' Saved/Created Estore For Merchant');
                        approve({ message: 'Bot Validated', status: true, data: saved, isVerified: true, access_token: token });
                    });

                }

            });
        })

    };

    async function captureActivity(user, fingerprint) {
        return new Promise(function(approve, reject) {


            log('---------ActivityModel-----------');
            log('Mobile : ' + user.identities[0].identityValue);
            var mobile = user.identities[0].identityValue.split("91")[1];
            log('Mobile : ' + mobile);
            ActivityModel.findOneAndUpdate({ mobile: mobile }, {
                $push: {
                    activity: fingerprint
                }
            }, { upsert: true, new: true }, function(errUpdate, updated) {

                if (errUpdate) {
                    log('Error Updated Existing Log');
                    approve(errUpdate);
                }

                if (updated) {
                    log('Updated Existing Log');
                    approve(updated);

                } else {
                    log('Createting New Log');
                    var tuple = {};
                    tuple.mobile = mobile;
                    tuple.activity = [];
                    tuple.activity.push(fingerprint);
                    var tupleLog = new ActivityModel(tuple);
                    tupleLog.save(function(errSave, saved) {

                        if (errSave) {
                            log('Error Saving New Log');
                            approve(errSave);
                        }
                        log('Saved New Log');
                        approve(saved);
                    });
                }
            });

        });


    }

    app.post("/auth/otp/less", function(req, resp) {
        log("/auth/otp/less");

        var user = req.query.user || req.body.user || req.params["user"];
        const visitorFingerprint = req.fingerprint;
        user = JSON.parse(user);
        log('User Request From Params :');
        log(user);
        log('User Validate OTPLESS');
        log(user.token);

        log('Mobile Number : ' + user.identities[0].identityValue.split("91")[1]);

        visitorFingerprint.components.useragent.network = user.network;
        visitorFingerprint.components.useragent.deviceInfo = user.deviceInfo;
        visitorFingerprint.created_at = new Date();
        var promise = [];
        log("-------------------------------------------------------------------------");
        log('FinterPrint :');
        log(visitorFingerprint);
        log("-------------------------------------------------------------------------");


        // var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        // var userAgentString = req.headers['user-agent'] || '';
        // var headers = {
        //     accept: req.headers['accept'],
        //     acceptLanguage: req.headers['accept-language'],
        //     acceptEncoding: req.headers['accept-encoding'],
        //     connection: req.headers['connection'],
        //     dnt: req.headers['dnt'],
        //     referer: req.headers['referer'],
        //     secFetchMode: req.headers['sec-fetch-mode'],
        //     secFetchSite: req.headers['sec-fetch-site']
        // };

        promise.push(otpLessAuthValidate(user));
        promise.push(captureActivity(user, visitorFingerprint));

        var timer = moment().add(process.env.TIMETOLIVE_COOKIE, 'days').unix();

        Promise.all(promise)
            .then(function(promiseSuccess) {
                log('RESP Success OTPLESS .....................');
                log(promiseSuccess[0].data);

                var profilePromise = [];
                profilePromise.push(createProfileOTPLESS(promiseSuccess[0].data));

                Promise.all(profilePromise)
                    .then(function(promiseProfile) {
                        log('RESP PROFILE FETCHED CREATED .....................');
                        log(promiseProfile[0]);
                        log('Access Token : ' + promiseProfile[0].access_token);

                        req.session.easycred_app_retail_access_token = promiseProfile[0].access_token;
                        req.session.easycred_retail_profile = promiseProfile[0].data.profile;

                        //resp.cookie('easycred_app_retail_access_token', promiseProfile[0].access_token);
                        resp.cookie('easycred_app_retail_access_token', promiseProfile[0].access_token, { maxAge: timer, httpOnly: false });
                        resp.cookie('easycred_retail_profile', promiseProfile[0].data.profile, { maxAge: timer, httpOnly: false });
                        process.env.EASYCRED_RETAIL_PROFILE_PROCESS = promiseProfile[0].data.profile;
                        log('Your Session Access Token : ');
                        log(req.session.easycred_app_retail_access_token);

                        log('Your Session ID : ');
                        log(req.session.id);

                        log('cookie : ');
                        log(resp.cookies);


                        log('Access Token  :');
                        log(promiseProfile[0].access_token);

                        resp.send({ status: true, isVerified: true, message: 'Verified', data: promiseProfile[0], activity: promiseSuccess[1] });

                    })
                    .catch(function(respProfileError) {
                        log('Error Occured :');
                        log(respProfileError);
                        resp.send({ status: true, isVerified: false, message: 'Failed To Create Profile Using OTP', data: respProfileError });
                    })

            })
            .catch(function(respError) {
                log('Error Occured  Try/Block :');
                log(respError);
                resp.send({ status: true, isVerified: false, message: 'Failed To Authenticat Using OTP', data: respError });
            })

    });

})();

// axios({
//         method: 'post',
//         headers: {
//             "Content-Type": "application/x-www-form-urlencoded"
//         },
//         url: 'https://auth.otpless.app/auth/userInfo',
//         data: {
//             client_id: process.env.OTPLESS_CLIENTID,
//             client_secret: process.env.OTPLESS_SECRET,
//             token: user.token
//         }
//     })
//     .then(function(responseSuccess) {
//         log('RESP Success OTPLESS');
//         log(responseSuccess.data);
//         approve(responseSuccess);
//     })
//     .catch(function(responseError) {
//         log('RESP Error OTPLESS');
//         log(responseError);
//         reject(responseError);
//     })