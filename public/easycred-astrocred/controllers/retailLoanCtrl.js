app.controller('retailLoanCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'juspay', 'profileEvent', function($scope, $rootScope, $timeout, stateManager, juspay, profileEvent) {
    $timeout(function() {

        $rootScope.$on('request_error', function(event, data) {
            error('request_error');
            $scope.loaderRetail.hide();
        });


        $scope.activeLinks = [];
        $scope.expiredLinks = [];
        $scope.loanJourney = [];
        warn('Retail Loan Type :');
        $scope.retailType = $scope.myNavigator.topPage.data.retailType;
        log($scope.retailType);
        warn('Init retailLoanCtrl Ready');


        $scope.isUserLogggedIn = stateManager.isUserLogggedIn();
        if (stateManager.isUserLogggedIn()) {
            $scope.profileRetail = stateManager.getProfile();
            $scope.profileDashboard = stateManager.getProfile();

            $scope.fetchLoans(false);
            //  $scope.initAuto();
            $scope.fetchUpdatedProfile();

        } else {
            $timeout(function() {
                ons.notification.alert('User Not Logged In')
                    .then(function() {
                        stateManager.clearLocalStorage();
                        $scope.myNavigator.resetToPage('login.html');

                    });
            })
        }


    }, 100);





    function isPopupBlocked() {
        var newWindow = window.open("about:blank", "_blank", "width=100,height=100");

        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
            // Popup was blocked or the window was immediately closed
            return true;
        } else {
            // Popup was likely not blocked
            newWindow.close(); // Close the test window immediately
            return false;
        }
    }


    $scope.initAuto = function() {
        window.onload = function() {
            $timeout(function() {
                $scope.initAutoComplete();
            }, 100)

        }
    }


    $scope.$on('fetch-retail-loans', function() {
        warn('fetch-retail-loans');
        $scope.fetchLoans(false);

    });



    $scope.$on('open-link-loan', function() {
        log('Link :');
        log($scope.openLinkOnApply);
        var linkWindow = window.open($scope.openLinkOnApply.loanLink, "_blank", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=yes, width=" + window.screen.availWidth, "height=" + window.screen.availHeight);

        var timer = setInterval(function() {
            if (linkWindow.closed) {
                clearInterval(timer);
                warn('closed Loan Link');
                $scope.fetchLoans(false);
            }
        }, 1000);
    })


    $scope.loanJourneyFormat = function(journeyTuple) {
        warn('loanJourneyFormat : ');
        var current = Date.now();
        warn('Current : ' + Date(current));
        $scope.expiredLinks = [];;
        $scope.activeLinks = [];

        log(journeyTuple);
        journeyTuple.forEach(function(tuple, $index) {
            warn('Link Date Expiry : ' + tuple.loanLinkExpiryTime);

            warn('Link Date : ' + new Date(tuple.loanLinkExpiryTime));

            if (current >= new Date(tuple.loanLinkExpiryTime)) {
                log('Link Expired');
                tuple.isLoanLinkExpired = true;
                tuple.LoanLinkExpireStatus = "EXPIRED";
                $scope.expiredLinks.push(tuple);

            } else {
                log('Link Not Expired');

                tuple.isLoanLinkExpired = false;
                tuple.LoanLinkExpireStatus = "ACTIVE";
                $scope.activeLinks.push(tuple);
            }

        });
        log('Formatted Journey :');
        log(journeyTuple);
        log('Active Journey :');
        log($scope.activeLinks);
        log('Expired Journey :');
        log($scope.expiredLinks);
        return journeyTuple;
    };

    $scope.fetchLoans = function(isReload, $done) {
        $scope.loaderRetail.show();

        juspay.fetchAllLoans($scope.profileRetail.profile)
            .then(function(resp) {
                $timeout(function() {
                    error('All Retail Loans');
                    log(resp);
                    $scope.loaderRetail.hide();

                    if (resp.data && resp.data.status && resp.data.isReady) {


                        if (resp.data.data.journey && resp.data.data.journey.length != 0) {
                            ons.notification.toast('Successfully Fetched Loans Applications', { timeout: 2000 });
                            log(resp.data.data.journey);
                            $scope.loanJourney = [];
                            $scope.loanJourney = $scope.loanJourneyFormat(resp.data.data.journey);
                        } else {
                            $scope.loanJourney = [];
                            //ons.notification.toast('Apply For Your First Loan', { timeout: 2000 });

                        }
                    } else {
                        ons.notification.toast('Please Try Again Later', { timeout: 2000 });
                    }

                    if (isReload) {
                        warn('Reload Done');
                        $done();
                    }
                })
            });
    }
    $scope.reload = function($done) {
        $scope.fetchLoans(true, $done);
    }

    $scope.fetchCurrentLocation = function(cb, err) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
                console.log(pos);
                cb(pos.coords);
            }, function(error) {
                console.log(error);
                err(error);
            }, { accuracy: true });
        }
    };

    $scope.openActionSheet = function() {
        ons.openActionSheet({
            title: 'Apply For PL/Topup',
            cancelable: true,
            buttons: [
                'Personal Loan Upto 5 Lakhs',
                'Top Up Loan Upto 2 Lakhs',
                'Consumer Loan Upto 1 Lakhs',
                {
                    label: 'Apply For A Friend/Family',
                    modifier: 'destructive'
                },
                {
                    label: 'Cancel',
                    modifier: 'destructive'
                }
            ]
        }).then(function(index) {
            log('Index :' + index);
            // check if consent is given or not
            log($scope.activeLinks);

            if (index != 4) {

                // // check if consent for KYC is given or not
                if ($scope.profileDashboard.consent.isAadharAccepted) {

                    if ($scope.activeLinks.length > 2) {
                        ons.notification.alert('Currently You Can Only Create 2 Active Loan Applications');
                    } else {


                        warn('Consent Is Given');
                        if (index == 0) {
                            $scope.loaderRetail.show();
                            juspay.generateLoanLink($scope.profileRetail.profile, 500000, 'PL', $scope.profileRetail.common.location, 1, $scope.profileRetail.profile_info.fullname, $scope.profileRetail.profile_info.email, $scope.profileRetail.profile_info.mobile)
                                .then(function(resp) {

                                    warn('New Loan Link Generated Upto 5L:');
                                    log(resp);
                                    if (resp.data && resp.data.status) {
                                        $scope.openLinkOnApply = resp.data.data;
                                        $scope.$emit('fetch-retail-loans', {});
                                        $scope.$emit('open-link-loan', {});
                                    } else {

                                    }
                                });
                        } else if (index == 1) {
                            $scope.loaderRetail.show();
                            juspay.generateLoanLink($scope.profileRetail.profile, 200000, 'TOPUP', $scope.profileRetail.common.location, 1, $scope.profileRetail.profile_info.fullname, $scope.profileRetail.profile_info.email, $scope.profileRetail.profile_info.mobile)
                                .then(function(resp) {
                                    warn('New Loan Link Generated Upto 2L:');
                                    log(resp);
                                    if (resp.data && resp.data.status) {
                                        $scope.openLinkOnApply = resp.data.data;
                                        $scope.$emit('fetch-retail-loans', {});
                                        $scope.$emit('open-link-loan', {});
                                    } else {

                                    }
                                });
                        } else if (index == 2) {
                            $scope.loaderRetail.show();
                            juspay.generateLoanLink($scope.profileRetail.profile, 100000, 'CONSUMER', $scope.profileRetail.common.location, 1, $scope.profileRetail.profile_info.fullname, $scope.profileRetail.profile_info.email, $scope.profileRetail.profile_info.mobile)
                                .then(function(resp) {
                                    warn('New Loan Link Generated Upto 2L:');
                                    log(resp);
                                    if (resp.data && resp.data.status) {
                                        $scope.openLinkOnApply = resp.data.data;
                                        $scope.$emit('fetch-retail-loans', {});
                                        $scope.$emit('open-link-loan', {});
                                    } else {

                                    }

                                });
                        } else if (index == 3) {
                            ons.notification.confirm('This is a new feature which allow you to apply for a new applicant such as a friend or a family member who might not be using EASYCRED platform.This will not impact your CREDIT Profile. A Magic Link would be sent via an SMS to the new applicant mobile number. Would you like to apply?')
                                .then(function(resp) {
                                    log(resp);
                                    if (resp == 1) {
                                        $scope.myNavigator.pushPage('apply-behalf.html', {
                                            animation: 'lift'
                                        });
                                    }
                                });
                        }
                    }

                } else {
                    warn('Consent Is Required');
                    $scope.myNavigator.resetToPage('kyc-consent.html', {});
                }
            }
        })

    }

    $scope.checkStatusForLoan = function(profile, link) {
        $scope.loaderRetail.show();
        warn('checkStatusForLoan ');
        log(link);
        juspay.customerStatus(profile, $scope.profileRetail.universal_customer_id, $scope.profileRetail.profile_info.email, link.loanIntentId)
            .then(function(resp) {
                $scope.loaderRetail.hide();

                warn('Customer Loan Application Status:');
                log(resp);
                if (resp.data && resp.data.isReady) {
                    log('Loan Application length ' + resp.data.data.loanApplications.length);
                    if (resp.data.data.loanApplications.length != 0) {

                        $scope.myNavigator.pushPage('customer-status.html', {
                            animation: 'slide',
                            data: {
                                loanIntentId: link.loanIntentId,
                                loanIntentIdAlias: link.loanIntentIdAlias || 'ECPL',
                                loanLinkExpiryTime: link.loanLinkExpiryTime,
                                created_at: link.created_at,
                                merchantId: link.payload.merchantId
                            }
                        })
                    } else {
                        ons.notification.alert('Loan Application Process Not Initiated');
                    }
                } else {
                    log('Pop Page');
                    ons.notification.alert(resp.data.message);

                }

            });
    }





    $scope.openLoanLink = function(link) {

        warn('Selected Loan');
        log(link);
        ons.openActionSheet({
            title: 'Loan Application ' + link.loanIntentIdAlias || 'ECPL',
            cancelable: true,
            buttons: [
                'View Application Status',
                'Continue Loan Application',

                {
                    label: 'Cancel',
                    modifier: 'destructive'
                }
            ]
        }).then(function(index) {
            warn('Selected Loan Application :');
            log(index);
            log($scope.profileRetail.profile, $scope.profileRetail.universal_customer_id, $scope.profileRetail.profile_info.email, link.loanIntentId);

            juspay.updateLoanStatus($scope.profileRetail.profile, $scope.profileRetail.universal_customer_id, $scope.profileRetail.profile_info.email, link.loanIntentId)
                .then(function(resp) {
                    warn('updateLoanStatus :');
                    log(resp);

                    if (resp.data.status && resp.data.continueLoanApplication) {

                        if (index == 0) {
                            log(link);
                            $scope.checkStatusForLoan($scope.profileRetail.profile, link);

                        } else if (index == 1) {

                            // if (isPopupBlocked()) {
                            //     ons.notification.alert('Popup is Blocked. Enable Popup To Continue');
                            // } else {

                            // }

                            var linkWindow = window.open(link.loanLink, "_blank", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=yes, width=" + window.screen.availWidth, "height=" + window.screen.availHeight);
                            var timer = setInterval(function() {
                                if (linkWindow.closed) {
                                    clearInterval(timer);
                                    warn('closed Loan Link');
                                    $scope.fetchLoans(false);
                                    warn('closed Loan Link');
                                    log(link);
                                }
                            }, 1000);

                        }

                    } else {
                        ons.notification.alert('Loan Application Has Been Rejected By Lender');
                    }
                });





        })
    };


    $scope.openExpiredLoanLink = function() {
        warn('Sending openExpiredLoanLink');
        log($scope.expiredLinks);
        $scope.myNavigator.pushPage('expired-loan.html', {
            data: {
                expiredLinks: $scope.expiredLinks
            }
        })

    }



    $scope.initAutoComplete = function() {
        // The DOM element you wish to replace with Tagify
        const autoCompleteJS = new autoComplete({
            selector: "#searchLoans",
            placeHolder: "Search Loan Application,Activity...",
            submit: true,
            threshold: 1,
            searchEngine: "loose",
            data: {
                src: async (query) => {
                    try {
                        var uri;
                        if (window.location.hostname == 'localhost') {
                            uri = `http://localhost:5001/get/juspay/api/search/typeahed/all/personal/loans?search=` + query;
                        } else {
                            uri = `https://retail.easycred.co.in/get/juspay/api/search/typeahed/all/personal/loans?search=` + query;
                        }

                        // Fetch Data from external Source
                        const source = await fetch(uri);
                        // Data should be an array of `Objects` or `Strings`
                        const data = await source.json();
                        log(data);
                        return data;
                    } catch (error) {
                        return error;
                    }
                },
                // Data source 'Object' key to be searched
                keys: ["journey.loanIntentIdAlias"]
            },
            query: (input) => {
                console.log(input);
                if (input == '') {

                    console.log(input);
                }
                return input;
            },
            resultsList: {
                element: (list, data) => {
                    const info = document.createElement("p");
                    if (data.results.length > 0) {
                        info.innerHTML = `Displaying <strong>${data.results.length}</strong> out of <strong>${data.matches.length}</strong> results`;
                    } else {
                        info.innerHTML = `Found <strong>${data.matches.length}</strong> matching results for <strong>"${data.query}"</strong>`;
                    }
                    list.prepend(info);
                },
                noResults: true,
                maxResults: 15,
                tabSelect: true
            },
            resultItem: {
                element: (item, data) => {

                    var split = data.key.split('_');
                    var i = 0;
                    var complete = '';
                    while (i != split.length) {
                        complete = complete + split[i] + " ";
                        i++;
                    };

                    // Modify Results Item Style
                    item.style = "display: flex; justify-content: space-between;";
                    // Modify Results Item Content
                    item.innerHTML = `
                              <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
                                ${data.match}
                              </span>
                              <span style="display: flex; align-items: center; font-size: 13px; font-weight: 100; text-transform: uppercase; color: rgba(0,0,0,.2);">
                                ${complete}
                              </span>`;
                },
                highlight: true
            }
        });
        $timeout(function() {

            document.querySelector("#searchLoans").addEventListener("selection", function(event) {
                const feedback = event.detail;
                autoCompleteJS.input.blur();
                // Prepare User's Selected Value
                const selection = feedback.selection.value[feedback.selection.key];
                // Render selected choice to selection div
                // Replace Input value with the selected value
                autoCompleteJS.input.value = selection;
                // Console log autoComplete data feedback
                console.log(selection);
                console.log(feedback);

            });
        }, 100);

    }




    $scope.fetchUpdatedProfile = function() {
        profileEvent.fetchProfile($scope.profileDashboard.profile)
            .then(function(resp) {
                warn('fetchUpdatedProfile Profile');
                log(resp);
                $timeout(function() {
                    if (resp.data && resp.data.status) {
                        $scope.profileDashboard = resp.data.data;
                        stateManager.saveProfile(resp.data.data);
                    } else {
                        ons.notification.toast('Some Error Occured', { timeout: 3000 });
                    }
                })

            })
    };


}])