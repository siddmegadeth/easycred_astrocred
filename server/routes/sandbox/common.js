(function() {
    initSandBox = module.exports = function() {


        if (app.get("SANDBOX_ACCESS_TOKEN")) {
            log('Access Token  Found :');
        } else {
            log('SANDBOX Access Token Not Found. CREATING NEW ACCESS TOKEM :');
            createAccessToken(function(resp) {
                log('Access Token Created :');
                //log(app.get("SANDBOX_ACCESS_TOKEN"));
                log(resp);
            }, function(error) {
                log('Access Token Result Error :');
                //log(error);
            });
        }
    }

    createAccessToken = module.exports = function(approve, reject) {
        log('-----------------------------------SANDBOX Generate Access Token-------------------------------------------');
        //var form = req.params.form || req.query.form;
        const headers = {
            'x-api-key': process.env.SANDBOX_CLIENTID,
            'x-api-secret': process.env.SANDBOX_SECRET,
            'x-api-version': '2.0.0',
            'Content-Type': 'application/json'
        }
        log(headers);
        log(process.env.SANDBOX_URL + '/authenticate');
        log('-----------------------------------SANDBOX Generate Access Token-------------------------------------------');

        axios({
                url: process.env.SANDBOX_URL + '/authenticate',
                headers: headers,
                method: 'POST',
                param: true
            })
            .then(function(success) {

                log('RESP Success GENERATE/AUTH TOKEN');
                //log(success.data);
                app.set("SANDBOX_ACCESS_TOKEN", success.data.access_token);
                approve({ status: true, isTokenGenerated: true, message: 'Access Token Generated', data: success.data });
            })
            .catch(function(error) {
                log('RESP ERROR GENERATE/AUTH TOKEN');
                reject({ status: false, isTokenGenerated: false, message: 'Access Token Not Generated', data: [] });
            })
        log('---------------------------------- Generate Access Token-------------------------------------------');

    }


    validateAccessToken = module.exports = function(approve, reject) {

        if (app.get("SANDBOX_ACCESS_TOKEN")) {
            log('Validate And Refresh Access Token');
            //var form = req.params.form || req.query.form;
            const headers = {
                'x-api-key': process.env.SANDBOX_CLIENTID,
                'authorization': app.get("SANDBOX_ACCESS_TOKEN"),
                'x-api-version': '2.0.0',
                'Content-Type': 'application/json'
            }
            log(headers);
            log(process.env.SANDBOX_URL + '/authorize?request_token=' + app.get("SANDBOX_ACCESS_TOKEN"));
            axios({
                    url: process.env.SANDBOX_URL + '/authorize?request_token=' + app.get("SANDBOX_ACCESS_TOKEN"),
                    headers: headers,
                    method: 'POST',
                    param: true,

                })
                .then(function(success) {
                    log('RESP Success REFRESH/AUTH TOKEN');
                    log(success.data);
                    app.set("SANDBOX_ACCESS_TOKEN", success.data.access_token);
                    approve({ status: true, message: success.data.message, data: success.data.access_token, isTokenValid: true });
                })
                .catch(function(error) {
                    log('RESP ERROR REFRESH/AUTH TOKEN');
                    log("=========================================================================");
                    log(error.response.data);
                    log("=========================================================================");
                    if (error.status == 403 && error.response.data == 403) {

                        if (error.response.message == 'Insufficient privilege') {
                            log('Insufficient privilege');
                            approve({ status: false, message: error.response.data.message, data: error.response.data, isTokenValid: false });
                        } else if (error.response.message == "pass a refreshable access token") {
                            log('pass a refreshable access token');
                            approve({ status: true, message: error.response.data.message, data: error.response.data, isTokenValid: false });
                        } else {
                            approve({ status: false, message: error.response.data.message, data: error.response.data, isTokenValid: false });
                        }

                    } else {
                        reject({ status: false, message: error.response.data.message, data: error.response.data, isTokenValid: false });
                    }
                })
        } else {
            log('Generate Access Token');
            //var form = req.params.form || req.query.form;
            const headers = {
                'x-api-key': process.env.SANDBOX_CLIENTID_LIVE,
                'x-api-secret': process.env.SANDBOX_SECRET_LIVE,
                'x-api-version': '2.0.0',
                'Content-Type': 'application/json'
            }
            log(headers);
            log(process.env.SANDBOX_URL + '/authenticate');
            axios({
                    url: process.env.SANDBOX_URL + '/authenticate',
                    headers: headers,
                    method: 'POST',
                    param: true
                })
                .then(function(success) {
                    log('RESP Success GENERATE/AUTH TOKEN');
                    log(success.data);
                    app.set("SANDBOX_ACCESS_TOKEN", success.data.access_token);
                    approve(success.data);
                })
                .catch(function(error) {
                    log('RESP ERROR GENERATE/AUTH TOKEN');
                    reject(error);
                })

        }

    }
})();