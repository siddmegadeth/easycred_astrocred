(function () {
    /**
     * SurePass API Configuration Middleware — PRODUCTION ONLY
     *
     * Reads from .env variables (in priority order):
     *   Token: SUREPASS_TOKEN  |  SUREPASS_PRODUCTION_TOKEN
     *   URL:   SUREPASS_URL    |  SUREPASS_SANDBOX_URL_PRODUCTION  |  https://kyc-api.surepass.app
     */

    // Resolve token — try all known variable names
    var token = process.env.SUREPASS_TOKEN
             || process.env.SUREPASS_PRODUCTION_TOKEN
             || process.env.SUREPASS_TOKEN_PRODUCTION;

    // Resolve URL — try all known variable names
    var url = process.env.SUREPASS_URL
           || process.env.SUREPASS_SANDBOX_URL_PRODUCTION
           || process.env.SUREPASS_PRODUCTION_URL
           || 'https://kyc-api.surepass.app';

    // Set canonical env vars so all routes just read process.env.SUREPASS_TOKEN / SUREPASS_URL
    process.env.SUREPASS_TOKEN = token || '';
    process.env.SUREPASS_URL   = url;
    process.env.SUREPASS_MODE  = 'production';

    log('===========================================');
    log('    SUREPASS API CONFIGURATION');
    log('===========================================');
    log('  Mode  : 🏭 PRODUCTION (PAID — real API calls)');
    log('  URL   : ' + process.env.SUREPASS_URL);
    log('  Token : ' + (process.env.SUREPASS_TOKEN
        ? '✅ SET (****' + process.env.SUREPASS_TOKEN.slice(-6) + ')'
        : '❌ NOT SET — add SUREPASS_PRODUCTION_TOKEN to your .env!'));
    log('===========================================');

    if (!process.env.SUREPASS_TOKEN) {
        log('⛔  CRITICAL: No SurePass token found!');
        log('   Checked: SUREPASS_TOKEN, SUREPASS_PRODUCTION_TOKEN, SUREPASS_TOKEN_PRODUCTION');
        log('   CIBIL fetching will FAIL until a token is set.');
    }

    // Export helper for other modules
    global.getSurePassConfig = function() {
        return {
            url: process.env.SUREPASS_URL,
            token: process.env.SUREPASS_TOKEN,
            mode: 'production',
            isSandbox: false,
            isProduction: true
        };
    };

})();