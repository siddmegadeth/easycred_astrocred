(function() {


    async function panAdvanceFetch(pan_number) {
        var URL = process.env.SUREPASS_URL + "/api/v1/pan/pan-comprehensive-plus";

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
        var result = await axios(options)
        return result.data.data;

    }


    async function panFromMobileFetch(name, mobile_no) {
        var URL = process.env.SUREPASS_URL + "/api/v1/pan/mobile-to-pan";

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
        var result = await axios(options)
        return result.data.data;

    }



    app.get("/get/surepass/pan/from/mobile", async function(req, resp) {
        try {

            log("/get/surepass/pan/from/mobile");
            mobile = req.params.mobile || req.query.mobile;
            fullname = req.params.fullname || req.query.fullname;
            log('fullname : ' + fullname);
            log('mobile : ' + mobile);

            if (mobile && fullname) {
                var panfromMobile = await panFromMobileFetch(fullname, mobile);
                log('Result :');
                log(panfromMobile);
                if (panfromMobile) {

                    var panAdvance = await panAdvanceFetch(panfromMobile.pan_number);
                    if (panAdvance) {
                        resp.send({ status: true, isSuccess: true, data: panfromMobile, data_advance: panAdvance });
                    } else {
                        resp.send({ status: true, isSuccess: false, data: {} });
                    }

                } else {
                    resp.send({ status: true, isSuccess: false, data: {} });
                }

            } else {
                resp.send({ status: true, isSuccess: false, data: {} });
            }
        } catch (catchError) {
            log('Error :');
            log(catchError);
            resp.send({ status: false, isSuccess: false, data: catchError });
        }
    })

})();