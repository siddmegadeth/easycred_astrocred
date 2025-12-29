app.service('httpTimeoutInterceptors', ['$timeout', '$rootScope', function($timeout, $rootScope) {

    return {
        request: function(config) {
            config.timeout = 18000;

            // 🔐 REQUIRED FOR SESSION COOKIE
            config.withCredentials = true;

            return config;
        },
        response: function(response) {
            return response;
        }
    };

}]);



app.service('httpInterceptors', [
    '$timeout',
    '$rootScope',
    '$q',
    function ($timeout, $rootScope, $q) {

        var numLoadings = 0;
        var isLoggingOut = false; // 🔐 prevent multiple triggers

        return {

            request: function (config) {

                config.timeout = 18000;
                config.withCredentials = true;

                if (window.localStorage.easycred_astro_access_token) {
                    config.headers = config.headers || {};
                    config.headers.Authorization =
                        "Bearer " + window.localStorage.easycred_astro_access_token;
                }

                $rootScope.NavProgress = true;
                numLoadings++;

                $rootScope.$broadcast("loader_show");
                $rootScope.$broadcast("progress_loader_show");

                return config;
            },

            response: function (response) {

                if ((--numLoadings) === 0) {
                    $rootScope.$broadcast("loader_hide");
                    $rootScope.$broadcast("progress_loader_hide");
                }

                $rootScope.NavProgress = false;
                return response;
            },

            responseError: function (response) {

                if (!isLoggingOut &&
                    (response.status === 401 || response.status === 440)) {

                    isLoggingOut = true;

                    $rootScope.$emit('session-expired', {
                        reason: 'SESSION_EXPIRED'
                    });
                }

                if ((--numLoadings) <= 0) {
                    $rootScope.$broadcast("loader_hide");
                    $rootScope.$broadcast("progress_loader_hide");
                }

                $rootScope.NavProgress = false;

                return $q.reject(response);
            },

            requestError: function (rejection) {

                $rootScope.$broadcast("loader_hide");
                $rootScope.$broadcast("progress_loader_hide");
                $rootScope.NavProgress = false;

                return $q.reject(rejection);
            }
        };
    }
]);
