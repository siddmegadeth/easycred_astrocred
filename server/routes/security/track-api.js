(function() {


    var geoip = require('geoip-lite');
    var UAParser = require('ua-parser-js');
    var Tracking = require('../models/Tracking');
    var riskEngine = require('../services/riskEngine');
    var ipReputation = require('../services/ipReputation');

    module.exports = function(app) {

        app.post('/api/security/track', function(req, res) {

            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            var geo = geoip.lookup(ip);
            var ua = new UAParser(req.headers['user-agent']).getResult();

            ipReputation(ip, function(rep) {

                var risk = riskEngine({
                    isProxy: rep.isProxy,
                    location: geo,
                    browser: ua.browser.name,
                    event: req.body.event
                });

                var record = new Tracking({
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

                record.save();

                res.json({
                    success: true,
                    riskScore: risk.score,
                    flags: risk.flags
                });
            });
        });
    };

})();