(function() {

    /**
     * JWT is SECONDARY to session
     * Session is the source of truth
     */
    createJWT = module.exports = function(context) {

        if (!context || !context.userId || !context.sessionId) {
            throw new Error('JWT context missing userId or sessionId');
        }

        var now = Math.floor(Date.now() / 1000);

        // 🔐 SHORT LIVED TOKEN (15 minutes MAX)
        var expiry = now + (15 * 60);

        var payload = {

            // Subject = user (auditable)
            sub: context.userId.toString(),

            // Session binding (CRITICAL)
            sid: context.sessionId,

            // Issued at
            iat: now,

            // Expiry
            exp: expiry,

            // Scope (optional but recommended)
            scope: 'SESSION_BOUND_ACCESS',

            // Issuer (audit)
            iss: 'easycred-security-service'
        };

        var token = jwt.encode(
            payload,
            process.env.ACCESSTOKEN_SECRET
        );

        return token;
    };


    verifyJWT = module.exports = function(req, res, next) {

        try {

            // 1️⃣ No Authorization header → continue (session still valid)
            var authHeader = req.headers.authorization;
            if (!authHeader) {
                return next();
            }

            // 2️⃣ Extract token
            var parts = authHeader.split(' ');
            if (parts.length !== 2 || parts[0] !== 'Bearer') {
                return res.status(401).send({
                    message: 'Invalid authorization format',
                    status: false,
                    isLoggedIn: false
                });
            }

            var token = parts[1];

            // 3️⃣ Decode token
            var payload = jwt.decode(token, process.env.ACCESSTOKEN_SECRET);

            if (!payload) {
                return res.status(401).send({
                    message: 'Invalid token payload',
                    status: false,
                    isLoggedIn: false
                });
            }

            // 4️⃣ Session MUST exist
            if (!req.session || !req.sessionID) {
                return res.status(401).send({
                    message: 'Session missing or expired',
                    status: false,
                    isLoggedIn: false
                });
            }

            // 5️⃣ Bind JWT → Session
            if (payload.sid !== req.sessionID) {
                return res.status(401).send({
                    message: 'Session mismatch',
                    status: false,
                    isLoggedIn: false
                });
            }

            // 6️⃣ Optional: Bind user
            if (payload.sub && req.session.userId &&
                payload.sub.toString() !== req.session.userId.toString()) {

                return res.status(401).send({
                    status: false,
                    isLoggedIn: false,
                    message: 'token not found as error occured'
                });
            }

            // 7️⃣ Attach verified JWT
            req.jwt = payload;

            return next();

        } catch (err) {

            return res.status(401).send({
                message: 'JWT verification failed'
            });
        }
    }
    app.use(verifyJWT);


})();