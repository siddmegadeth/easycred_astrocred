app.provider('cibilCore', [function() {
    var mmtcURL;
    return {
        config: function(url) {

            cibilURL = url.cibil_core || url;
        },
        $get: ['$http', function($http) {
            return {

                cibil: function(profile) {
                    return $http({
                        method: 'GET',
                        url: cibilURL.cibil,
                        params: {
                            profile: profile
                        }
                    })
                }

            }
        }]

    }
}])