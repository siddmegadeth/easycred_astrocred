(function () {



    app.get('/desktop/not/supported', function (req, resp) {
        return resp.render('desktop-support');
    });


    app.get('/private/restricted', function (req, resp) {
        return resp.redirect('no-access');
    });

    app.get('/route/not/found', function (req, resp) {
        return resp.redirect('not-found');
    });

    app.get('/get/easycred/help/docs/walkthrough', function (req, resp) {
        return resp.render('retail-help');
    });

    // Login Route
    app.get('/login', function (req, resp) {
        log('/login');
        return resp.render('login');
    });

    // CIBIL Dashboard Route (with optional auth check)
    app.get('/cibil-dashboard', function (req, resp) {
        log('/cibil-dashboard');

        // For now, allow demo access without strict auth
        // In production, uncomment to enforce authentication:
        // if (!req.session?.mobile && !req.query.mobile) {
        //     return resp.redirect('/login');
        // }

        var protocol = req.protocol || 'http';
        var host = req.get('host') || 'localhost:7001';
        var baseUrl = protocol + '://' + host;
        log('CIBIL Dashboard baseUrl: ' + baseUrl);

        return resp.render('cibil-dashboard', {
            title: 'CIBIL Credit Report Dashboard',
            baseUrl: baseUrl,
            mobile: req.session?.mobile || req.query.mobile || '7764056669'
        });
    });

    // Alternative route for CIBIL Dashboard
    app.get('/dashboard/cibil', function (req, resp) {
        return resp.redirect('/cibil-dashboard');
    });

})()