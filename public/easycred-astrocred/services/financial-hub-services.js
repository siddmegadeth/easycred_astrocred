(function () {
    'use strict';

    app.provider('financialHub', function () {
        var config = {};
        this.config = function (val) {
            config = val;
        };

        this.$get = ['$http', '$q', function ($http, $q) {
            return {
                // FINVU - Account Aggregator
                initiateFinVuConsent: function (mobile, handle) {
                    return $http.post('/api/finvu/consent/initiate', { mobile: mobile, handle: handle });
                },
                getLinkedAccounts: function () {
                    return $http.get('/api/finvu/accounts');
                },

                // API SETU - Asset Verification
                verifyDrivingLicense: function (data) {
                    return $http.post('/api/setu/verify/dl', data);
                },
                verifyVehicleRC: function (data) {
                    return $http.post('/api/setu/verify/rc', data);
                },

                // Get Unified Profile
                getFinancialProfile: function () {
                    return $http.get('/get/profile/financial-summary');
                }
            };
        }];
    });

})();
