(function() {

    app.get('/api/auth/me', function(req, res) {

        log('--- /api/auth/me ---');
        log('Session ID:', req.sessionID);
        log('Session object:', req.session);
        log('User ID:', req.userId);

        if (!req.session) {
            return res.status(401).send({
                authenticated: false,
                reason: 'NO_SESSION_OBJECT'
            });
        }

        if (!req.session.isAuthenticated) {
            return res.status(401).send({
                authenticated: false,
                reason: 'NOT_AUTHENTICATED'
            });
        }

        return res.send({
            authenticated: true,
            user: {
                userId: req.session.userId,
                mobile: req.session.mobile
            }
        });
    });

})();