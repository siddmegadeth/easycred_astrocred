var DI = [
    'onsen',
    'fcsa-number',
    'ngSanitize',
    'ngMessages',
    'ngAria',
    'ghiscoding.validation',
    'pascalprecht.translate',
    'ngFileUpload',
    'fcsa-number'
];

var app = angular.module('myApp', DI);
log = console.log.bind(console);
error = console.error.bind(console);
warn = console.warn.bind(console);
window.socket;

ons.ready(function() {

    console.log('is Android ' + ons.platform.isAndroidPhone());
    console.log('Is iOS ' + ons.platform.isIOS());

    if (ons.platform.isAndroidPhone()) {
        ons.platform.select('ios');
    } else if (ons.platform.isIOS()) {
        ons.platform.select('ios');
    } else {
        ons.platform.select('ios');
    }
    if (ons.isWebView()) {
        warn('Running On A Android/iOS Device  ');
    } else {
        warn('Running On A Browser ');
    }

    ons.setDefaultDeviceBackButtonListener(function() {
        if (ons.notification.confirm("Are you sure to close the app?",
                function(index) {
                    console.log(index);
                    if (index === 1) { // OK button
                        navigator.app.exitApp(); // Close the app
                    }
                }
            ));
    });

    history.pushState(null, null, location.href);
    window.onpopstate = function() {
        history.go(1);
    };

    window.onbeforeunload = function() { alert("Your work will be lost.") };

});

