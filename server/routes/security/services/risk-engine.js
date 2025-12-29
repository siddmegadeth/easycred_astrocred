(function() {

    function calculateRisk(data) {
        var score = 0;
        var flags = [];

        // VPN / Proxy
        if (data.isProxy) {
            score += 40;
            flags.push('PROXY_DETECTED');
        }

        // Unknown country
        if (data.location && data.location.country !== 'IN') {
            score += 20;
            flags.push('FOREIGN_IP');
        }

        // Rapid page switching (bot-like)
        if (data.event === 'rapid_click') {
            score += 15;
            flags.push('ABNORMAL_BEHAVIOR');
        }

        // Missing browser info (headless)
        if (!data.browser) {
            score += 25;
            flags.push('HEADLESS_BROWSER');
        }

        // Normalize
        if (score > 100) score = 100;

        return {
            score: score,
            flags: flags
        };
    }

    module.exports = calculateRisk;

})();