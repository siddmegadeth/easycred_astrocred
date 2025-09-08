app.service('admins', ['$timeout', '$http', function($timeout, $http) {

    return {
        isAdmin: function() {
            return $http({
                method: 'GET',
                url: '/get/admins/list'
            })
        },
        createProfile: function(profile) {
            return $http({
                method: 'POST',
                url: "/post/admins/create/user/profile",
                params: {
                    profile: profile
                }
            })
        },
        fetchAllProfiles: function(profile) {
            return $http({
                method: 'GET',
                url: "/get/admins/fetch/user/profile",
            })
        },
        createAds: function(config) {
            return config;
        }
    }
}]);