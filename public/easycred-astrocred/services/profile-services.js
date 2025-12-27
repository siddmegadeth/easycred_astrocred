app.provider('profileOperations', [function() {
    return {
        config: function(url) {

            profileURL = url.profile || url;
        },
        $get: ['$http', function($http) {
            return {

                completeOnboarding: function(profile) {
                    return $http({
                        method: 'POST',
                        url: profileURL.completeOnboarding,
                        params: {
                            profile: profile
                        }
                    })
                },
            }
        }]

    }
}])