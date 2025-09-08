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

})()