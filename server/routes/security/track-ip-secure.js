(function() {
    var riskEngine = require('./services/risk-engine');
    var ipReputation = require('./services/ip-reputation');


    async function saveTracking(req, geo, ua, risk, ip) {
        var record = new TrackingModel({
            ip: ip,
            location: geo ? {
                country: geo.country,
                region: geo.region,
                city: geo.city,
                lat: geo.ll[0],
                lon: geo.ll[1]
            } : null,

            device: {
                type: ua.device.type || 'desktop',
                brand: ua.device.vendor || '',
                model: ua.device.model || '',
                os: ua.os.name,
                browser: ua.browser.name
            },

            sessionId: req.body.sessionId,
            userId: req.body.userId || null,

            activity: {
                page: req.body.page,
                referrer: req.body.referrer,
                event: req.body.event
            },

            riskScore: risk.score,
            riskFlags: risk.flags
        });

        return record.save();

    }

    app.get('/get/api/security/track', async function(req, resp) {
        try {
            log('/get/api/security/track');
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            var geo = geoip.lookup(ip);
            var ua = new UAParser(req.headers['user-agent']).getResult();

            rep = await ipReputation(ip);

            var risk = riskEngine({
                isProxy: rep.isProxy,
                location: geo,
                browser: ua.browser.name,
                event: req.body.event
            });

            var isSaved = await saveTracking(req, geo, ua, risk, ip);

            resp.send({
                success: true,
                isSuccess: true,
                riskScore: risk.score,
                flags: risk.flags,
                data: isSaved
            });
        } catch (err) {
            log('Error Occured :');
            log(err);
            resp.send({
                success: false,
                isSuccess: false,
                riskScore: {},
                flags: {},
                data: err
            });
        }
    });

})();