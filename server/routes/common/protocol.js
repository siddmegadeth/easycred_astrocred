(function() {

    // implement Website /get/website/internet/protocol/address
    app.get('/get/website/internet/protocol/address', function(req, resp) {
        log('/get/website/internet/protocol/address');
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        log(ip);
        // if (ip && ip != "::1") {
        //     ip3country.lookupStr(ip);
        //     log("Your IP Is : " + ip);
        //     resp.send({ status: true, message: 'IP Found', data: ip3country.lookupStr(ip) });
        // } else {
        //     var countryCode = {
        //         "name": "India",
        //         "iso2": "IN",
        //         "iso3": "IND",
        //         "numeric": "356"
        //     };
        //     resp.send({ status: false, message: 'NoIP Found As Running On Localhost Returning Default India Code', data: countryCode });
        // }
        var countryCode = {
            "name": "India",
            "iso2": "IN",
            "iso3": "IND",
            "numeric": "356"
        };
        resp.send({ status: false, message: 'NoIP Found As Running On Localhost Returning Default India Code', data: countryCode });
    });



})();