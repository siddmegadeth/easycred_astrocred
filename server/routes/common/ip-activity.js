(function() {


    app.get("/ip/activity", function(req, resp) {
        log("/ip/activity");
        var mobile = req.params.mobile || req.body.mobile || req.query.mobile;
        log('Mobile : ' + mobile);
        if (mobile) {
            ActivityModel.findOne({ mobile: mobile }, function(errFound, found) {

                if (errFound) {
                    log('Error Updated Existing Log');
                    resp.send({ message: 'Error Found', data: errFound });
                }

                if (found) {
                    log('Updated Existing Log');
                    resp.send({ message: 'Found', data: found });
                } else {
                    resp.send({ message: 'Not Found', data: {} });
                }
            });
        } else {
            resp.send({ message: 'Params Required' });
        }
    })



    app.get("/ip/activity/all", function(req, resp) {
        log("/ip/activity/all");

        var aggregate = [
            { $skip: 60 },
            { $limit: 60 },
        ]

        ActivityModel.find({}, function(errFound, found) {

                if (errFound) {
                    log('Error Updated Existing Log');
                    resp.send({ message: 'Error Found', data: errFound });
                }

                if (found) {
                    log('Updated Existing Log');
                    resp.send({ message: 'Found', data: found });
                } else {
                    resp.send({ message: 'Not Found', data: {} });
                }
            })
            .limit(10)
            .skip(10);

    })




})()