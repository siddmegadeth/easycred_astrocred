app.provider('sandbox', [function() {

    var sandBoxURL;
    return {
        config: function(url) {
            sandBoxURL = url.sandbox || url;
        },
        $get: ['$http', 'stateManager', function($http, stateManager) {
            return {
                verifyKYC: function(profile, kyc, isSurePassAPI) {
                    return $http({
                        method: 'POST',
                        url: sandBoxURL.verifyKYC,
                        params: {
                            profile: profile,
                            kyc: kyc,
                            isSurePassAPI: isSurePassAPI
                        }
                    })
                },
                initAadharVerification: function(aadhaar_number) {
                    return $http({
                        method: 'GET',
                        url: sandBoxURL.initAadharVerification,
                        params: {
                            aadhaar_number: aadhaar_number
                        }
                    })
                },
                validateAadharOTP: function(otp, reference_id) {
                    return $http({
                        method: 'GET',
                        url: sandBoxURL.validateAadharOTP,
                        params: {
                            otp: otp,
                            reference_id: reference_id
                        }
                    })
                },
            }
        }]
    }
}])