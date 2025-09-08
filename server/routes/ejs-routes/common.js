(function() {

    app.get("/get/submit/bing/indexnow", function(req, resp) {
        log("/get/submit/bing/indexnow");
        request.post({
            method: 'POST',
            url: 'https://api.indexnow.org',
            headers: {
                "content-type": "application/json",
            },
            body: {
                'host': "https://retail.easycred.co.in",
                "key": "3dc98258a86a450493709ac48cfa092b",
                "keyLocation": "https://retail.easycred.co.in/3dc98258a86a450493709ac48cfa092b.txt",
                "urlList": [
                    "https://retail.easycred.co.in/",
                    "https://retail.easycred.co.in/home",
                    "https://retail.easycred.co.in/faq",
                    "https://retail.easycred.co.in/contact"
                ]
            },
            json: true
        }, function(error, body, response) {

            if (error) {
                log("Error Found : ");
                log(error);
                resp.send(error);
            }
            log("Response :");
            resp.send({ status: true, data: response, body: body });

        });
    });

    app.get("/3dc98258a86a450493709ac48cfa092b.txt", function(req, resp) {
        log(BASEPATH  + '/sitemap/3dc98258a86a450493709ac48cfa092b.txt');
        return resp.sendFile(BASEPATH  + '/sitemap/3dc98258a86a450493709ac48cfa092b.txt');
    });

    app.get("/03486d2e39f81ef96a527835dce0896a.html", function(req, resp) {
        log(BASEPATH + '/sitemap/03486d2e39f81ef96a527835dce0896a.html');
        return resp.sendFile(BASEPATH + '/sitemap/03486d2e39f81ef96a527835dce0896a.html');
    });



    app.get('/sitemap.xml', function(req, resp) {
        log(BASEPATH);
        return resp.sendFile(BASEPATH + '/sitemap/sitemap.xml');
    });
    app.get('/robots.txt', function(req, resp) {
        return resp.sendFile(BASEPATH + '/sitemap/robots.txt');
    });

})();