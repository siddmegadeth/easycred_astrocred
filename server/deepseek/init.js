(function() {

    // Configuration
    const DEEPSEEK_CONFIG = {
        apiKey: process.env.DEEPSEEK_API, // Replace with your actual API key
        baseUrl: 'https://api.deepseek.com/v1', // Check for the latest API endpoint
    };

    // Initialize DeepSeek client
    deepseekClient = module.exports = axios.create({
        baseURL: DEEPSEEK_CONFIG.baseUrl,
        headers: {
            'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
        }
    });
    log('deepseek Initialized Object :');
    // DeepSeek client Inititalized Basic
    log('-------------------------------------------------------------------------');
})();