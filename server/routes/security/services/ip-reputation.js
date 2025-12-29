(function() {

    async function checkIP(ip) {
        // Replace with real API call
        var result = {
            isProxy: false,
            isTor: false,
            isVPN: false
        };

        // Example rule
        if (ip.indexOf('10.') === 0) {
            result.isProxy = true;
        }

        return result;
    }

    module.exports = checkIP;

})();