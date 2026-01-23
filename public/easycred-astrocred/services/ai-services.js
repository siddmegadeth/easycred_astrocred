(function () {
    'use strict';

    /**
     * ASTRO AI Service
     * Frontend service for AI chat and recommendations
     */

    app.provider('astroAI', function () {
        var config = {};

        this.config = function (val) {
            config = val;
        };

        this.$get = ['$http', '$q', function ($http, $q) {
            return {
                /**
                 * Send a chat message to ASTRO AI
                 * @param {string} message - User's message
                 * @param {object} context - User's credit context
                 */
                chat: function (message, context) {
                    return $http.post('/api/ai/chat', {
                        message: message,
                        context: context
                    });
                },

                /**
                 * Get AI-generated summary of credit report
                 * @param {object} creditData - Full credit report data
                 */
                summarizeReport: function (creditData) {
                    return $http.post('/api/ai/summarize-report', {
                        creditData: creditData
                    });
                },

                /**
                 * Generate personalized improvement plan
                 * @param {object} creditData - Current credit data
                 * @param {number} targetScore - Target credit score
                 * @param {number} timeframeMonths - Timeframe in months
                 */
                getImprovementPlan: function (creditData, targetScore, timeframeMonths) {
                    return $http.post('/api/ai/improvement-plan', {
                        creditData: creditData,
                        targetScore: targetScore || 750,
                        timeframeMonths: timeframeMonths || 12
                    });
                },

                /**
                 * Get quick tips (no API cost)
                 */
                getQuickTips: function () {
                    return $http.get('/api/ai/quick-tips');
                },

                /**
                 * Build context object from scope data
                 * @param {object} scope - Controller's $scope
                 */
                buildContext: function (scope) {
                    return {
                        credit_score: scope.creditData?.credit_score,
                        total_accounts: scope.accounts?.length,
                        default_accounts: scope.defaultAccounts,
                        total_overdue: scope.totalOverdue,
                        credit_utilization: scope.creditUtilization,
                        recent_enquiries: scope.recentEnquiries,
                        credit_age: scope.creditAge,
                        risk_level: scope.riskAssessment?.level
                    };
                }
            };
        }];
    });

})();
