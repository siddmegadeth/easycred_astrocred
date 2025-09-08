app.provider('profileEvent', [function() {

    var userOnboarURL;
    return {
        config: function(url) {

            userOnboarURL = url.profile_event || url;

        },
        $get: ['$http', function($http) {
            return {
                otpLessAuth: function(user) {
                    return $http({
                        method: 'POST',
                        url: userOnboarURL.otpLessAuth,
                        params: {
                            user: user
                        }
                    })
                },
                userOnboardingSocialLogin: function(user) {
                    return $http({
                        method: 'GET',
                        url: userOnboarURL.userOnboardingSocialLogin,
                        params: {
                            user: user
                        }
                    })
                },
                completeProfile: function(profile) {
                    return $http({
                        method: 'POST',
                        url: userOnboarURL.completeProfile,
                        params: {
                            profile: profile
                        }
                    })
                },
                editProfile: function(profile) {
                    return $http({
                        method: 'POST',
                        url: userOnboarURL.editProfile,
                        params: {
                            profile: profile
                        }
                    })
                },
                updateBackgroundImage: function(profile, background_image) {
                    return $http({
                        method: 'POST',
                        url: userOnboarURL.updateBackgroundImage,
                        params: {
                            profile: profile,
                            background_image: background_image
                        }
                    })
                },
                editSocialMediaProfile: function(profile) {
                    return $http({
                        method: 'GET',
                        url: userOnboarURL.editSocialMediaProfile,
                        params: {
                            profile: profile
                        }
                    })
                },
                fetchProfile: function(profile) {
                    return $http({
                        method: 'GET',
                        url: userOnboarURL.fetchProfile,
                        params: {
                            profile: profile
                        }
                    })
                },
                createPaySprintProfile: function(profile, customer_id, create_profile) {
                    return $http({
                        method: 'POST',
                        url: userOnboarURL.createPaySprintProfile,
                        params: {
                            profile: profile,
                            customer_id: customer_id,
                            create_profile: create_profile
                        }
                    })
                },
                fetchPaySprintProfile: function(profile, customer_id) {
                    return $http({
                        method: 'GET',
                        url: userOnboarURL.fetchPaySprintProfile,
                        params: {
                            profile: profile,
                            customer_id: customer_id
                        }
                    })
                },

                confirmPaySprintProfile: function(profile) {
                    return $http({
                        method: 'POST',
                        url: userOnboarURL.confirmPaySprintProfile,
                        params: {
                            profile: profile
                        }
                    })
                }
            }
        }]
    }
}])