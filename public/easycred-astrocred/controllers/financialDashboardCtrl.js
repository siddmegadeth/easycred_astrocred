(function () {
    'use strict';

    app.controller('financialDashboardCtrl', ['$scope', 'financialHub', 'cibilCore', 'stateManager', '$timeout', function ($scope, financialHub, cibilCore, stateManager, $timeout) {
        $scope.loaderShow = true;
        $scope.user = stateManager.getUserData();
        $scope.financialData = {
            creditScore: 0,
            bankBalance: 0,
            linkedAccounts: [],
            verifiedAssets: [],
            recommendations: []
        };

        $scope.init = function () {
            $scope.loadCreditData();
            $scope.loadBankAccounts();
            $scope.loadAssets();
        };

        $scope.loadCreditData = function () {
            cibilCore.getAnalysis().then(function (res) {
                if (res.data.success) {
                    $scope.financialData.creditScore = res.data.credit_score || 0;
                    $scope.financialData.creditGrade = res.data.overallGrade;
                    $scope.financialData.recommendations = res.data.recommendations;
                }
            }).finally(function () {
                $scope.checkLoader();
            });
        };

        $scope.loadBankAccounts = function () {
            financialHub.getLinkedAccounts().then(function (res) {
                if (res.data.success) {
                    $scope.financialData.linkedAccounts = res.data.accounts;
                    $scope.financialData.bankBalance = res.data.accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
                }
            }).finally(function () {
                $scope.checkLoader();
            });
        };

        $scope.loadAssets = function () {
            // Logic to load verified assets from profile
            $scope.financialData.verifiedAssets = $scope.user.api_setu ? $scope.user.api_setu.verifiedAssets : [];
        };

        $scope.checkLoader = function () {
            // Simple logic to hide loader when primary data is fetched
            $timeout(function () {
                $scope.loaderShow = false;
            }, 1000);
        };

        // UI Handlers
        $scope.getScoreColor = function (score) {
            if (score >= 750) return 'text-success';
            if (score >= 700) return 'text-primary';
            if (score >= 650) return 'text-warning';
            return 'text-danger';
        };

        $scope.init();
    }]);

})();
