(function() {

    // process.env.JUSPAY_AUTHORIZATION = "Basic " + Buffer.from(process.env.JUSPAY_API_KEY + ":").toString("base64");

    log('---------------------------------------------------------------------------------------------------------');
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'DEVELOPMENT' || process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'DEV') {
        log('Running SUREPASS DEV MANAGEMENT:');
        log('---------------------------------------------------------------------------------------------------------');

        process.env.SUREPASS_URL = process.env.SUREPASS_SANDBOX_URL_DEVELOPMENT;
        process.env.SUREPASS_TOKEN = process.env.SUREPASS_SANDBOX_TOKEN;

    }
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'PRODUCTION' || process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'PROD') {

        log('Running SUREPASS PRODUCTION MANAGEMENT:');
        log('---------------------------------------------------------------------------------------------------------');

        // process.env.SUREPASS_URL = process.env.SUREPASS_SANDBOX_URL_PRODUCTION;
        // process.env.SUREPASS_TOKEN = process.env.SUREPASS_PRODUCTION_TOKEN;
        process.env.SUREPASS_URL = process.env.SUREPASS_SANDBOX_URL_PRODUCTION;
        process.env.SUREPASS_TOKEN = process.env.SUREPASS_PRODUCTION_TOKEN;
    } else {


        log('Running SUREPASS DEV MANAGEMENT:');
        log('---------------------------------------------------------------------------------------------------------');

        process.env.SUREPASS_URL = process.env.SUREPASS_SANDBOX_URL_PRODUCTION;
        process.env.SUREPASS_TOKEN = process.env.SUREPASS_PRODUCTION_TOKEN;

    }

    log('---------------------------------------------------------------------------------------------------------');

    log('SUREPASS TOEN AND URL:');
    log(process.env.SUREPASS_URL);
    log(process.env.SUREPASS_TOKEN);

    log('---------------------------------------------------------------------------------------------------------');

})()