app.controller('pricingCtrl', ['$scope', '$http', '$location', 'stateManager', function ($scope, $http, $location, stateManager) {
    'use strict';

    // Initialize
    $scope.billingInterval = 'monthly';
    $scope.currentPlan = 'FREE';
    $scope.subscribing = false;
    $scope.subscription = null;

    // Load current subscription on init
    $scope.$on('$viewContentLoaded', function () {
        $scope.loadSubscription();
    });

    $scope.loadSubscription = function () {
        $http.get('/api/subscription/current')
            .then(function (response) {
                if (response.data.success) {
                    $scope.subscription = response.data.subscription;
                    $scope.currentPlan = $scope.subscription.plan;
                }
            })
            .catch(function (error) {
                console.error('Failed to load subscription:', error);
            });
    };

    $scope.subscribe = function (plan) {
        if (!stateManager.isUserLogggedIn()) {
            $location.path('/login');
            return;
        }

        $scope.subscribing = true;

        $http.post('/api/subscription/create', {
            plan: plan,
            interval: $scope.billingInterval
        })
            .then(function (response) {
                if (response.data.success && response.data.paymentUrl) {
                    // Redirect to Razorpay payment page
                    window.location.href = response.data.paymentUrl;
                } else {
                    alert('Failed to create subscription. Please try again.');
                }
            })
            .catch(function (error) {
                console.error('Subscription error:', error);
                alert('An error occurred. Please try again.');
            })
            .finally(function () {
                $scope.subscribing = false;
            });
    };

    $scope.contactSales = function () {
        window.open('mailto:enterprise@astrocred.co.in?subject=Enterprise Plan Inquiry', '_blank');
    };

    $scope.cancelSubscription = function () {
        if (!confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.')) {
            return;
        }

        $http.post('/api/subscription/cancel', {
            reason: 'User requested cancellation'
        })
            .then(function (response) {
                if (response.data.success) {
                    alert(response.data.message);
                    $scope.loadSubscription();
                }
            })
            .catch(function (error) {
                console.error('Cancel error:', error);
                alert('Failed to cancel subscription. Please contact support.');
            });
    };

}]);
