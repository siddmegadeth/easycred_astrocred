app.provider('utility', [function() {

    var utilURL;
    var currencyCodeStatus;
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
                validateAadharCard: function(aadhaar_number) {

                    // Regex to check valid
                    // aadhaar_number  
                    let regex = new RegExp(/^[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}$/);

                    // if aadhaar_number 
                    // is empty return false
                    if (aadhaar_number == null) {
                        return false;
                    }

                    // Return true if the aadhaar_number
                    // matched the ReGex
                    if (regex.test(aadhaar_number) == true) {
                        return true;
                    } else {
                        return false;
                    }
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