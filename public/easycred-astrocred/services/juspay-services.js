app.provider('juspay', [function() {
    var juspayURL;
    return {
        config: function(url) {

            juspayURL = url.juspay_endpoint || url;
        },
        $get: ['$http', function($http) {
            return {
                applyOnBehalf: function(sender, behalf_profile) {
                    return $http({
                        method: 'GET',
                        url: juspayURL.applyOnBehalf,
                        params: {
                            sender: sender,
                            behalf_profile: behalf_profile,
                        }
                    })
                },
                completeProfile: function(profile, juspay_profile) {
                    return $http({
                        method: 'GET',
                        url: juspayURL.completeProfile,
                        params: {
                            profile: profile,
                            juspay_profile: juspay_profile,
                        }
                    })
                },
                generateLoanLink: function(profile, loan_amount, loanType, location, sendLoanLinkToUser, fullname, email, mobile) {
                    return $http({
                        method: 'GET',
                        url: juspayURL.generateLoanLink,
                        params: {
                            profile: profile,
                            loan_amount: loan_amount,
                            sendLoanLinkToUser: sendLoanLinkToUser,
                            loanType: loanType,
                            location: location,
                            fullname: fullname,
                            email: email,
                            mobile: mobile
                        }
                    })
                },
                generateMagicLoanLink: function(profile, loan_amount, loanType, location, sendLoanLinkToUser) {
                    return $http({
                        method: 'GET',
                        url: juspayURL.generateMagicLoanLink,
                        params: {
                            profile: profile,
                            loan_amount: loan_amount,
                            sendLoanLinkToUser: sendLoanLinkToUser,
                            loanType: loanType,
                            location: location
                        }
                    })
                },
                customerStatus: function(profile, universal_customer_id, email, loanIntentId) {
                    return $http({
                        method: 'GET',
                        url: juspayURL.customerStatus,
                        params: {
                            profile: profile,
                            universal_customer_id: universal_customer_id,
                            email: email,
                            loanIntentId: loanIntentId
                        }
                    })
                },
                updateLoanStatus: function(profile, universal_customer_id, email, loanIntentId) {
                    return $http({
                        method: 'GET',
                        url: juspayURL.updateLoanStatus,
                        params: {
                            profile: profile,
                            universal_customer_id: universal_customer_id,
                            email: email,
                            loanIntentId: loanIntentId
                        }
                    })
                },
                fetchAllLoans: function(profile) {
                    return $http({
                        method: 'GET',
                        url: juspayURL.fetchAllLoans,
                        params: {
                            profile: profile
                        }
                    })
                },
                loanStatistics: function(profile) {
                    return $http({
                        method: 'GET',
                        url: juspayURL.loanStatistics,
                        params: {
                            profile: profile
                        }
                    })
                },

            }
        }]

    }
}])