app.provider('utility', [function() {

    var utilURL;
    var currencyCodeStatus;

    // Verhoeff tables
    var d = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
        [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
        [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
        [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
        [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
        [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
        [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
        [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];

    var p = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
        [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
        [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
        [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
        [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
        [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
        [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];
    invArray = function(array) {
        if (Object.prototype.toString.call(array) === "[object Number]") {
            array = String(array);
        }
        if (Object.prototype.toString.call(array) === "[object String]") {
            array = array.split("").map(Number);
        }
        return array.reverse();
    }

    validate = function(array) {
        var c = 0;
        var invertedArray = invArray(array);
        var has_only_numbers = !invertedArray.some(isNaN);
        if (!has_only_numbers) {
            return false;
        }
        for (var i = 0; i < invertedArray.length; i++) {
            c = d[c][p[(i % 8)][invertedArray[i]]];
        }
        return (c === 0);
    }



    return {
        config: function(url) {
            if (url.near) {
                utilURL = url.utility;
            } else {
                utilURL = url;
            }
        },
        $get: ['$http', 'stateManager', function($http, stateManager) {
            return {
                isMobileBrowser: function() {
                    // Check if the user is accessing the page on a mobile device
                    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    if (isMobile) {
                        // User is accessing the page on a mobile device
                        console.log("Mobile device detected");
                        return true;
                    } else {
                        // User is accessing the page on a desktop device
                        console.log("Desktop device detected");
                        return false;
                    }
                },
                isAdmin: function() {
                    return $http({
                        method: 'GET',
                        url: utilURL.isAdmin

                    })
                },
                acceptTerms: function(profile, consent) {
                    return $http({
                        method: 'GET',
                        url: utilURL.acceptTerms,
                        params: {
                            profile: profile,
                            consent: consent
                        }
                    })
                },
                giveKYCConcent: function(profile, consent) {
                    return $http({
                        method: 'GET',
                        url: utilURL.giveKYCConcent,
                        params: {
                            profile: profile,
                            consent: consent
                        }
                    })
                },
                fetchTerms: function() {
                    return $http({
                        method: 'GET',
                        url: utilURL.fetchTerms

                    })
                },
                fetchConcentForm: function() {
                    return $http({
                        method: 'GET',
                        url: utilURL.fetchConcentForm

                    })
                },
                getSupportedCountries: function() {

                    return $http({
                        method: 'GET',
                        url: utilURL.getSupportedCountries,

                    })
                },
                validateToken: function() {
                    return $http({
                        method: 'POST',
                        url: utilURL.validateToken
                    })
                },
                getCurrencyCode: function(countryiso) {
                    return $http({
                        method: 'GET',
                        url: utilURL.getCurrencyCode,
                        params: {
                            countryiso: countryiso
                        }
                    })
                },
                getCurrencySymbol: function() {
                    return $http({
                        method: 'GET',
                        url: utilURL.getCurrencySymbol,
                    })
                },
                validateUPIorVPA: function(upi) {
                    warn('UPI/VPA Code : ' + upi);
                    if (upi) {
                        // Regex to check valid
                        var regex = new RegExp('[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}');

                        // is empty return false
                        if (upi == null) {
                            return false;
                        }
                        // matched the ReGex
                        if (regex.test(upi) == true) {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                },
                validateIFSCCode: function(ifscCode) {
                    warn('IFSC Code : ' + ifscCode);
                    var ifscCode = ifscCode.toUpperCase();
                    warn('IFSC Code : ' + ifscCode);
                    if (ifscCode) {
                        // Regex to check valid
                        // ifsc_Code  
                        let regex = new RegExp(/^[A-Z]{4}0[A-Z0-9]{6}$/);

                        // if ifsc_Code 
                        // is empty return false
                        if (ifscCode == null) {
                            return false;
                        }

                        // Return true if the ifsc_Code
                        // matched the ReGex
                        if (regex.test(ifscCode) == true) {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                },
                validateAadharNumber: function(aadhaar_no) {
                    if (!aadhaar_no || aadhaar_no.length !== 12) {
                        return false;
                    }
                    if (aadhaar_no.startsWith('0') || aadhaar_no.startsWith('1')) {
                        return false;
                    }
                    return validate(aadhaar_no);
                },
                validatePANCard: function(panCardNo) {

                    // Regex to check valid
                    // PAN Number
                    let regex = new RegExp(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/);

                    // if PAN Number 
                    // is empty return false
                    if (panCardNo == null) {
                        return false;
                    }

                    // Return true if the PAN NUMBER
                    // matched the ReGex
                    if (regex.test(panCardNo) == true) {
                        return true;
                    } else {
                        return false;
                    }
                },
                validateGST: function(gstNumber) {
                    const gst_value = gstNumber.toUpperCase();
                    const reg = /^([0-9]{2}[a-zA-Z]{4}([a-zA-Z]{1}|[0-9]{1})[0-9]{4}[a-zA-Z]{1}([a-zA-Z]|[0-9]){3}){0,15}$/;
                    if (gst_value.match(reg)) {
                        return true;
                    } else {
                        return false;
                    }
                },
                validateBankAccountNumber: function(accountNumber) {
                    // Regex to check valid
                    // BANK ACCOUNT NUMBER CODE
                    if (accountNumber) {
                        let regex = new RegExp(/^[0-9]{9,18}$/);

                        // bank_account_number CODE
                        // is empty return false
                        if (accountNumber == null) {
                            return false;
                        }

                        // Return true if the bank_account_number
                        // matched the ReGex
                        if (regex.test(accountNumber) == true) {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }


            }
        }]
    }
}])