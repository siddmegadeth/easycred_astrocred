(function() {






    app.get("/get/surepass/pan/from/mobile", function(req, resp) {
        try {

            log("/get/surepass/pan/from/mobile");
            mobile = req.params.mobile || req.query.mobile;
            fullname = req.params.fullname || req.query.fullname;
            log('fullname : '+fullname);
            log('mobile : '+mobile);

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
                        resp.send(response.data); //send original and new fresh link while updating the same to DB
                    })
                    .catch(function(errorResp) {
                        log('Response Error :');
                        log(errorResp);
                        resp.send(errorResp);
                    });

            } else {
                resp.send({ status: false });
            }
        } catch (catchError) {
            resp.send(catchError);
        }
    })

})();