app.config(['productionModeProvider', 'utilityProvider', 'profileEventProvider', 'geoIPServicesProvider', '$httpProvider', '$translateProvider', 'sandboxProvider', 'kycProvider', 'juspayProvider', 'mmtcProvider', 'surePassProvider', 'authenticationProvider', function(productionModeProvider, utilityProvider, profileEventProvider, geoIPServicesProvider, $httpProvider, $translateProvider, sandboxProvider, kycProvider, juspayProvider, mmtcProvider, surePassProvider, authenticationProvider) {

    $translateProvider.useStaticFilesLoader({
        prefix: 'locales/',
        suffix: '.json'
    });

    $translateProvider.preferredLanguage('en');

    var productionLink = productionModeProvider.config({
        type: 'development',
        servername: 'https://retail.easycred.co.in'
    });

    $httpProvider.interceptors.push('httpInterceptors');
    $httpProvider.interceptors.push('httpTimeoutInterceptors');

    var prod = {
        ip_url: {
            getGeoFromIP: productionLink + '/get/website/internet/protocol/address',
        },
        authentication: {
            generateWABusinessOtp: productionLink + "/get/auth/otp/fast2sms/whatsapp/business",
            authenticateWABusinessOtp: productionLink + "/get/auth/otp/fast2sms/whatsapp/business/validate",
            generateOTP: productionLink + "/get/auth/otp/send/fast2sms",
            validateOTP: productionLink + "/get/auth/otp/validate/fast2sms",
        },
        profile_event: {
            userOnboardingSocialLogin: productionLink + '/get/auth/user/onboarding/social/login',
            completeProfile: productionLink + '/post/user/onboarding/complete/profile',
            editProfile: productionLink + '/post/user/onboarding/edit/update/profile',
            otpLessAuth: productionLink + "/auth/otp/less",
            editSocialMediaProfile: productionLink + '/get/user/onboarding/edit/social/media',
            updateBackgroundImage: productionLink + "/post/profile/update/background/image",
            fetchProfile: productionLink + "/get/auth/fetch/updated/profile",
            createPaySprintProfile: productionLink + "/post/paysprint/create/profile",
            fetchPaySprintProfile: productionLink + "/get/paysprint/fetch/profile",
            confirmPaySprintProfile: productionLink + "/post/paysprint/confirm/profile"
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
        mmtc: {
            customers: {
                createProfile: productionLink + "/get/mmtc/customer/create/profile",
                getProfile: productionLink + "",
                getPortfolio: productionLink + "/get/mmtc/customer/get/portfolio",
                activation: productionLink + "",
                deactivation: productionLink + "",
                updateProfile: productionLink + "",
                syncProfile: productionLink + "/post/mmtc/customer/sync/profile",
                checkIfMMTCProfileExist: productionLink + "/get/mmtc/customer/check/profile"
            },
            prices: {
                goldPriceHistory: productionLink + '/get/mmtc/prices/historical/gold/prices',
                silverPriceHistory: productionLink + '/get/mmtc/prices/historical/silver/prices'
            },
            pvt: {
                getNonExecutableQuote: productionLink + "/get/mmtc/pvt/non/executable/quote",
                getAddresses: productionLink + "/get/mmtc/pvt/get/address",
            },
            trade: {
                validateQuote: productionLink + '/post/paysprint/api/v1/service/digitalgold/trade/validate_quote',
                getQuoteBuy: productionLink + '/post/mmtc/trade/getquote/buy',
                getQuoteSell: productionLink + '/post/mmtc/trade/getquote/sell',
                validateOrderAndExecute: productionLink + '/post/mmtc/trade/validate/order/and/execute',
                validateOrderAndExecuteQuantity: productionLink + '/post/mmtc/trade/validate/order/and/execute/quantity',
                executeOrderWithPayIn: productionLink + '/post/mmtc/trade/execute/order/with/mmtc/payment/gateway',
                executeOrderWithPayOut: productionLink + '/post/mmtc/trade/execute/order/with/mmtc/payment/gateway/pay/out',
                getOrderHistory: productionLink + '/post/mmtc/trade/get/order/history'
            },
            payments: {
                paymentOptionsUPI: productionLink + '/get/mmtc/payments/get/payment/options/upi',
                paymentOptionsBank: productionLink + '/get/mmtc/payments/get/payment/options/bank'

            }
        },
        sandbox: {
            verifyKYC: productionLink + '/post/sandbox/verify/kyc',
            initAadharVerification: productionLink + '/get/sandbox/generate/aadhar/card/otp/kyc',
            validateAadharOTP: productionLink + '/get/sandbox/validate/aadhar/card/kyc/otp',
        },
        kyc_endpoint: {
            completeKYC: productionLink + '/post/kyc/complete/kyc/onboarding',
            validateKYC: productionLink + '/post/kyc/validate/kyc/status',
            updateVerifiedAadhar: productionLink + '/post/kyc/aadhar/update/verified/aadhar'
        },
        juspay_endpoint: {
            generateLoanLink: productionLink + "/get/juspay/api/loan/link/generate",
            customerStatus: productionLink + "/get/juspay/api/customer/status",
            fetchAllLoans: productionLink + '/get/juspay/api/retail/fetch/all/personal/loans/journey',
            loanStatistics: productionLink + '/get/juspay/api/retail/fetch/all/personal/loans/statistics/data',
            generateMagicLoanLink: productionLink + "/get/juspay/api/loan/link/generate/magic/link",
            updateLoanStatus: productionLink + '/get/juspay/api/customer/update/loan/status',
            completeProfile: productionLink + '/get/juspay/api/customer/profile/complete',
            applyOnBehalf : productionLink + '/get/juspay/api/loan/link/generate/apply/on/behalf'
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
    profileEventProvider.config(prod.profile_event);
    geoIPServicesProvider.config(prod.ip_url);
    sandboxProvider.config(prod.sandbox);
    kycProvider.config(prod.kyc_endpoint);
    juspayProvider.config(prod.juspay_endpoint);
    mmtcProvider.config(prod.mmtc);
    surePassProvider.config(prod.surepass);
    authenticationProvider.config(prod.authentication);
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

app.run(['$rootScope', 'stateManager', function($rootScope, stateManager) {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZ2V0aGlrZWFwcCIsImEiOiJja2J0Z2l4cnkwOTN3MnJsaXRwdGMxcnVyIn0.MBRU5vDIM-DdcuHTsNuK7Q';
}]);

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