app.controller('goldSilverCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'mmtc', 'sandbox', 'profileEvent', 'stateManagerMMTC', function($scope, $rootScope, $timeout, stateManager, mmtc, sandbox, profileEvent, stateManagerMMTC) {



    $timeout(function() {
        socket.emit('request-mmtc-getquote-gold', { type: 'BUY' });

        // request gold quote
        $scope.showPage = false;

        $scope.profile = stateManager.getProfile();
        $scope.customerPortfolio = {};
        $scope.isGoldLoaded = false;
        $scope.isSilverLoaded = false;
        $scope.isMMTCAccountCreated = true;

        $scope.customerPortfolio = $scope.myNavigator.topPage.data.portfolio || {};
        $scope.profileMMTC = stateManagerMMTC.getProfile();
        $scope.profile = stateManager.getProfile();


        socket.on('stopped-mmtc-quotes', function(event, data) {
            warn('stopped-mmtc-quotes. All Services Stopped For Get Quotes For API');
            $scope.loaderGold.hide();

        });
        socket.on('response-mmtc-getquote-gold', function(incoming) {
            warn('response-mmtc-getquote-gold');
            log('Received');
            log(incoming);
            if (incoming.isSuccess) {
                $scope.goldPrice = incoming.data;
                warn('GOLD Prices :');
                log($scope.goldPrice);
                warn('Buy Calculate By Amount  For Gold');
                $scope.goldRatesBuy = stateManagerMMTC.calculateMetalBuy(1, $scope.goldPrice, 'Q');
                warn('Sell Calculate By Amount  For Gold');
                $scope.goldRatesSell = stateManagerMMTC.calculateMetalSell(1, $scope.goldPrice, 'Q');
                $scope.isGoldLoaded = true;



                warn('getPortfolio :');
                mmtc.customers.getPortfolio($scope.profileMMTC.customerRefNo)
                    .then(function(resp) {
                        warn('getPortfolio');
                        log(resp);
                        if (resp.data.status && resp.data.isSuccess) {
                            $scope.customerPortfolio = resp.data.data;
                            $scope.customerPortfolio.currency = stateManagerMMTC.calculateMetalBuy($scope.customerPortfolio.balances[0].balQuantity, $scope.goldPrice, 'Q');
                            log($scope.customerPortfolio);
                            $scope.isCustomerPorfolioFound = true;


                        } else {
                            $scope.isCustomerPorfolioFound = false;
                            $scope.customerPortfolio = {};

                        }

                    });


            } else {
                log('Not Able To Fetch Gold Quote');
            }
        });

    }, 300);

    $rootScope.$on('transaction-update', function() {
        $timeout(function() {
            warn('request-mmtc-getquote-gold :');
            socket.emit('request-mmtc-getquote-gold', { type: 'BUY' });
            $scope.loaderGold.show();
            warn('getPortfolio :');
            mmtc.customers.getPortfolio($scope.profileMMTC.customerRefNo)
                .then(function(resp) {
                    warn('getPortfolio');
                    log(resp);
                    $scope.loaderGold.hide();
                    if (resp.data.status && resp.data.isSuccess) {
                        $scope.customerPortfolio = resp.data.data;
                        $scope.customerPortfolio.currency = stateManagerMMTC.calculateMetalBuy($scope.customerPortfolio.balances[0].balQuantity, $scope.goldPrice, 'Q');
                        log($scope.customerPortfolio);
                        $scope.isCustomerPorfolioFound = true;


                    } else {
                        $scope.isCustomerPorfolioFound = false;
                        $scope.customerPortfolio = {};

                    }

                });
        }, 100)
    })




    $scope.reload = function($done) {
        $scope.getPortfolio(true, $done);
    }




    $scope.openTab = function(evt, tabTitle) {
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(tabTitle).style.display = "block";
        evt.currentTarget.className += " active";
    }

    $scope.gotoDashboard = function() {
        socket.emit('stop-mmtc-getquote', {});
        $scope.myNavigator.resetToPage('dashboard.html', { animation: 'slide' });

    }
    $scope.gotoWallet = function() {
        //socket.emit('stop-mmtc-getquote', {});
        $scope.myNavigator.pushPage('wallet.html', {
            animation: 'lift',
            data: {
                goldPrice: $scope.goldPrice
            }
        });

    }
    $scope.getPortfolio = function(isReload, $done) {
        //this getProfile will create a updated mmtc data and sync with db
        $scope.loaderGold.show();
        mmtc.customers.getPortfolio($scope.profileMMTC.customerRefNo)
            .then(function(resp) {
                $scope.loaderGold.hide();
                $timeout(function() {
                    warn('mmtc customer getPortfolio :');
                    log(resp);
                    if (resp.data && resp.data.status && resp.data.isSuccess) {
                        $scope.customerPortfolio = resp.data.data;
                        $scope.customerPortfolio.currency = stateManagerMMTC.calculateMetalBuy($scope.customerPortfolio.balances[0].balQuantity, $scope.goldPrice, 'Q');

                    } else {
                        ons.notification.toast('You Have No Purchases. Please Wait', { timeout: 2000 });
                    }

                    if (isReload) {
                        ons.notification.toast('Fetched Portfolio', { timeout: 2000 });

                        $done();
                    }
                })

            });
    }




    $scope.changeType = function(type) {
        warn('changeType ' + type);
        $scope.TypeForQuote = type;
    }






    async function getQuoteSellAmount(value) {
        return new Promise(function(approve, reject) {

            mmtc.trade.getQuoteSell($scope.profileMMTC.customerRefNo, 'XAG', value, 'A')
                .then(function(resp) {
                    log(resp);
                    $scope.loaderGold.hide();
                    $timeout(function() {
                        warn('mmtc getQuoteSell validateOrder amount :');
                        log(resp);
                        if (resp.data && resp.data.status && resp.data.isSuccess) {
                            approve(resp.data.data);
                        } else {
                            ons.notification.toast('You Have No Purchases. Please Wait', { timeout: 2000 });
                            reject({});
                        }

                    })

                })
        });
    }



    async function getQuoteSellQuantity(value) {

        return new Promise(function(approve, reject) {

            mmtc.trade.getQuoteSell($scope.profileMMTC.customerRefNo, 'XAG', value, 'Q')
                .then(function(resp) {
                    log(resp);
                    $scope.loaderGold.hide();
                    $timeout(function() {
                        warn('mmtc getQuoteSell validateOrder quantity :');
                        log(resp);
                        if (resp.data && resp.data.status && resp.data.isSuccess) {
                            approve(resp.data.data);
                        } else {
                            ons.notification.toast('You Have No Purchases. Please Wait', { timeout: 2000 });
                            reject({});
                        }
                    })

                })
        });
    }




    getGoldRateSell = function(balance, cb) {
        var rate = stateManagerMMTC.calculateMetalSell(balance, $scope.goldPrice, 'Q');
        cb(rate);
    }

    $scope.sellDialog = function() {

        mmtc.customers.getPortfolio($scope.profileMMTC.customerRefNo)
            .then(function(resp) {
                warn(' getPortfolio sellDialog Resp');
                log(resp);
                if (resp.data && resp.data.status) {
                    $scope.portfolioBalanceSell = resp.data.data;
                    getGoldRateSell($scope.portfolioBalanceSell.balances[0].balQuantity, function(resp) {
                        warn('getGoldRateSell ');
                        log(resp);
                        $scope.goldRateSell = resp;
                        $scope.initPromiseSell(true);

                    });

                }

            });




    }


    $scope.closeTradeGoldDialog = function() {
        $scope.loaderGold.hide();
        $scope.buyGold.hide();
        $scope.purchaseDialogClose();
    }


    $scope.closeTradeGoldDialogSell = function() {
        $scope.loaderGold.hide();
        $scope.sellGold.hide();
    }



    $scope.purchaseDialogClose = function() {

        log('purchaseDialogClose');

        var promise = [];
        promise.push(getQuoteBuyAmount());
        promise.push(getQuoteBuyQuantity());

        Promise.all(promise)
            .then(function(promiseSuccess) {
                $scope.loaderGold.hide();
                $scope.getQuoteAmountTrade = promiseSuccess[0];
                $scope.getQuoteQuantityTrade = promiseSuccess[1];
                $scope.tradeQuoteTime = null;
                $scope.startTime = new Date();


            })
            .catch(function(errorReject) {

                error('Rejected Promise purchaseDialogClose');
                error(errorReject);

                ons.notification.toast('Error Occured In Promise', { timeout: 4000 });
                error(errorReject);

            });

    }

    $scope.initPromiseSell = function(openDialog) {

        log('initPromise');
        $scope.loaderGold.show();

        var promise = [];
        promise.push(getQuoteSellAmount($scope.goldRateSell.totalAmount));
        promise.push(getQuoteSellQuantity($scope.goldRateSell.totalAmount));

        Promise.all(promise)
            .then(function(promiseSuccess) {
                log(promiseSuccess);
                $scope.loaderGold.hide();
                $scope.getQuoteAmountTradeSell = promiseSuccess[0];
                $scope.getQuoteQuantityTradeSell = promiseSuccess[1];
                $scope.tradeQuoteTimeSell = null;
                $scope.startTime = new Date();


                if (openDialog) {
                    $scope.sellGold.show();
                }
            })
            .catch(function(error) {
                log(error);
                ons.notification.alert('Error Occured In Promise', { timeout: 4000 });
                log(error);
                if (openDialog) {
                    $scope.sellGold.hide();
                }
            });

    }



    $scope.purchaseDialog = function() {
        warn('purchaseDialog : Open Dialog ');
        $scope.initPromiseBuy(true);
    }

    async function getQuoteBuyAmount() {
        return new Promise(function(approve, reject) {

            mmtc.trade.getQuoteBuy($scope.profileMMTC.customerRefNo, 'XAG', 'A')
                .then(function(resp) {
                    log(resp);
                    $scope.loaderGold.hide();
                    $timeout(function() {
                        warn('mmtc getQuoteBuyAmount validateOrder amount :');
                        log(resp);
                        if (resp.data && resp.data.status && resp.data.isSuccess) {
                            approve(resp.data.data);
                        } else {
                            ons.notification.toast('You Have No Purchases. Please Wait', { timeout: 2000 });
                            reject({});
                        }

                    })

                })
        });
    }

    async function getQuoteBuyQuantity() {

        return new Promise(function(approve, reject) {

            mmtc.trade.getQuoteBuy($scope.profileMMTC.customerRefNo, 'XAG', 'Q')
                .then(function(resp) {
                    log(resp);
                    $scope.loaderGold.hide();
                    $timeout(function() {
                        warn('mmtc getQuoteBuyQuantity validateOrder quantity  :');
                        log(resp);
                        if (resp.data && resp.data.status && resp.data.isSuccess) {
                            approve(resp.data.data);
                        } else {
                            ons.notification.toast('You Have No Purchases. Please Wait', { timeout: 2000 });
                            reject({});
                        }
                    })

                })
        });
    }


    $scope.initPromiseBuy = function(openDialog) {

        log('initPromiseBuy');
        $scope.loaderGold.show();

        var promise = [];
        promise.push(getQuoteBuyAmount());
        promise.push(getQuoteBuyQuantity());

        Promise.all(promise)
            .then(function(promiseSuccess) {
                error('initPromiseBuy :');
                warn('promiseSuccess :');
                log(promiseSuccess);
                $scope.loaderGold.hide();
                $scope.getQuoteAmountTrade = promiseSuccess[0];
                $scope.getQuoteQuantityTrade = promiseSuccess[1];
                $scope.tradeQuoteTime = null;
                $scope.startTime = new Date();

                error('getQuote Buy Amaount');
                log($scope.getQuoteAmountTrade);

                error('getQuote Buy Quantity');
                log($scope.getQuoteQuantityTrade);
                if (openDialog) {
                    $scope.buyGold.show();
                }
            })
            .catch(function(errorCatch) {
                warn('error');
                log(errorCatch);
                ons.notification.toast('Error Occured In initPromiseBuy', { timeout: 4000 });
                log(errorCatch);
                if (openDialog) {
                    $scope.buyGold.hide();
                }
            });

    }




    $scope.covertGoldFromINRToGram = function(rupessInput, type) {

        warn('Typed covertGoldFromINRToGram');
        log(rupessInput);
        log($scope.getQuoteAmountTrade);
        if (rupessInput == null || rupessInput == undefined) {
            log('NAN Found');
            $scope.goldSellINR = 0.0000;
        } else {
            log('Only Number');
            if (type == 'BUY') {
                $scope.goldPurchaseINR = stateManagerMMTC.calculateMetalBuy(rupessInput, $scope.getQuoteAmountTrade, 'A');
                log($scope.goldPurchaseINR);
            } else {
                log('SELL Amount');
                $scope.goldSellINR = stateManagerMMTC.calculateMetalSell(rupessInput, $scope.getQuoteAmountTradeSell, 'A');
                log($scope.goldSellINR);
            }
        }
    }


    $scope.covertGoldFromGramToINR = function(gramInput, type) {

        warn('Typed covertGoldFromGramToINR');
        log(gramInput);
        log($scope.getQuoteQuantityTrade);
        if (gramInput == null || gramInput == undefined) {
            log('NAN Found');
            $scope.goldSellGRAM = 0.0000;
        } else {
            log('Only Number');
            if (type == 'BUY') {

                $scope.goldPurchaseGRAM = stateManagerMMTC.calculateMetalBuy(gramInput, $scope.getQuoteQuantityTrade, 'Q');
                log($scope.goldPurchaseGRAM);
            } else {
                log('SELL Quantity');
                $scope.goldSellGRAM = stateManagerMMTC.calculateMetalSell(gramInput, $scope.getQuoteQuantityTradeSell, 'Q');
                log($scope.goldSellGRAM);
            }
        }
    }

    function check8MinutesElapsed(startTime) {
        const currentTime = new Date();
        const elapsedTimeInMilliseconds = currentTime - startTime;
        const elapsedTimeInMinutes = elapsedTimeInMilliseconds / (1000 * 60);
        return elapsedTimeInMinutes >= 8;
    }



    $scope.finalSellConvertAmount = function() {}




    $scope.validateOrderAmount = function(quantity) {
        log('validateOrderAmount :');
        if ($scope.startTime) {
            // After some time, call the function
            if (check8MinutesElapsed($scope.startTime)) {
                ons.notification.alert("time has elapsed.");
            } else {
                ons.notification.toast("time has not elapsed.");
                $scope.loaderGold.show();

                quantity.customerRefNo = $scope.profileMMTC.customerRefNo;
                mmtc.trade.validateOrderAndExecute(quantity)
                    .then(function(resp) {
                        $scope.loaderGold.hide();

                        warn('validateOrderQuantity quantity :');
                        log(resp);
                        if (resp.data.isSuccess && resp.data.status) {
                            resp.data.data.calculationType = "A";
                            $scope.executePayment(resp.data.data);
                        } else {
                            ons.notification.alert('Unable To Place Order');
                        }

                    });

            }
        } else {
            ons.notification.alert("no values found");

        }
    };


    $scope.validateOrderQuantity = function(amount) {
        log('validateOrderQuantity :');

        if ($scope.startTime) {
            // After some time, call the function
            if (check8MinutesElapsed($scope.startTime)) {
                ons.notification.alert("time has elapsed.");
            } else {

                //ons.notification.toast("time has not elapsed.");
                $scope.loaderGold.show();

                var customerRefNo = $scope.profileMMTC.customerRefNo;
                mmtc.trade.validateOrderAndExecuteQuantity(customerRefNo, amount)
                    .then(function(resp) {
                        $scope.loaderGold.hide();

                        warn('validateOrderAmount quantity :');
                        log(resp);
                        if (resp.data.isSuccess && resp.data.status) {
                            resp.data.data.calculationType = "Q";
                            $scope.executePayment(resp.data.data);
                        } else {
                            ons.notification.alert('Unable To Place Order');
                        }

                    });

            }
        } else {
            ons.notification.alert("no values found");

        }
    };



    $scope.validateOrderAmountSell = function(amount) {
        warn('validateOrderAmountSell :');
        log(amount);
        mmtc.trade.getQuoteSell($scope.profileMMTC.customerRefNo, 'XAG', amount, 'A')
            .then(function(resp) {
                log(resp);
                $scope.loaderGold.hide();
                $timeout(function() {
                    warn('mmtc getQuoteSell validateOrderAmountSell amount :');
                    log(resp);
                    if (resp.data && resp.data.status && resp.data.isSuccess) {
                        log('Executed getQuoteSell');
                        $scope.sellGold.hide();

                        $scope.calculatedMetal = stateManagerMMTC.calculateMetalSell(amount, resp.data.data, 'A');
                        log('Final Result For Sell');
                        log($scope.calculatedMetal);

                        warn('Balance :');
                        log($scope.portfolioBalanceSell);
                        var recommendedPaymentMethod;

                        if (parseInt($scope.calculatedMetal.quantity) <= parseInt($scope.portfolioBalanceSell.balances[0].balQuantity)) {

                            if (parseInt($scope.calculatedMetal.totalAmount) >= 100000) {
                                recommendedPaymentMethod = "RTGS";
                            } else {
                                recommendedPaymentMethod = "UPI";
                            }


                            $scope.myNavigator.pushPage('gold-silver-sell.html', {
                                animation: 'lift',
                                data: {
                                    getQuoteSell: resp.data.data,
                                    calculatedMetal: $scope.calculatedMetal,
                                    recommendedPaymentMethod: recommendedPaymentMethod
                                }
                            })

                        } else {
                            ons.notification.alert('You Balance Is Insufficent');
                        }


                    } else {
                        ons.notification.toast('You Have No Purchases. Please Wait', { timeout: 2000 });
                        log('Not Executed getQuoteSell');

                    }

                })

            })

    };




    $scope.executePayment = function(payment) {
        // passvalue to rwzorpay
        var options = {
            "key": payment.key, // Enter the Key ID generated from the Dashboard
            "amount": payment.orderId.total_amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
            "currency": "INR",
            "order_id": payment.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
            "handler": function(response) {
                $scope.buyGold.hide();
                $scope.loaderGold.hide();
                log(response);
                log(response.razorpay_payment_id);
                log(response.razorpay_order_id);
                log(response.razorpay_signature)

                if (response) {
                    ons.notification.alert('Order Confirmed');
                    $scope.executeOrderWithPayIn(payment, response);
                } else {
                    ons.notification.alert('Not Able To Place Order');

                }

            },
            "modal": {
                ondismiss: function() {
                    // This function is called when the Checkout modal is closed by the user
                    // This includes closing via the 'X' button, pressing Escape, or clicking outside the modal
                    console.log("Razorpay Checkout modal dismissed.");
                    // You can add your custom logic here, such as:
                    // - Updating UI elements
                    // - Logging the event
                    // - Making an API call to your backend
                    $scope.buyGold.hide();
                    $scope.loaderGold.hide();

                    ons.notification.alert('The Payment Was Cancelled');
                }
            },
            "notes": {
                "address": "Razorpay Corporate Office"
            },
            "theme": {
                "color": "#3399cc"
            }
        };

        var rzp1 = new Razorpay(options);

        rzp1.on('payment.failed', function(response) {
            log(response.error);
            // log(response.error.code);
            // log(response.error.description);
            // log(response.error.source);
            // log(response.error.step);
            // log(response.error.reason);
            // log(response.error.metadata.order_id);
            // log(response.error.metadata.payment_id);
        });

        rzp1.open();


    };


    $scope.executeOrderWithPayIn = function(payment, order) {

        var customerRefNo = $scope.profileMMTC.customerRefNo;
        mmtc.trade.executeOrderWithPayIn(customerRefNo, payment, order)
            .then(function(resp) {
                $scope.loaderGold.hide();
                warn('executeOrderWithPayIn amount :');
                log(resp.data);
                log(resp.data.data);
                $rootScope.$emit('transaction-update', {});

            });
    }

    $scope.format = function() {
        var value = $scope.rupessInput.replace(/,/g, '') / 100;
        $scope.rupessInput = parseFloat(value).toLocaleString('en-US', {
            style: 'decimal',
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        });
    };


}])