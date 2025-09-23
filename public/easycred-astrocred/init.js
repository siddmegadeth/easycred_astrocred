var DI = [
    'fcsa-number',
    'ngSanitize',
    'ngMessages',
    'ngAria',
    'ghiscoding.validation',
    'pascalprecht.translate',
    'ngFileUpload',
    'ngRoute'
];

var app = angular.module('myApp', DI);
log = console.log.bind(console);
error = console.error.bind(console);
warn = console.warn.bind(console);
window.socket;

Offline.options = {
    checkOnLoad: true,
    interceptRequests: true,
    reconnect: {
        // How many seconds should we wait before rechecking.
        initialDelay: 3,
        delay: 10
        // How long should we wait between retries.
    },
    requests: true,
    game: false
};
Offline.on('down', function() {
    log("Down");
});
Offline.on('confirmed-down', function() {
    log(" confirmedDown");

});

Offline.on('confirmed-up', function() {
    log("confirmed Up");

});


app.config(['productionModeProvider', 'utilityProvider', 'geoIPServicesProvider', '$httpProvider', '$translateProvider', 'surePassProvider', 'authenticationProvider', '$routeProvider', '$locationProvider', function(productionModeProvider, utilityProvider, geoIPServicesProvider, $httpProvider, $translateProvider, surePassProvider, authenticationProvider, $routeProvider, $locationProvider) {

    $locationProvider.html5Mode({
        enabled: false,
        requireBase: true
    });

    $locationProvider.hashPrefix('');

    $translateProvider.useStaticFilesLoader({
        prefix: 'locales/',
        suffix: '.json'
    });

    $translateProvider.preferredLanguage('en');

    var productionLink = productionModeProvider.config({
        type: 'development',
        servername: 'https://astrocred.easycred.co.in'
    });

    $httpProvider.interceptors.push('httpInterceptors');
    $httpProvider.interceptors.push('httpTimeoutInterceptors');

    $routeProvider
        .when('/', {
            templateUrl: 'templates/landing.html',
            config: {
                requireLogin: false,
                isPrivate: false,
                showNavLink: true,
                showLoginLink: true,
                showLogoutLink: false
            },
            resolve: {
                authenticated: function($q, stateManager, $location) {

                    if (stateManager.isUserLogggedIn()) {
                        return $q.when(true);
                    } else {
                        // $location.path("login");
                        //show popup
                    }
                }
            }
        })
        .when('/home', {
            templateUrl: 'templates/home.html',
            controller: 'homeCtrl',
            config: {
                requireLogin: true,
                isPrivate: true,
                showNavLink: true

            },
            resolve: {
                authenticated: function($q, stateManager, $location) {

                    if (stateManager.isUserLogggedIn()) {
                        return $q.when(true);
                    } else {
                        $location.path("login");
                        //show popup
                    }
                }
            }
        })
        .when('/profile', {
            templateUrl: 'templates/profile.html',
            config: {
                requireLogin: true,
                isPrivate: true,
                showNavLink: true

            },
            resolve: {
                authenticated: function($q, stateManager, $location) {

                    if (stateManager.isUserLogggedIn()) {
                        return $q.when(true);
                    } else {
                        $location.path("login");
                        //show popup
                    }
                }
            }
        })
        .when('/login', {
            templateUrl: 'templates/login.html',
            controller: 'loginCtrl',
            config: {
                requireLogin: false,
                isPrivate: false,
                showNavLink: false

            },
            resolve: {
                authenticated: function($q, stateManager, $location) {

                    if (stateManager.isUserLogggedIn()) {
                        $location.path("/home");
                    } else {
                        //$location.path("/login");
                        //show popup
                    }
                }
            }
        })
        .when('/logout', {
            templateUrl: 'templates/logout.html',
            controller: 'logoutCtrl',

            config: {
                requireLogin: false,
                isPrivate: false,
                showNavLink: true
            },
            resolve: {
                authenticated: function($q, stateManager, $location) {

                    if (stateManager.isUserLogggedIn()) {
                        $location.path("/home");
                    } else {}
                }
            }
        })
        .when('/sign-up', {
            templateUrl: 'templates/sign-up.html',
            controller: 'loginCtrl',
            config: {
                requireLogin: false,
                isPrivate: false,
                showNavLink: true

            }

        })
        .when('/access-denied', {
            templateUrl: 'templates/access-denied.html',
            config: {
                requireLogin: false,
                isPrivate: false,
                showNavLink: true

            }
        })
        .otherwise({
            redirectTo: '/access-denied'
        });




    var prod = {
        ip_url: {
            getGeoFromIP: productionLink + '/get/website/internet/protocol/address',
        },
        authentication: {
            generateOTP: productionLink + "/get/auth/otp/send/fast2sms",
            validateOTP: productionLink + "/get/auth/otp/validate/fast2sms",
        },
        utility: {
            validateToken: productionLink + '/post/validate/token',
            getSupportedCountries: productionLink + '/get/supported/countries',
            getCurrencySymbol: productionLink + '/get/currency/list',
            getCurrencyCode: productionLink + '/get/currency/code',
            isAdmin: productionLink + '/get/admins/list',
            fetchTerms: productionLink + '/get/terms/conditions',
            acceptTerms: productionLink + '/get/terms/conditions/accept',
            fetchConcentForm: productionLink + "/get/kyc/concent/form",
            giveKYCConcent: productionLink + "/get/consent/kyc/accept"
        },
        surepass: {
            cibil: productionLink + "/get/check/credit/report/cibil",
            equifax: productionLink + "/get/check/credit/report/equifax",
            experion: productionLink + "/get/check/credit/report/experion",
            KYCMobileToPAN: productionLink + "/get/surepass/kyc/pan/from/mobile",
            kycPanPlus: productionLink + "/get/surepass/kyc/pan/plus",
            KYCPanToAadhar: productionLink + "/get/surepass/kyc/aadhar/from/pan",
            KYCAllFromMobile: productionLink + "/get/surepass/pan/aadhar/from/mobile",
            mobileToMultipleUPI: productionLink + "/get/surepass/mobile/to/multiple/upi"
        }
    };

    utilityProvider.config(prod.utility);
    geoIPServicesProvider.config(prod.ip_url);
    surePassProvider.config(prod.surepass);
    authenticationProvider.config(prod.authentication);
}]);

