(function() {
    app.get("/get/terms/conditions", function(req, resp) {
        log("/get/terms/conditions");
        var terms = require("./../../../data/terms.json");
        resp.send(terms);

    });


    app.get("/get/kyc/concent/form", function(req, resp) {
        log("/get/kyc/concent/form");
        var terms = require("./../../../data/consent-kyc.json");
        resp.send(terms);

    });


})();