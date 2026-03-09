app.provider('languageServices', [function() {

    var currentSelectedLanguage;
    return {
        config: function(languageSelected) {
            currentSelectedLanguage = languageSelected.language;
            window.localStorage.setItem("easycred_retail_selected_language", currentSelectedLanguage);
        },
        isAvailable: function() {
            if (window.localStorage.easycred_retail_selected_language) {
                return true;
            } else {
                return false;
            }
        },
        set: function(lang) {
            window.localStorage.setItem("easycred_retail_selected_language", lang);
        },
        get: function() {
            if (window.localStorage.easycred_retail_selected_language) {
                return window.localStorage.easycred_retail_selected_language;
            } else {
                return false;
            }

        },
        $get: ['$http', 'stateManager', function($http, stateManager) {
            return {
                isAvailable: function() {
                    if (window.localStorage.easycred_retail_selected_language) {
                        return true;
                    } else {
                        return false;
                    }
                },
                set: function(lang) {
                    window.localStorage.setItem("easycred_retail_selected_language", lang);
                },
                get: function() {
                    if (window.localStorage.easycred_retail_selected_language) {
                        return window.localStorage.easycred_retail_selected_language;
                    } else {
                        return false;
                    }

                },
            }
        }]
    }
}])