app.run(['$rootScope', '$location', 'stateManager', '$window', function($rootScope, $location, stateManager, $window) {

    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        var config = next.config;
        log(config);
        $rootScope.config = config;


        if ($rootScope.config.requireLogin) {
            if (stateManager.isUserLogggedIn()) {

            } else {
                stateManager.clearLocalStorage();
                $location.url("/login");
            }
        } else {
            log('View For Public $routeChangeStart');
        }


    });

    $rootScope.$on('$routeChangeSuccess', function(event, next, current) {
        warn('$routeChangeSuccess');
        var config = next.config;
        log(config);
        $rootScope.config = config;

        if ($rootScope.config.requireLogin) {
            if (stateManager.isUserLogggedIn()) {
                $rootScope.showNavLink = config.showNavLink;
                $rootScope.showLoginLink = false;
                $rootScope.showLogoutLink = true;
            } else {

                $rootScope.showNavLink = false;
                $rootScope.showLoginLink = true;
                $rootScope.showLogoutLink = false;
            }
        } else {

            if (stateManager.isUserLogggedIn()) {
                $rootScope.showNavLink = config.showNavLink;
                $rootScope.showLoginLink = false;
                $rootScope.showLogoutLink = true;
            } else {
                log('View For Public $routeChangeSuccess');
                $rootScope.showNavLink = false;
                $rootScope.showLoginLink = true;
                $rootScope.showLogoutLink = false;
            }


        }




    });


}]);



app.directive('currencyInput', function($filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            element.on('keydown', function(event) {
                // Allow backspace, delete, tab, and arrow keys
                if (event.keyCode == 8 || event.keyCode == 46 || event.keyCode == 9 ||
                    (event.keyCode >= 37 && event.keyCode <= 40)) {
                    return;
                }
                // Allow only numbers and decimal point
                if ((event.keyCode < 48 || event.keyCode > 57) && event.keyCode !== 190) {
                    event.preventDefault();
                }
            });

            element.on('blur', function() {
                var value = element.val();
                if (value) {
                    var formattedValue = $filter('currency')(parseFloat(value), '₹');
                    log('Formatted Value :');
                    log(formattedValue);
                    element.val(formattedValue);
                    ngModel.$setViewValue(parseFloat(value));
                }
            });

            ngModel.$parsers.push(function(value) {
                if (value) {
                    var strValue = value.toString(); // Fix: convert to string before replace
                    log(strValue);
                    return parseFloat(strValue.replace(/[^0-9\.]/g, ''));
                }
                return null;
            });
        }
    };
});



app.filter('statusDisplay', function() {
    return function(input) {
        if (!input) return '';
        // Convert status codes to display-friendly text
        const statusMap = {
            'CREATED': 'Submitted',
            'OFFERED': 'Offer Received',
            'ACTION_REQUIRED': 'Action Required',
            'OFFER_ACCEPTED': 'Offer Accepted',
            'KYC_COMPLETED': 'Processing',
            'GRANTED': 'Approved',
            'REPAYMENT_SETUP_COMPLETED': 'Disbursed',
            'AGREEMENT_SIGNED': 'Agreement Signed',
            'THEMIS_REJECTED': 'Rejected'
        };
        return statusMap[input] || input;
    };
});