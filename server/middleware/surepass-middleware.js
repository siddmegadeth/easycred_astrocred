(function () {
    /**
     * SurePass API Configuration Middleware
     * Automatically configures sandbox or production mode based on environment
     * 
     * Sandbox Mode: FREE - No charges (for development/testing)
     * Production Mode: PAID - Charges apply per API call
     */

    const SUREPASS_CONFIG = {
        sandbox: {
            url: 'https://sandbox.surepass.io',
            name: 'SANDBOX'
        },
        production: {
            url: process.env.SUREPASS_PRODUCTION_URL || 'https://kyc-api.surepass.app',
            name: 'PRODUCTION'
        }
    };

    log('===========================================');
    log('    SUREPASS API CONFIGURATION');
    log('===========================================');

    // Set to false to use production Surepass API (requires SUREPASS_TOKEN_PRODUCTION and charges apply)
    const FORCE_SANDBOX = process.env.FORCE_SUREPASS_SANDBOX === 'true';
    
    // Determine mode based on SUREPASS_ENV or NODE_ENV
    const surepassEnv = FORCE_SANDBOX ? 'development' : (process.env.SUREPASS_ENV || process.env.NODE_ENV || 'development');
    const isProduction = FORCE_SANDBOX ? false : ['production', 'PRODUCTION', 'prod', 'PROD'].includes(surepassEnv);
    const isSandbox = !isProduction;
    
    if (FORCE_SANDBOX) {
        log('');
        log('🔒 FORCED SANDBOX MODE (Development Override)');
        log('-------------------------------------------');
    }

    if (isProduction) {
        // Production Mode - PAID API calls
        log('');
        log('🔴 SUREPASS PRODUCTION MODE (CHARGES APPLY)');
        log('-------------------------------------------');

        process.env.SUREPASS_URL = process.env.SUREPASS_URL_PRODUCTION || 
                                   process.env.SUREPASS_PRODUCTION_URL || 
                                   SUREPASS_CONFIG.production.url;
        
        process.env.SUREPASS_TOKEN = process.env.SUREPASS_TOKEN_PRODUCTION || 
                                     process.env.SUREPASS_PRODUCTION_TOKEN ||
                                     process.env.SUREPASS_TOKEN;
        
        process.env.SUREPASS_MODE = 'production';
        
    } else {
        // Sandbox/Development Mode - FREE API calls
        log('');
        log('🟢 SUREPASS SANDBOX MODE (FREE - NO CHARGES)');
        log('-------------------------------------------');

        process.env.SUREPASS_URL = process.env.SUREPASS_SANDBOX_URL || 
                                   process.env.SUREPASS_SANDBOX_URL_DEVELOPMENT || 
                                   process.env.SUREPASS_URL_DEVELOPMENT ||
                                   SUREPASS_CONFIG.sandbox.url;
        
        process.env.SUREPASS_TOKEN = process.env.SUREPASS_SANDBOX_TOKEN || 
                                     process.env.SUREPASS_TOKEN_DEVELOPMENT;
        
        process.env.SUREPASS_MODE = 'sandbox';
    }

    // Log configuration (mask token for security)
    log('');
    log('Configuration:');
    log('  Mode  : ' + (isSandbox ? '🧪 SANDBOX (FREE - NO CHARGES)' : '🏭 PRODUCTION (PAID)'));
    log('  URL   : ' + process.env.SUREPASS_URL);
    log('  Token : ' + (process.env.SUREPASS_TOKEN ? '****' + process.env.SUREPASS_TOKEN.slice(-8) : '❌ NOT SET'));
    log('');
    
    if (FORCE_SANDBOX) {
        log('⚠️  SurePass is in SANDBOX mode (FORCE_SUREPASS_SANDBOX=true in .env)');
        log('   To use production API, remove FORCE_SUREPASS_SANDBOX or set it to false');
        log('   and set SUREPASS_TOKEN_PRODUCTION in .env');
        log('');
    }

    // Validation warnings
    if (!process.env.SUREPASS_TOKEN) {
        log('⚠️  WARNING: SUREPASS_TOKEN is not set!');
        log('   Sandbox: set SUREPASS_SANDBOX_TOKEN or SUREPASS_TOKEN_DEVELOPMENT in .env');
        log('   Production: set SUREPASS_TOKEN_PRODUCTION (or SUREPASS_TOKEN) in .env');
        log('');
    }

    if (!process.env.SUREPASS_URL) {
        log('⚠️  WARNING: SUREPASS_URL is not set!');
        log('   Using default sandbox URL: ' + SUREPASS_CONFIG.sandbox.url);
        process.env.SUREPASS_URL = SUREPASS_CONFIG.sandbox.url;
    }

    log('===========================================');

    // Export helper function for other modules
    global.getSurePassConfig = function() {
        return {
            url: process.env.SUREPASS_URL,
            token: process.env.SUREPASS_TOKEN,
            mode: process.env.SUREPASS_MODE,
            isSandbox: process.env.SUREPASS_MODE === 'sandbox',
            isProduction: process.env.SUREPASS_MODE === 'production'
        };
    };

})()