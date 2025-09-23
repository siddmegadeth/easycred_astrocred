app.provider('stateManager', [function() {

    var stateManagerURL;
    var object;
    return {

        config: function(configRoute) {
            window.localStorage.setItem("easycred_astrocred_app_access_token", false);
            warn('Setting website_access_token_status to False On Page Reload');
            warn("Status : " + window.localStorage.easycred_astrocred_app_access_token);
            log(configRoute);
            stateManagerURL = configRoute;
        },
        $get: ['$http', function($http) {
            return {
                isUserLogggedIn: function() {
                    if (window.localStorage.easycred_astrocred_app_access_token && window.localStorage.easycred_astrocred_profile) {
                        if (window.localStorage.easycred_astrocred_app_access_token != "undefined" && window.localStorage.easycred_astrocred_profile != "undefined" || window.localStorage.easycred_astrocred_app_access_token != null && window.localStorage.easycred_astrocred_profile != null)
                            return true;
                        else
                            return false;
                    } else
                        return false;
                },
                checkAccessToken: function() {
                    return $http({
                        method: 'POST',
                        url: "/check/access/token"
                    })
                },
                saveProfile: function(profile) {
                    window.localStorage.removeItem("easycred_astrocred_profile");
                    window.localStorage.setItem("easycred_astrocred_profile", JSON.stringify(profile));
                },
                getProfile: function() {
                    if (window.localStorage.easycred_astrocred_profile) {
                        var profile = JSON.parse(window.localStorage.easycred_astrocred_profile);
                        log(profile);
                        return profile;
                    }
                },
                getAccessToken: function() {
                    if (window.localStorage.easycred_astrocred_app_access_token)
                        return window.localStorage.easycred_astrocred_app_access_token;
                },
                saveAccessToken: function(access_token) {
                    return window.localStorage.setItem("easycred_astrocred_app_access_token", access_token);
                },
                verifyAccessToken: function(callback) {

                    warn("Token Status : " + window.localStorage.easycred_astrocred_app_access_token);
                    if (window.localStorage.easycred_astrocred_app_access_token == true || window.localStorage.easycred_astrocred_app_access_token == 'true') {
                        warn('Calling localStorage As https Is Verified Earlier :');
                        callback({
                            isTokenValid: true,
                            status: true,
                            message: 'Token Verified'
                        })

                    } else {
                        warn('Calling HTTPS First Time :');
                        $http({
                            method: 'GET',
                            url: stateManagerURL.verifyAccessToken
                        }).then(function(resp) {
                            warn('Verifying Access Token');
                            log(resp);
                            if (resp.data.isTokenValid) {
                                window.localStorage.setItem("easycred_astrocred_app_access_token", true);
                                callback({
                                    isTokenValid: true,
                                    status: true,
                                    message: 'Token Verified'
                                })
                            } else {
                                callback({
                                    isTokenValid: false,
                                    status: false,
                                    message: 'Token Not Verified'
                                })
                            }
                        });
                    }
                },
                isProfileExist: function() {
                    // check both exist and if empty
                    if (window.localStorage.easycred_astrocred_profile) {
                        // check if value is empty or null
                        var value = window.localStorage.easycred_astrocred_profile;
                        if (value != null || value != 'null' || value != undefined || value != 'undefined') {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                },
                isProfileCompleted: function() {
                    // check both exist and if empty
                    if (window.localStorage.easycred_astrocred_profile) {
                        // check if value is empty or null
                        var profileTuple = JSON.parse(window.localStorage.easycred_astrocred_profile);
                        if (profileTuple.isProfileCompleted) {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                },
                clearLocalStorage: function() {
                    window.localStorage.removeItem("easycred_astrocred_app_access_token");
                    window.localStorage.removeItem("easycred_astrocred_profile");
                    window.localStorage.removeItem("easycred_astrocred_website_country_code");
                    window.localStorage.removeItem("easycred_astrocred_app_access_token");
                    window.localStorage.removeItem("easycred_astrocred_mmtc_profile");
                    window.localStorage.removeItem("easycred_astrocred_currency_code");
                    window.localStorage.removeItem("easycred_astrocred_app_supported_country");
                    window.localStorage.removeItem("easycred_astrocred_last_mode_app");
                    window.localStorage.clear();
                    document.cookie.split(';').forEach(cookie => {
                        const eqPos = cookie.indexOf('=');
                        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
                        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
                    });
                }
            }
        }]
    }


}]);