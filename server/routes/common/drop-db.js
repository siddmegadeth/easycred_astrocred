(function() {

    // drop collection
    app.get('/get/drop/mongoose/collection', function(req, resp) {
        log('/get/drop/mongoose/collection');

        var model = req.body.model || req.query.model;
        log("Model To Drop : " + model);
        if (model) {
            mongoose.connection.db.dropCollection(model, function(err, result) {

                if (err) {
                    resp.send(err);

                }
                resp.send('dropped collection');
            });
        } else {
            resp.send('not dropped');
        }

    });

    // drop database
    app.get('/get/drop/mongoose/database', function(req, resp) {
        log('/get/drop/mongoose/database');
        mongoose.connection.db.dropDatabase(function(err, result) {

            if (err) {
                resp.send('error Occured ' +err);

            }
            resp.send('dropped database ' +result);
        });

    });


})();