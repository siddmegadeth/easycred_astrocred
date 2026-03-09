https: //api.sandbox.co.in/authenticate
    (function() {

        app.get("/get/sandbox/generate/autheticate/token", function(req, resp) {
            log("/get/sandbox/generate/autheticate/token");

            //var form = req.params.form || req.query.form;
            const headers = {
                'x-api-key': process.env.SANDBOX_CLIENTID,
                'x-api-secret': process.env.SANDBOX_SECRET,
                'x-api-version': '2.0',
                'Content-Type': 'application/json'
            }
            log('---------------------SANDBOX AUTH TOKEN---------------------');
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
                    resp.send(success.data);
                })
                .catch(function(error) {
                    log('RESP ERROR GENERATE/AUTH TOKEN');
                    resp.send(error);
                })
            log('---------------------SANDBOX AUTH TOKEN---------------------');

        });

    })();


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