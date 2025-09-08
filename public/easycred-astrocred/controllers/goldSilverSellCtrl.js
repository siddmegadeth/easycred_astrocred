app.controller('goldSilverSellCtrl', ['$scope', '$rootScope', '$timeout', 'stateManager', 'mmtc', 'sandbox', 'profileEvent', 'stateManagerMMTC', function($scope, $rootScope, $timeout, stateManager, mmtc, sandbox, profileEvent, stateManagerMMTC) {

    $timeout(function() {

        $scope.getQuoteSell = $scope.myNavigator.topPage.data.getQuoteSell || {};
        $scope.calculatedMetal = $scope.myNavigator.topPage.data.calculatedMetal || {};
        $scope.recommendedPaymentMethod = $scope.myNavigator.topPage.data.recommendedPaymentMethod || {};
        $scope.isUPILoaded = false;
        $scope.isBankLoaded = false;

        warn('gold Silver Sell getQuoteSell Order :');
        log($scope.getQuoteSell);

        warn('gold Silver Sell calculated Meta :');
        log($scope.calculatedMetal);

        warn('recommendedPaymentMethod :');
        log($scope.recommendedPaymentMethod);

        $scope.calculate = {
            calculationType: $scope.calculatedMetal.calculationType,
            preTaxAmount: $scope.calculatedMetal.preTaxAmount,
            quantity: $scope.calculatedMetal.quantity,
            quoteId: $scope.getQuoteSell.quoteId,
            tax1Amt: $scope.calculatedMetal.tax1Amt,
            tax2Amt: $scope.calculatedMetal.tax2Amt,
            tax3Amt: $scope.calculatedMetal.tax3Amt,
            totalAmount: $scope.calculatedMetal.totalAmount,
            totalTaxAmount: $scope.calculatedMetal.totalTaxAmount,
            transactionDate: $scope.getQuoteSell.transactionDate,
            transactionOrderID: $scope.getQuoteSell.transactionOrderID
        };

        warn('Calculated  Final Before executeOrderWithPayOut :');
        log($scope.calculate);
        $scope.profileMMTC = stateManagerMMTC.getProfile();

        if ($scope.recommendedPaymentMethod == 'UPI') {
            warn('Fetching UPI');
            $scope.paymentOptionsUPI();
        } else if ($scope.recommendedPaymentMethod == "RTGS") {
            warn('Fetching RTGS');
            $scope.paymentOptionsBank();
        } else {
            warn('Default Is UPI');
            $scope.paymentOptionsUPI();
        }

    });

    $scope.paymentOptionsUPI = function() {
        $scope.loaderTrend.show();
        mmtc.payments.paymentOptionsUPI($scope.profileMMTC.customerRefNo, $scope.profileMMTC.fullName, $scope.profileMMTC.mobileNumber)
            .then(function(resp) {
                warn('paymentOptions :');
                log(resp);
                $scope.loaderTrend.hide();
                if (resp.data.isFound && resp.data.status) {
                    $scope.upiList = resp.data.data;
                    $scope.isUPILoaded = true;
                } else {
                    $scope.upiList = [];
                    ons.notification.alert('Not Able To Fetch Payment Methods Now');
                }
            });

    }

    $scope.paymentOptionsBank = function() {
        $scope.loaderTrend.show();
        mmtc.payments.paymentOptionsBank($scope.profileMMTC.customerRefNo, $scope.profileMMTC.fullName, $scope.profileMMTC.mobileNumber)
            .then(function(resp) {
                warn('paymentOptions :');
                log(resp);
                $scope.loaderTrend.hide();
                if (resp.data.isFound && resp.data.status) {
                    $scope.bankList = resp.data.data;
                    $scope.isBankLoaded = true;
                } else {
                    $scope.bankList = [];
                    ons.notification.alert('Not Able To Fetch Payment Methods Now');
                }
            });

    }


    $scope.executeTrade = function(selected) {
        warn('executeTrade :');
        log($scope.recommendedPaymentMethod);
        var method;

        if ($scope.recommendedPaymentMethod == "UPI") {

            method = {
                "customerAccountInfo": {
                    "name": $scope.upiList.name,
                    "accountNumber": "",
                    "ifsc": "",
                    "vpa": selected
                },
                "paymentChannel": "UPI"
            }
        } else if ($scope.recommendedPaymentMethod == "RTGS") {

            method = {
                "customerAccountInfo": {
                    "name": $scope.bankList.name,
                    "accountNumber": $scope.bankList.bank_account_no,
                    "ifsc": $scope.bankList.bank_ifsc,
                    "vpa": ""
                },
                "paymentChannel": "RTGS"
            }
        }
        log('METHOD :');
        log(method);
        $scope.loaderTrend.show();
        mmtc.trade.executeOrderWithPayOut($scope.profileMMTC.customerRefNo, $scope.profileMMTC.mobileNumber, $scope.calculate, $scope.recommendedPaymentMethod, method)
            .then(function(resp) {
                $scope.loaderTrend.hide();
                warn('executeOrderWithPayOut :');
                log(resp);
                $rootScope.$emit('transaction-update', {});

                if (resp.data.isSuccess && resp.data.status) {

                    ons.notification.alert('Your Trade Has Been Successfully Executed. You Can Expect Credit In Your Account In T+1 Days. Thank You For Trusting EASYCRED')
                        .then(function() {
                            $scope.myNavigator.popPage();
                        })
                } else {
                    ons.notification.alert('Your Trade Has Not Been Executed. You Can Try Again Later');

                }
            });
    }

}])