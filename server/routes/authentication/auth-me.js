(function() {

    app.get('/api/auth/me', function(req, res) {

        log('--- /api/auth/me ---');
        log('Session ID:', req.session.sessionID);
        log('User ID:', req.session.userId);
        log('Session object:', req.session);

        if (!req.session) {
            return res.status(401).send({
                authenticated: false,
                isLoggedIn: false,
                reason: 'NO_SESSION_OBJECT'
            });
        }

        if (!req.session.isAuthenticated) {
            return res.status(401).send({
                authenticated: false,
                isLoggedIn: false,
                reason: 'NOT_AUTHENTICATED'
            });
        }

        return res.send({
            authenticated: true,
            isLoggedIn: true,
            user: {
                userId: req.session.userId,
                mobile: req.session.mobile,
                session: req.session.sessionID,
            }
        });
    });

})();