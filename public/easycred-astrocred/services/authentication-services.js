app.provider('authentication', [function() {

    var authURL;
    return {
        config: function(url) {

            authURL = url.authentication || url;

        },
        $get: ['$http', function($http) {
            return {
                generateWABusinessOtp: function(mobile) {
                    return $http({
                        method: 'GET',
                        url: authURL.generateWABusinessOtp,
                        params: {
                            mobile: mobile
                        }
                    })

                },
                authenticateWABusinessOtp: function(mobile, otp) {
                    return $http({
                        method: 'GET',
                        url: authURL.authenticateWABusinessOtp,
                        params: {
                            mobile: mobile,
                            otp: otp
                        }
                    })

                },
                generateOTP: function(mobile,telemetric) {
                    return $http({
                        method: 'GET',
                        url: authURL.generateOTP,
                        params: {
                            mobile: mobile,
                            telemetric: telemetric
                        }
                    })
                },
                validateOTP: function(mobile, otp) {
                    return $http({
                        method: 'GET',
                        url: authURL.validateOTP,
                        params: {
                            mobile: mobile,
                            otp: otp
                        }
                    })
                }
            }
        }]
    }
}])