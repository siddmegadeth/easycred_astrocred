app.provider('geoIPServices', [function() {

    var ipURL;
    return {
        config: function(url) {

            ipURL = url.ip_url || url;

        },
        $get: ['$http', function($http) {
            return {
                getGeoFromIP: function(callback) {

                    if (!window.localStorage.easycred_retail_country_code && window.localStorage.easycred_retail_country_code == undefined || window.localStorage.easycred_retail_country_code == null) {
                        warn('Getting IP Address');
                        return $http({
                            method: 'GET',
                            url: ipURL.getGeoFromIP,
                        }).then(function(resp) {

                            warn('Your Current IP Is');
                            log(resp);
                            callback(resp.data.data);
                        });
                    } else {
                         warn('Getting Saved IP Address');
                        callback(JSON.parse(window.localStorage.easycred_retail_country_code));
                    }
                }
            }
        }]
    }
}])