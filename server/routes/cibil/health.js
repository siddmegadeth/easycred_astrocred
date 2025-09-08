(function() {
    // Health check endpoint
    app.get('/get/api/cibil/health', function(req, resp) {
        log('/get/api/cibil/health');
        resp.send({ status: true, message: 'CIBIL Analyzer API is running' });
    });

})();