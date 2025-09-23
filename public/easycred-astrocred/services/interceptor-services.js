app.service('httpTimeoutInterceptors', ['$timeout', '$rootScope', function($timeout, $rootScope) {

    return {


        request: function(config) {
            config.timeout = 18000;
            // $rootScope.$broadcast("loader_hide");
            // $rootScope.$broadcast("progress_loader_hide");
            return config;
        },
        response: function(config) {
            // $rootScope.$broadcast("loader_hide");
            // $rootScope.$broadcast("progress_loader_hide");

            return config;
        }

    }

}]);


app.service('httpInterceptors', ['$timeout', '$rootScope', '$q', function($timeout, $rootScope, $q) {

    var numLoadings = 0;

    return {
        request: function(config) {

            config.timeout = 18000;
            if (window.localStorage.easycred_astro_access_token) {
                var token = window.localStorage.easycred_astro_access_token;
                if (token != undefined || token != null) {

                    // get token from a cookie or local storage
                    config.headers = config.headers || {};
                    config.headers.Authorization = "Bearer " + token;
                }
            }
            $rootScope.NavProgress = true;

            numLoadings++;

            // Show loader
            $rootScope.$broadcast("loader_show");
            $rootScope.$broadcast("progress_loader_show");
            return config || $q.when(config)

        },
        response: function(config) {

            if ((--numLoadings) === 0) {
                // Hide loader
                $rootScope.$broadcast("loader_hide");
                $rootScope.$broadcast("progress_loader_hide");

            }
            $rootScope.NavProgress = false;

            return config || $q.when(config);

        },
        requestError: function(config) {

            $rootScope.$broadcast("loader_hide");
            $rootScope.$broadcast("progress_loader_hide");
            $rootScope.$broadcast("request_error");

            $rootScope.NavProgress = false;

            return config;

        },
        responseError: function(config) {
            warn('Response Error HTTPS :');
            log(config);
            log(config.data);
            if (config.data.forceLogout) {
                $rootScope.$emit('force-logout', {});
            }

            $rootScope.$emit('exception-occured', {});
            if (config.status == -1) {
                warn("Slow/Or Network Issue Detected");
                $rootScope.$broadcast("loader_hide");
                $rootScope.$broadcast("progress_loader_hide");
                $rootScope.$broadcast("request_error");

                ons.notification.toast({
                    message: "Some Network Issue Has Occured",
                    timeout: 4000,
                    buttonLabel: 'Ok'
                }).then(function() {})
                //document.querySelector('#myNavigator').resetToPage('offline.html');

            } else {
                $rootScope.$broadcast("loader_hide");
                $rootScope.$broadcast("progress_loader_hide");
                $rootScope.$broadcast("request_error");
                
            }

            if (!(--numLoadings)) {
                // Hide loader
                $rootScope.$broadcast("loader_hide");
                $rootScope.$broadcast("progress_loader_hide");
                $rootScope.$broadcast("request_error");

            }
            $rootScope.NavProgress = false;

            return $q.reject(config);

        }


    }

}]);