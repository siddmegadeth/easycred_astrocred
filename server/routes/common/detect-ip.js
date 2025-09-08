(function() {

    app.get("/detect/ip", function(req, resp) {
        try {
            log("/detect/ip");
            // Get client IP address (handles proxies)
            let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            if (ip.includes(',')) {
                ip = ip.split(',')[0].trim();
            }

            // IPv4 mapped IPv6 addresses handling
            if (ip.substr(0, 7) === "::ffff:") {
                ip = ip.substr(7);
            }
            log('IP :');
            log(ip);
            if (ip == '::1') {
                log('Localhost Detected : ', ip);
                resp.send({ message: 'Localhost Detected', data: ip });
            } else {
                // Get user agent and parse it
                var userAgentString = req.headers['user-agent'] || '';
                var agent = useragent.parse(userAgentString);

                // Get basic geo info from local database
                var geo = geoip.lookup(ip) || {};
                log('GEO IP Look UP :');
                log(geo);
                // Enhanced geo data from external API (ip-api.com)
                try {
                    axios({
                            url: `http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`,
                            method: 'GET'
                        })
                        .then(function(respIP) {
                            log('IP Check Resp :');
                            log(respIP);
                            if (respIP.data && respIP.data.status === 'success') {
                                var enhancedGeo = {};
                                enhancedGeo = respIP.data;
                                // Prepare response data
                                var responseData = {
                                    ip: ip,
                                    timestamp: new Date().toISOString(),
                                    location: {
                                        localDatabase: {
                                            country: geo.country,
                                            region: geo.region,
                                            city: geo.city,
                                            timezone: geo.timezone,
                                            ll: geo.ll || [null, null],
                                            metro: geo.metro || null,
                                            area: geo.area || null
                                        },
                                        enhancedData: enhancedGeo || null
                                    },
                                    network: {
                                        isp: enhancedGeo.isp || null,
                                        organization: enhancedGeo.org || null,
                                        as: enhancedGeo.as || null,
                                        asname: enhancedGeo.asname || null,
                                        reverse: enhancedGeo.reverse || null
                                    },
                                    deviceCharacteristics: {
                                        mobile: enhancedGeo.mobile || false,
                                        proxy: enhancedGeo.proxy || false,
                                        hosting: enhancedGeo.hosting || false
                                    },
                                    browser: {
                                        family: agent.family,
                                        version: agent.toVersion(),
                                        os: agent.os.toString(),
                                        device: agent.device.toString(),
                                        source: userAgentString
                                    },
                                    headers: {
                                        accept: req.headers['accept'],
                                        acceptLanguage: req.headers['accept-language'],
                                        acceptEncoding: req.headers['accept-encoding'],
                                        connection: req.headers['connection'],
                                        dnt: req.headers['dnt'],
                                        referer: req.headers['referer'],
                                        secFetchMode: req.headers['sec-fetch-mode'],
                                        secFetchSite: req.headers['sec-fetch-site']
                                    }
                                };

                                resp.send({ data: responseData, message: 'IP Detected Response' });
                            }

                        })
                        .catch(function(errAxios) {
                            log('Error Axios :');
                            resp.send({ message: 'Error Axios', data: errAxios });
                        })


                } catch (geoApiError) {
                    log('External geo API error:', geoApiError.message);
                    resp.send({ message: 'External geo API error', data: geoApiError });
                }
            }

        } catch (errorDetect) {
            log('Error in detection:', errorDetect);
            resp.send({ message: 'Error in detection:', data: errorDetect });
        }

    });
})();