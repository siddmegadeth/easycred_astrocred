(function() {

    app.get("/get/surepass/bank/account/from/mobile", function(req, resp) {
        try {

            log("/get/surepass/bank/account/from/mobile");
            mobile = req.params.mobile || req.query.mobile;
            log('mobile : '+mobile);
            if (mobile) {
                var URL = process.env.SUREPASS_URL + "/api/v1/mobile-to-bank-details/verification";
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
                        "mobile_no": mobile
                    }
                };
                axios(options)
                    .then(function(response) {
                        log('response Success : ');
                        log(response);
                        log(response.data);
                        resp.send(response.data); //send original and new fresh link while updating the same to DB
                    })
                    .catch(function(errorResp) {
                        log('Response Error :');
                        log(errorResp.data);
                        log(errorResp);
                        resp.send(errorResp);
                    });

            } else {
                resp.send({ status: false });
            }
        } catch (catchError) {
            log(catchError);
            resp.send(catchError);
        }
    })

})();