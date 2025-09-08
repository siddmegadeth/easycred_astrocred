(function() {


    if (process.env.SANDBOX_ENV === 'development' || process.env.SANDBOX_ENV === 'DEVELOPMENT' || process.env.SANDBOX_ENV === 'dev' || process.env.SANDBOX_ENV === 'DEV') {
        log('----------------------------------------SANDBOX DEVELOPMENT----------------------:');
        process.env.SANDBOX_CLIENTID = process.env.SANDBOX_CLIENTID_TEST;
        process.env.SANDBOX_SECRET = process.env.SANDBOX_SECRET_TEST;
        process.env.SANDBOX_URL = process.env.SANDBOX_TEST_URL;
        log('SANDOX DEV CREDENTIALS IN USE');
        log('URL              : ' + process.env.SANDBOX_URL);
        log('SANDBOX CLIENTID : ' + process.env.SANDBOX_CLIENTID);
        log('SANDBOX SECRET   : ' + process.env.SANDBOX_SECRET);
        log("----------------------------------------------------------------------------------");

    } else if (process.env.SANDBOX_ENV === 'production' || process.env.SANDBOX_ENV === 'PRODUCTION' || process.env.SANDBOX_ENV === 'prod' || process.env.SANDBOX_ENV === 'PROD') {

        log('----------------------------------------SANDBOX PRODUCTION ----------------------:');
        process.env.SANDBOX_CLIENTID = process.env.SANDBOX_CLIENTID_LIVE;
        process.env.SANDBOX_SECRET = process.env.SANDBOX_SECRET_LIVE;
        process.env.SANDBOX_URL = process.env.SANDBOX_LIVE_URL;
        log('SANDOX PROD CREDENTIALS IN USE');

        log('URL              : ' + process.env.SANDBOX_URL);
        log('SANDBOX CLIENTID : ' + process.env.SANDBOX_CLIENTID);
        log('SANDBOX SECRET   : ' + process.env.SANDBOX_SECRET);
        log("----------------------------------------------------------------------------------");

    } else {

        log('----------------------------------------SANDBOX PRODUCTION DEFAULTING IF ENV NOT SPECIFIED  ----------------------:');
        process.env.SANDBOX_CLIENTID = process.env.SANDBOX_CLIENTID_LIVE;
        process.env.SANDBOX_SECRET = process.env.SANDBOX_SECRET_LIVE;
        process.env.SANDBOX_URL = process.env.SANDBOX_LIVE_URL;
        log('SANDOX PROD CREDENTIALS IN USE');

        log('URL              : ' + process.env.SANDBOX_URL);
        log('SANDBOX CLIENTID : ' + process.env.SANDBOX_CLIENTID);
        log('SANDBOX SECRET   : ' + process.env.SANDBOX_SECRET);
        log("----------------------------------------------------------------------------------");
    }



})()