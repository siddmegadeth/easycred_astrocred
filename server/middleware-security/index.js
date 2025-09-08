(function() {
    var public = require("./../../data/route-access/route-config-public.json");
    var private = require("./../../data/route-access/route-config-private.json");
    routeAccessConfig = module.exports = {};
    routeAccessConfig.public = public.public;
    routeAccessConfig.private = private.private;



    securityRoute = function(req, resp, next) {
        try {
            log('-------securityRoute--------------');
            // Validate configuration


            if (!routeAccessConfig || typeof routeAccessConfig !== 'object') {
                throw new Error('Invalid route access configuration');
            }

            // Extract JWT secret from config
            var jwtSecret = process.env.ACCESSTOKEN_SECRET;
            if (!jwtSecret) {
                throw new Error('JWT secret is required');
            }

            // Pre-process routes for faster matching
            var publicRoutes = (routeAccessConfig.public || []).map(function(route) {
                return {
                    path: route.path,
                    methods: route.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
                };
            });

            var privateRoutes = (routeAccessConfig.private || []).map(function(route) {
                return {
                    path: route.path,
                    methods: route.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
                };
            });


            // Check if route is public
            var isPublic = publicRoutes.some(function(route) {
                return route.path === req.path && route.methods.includes(req.method.toUpperCase());
            });

            if (isPublic) {

                return next(); // No security checks needed
            } else {

                // Get token from header
                var token;
                if (req.header('Authorization') || req.headers.authorization) {
                    log('Headers :');
                    log(req.headers.authorization);
                    token = req.headers.authorization.split('Bearer ')[1];
                    log('Extracted Token :');
                    log(token);
                } else if (req.cookies && req.cookies.easycred_app_retail_access_token) {
                    token = req.cookies.easycred_app_retail_access_token;
                }
                //token = req.cookies.easycred_app_retail_access_token;

                if (!token) {
                    return resp.status(401).json({
                        status: false,
                        message: 'You are not logged in! Please log in to get access.',
                        forceLogout: true
                    });
                } else {
                    payload = jwt.decode(token, process.env.ACCESSTOKEN_SECRET);
                    //var payload = jwt.decode(cookie.gearguide_access_token, process.env.ACCESSTOKEN_SECRET);
                    // log('payload :');
                    // log(payload);
                    if (payload.exp <= moment().unix()) {
                        log('token expired');
                        return resp.status(403).json({
                            status: false,
                            message: 'token expired',
                            forceLogout: true
                        });
                    } else {
                        var isPrivate = privateRoutes.some(function(route) {
                            return route.path === req.path && route.methods.includes(req.method.toUpperCase());
                        });
                        if (isPrivate) {
                            log('Access Allowed');
                            return next(); // Just needs to be authenticated
                        }

                        // Default is deny
                        log('Access denied');
                        return resp.status(403).json({
                            status: false,
                            message: 'Access denied',
                            forceLogout: false
                        });

                    }
                }
            }


        } catch (err) {
            log('Error Occured :');
            log(err);
            return resp.status(404).json({
                status: false,
                message: 'Error Occured',
                data: err,
                forceLogout: true
            });
        }


    }

    // Add the route access middleware/ comment/uncomment to test
    app.use(securityRoute);

})();