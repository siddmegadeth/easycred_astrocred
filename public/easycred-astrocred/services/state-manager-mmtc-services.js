function getDateTime() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ') + '.000';
};

function getTimeStampInMs() {
    return Date.now();
};

function roundUp(num, digits) {
    if (digits === void 0) { digits = 4; }
    return Math.ceil(num * Math.pow(10, digits)) / Math.pow(10, digits);
};



app.provider('stateManagerMMTC', [function() {

    var stateManagerURL;
    var object;
    return {

        config: function(configRoute) {

            stateManagerURL = configRoute;
        },
        $get: ['$http', function($http) {
            return {
                saveProfile: function(profile) {
                    window.localStorage.removeItem("easycred_retail_mmtc_profile");
                    window.localStorage.setItem("easycred_retail_mmtc_profile", JSON.stringify(profile));
                },
                getProfile: function() {
                    if (window.localStorage.easycred_retail_mmtc_profile) {
                        var profile = JSON.parse(window.localStorage.easycred_retail_mmtc_profile);
                        log(profile);
                        return profile;
                    }
                },
                isProfileExist: function() {
                    // check both exist and if empty
                    if (window.localStorage.easycred_retail_mmtc_profile) {
                        // check if value is empty or null
                        var value = window.localStorage.easycred_retail_mmtc_profile;
                        if (value != null || value != 'null' || value != undefined || value != 'undefined') {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                },
                isMMTCAccountCreated: function() {
                    // check both exist and if empty
                    if (window.localStorage.easycred_retail_profile) {
                        // check if value is empty or null
                        var profileTuple = JSON.parse(window.localStorage.easycred_retail_profile);
                        if (profileTuple.mmtc.isMMTCAccountCreated) {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                },
                validateBalanceAmountBeforeSell: function() {


                },
                getQuoteBuy: function(responseBody) {
                    let res = JSON.parse(responseBody)

                    log({
                        preTaxAmount: (res.preTaxAmount * pm.collectionVariables.get("metalQuantity")).toFixed(2).toString(),
                        quantity: (res.quantity * pm.collectionVariables.get("metalQuantity")).toFixed(4).toString(),
                        quoteId: res.quoteId,
                        tax1Amt: (res.tax1Amt * pm.collectionVariables.get("metalQuantity")).toFixed(2).toString(),
                        tax2Amt: (res.tax2Amt * pm.collectionVariables.get("metalQuantity")).toFixed(2).toString(),
                        transactionDate: res.createdAt,
                        transactionOrderID: JSON.parse(request.data).transactionRefNo,
                        totalAmount: (res.totalAmount * pm.collectionVariables.get("metalQuantity")).toFixed(2).toString()
                    });

                },
                getQuoteSell: function(responseBody) {

                    let res = JSON.parse(responseBody)
                    log({
                        preTaxAmount: res.preTaxAmount,
                        quantity: res.quantity,
                        quoteId: res.quoteId,
                        tax1Amt: res.tax1Amt,
                        tax2Amt: res.tax2Amt,
                        transactionDate: res.createdAt,
                        transactionOrderID: JSON.parse(request.data).transactionRefNo,
                        totalAmount: res.totalAmount
                    });

                },
                getNonExecutableQuote: function(currencyPair, type) {
                    return $http({
                        method: 'GET',
                        url: productionLink + "/get/mmtc/non/executable/quote",
                        params: {
                            currencyPair: currencyPair,
                            type: type
                        }
                    })
                },
                calculateMetalBuy: function(value, quote, type) {
                    if (type === "Q") {
                        warn('Type Q');
                        log(value);
                        log(quote);
                        log(type);
                        let quantity = Number(value).toFixed(4);
                        let preTaxMetalRate = Number(quote.preTaxAmount);
                        let tax1Perc = Number(quote.tax1Perc);
                        let tax2Perc = Number(quote.tax2Perc);
                        let transactionOrderID = getTimeStampInMs();
                        let transactionDate = getDateTime();
                        let preTaxAmount = preTaxMetalRate * quantity;
                        let tax1Amt = roundUp(((preTaxAmount * tax1Perc) / 100), 2);
                        let tax2Amt = roundUp(((preTaxAmount * tax2Perc) / 100), 2);
                        let tax3Amt = Number(quote.tax3Amt) || 0;
                        let totalTaxAmount = tax1Amt + tax2Amt + tax3Amt;
                        let totalAmount = preTaxAmount + totalTaxAmount;

                        log({
                            calculationType: "Q",
                            quoteId: quote.quoteId,
                            quantity: quantity.toString(),
                            preTaxAmount: preTaxAmount.toFixed(2),
                            totalAmount: totalAmount.toFixed(2),
                            tax1Amt: tax1Amt.toFixed(2),
                            tax2Amt: tax2Amt.toFixed(2),
                            tax3Amt: tax3Amt.toFixed(2),
                            totalTaxAmount: totalTaxAmount.toFixed(2),
                            transactionDate: transactionDate,
                            transactionOrderID: transactionOrderID.toString(),
                        });

                        return {
                            calculationType: "Q",
                            quoteId: quote.quoteId,
                            quantity: quantity.toString(),
                            preTaxAmount: preTaxAmount.toFixed(2),
                            totalAmount: totalAmount.toFixed(2),
                            tax1Amt: tax1Amt.toFixed(2),
                            tax2Amt: tax2Amt.toFixed(2),
                            tax3Amt: tax3Amt.toFixed(2),
                            totalTaxAmount: totalTaxAmount.toFixed(2),
                            transactionDate: transactionDate,
                            transactionOrderID: transactionOrderID.toString(),
                        }

                    } else {
                        warn('Type A');
                        log(value);
                        log(quote);
                        log(type);
                        let transactionOrderID = getTimeStampInMs();
                        let transactionDate = getDateTime();
                        let preTaxAmount = parseFloat(value);
                        let quantity = parseFloat(preTaxAmount / quote.preTaxAmount).toFixed(4);
                        let tax1Amt = roundUp((preTaxAmount * (quote.tax1Perc / 100)), 2);
                        let tax2Amt = roundUp((preTaxAmount * (quote.tax2Perc / 100)), 2);
                        let tax3Amt = Number(quote.tax3Amt) || 0;
                        let totalTaxAmount = tax1Amt + tax2Amt + tax3Amt;
                        let totalAmount = preTaxAmount + totalTaxAmount;



                        log({
                            calculationType: "A",
                            quoteId: quote.quoteId,
                            quantity: quantity,
                            preTaxAmount: (preTaxAmount).toFixed(2).toString(),
                            totalAmount: totalAmount.toFixed(2),
                            tax1Amt: tax1Amt.toFixed(2),
                            tax2Amt: tax2Amt.toFixed(2),
                            tax3Amt: tax3Amt.toFixed(2),
                            totalTaxAmount: totalTaxAmount.toFixed(2),
                            transactionDate: transactionDate,
                            transactionOrderID: transactionOrderID.toString(),
                        })

                        return {
                            calculationType: "A",
                            quoteId: quote.quoteId,
                            quantity: quantity,
                            preTaxAmount: (preTaxAmount).toFixed(2).toString(),
                            totalAmount: totalAmount.toFixed(2),
                            tax1Amt: tax1Amt.toFixed(2),
                            tax2Amt: tax2Amt.toFixed(2),
                            tax3Amt: tax3Amt.toFixed(2),
                            totalTaxAmount: totalTaxAmount.toFixed(2),
                            transactionDate: transactionDate,
                            transactionOrderID: transactionOrderID.toString(),
                        }

                    }


                },
                calculateMetalSell: function(value, quote, type) {
                    if (type === "Q") {

                        let quantity = Number((value)).toFixed(4);
                        let preTaxMetalRate = Number(quote.preTaxAmount);
                        let tax1Perc = Number(quote.tax1Perc);
                        let tax2Perc = Number(quote.tax2Perc);
                        let transactionOrderID = getTimeStampInMs();
                        let transactionDate = getDateTime();
                        let preTaxAmount = preTaxMetalRate * quantity;
                        let tax1Amt = roundUp(((preTaxAmount * tax1Perc) / 100), 2);
                        let tax2Amt = roundUp(((preTaxAmount * tax2Perc) / 100), 2);
                        let tax3Amt = Number(quote.tax3Amt) || 0;
                        let totalTaxAmount = tax1Amt + tax2Amt + tax3Amt;
                        let totalAmount = preTaxAmount - totalTaxAmount;

                        log({
                            calculationType: "Q",
                            quoteId: quote.quoteId,
                            quantity: quantity.toString(),
                            preTaxAmount: preTaxAmount.toFixed(2),
                            totalAmount: totalAmount.toFixed(2),
                            tax1Amt: tax1Amt.toFixed(2),
                            tax2Amt: tax2Amt.toFixed(2),
                            tax3Amt: tax3Amt.toFixed(2),
                            totalTaxAmount: (totalTaxAmount).toFixed(2),
                            transactionDate: transactionDate,
                            transactionOrderID: transactionOrderID.toString(),
                        })

                        return {
                            calculationType: "Q",
                            quoteId: quote.quoteId,
                            quantity: quantity.toString(),
                            preTaxAmount: preTaxAmount.toFixed(2),
                            totalAmount: totalAmount.toFixed(2),
                            tax1Amt: tax1Amt.toFixed(2),
                            tax2Amt: tax2Amt.toFixed(2),
                            tax3Amt: tax3Amt.toFixed(2),
                            totalTaxAmount: (totalTaxAmount).toFixed(2),
                            transactionDate: transactionDate,
                            transactionOrderID: transactionOrderID.toString(),
                        }

                    } else {
                        let transactionOrderID = getTimeStampInMs();
                        let transactionDate = getDateTime();
                        let preTaxAmount = parseFloat(value);
                        let quantity = parseFloat(preTaxAmount / quote.preTaxAmount).toFixed(4);
                        let tax1Amt = roundUp((preTaxAmount * (quote.tax1Perc / 100)), 2);
                        let tax2Amt = roundUp((preTaxAmount * (quote.tax2Perc / 100)), 2);
                        let tax3Amt = Number(quote.tax3Amt) || 0;
                        let totalTaxAmount = tax1Amt + tax2Amt + tax3Amt;
                        let totalAmount = preTaxAmount - totalTaxAmount;

                        log({
                            calculationType: "A",
                            quoteId: quote.quoteId,
                            quantity: quantity,
                            preTaxAmount: (preTaxAmount).toFixed(2).toString(),
                            totalAmount: totalAmount.toFixed(2),
                            tax1Amt: tax1Amt.toFixed(2),
                            tax2Amt: tax2Amt.toFixed(2),
                            tax3Amt: tax3Amt.toFixed(2),
                            totalTaxAmount: (tax1Amt + tax2Amt).toFixed(2),
                            transactionDate: transactionDate,
                            transactionOrderID: transactionOrderID.toString(),
                        })

                        return {
                            calculationType: "A",
                            quoteId: quote.quoteId,
                            quantity: quantity,
                            preTaxAmount: (preTaxAmount).toFixed(2).toString(),
                            totalAmount: totalAmount.toFixed(2),
                            tax1Amt: tax1Amt.toFixed(2),
                            tax2Amt: tax2Amt.toFixed(2),
                            tax3Amt: tax3Amt.toFixed(2),
                            totalTaxAmount: (tax1Amt + tax2Amt).toFixed(2),
                            transactionDate: transactionDate,
                            transactionOrderID: transactionOrderID.toString(),
                        }
                    }

                }
            }
        }]
    }


}]);