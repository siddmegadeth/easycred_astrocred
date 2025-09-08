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


app.provider('mmtc', [function() {
    var mmtcURL;
    return {
        config: function(url) {

            mmtcURL = url.mmtc || url;
        },
        $get: ['$http', function($http) {
            return {
                payments: {
                    paymentOptionsUPI: function(customerRefNo, fullname, mobile_number) {
                        return $http({
                            method: 'GET',
                            url: mmtcURL.payments.paymentOptionsUPI,
                            params: {
                                customerRefNo: customerRefNo,
                                mobile_number: mobile_number,
                                fullname: fullname

                            }
                        })
                    },
                    paymentOptionsBank: function(customerRefNo, fullname, mobile_number) {
                        return $http({
                            method: 'GET',
                            url: mmtcURL.payments.paymentOptionsBank,
                            params: {
                                customerRefNo: customerRefNo,
                                mobile_number: mobile_number,
                                fullname: fullname

                            }
                        })
                    }
                },
                prices: {
                    goldPriceHistory: function(timeframe) {
                        return $http({
                            method: 'GET',
                            url: mmtcURL.prices.goldPriceHistory,
                            params: {
                                timeframe: timeframe
                            }
                        })
                    },
                    silverPriceHistory: function(timeframe) {
                        return $http({
                            method: 'GET',
                            url: mmtcURL.prices.silverPriceHistory,
                            params: {
                                timeframe: timeframe
                            }
                        })
                    },
                },
                customers: {
                    createProfile: function(profile) {
                        return $http({
                            method: 'GET',
                            url: mmtcURL.customers.createProfile,
                            params: {
                                profile: profile
                            }
                        })
                    },
                    getProfile: function(profile, mobile) {
                        return $http({
                            method: 'GET',
                            url: mmtcURL.customers.getProfile,
                            params: {
                                profile: profile,
                                mobile: mobile
                            }
                        })
                    },
                    getPortfolio: function(customer_id) {
                        return $http({
                            method: 'GET',
                            url: mmtcURL.customers.getPortfolio,
                            params: {
                                profile: customer_id
                            }
                        })
                    },
                    activation: function(customer_id) {
                        return $http({
                            method: 'GET',
                            url: mmtcURL.customers.activation,
                            params: {
                                customer_id: customer_id
                            }
                        })
                    },
                    deactivation: function(customer_id) {
                        return $http({
                            method: 'GET',
                            url: mmtcURL.customers.deactivation,
                            params: {
                                customer_id: customer_id
                            }
                        })
                    },
                    updateProfile: function(profile) {
                        return $http({
                            method: 'GET',
                            url: mmtcURL.customers.updateProfile,
                            params: {
                                profile: profile
                            }
                        })
                    },
                    syncProfile: function(profile, mobile, customer) {
                        return $http({
                            method: 'POST',
                            url: mmtcURL.customers.syncProfile,
                            params: {
                                profile: profile,
                                mobile: mobile,
                                customer: customer
                            }
                        })
                    },
                    checkIfMMTCProfileExist: function(profile, mobile) {
                        return $http({
                            method: 'GET',
                            url: mmtcURL.customers.checkIfMMTCProfileExist,
                            params: {
                                profile: profile,
                                mobile: mobile
                            }
                        })
                    },
                },
                trade: {
                    //metal getOrderHistory
                    getOrderHistory: function(customerRefNo, last_day) {
                        return $http({
                            method: 'POST',
                            url: mmtcURL.trade.getOrderHistory,
                            params: {
                                customerRefNo: customerRefNo,
                                last_day: last_day
                            }
                        })
                    },
                    validateQuote: function(customer_id, billing_address_id, quote_id, amount, calculation_type, metal_type, profile) {
                        return $http({
                            method: 'POST',
                            url: mmtcURL.trade.validateQuote,
                            params: {
                                customer_id: customer_id,
                                billing_address_id: billing_address_id,
                                quote_id: quote_id,
                                amount: amount,
                                calculation_type: calculation_type,
                                metal_type: metal_type,
                                profile: profile
                            }
                        })
                    },
                    getQuoteBuy: function(customerRefNo, currencyPair, type) {
                        return $http({
                            method: 'POST',
                            url: mmtcURL.trade.getQuoteBuy,
                            params: {
                                customerRefNo: customerRefNo,
                                currencyPair: currencyPair,
                                type: type
                            }
                        })
                    },
                    getQuoteSell: function(customerRefNo, currencyPair, value, type) {
                        return $http({
                            method: 'POST',
                            url: mmtcURL.trade.getQuoteSell,
                            params: {
                                customerRefNo: customerRefNo,
                                currencyPair: currencyPair,
                                value: value,
                                type: type
                            }
                        })
                    },
                    validateOrderAndExecute: function(customer) {
                        return $http({
                            method: 'POST',
                            url: mmtcURL.trade.validateOrderAndExecute,
                            params: {
                                customer: customer
                            }
                        })
                    },
                    validateOrderAndExecuteQuantity: function(customerRefNo, quantity) {
                        return $http({
                            method: 'POST',
                            url: mmtcURL.trade.validateOrderAndExecuteQuantity,
                            params: {
                                customerRefNo: customerRefNo,
                                quantity: quantity
                            }
                        })
                    },
                    executeOrderWithPayIn: function(customerRefNo, payment, order) {
                        return $http({
                            method: 'POST',
                            url: mmtcURL.trade.executeOrderWithPayIn,
                            params: {
                                customerRefNo: customerRefNo,
                                payment: payment,
                                order: order
                            }
                        })
                    },
                    executeOrderWithPayOut: function(customerRefNo, mobile_number, order, payment_method, payment_medium) {
                        return $http({
                            method: 'POST',
                            url: mmtcURL.trade.executeOrderWithPayOut,
                            params: {
                                customerRefNo: customerRefNo,
                                order: order,
                                payment_method: payment_method,
                                mobile_number: mobile_number,
                                payment_medium: payment_medium
                            }
                        })
                    }
                },
                pvt: {
                    getNonExecutableQuote: function(currencyPair, type) {
                        return $http({
                            method: 'GET',
                            url: mmtcURL.pvt.getNonExecutableQuote,
                            params: {
                                currencyPair: currencyPair,
                                type: type
                            }
                        })
                    },
                    getAddresses: function(customerRefNo) {
                        return $http({
                            method: 'GET',
                            url: mmtcURL.pvt.getAddresses,
                            params: {
                                customerRefNo: customerRefNo
                            }
                        })
                    }
                }
            }
        }]

    }
}])