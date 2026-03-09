(function() {



    app.get("/get/surepass/pan/comprehensive/from/mobile", function(req, resp) {
        try {
            log("/get/surepass/pan/comprehensive/from/mobile");
            id_number = req.params.id_number || req.query.id_number;
            log('PAN : ' + id_number);

            if (id_number) {
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
                        "id_number": id_number
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