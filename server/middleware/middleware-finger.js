(function() {


    app.use(Fingerprint({
        parameters: [
            // Defaults
            Fingerprint.useragent,
            Fingerprint.acceptHeaders,
            Fingerprint.geoip
        ]
    }))


    // app.use((req, res, next) => {
    //     const visitorFingerprint = req.fingerprint;
    //     console.log(req.fingerprint)
    //     console.log(req.fingerprint.components.useragent.browser);
    //     console.log(req.fingerprint.components.useragent.device);
    //     console.log(req.fingerprint.components.useragent.os);

    //     console.log(`Visitor fingerprint: ${visitorFingerprint}`);
    //     // Store this fingerprint in your database
    //     next();
    // });


})();