app.provider('surePass', [function() {
    var mmtcURL;
    return {
        config: function(url) {

            creditURL = url.surepass || url;
        },
        $get: ['$http', function($http) {
            return {

                cibil: function(profile) {
                    return $http({
                        method: 'GET',
                        url: creditURL.cibil,
                        params: {
                            profile: profile
                        }
                    })
                },
                equifax: function(profile) {
                    return $http({
                        method: 'GET',
                        url: creditURL.equifax,
                        params: {
                            profile: profile
                        }
                    })
                },
                experion: function(profile) {
                    return $http({
                        method: 'GET',
                        url: creditURL.experion,
                        params: {
                            profile: profile
                        }
                    })
                },
                KYCMobileToPAN: function(profile, mobile, fullname) {
                    return $http({
                        method: 'GET',
                        url: creditURL.KYCMobileToPAN,
                        params: {
                            profile: profile,
                            mobile: mobile,
                            fullname: fullname
                        }
                    })
                },
                kycPanPlus: function(profile, pan_number) {
                    return $http({
                        method: 'GET',
                        url: creditURL.kycPanPlus,
                        params: {
                            profile: profile,
                            pan_number: pan_number
                        }
                    })
                },
                KYCPanToAadhar: function(profile, pan_number) {
                    return $http({
                        method: 'GET',
                        url: creditURL.KYCPanToAadhar,
                        params: {
                            profile: profile,
                            pan_number: pan_number
                        }
                    })
                },
                KYCAllFromMobile: function(profile, mobile, fullname) {
                    return $http({
                        method: 'GET',
                        url: creditURL.KYCAllFromMobile,
                        params: {
                            profile: profile,
                            fullname: fullname,
                            mobile: mobile
                        }
                    })
                },
                mobileToMultipleUPI: function(mobile) {
                    return $http({
                        method: 'GET',
                        url: creditURL.mobileToMultipleUPI,
                        params: {
                            mobile: mobile
                        }
                    })
                }

            }
        }]

    }
}])