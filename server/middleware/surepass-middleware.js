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
            url: 'https://kyc-api.surepass.io',
            name: 'PRODUCTION'
        }
    };

    log('===========================================');
    log('    SUREPASS API CONFIGURATION');
    log('===========================================');

    // 🔒 HARDCODED TO SANDBOX MODE FOR TESTING
    // TODO: Change back to production mode when ready for live API calls
    const FORCE_SANDBOX = true;  // ⚠️ Set to false for production
    
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
                                     process.env.SUREPASS_PRODUCTION_TOKEN;
        
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
        log('⚠️  IMPORTANT: SurePass is HARDCODED to SANDBOX mode');
        log('   This is for testing only. No charges will apply.');
        log('   To enable production mode, set FORCE_SANDBOX = false');
        log('   in server/middleware/surepass-middleware.js');
        log('');
    }

    // Validation warnings
    if (!process.env.SUREPASS_TOKEN) {
        log('⚠️  WARNING: SUREPASS_TOKEN is not set!');
        log('   Please configure your SurePass API token in .env file');
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