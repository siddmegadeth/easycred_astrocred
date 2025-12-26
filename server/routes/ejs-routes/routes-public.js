(function() {



    app.get('/desktop/not/supported', function(req, resp) {
        return resp.render('desktop-support');
    });


    app.get('/private/restricted', function(req, resp) {
        return resp.redirect('no-access');
    });

    app.get('/route/not/found', function(req, resp) {
        return resp.redirect('not-found');
    });

    app.get('/get/easycred/help/docs/walkthrough', function(req, resp) {
        return resp.render('retail-help');
    });

    // CIBIL Dashboard Route
    app.get('/cibil-dashboard', function(req, resp) {
        log('/cibil-dashboard');
        // Dynamically determine baseUrl from the request
        var protocol = req.protocol || 'http';
        var host = req.get('host') || 'localhost:7001';
        var baseUrl = protocol + '://' + host;
        log('CIBIL Dashboard baseUrl: ' + baseUrl);
        return resp.render('cibil-dashboard', {
            title: 'CIBIL Credit Report Dashboard',
            baseUrl: baseUrl
        });
    });

    // Alternative route for CIBIL Dashboard
    app.get('/dashboard/cibil', function(req, resp) {
        log('/dashboard/cibil');
        // Dynamically determine baseUrl from the request
        var protocol = req.protocol || 'http';
        var host = req.get('host') || 'localhost:7001';
        var baseUrl = protocol + '://' + host;
        log('CIBIL Dashboard baseUrl: ' + baseUrl);
        return resp.render('cibil-dashboard', {
            title: 'CIBIL Credit Report Dashboard',
            baseUrl: baseUrl
        });
    });

})()