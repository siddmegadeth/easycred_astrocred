app.provider('productionMode', [function() {
    var runType;
    var modeType = {};

    return {
        config: function(mode) {

            if (window.localStorage.easycred_astrocred_last_mode_app) {
                // check if mode has changed or not
                if (window.localStorage.easycred_astrocred_last_mode_app == mode.type) {
                    warn('Production Mode Has Not Changed')
                    log(window.localStorage.easycred_astrocred_last_mode_app);
                } else {
                    warn('Production Mode Has Changed.Adding New Mode And Resetting Browser With New Mode :');
                    //window.localStorage.removeItem("easycred_astrocred_profile");
                    warn('Production Mode Has Changed.Adding New Mode And Resetting Browser With New Mode :');
                    window.localStorage.removeItem("easycred_astrocred_profile");
                    window.localStorage.removeItem("easycred_astrocred_website_last_mode");
                    window.localStorage.setItem("easycred_astrocred_website_last_mode", mode.type);
                    window.localStorage.setItem("easycred_astrocred_last_mode_app", mode.type);
                }
            } else {
                warn('Setting New Mode :');
                window.localStorage.setItem("easycred_astrocred_last_mode_app", mode.type);
            }


            if (mode.type == 'production' || mode.type == 'prod') {
                runType = mode.servername;
                modeType.base = runType;
                modeType.type = 'production';

                window.socket = io(runType, {
                    withCredentials: true,
                    transports: ['websocket']
                });
                warn('Socket :');
                log(window.socket);
                return runType;
                // log()
                return runType;

            } else if (mode.type == 'development' || mode.type == 'dev') {
                // runType = 'http://' + window.location.host;
                runType = location.protocol + '//' + location.host;
                modeType.base = runType;
                modeType.type = 'development';

                log(runType);
                window.socket = io(runType, {
                    withCredentials: true,
                    transports: ['websocket']
                });
                warn('Socket :');
                log(window.socket);
                return runType;
                log(runType);

                return runType;
            }
        },
        $get: ['$http', function($http) {
            return {
                getMode: function() {
                    return modeType.base;
                },
                getHostMode: function() {
                    return modeType;
                },
                getPreviewMode: function() {
                    return mode.servername
                }
            }
        }]

    }
}])