(function() {


    cron.schedule('16 3 * * *', () => {
        log('===== Running CRON JOB For Sandbox API Access Token Generate Every 24 Hrs @3:16AM =====')
        console.log('Running a task every day at 3:16 AM');
        createAccessToken(function(resp) {
            log('Access Token Gnerated :');
            log(resp);
        }, function(error) {
            log('Access Token Result Error :');
            //log(error);
        });
    });
})();