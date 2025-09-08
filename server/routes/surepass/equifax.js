(function() {

    app.get("/get/check/credit/report/equifax", function(req, resp) {
        log("/get/check/credit/report/equifax");
        var URL = process.env.SUREPASS_URL + "/api/v1/credit-report-v2/fetch-report";
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
                "mobile": "9708016996",
                "pan": "IVZPK2103N",
                "name": "Shiv Kumar",
                "gender": "male",
                "consent": "Y"
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
                log(errorResp.status);
                resp.send(errorResp);
            });
    })

})();