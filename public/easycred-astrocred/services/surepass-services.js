app.provider('surePass', [function () {
    var mmtcURL;
    return {
        config: function (url) {

            creditURL = url.surepass || url;
        },
        $get: ['$http', function ($http) {
            return {

                cibil: function (mobile, fullname) {
                    return $http({
                        method: 'GET',
                        url: creditURL.cibil,
                        params: {
                            mobile: mobile,
                            fullname: fullname
                        }
                    })
                },
                equifax: function (profile) {
                    return $http({
                        method: 'GET',
                        url: creditURL.equifax,
                        params: {
                            profile: profile
                        }
                    })
                },
                experion: function (profile) {
                    return $http({
                        method: 'GET',
                        url: creditURL.experion,
                        params: {
                            profile: profile
                        }
                    })
                },
                getPanFromMobile: function (mobile, fullname) {
                    return $http({
                        method: 'GET',
                        url: creditURL.getPanFromMobile,
                        params: {
                            mobile: mobile,
                            fullname: fullname
                        }
                    })
                },
                kycPanPlus: function (profile, pan_number) {
                    return $http({
                        method: 'GET',
                        url: creditURL.kycPanPlus,
                        params: {
                            profile: profile,
                            pan_number: pan_number
                        }
                    })
                },
                panComprehensive: function (pan_number) {
                    return $http({
                        method: 'GET',
                        url: creditURL.panComprehensive,
                        params: {
                            id_number: pan_number
                        }
                    })
                },
                KYCPanToAadhar: function (profile, pan_number) {
                    return $http({
                        method: 'GET',
                        url: creditURL.KYCPanToAadhar,
                        params: {
                            profile: profile,
                            pan_number: pan_number
                        }
                    })
                },
                KYCAllFromMobile: function (profile, mobile, fullname) {
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
                mobileToMultipleUPI: function (mobile) {
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