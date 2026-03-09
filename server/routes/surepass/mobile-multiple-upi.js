(function() {


    async function updateProfilePaymentMethods() {
        return new Promise(function(approve, reject) {



        });



    };







    app.get("/get/surepass/mobile/to/multiple/upi", function(req, resp) {
        log("/get/surepass/mobile/to/multiple/upi");
        mobile = req.params.mobile || req.query.mobile;

        try {
            if (mobile) {
                var URL = process.env.SUREPASS_URL + "/api/v1/bank-verification/mobile-to-multiple-upi";
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
                        "mobile_number": mobile,
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
                        log(errorResp);
                        resp.send(errorResp);
                    });
            } else {
                resp.send({ status: false, message: 'Params Missing' });
            }

        } catch (exceptionError) {
            resp.send({ status: false, message: 'exception error', data: exceptionError });
        }
    })

})();