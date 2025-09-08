app.provider('kyc', [function() {
    var kycURL;
    return {
        config: function(url) {

            kycURL = url.kyc_endpoint || url;
        },
        $get: ['$http', function($http) {
            return {
                completeKYC: function(profile, kyc) {
                    return $http({
                        method: 'POST',
                        url: kycURL.completeKYC,
                        params: {
                            profile: profile,
                            kyc: kyc
                        }
                    })
                },
                validateKYC: function(profile) {
                    return $http({
                        method: 'POST',
                        url: kycURL.validateKYC,
                        params: {
                            profile: profile
                        }
                    })
                },
                updateVerifiedAadhar: function(profile, aadhar) {
                    return $http({
                        method: 'POST',
                        url: kycURL.updateVerifiedAadhar,
                        params: {
                            profile: profile,
                            aadhar: aadhar
                        }
                    })
                },
            }
        }]

    }
}])