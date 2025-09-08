app.provider('stateManager', [function() {

    var stateManagerURL;
    var object;
    return {

        config: function(configRoute) {
            window.localStorage.setItem("easycred_retail_app_access_token", false);
            warn('Setting website_access_token_status to False On Page Reload');
            warn("Status : " + window.localStorage.easycred_retail_app_access_token);
            log(configRoute);
            stateManagerURL = configRoute;
        },
        $get: ['$http', function($http) {
            return {
                clearSaveSearchKey: function(key) {
                    window.localStorage.removeItem("easycred_retail_search_key");

                },
                saveSearchKey: function(key) {
                    window.localStorage.setItem("easycred_retail_search_key", JSON.stringify(key));
                },
                checkIfSaveSearchKeyAvailable: function() {
                    if (window.localStorage.easycred_retail_search_key) {
                        return true;
                    } else {
                        return false;
                    }
                },
                getSaveSearchKey: function() {
                    if (window.localStorage.easycred_retail_search_key) {
                        return JSON.parse(window.localStorage.easycred_retail_search_key);
                    } else {
                        return [];
                    }
                },
                checkIfUserGeoLocationAvailable: function() {
                    if (window.localStorage.easycred_retail_user_geolocation) {
                        return true;
                    } else {
                        return false;
                    }
                },
                saveUserGeoLocation: function(user_geolocation) {
                    window.localStorage.setItem("easycred_retail_user_geolocation", JSON.stringify(user_geolocation));
                },
                getUserGeoLocation: function() {
                    if (window.localStorage.easycred_retail_user_geolocation) {
                        return JSON.parse(window.localStorage.easycred_retail_user_geolocation);
                    } else {
                        return [];
                    }
                },
                setObject: function(objectTuple) {
                    object = objectTuple;
                },
                getObject: function() {
                    return object;
                },

                isUserLogggedIn: function() {
                    if (window.localStorage.easycred_retail_app_access_token && window.localStorage.easycred_retail_profile) {
                        if (window.localStorage.easycred_retail_app_access_token != "undefined" && window.localStorage.easycred_retail_profile != "undefined" || window.localStorage.easycred_retail_app_access_token != null && window.localStorage.easycred_retail_profile != null)
                            return true;
                        else
                            return false;
                    } else
                        return false;
                },
                saveSupportedCountry: function(country) {

                    window.localStorage.setItem("easycred_retail_app_supported_country", JSON.stringify(country));
                },
                getSupportedCountry: function() {
                    if (window.localStorage.easycred_retail_app_supported_country)
                        return JSON.parse(window.localStorage.easycred_retail_app_supported_country);
                },
                isSupportedCountryExist: function() {
                    if (window.localStorage.easycred_retail_app_supported_country)
                        return true;
                    else
                        return false;
                },
                saveProfile: function(profile) {
                    window.localStorage.removeItem("easycred_retail_profile");
                    window.localStorage.setItem("easycred_retail_profile", JSON.stringify(profile));
                },
                getProfile: function() {
                    if (window.localStorage.easycred_retail_profile) {
                        var profile = JSON.parse(window.localStorage.easycred_retail_profile);
                        log(profile);
                        return profile;
                    }
                },
                isProfileExist: function() {
                    // check both exist and if empty
                    if (window.localStorage.easycred_retail_profile) {
                        // check if value is empty or null
                        var value = window.localStorage.easycred_retail_profile;
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
                    if (window.localStorage.easycred_retail_profile) {
                        // check if value is empty or null
                        var profileTuple = JSON.parse(window.localStorage.easycred_retail_profile);
                        if (profileTuple.isProfileCompleted) {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                },
                isKYCCompleted: function() {
                    // check both exist and if empty
                    if (window.localStorage.easycred_retail_profile) {
                        // check if value is empty or null
                        var profileTuple = JSON.parse(window.localStorage.easycred_retail_profile);
                        if (profileTuple.isKYCCompleted) {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                },
                getAccessToken: function() {
                    if (window.localStorage.easycred_retail_app_access_token)
                        return window.localStorage.easycred_retail_app_access_token;
                },
                saveAccessToken: function(access_token) {
                    return window.localStorage.setItem("easycred_retail_app_access_token", access_token);
                },
                isAccessTokenFound: function() {
                    if (window.localStorage.easycred_retail_app_access_token) {
                        if (window.localStorage.easycred_retail_app_access_token == undefined || window.localStorage.easycred_retail_app_access_token == 'undefined') {
                            return false;
                        } else {
                            return true;
                        }
                    } else {
                        return false;
                    }

                },
                isAccessTokenVerified: function() {
                    if (window.localStorage.easycred_retail_app_access_token)
                        return window.localStorage.easycred_retail_app_access_token
                    else
                        return false;
                },
                setAccessTokenVerificationStatus: function(status) {
                    return window.localStorage.setItem("easycred_retail_app_access_token", status);

                },
                verifyAccessToken: function(callback) {

                    warn("Token Status : " + window.localStorage.easycred_retail_app_access_token);
                    if (window.localStorage.easycred_retail_app_access_token == true || window.localStorage.easycred_retail_app_access_token == 'true') {
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
                                window.localStorage.setItem("easycred_retail_app_access_token", true);
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
                isCurrencyExist: function() {
                    if (window.localStorage.easycred_retail_currency_code) {
                        if (window.localStorage.easycred_retail_currency_code == undefined) {
                            return false;
                        } else {
                            return true;
                        }
                    } else {
                        return false;
                    }
                },
                saveCurrencyCode: function(currency) {
                    if (currency) {
                        window.localStorage.setItem("easycred_retail_currency_code", JSON.stringify(currency));
                    }
                },
                getCurrencyCode: function() {
                    if (window.localStorage.easycred_retail_currency_code)
                        return JSON.parse(window.localStorage.easycred_retail_currency_code);
                },
                getCurrency: function() {
                    if (window.localStorage.easycred_retail_currency_code) {
                        var code = JSON.parse(window.localStorage.easycred_retail_currency_code);
                        return code.symbol;
                    }
                },
                isUserLogggedIn: function() {
                    if (window.localStorage.easycred_retail_app_access_token && window.localStorage.easycred_retail_app_access_token) {
                        if (window.localStorage.access_token != "undefined" && window.localStorage.profile != "undefined" || window.localStorage.access_token != null && window.localStorage.profile != null)
                            return true;
                        else
                            return false;
                    } else
                        return false;
                },
                isCountryCodeExist: function() {
                    if (window.localStorage.easycred_retail_website_country_code) {
                        if (window.localStorage.easycred_retail_website_country_code == undefined) {
                            return false;
                        } else {
                            return true;
                        }
                    } else {
                        return false;
                    }
                },
                saveCountryCode: function(country) {
                    if (country) {
                        window.localStorage.setItem("easycred_retail_website_country_code", JSON.stringify(country));
                    }
                },
                getCountryCode: function() {
                    if (window.localStorage.easycred_retail_website_country_code) {
                        return JSON.parse(window.localStorage.easycred_retail_website_country_code);
                    } else {
                        return {}
                    }
                },
                clearLocalStorage: function() {
                    window.localStorage.removeItem("easycred_retail_app_access_token");
                    window.localStorage.removeItem("easycred_retail_profile");
                    window.localStorage.removeItem("easycred_retail_website_country_code");
                    window.localStorage.removeItem("easycred_retail_app_access_token");
                    window.localStorage.removeItem("easycred_retail_mmtc_profile");
                    window.localStorage.removeItem("easycred_retail_currency_code");
                    window.localStorage.removeItem("easycred_retail_app_supported_country");
                    window.localStorage.removeItem("easycred_retail_last_mode_app");
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