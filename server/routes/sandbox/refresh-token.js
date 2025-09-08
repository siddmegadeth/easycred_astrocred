https: //api.sandbox.co.in/authenticate
    (function() {



        app.get("/get/sandbox/refresh/token", function(req, resp) {
            log("/get/sandbox/refresh/token");

            if (app.get("SANDBOX_ACCESS_TOKEN")) {
                //var form = req.params.form || req.query.form;
                const headers = {
                    'x-api-key': process.env.SANDBOX_CLIENTID,
                    'authorization': app.get("SANDBOX_ACCESS_TOKEN"),
                    'x-api-version': '2.0',
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
                        resp.send({ status: true, message: success.data.message, data: success.data.access_token, isTokenValid: true });
                    })
                    .catch(function(error) {
                        log('RESP ERROR REFRESH/AUTH TOKEN');
                        log("=========================================================================");
                        log(error.response.data);
                        log("=========================================================================");
                        if (error.status == 403 && error.response.data == 403) {

                            if (error.response.message == 'Insufficient privilege') {
                                log('Insufficient privilege');
                                resp.send({ status: false, message: error.response.data.message, data: error.response.data, isTokenValid: false });
                            } else if (error.response.message == "pass a refreshable access token") {
                                log('pass a refreshable access token');
                                resp.send({ status: true, message: error.response.data.message, data: error.response.data, isTokenValid: false });
                            } else {
                                resp.send({ status: false, message: error.response.data.message, data: error.response.data, isTokenValid: false });
                            }

                        } else {
                            resp.send({ status: false, message: error.response.data.message, data: error.response.data, isTokenValid: false });
                        }
                    })
            } else {
                resp.send({ message: 'Access Token Not Found For Refresh', data: [], isTokenValid: false, status: false });
            }

        });

    })();


// {
//   "code": 403,
//   "message": "Data not found",
//   "timestamp": 1724353012893,
//   "transaction_id": "c1c95175-6f43-42d3-a7a3-458f448f1363"
// }

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