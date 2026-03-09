(function() {
    /**
     * sample-data.js — DISABLED IN PRODUCTION
     * This module previously generated synthetic/random CIBIL data for testing.
     * It has been disabled. Do NOT use fake data in the production environment.
     */
    module.exports = {
        generateSampleCIBILData: function() {
            throw new Error('generateSampleCIBILData is disabled in production. Use real SurePass API data.');
        },
        formatDate: function(date) {
            var day = String(date.getDate()).padStart(2, '0');
            var month = String(date.getMonth() + 1).padStart(2, '0');
            var year = date.getFullYear();
            return day + month + year;
        }
    };
})();