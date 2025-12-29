(function() {
    app.post('/post/api/auth/logout', function(req, res) {

        if (req.session) {
            req.session.destroy(function() {
                res.clearCookie('easycred_sid');
                res.send({ status: true, isLoggedOut: true });
            });
        } else {
            res.send({ status: true, isLoggedOut: true });
        }
    });

})();