(function() {

    // process.env.JUSPAY_AUTHORIZATION = "Basic " + Buffer.from(process.env.JUSPAY_API_KEY + ":").toString("base64");

    log('---------------------------------------------------------------------------------------------------------');
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'PRODUCTION' || process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'PROD') {
        log('Running SUREPASS PRODUCTION MANAGEMENT (CHARGES APPLY):');
        log('---------------------------------------------------------------------------------------------------------');

        process.env.SUREPASS_URL = process.env.SUREPASS_URL_PRODUCTION || process.env.SUREPASS_PRODUCTION_URL;
        process.env.SUREPASS_TOKEN = process.env.SUREPASS_TOKEN_PRODUCTION || process.env.SUREPASS_PRODUCTION_TOKEN;
    } else {
        // Development mode - use sandbox (FREE, no charges)
        log('Running SUREPASS DEVELOPMENT/SANDBOX MODE (FREE, NO CHARGES):');
        log('---------------------------------------------------------------------------------------------------------');

        process.env.SUREPASS_URL = process.env.SUREPASS_SANDBOX_URL_DEVELOPMENT || process.env.SUREPASS_SANDBOX_URL || process.env.SUREPASS_URL_DEVELOPMENT;
        process.env.SUREPASS_TOKEN = process.env.SUREPASS_SANDBOX_TOKEN || process.env.SUREPASS_TOKEN_DEVELOPMENT;
    }

    log('---------------------------------------------------------------------------------------------------------');

    log('SUREPASS TOEN AND URL:');
    log(process.env.SUREPASS_URL);
    log(process.env.SUREPASS_TOKEN);

    log('---------------------------------------------------------------------------------------------------------');

})()