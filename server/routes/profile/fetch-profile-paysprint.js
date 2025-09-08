(function() {


    app.get("/get/paysprint/fetch/profile", function(req, resp) {
        log("/get/paysprint/fetch/profile");
        var profile = req.body.profile || req.query.profile || req.params["profile"];
        var customer_id = req.body.customer_id || req.query.customer_id || req.params["customer_id"];

        var create_profile = JSON.parse(create_profile);

        log("---------profile ------------");
        log(profile);
        log("---------customer_id ------------");
        log(customer_id);
        log("---------------------");

        resp.send(200);
    });

})();