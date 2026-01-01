app.provider('cibilCore', [function() {
    var cibilUrls;

    return {
        config: function(urls) {
            cibilUrls = urls.cibil_core || urls;
        },
        $get: ['$http', function($http) {
            return {
                // ✅ FULLY COMPATIBLE APIs

                // 1. Data Upload & Processing
                uploadData: function(cibilData) {
                    // Backend expects raw CIBIL data object
                    return $http({
                        method: 'POST',
                        url: cibilUrls.upload.data,
                        data: cibilData,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                },

                uploadSampleData: function() {
                    // Backend: GET /get/api/cibil/upload (no params)
                    return $http({
                        method: 'GET',
                        url: cibilUrls.upload.sample
                    });
                },

                // 2. Analysis & Reports
                getAnalysis: function(identifier) {
                    // Backend: GET /get/api/cibil/analysis?pan=...&mobile=...&email=...&client_id=...&force_refresh=...
                    var params = {};

                    if (identifier.pan) params.pan = identifier.pan;
                    if (identifier.mobile) params.mobile = identifier.mobile;
                    if (identifier.email) params.email = identifier.email;
                    if (identifier.client_id) params.client_id = identifier.client_id;
                    if (identifier.force_refresh === true || identifier.force_refresh === 'true') {
                        params.force_refresh = 'true';
                    }

                    return $http({
                        method: 'GET',
                        url: cibilUrls.analysis.basic,
                        params: params
                    });
                },

                refreshAnalysis: function(identifier) {
                    // Backend: POST /post/api/cibil/analysis/refresh
                    // Body: { pan, mobile, email, client_id }
                    var data = {};

                    if (identifier.pan) data.pan = identifier.pan;
                    if (identifier.mobile) data.mobile = identifier.mobile;
                    if (identifier.email) data.email = identifier.email;
                    if (identifier.client_id) data.client_id = identifier.client_id;

                    return $http({
                        method: 'POST',
                        url: cibilUrls.database.refreshAnalysis,
                        data: data,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                },

                getComprehensiveReport: function(identifier) {
                    // Backend: GET /comprehensive-report?pan=...&mobile=...&email=...&client_id=...
                    var params = {};

                    if (identifier.pan) params.pan = identifier.pan;
                    if (identifier.mobile) params.mobile = identifier.mobile;
                    if (identifier.email) params.email = identifier.email;
                    if (identifier.client_id) params.client_id = identifier.client_id;

                    return $http({
                        method: 'GET',
                        url: cibilUrls.analysis.comprehensive,
                        params: params
                    });
                },

                getAnalysisStatistics: function() {
                    // Backend: GET /get/api/cibil/analysis/statistics (no params)
                    return $http({
                        method: 'GET',
                        url: cibilUrls.analysis.statistics
                    });
                },

                // 3. Risk Assessment
                getRiskAssessment: function(identifier) {
                    // Backend: GET /risk-assessment?pan=...&mobile=...&email=...&client_id=...
                    var params = {};

                    if (identifier.pan) params.pan = identifier.pan;
                    if (identifier.mobile) params.mobile = identifier.mobile;
                    if (identifier.email) params.email = identifier.email;
                    if (identifier.client_id) params.client_id = identifier.client_id;

                    return $http({
                        method: 'GET',
                        url: cibilUrls.risk.basic,
                        params: params
                    });
                },

                getEnhancedRiskAssessment: function(identifier) {
                    // Backend: GET /enhanced-risk-assessment?pan=...&mobile=...&email=...&client_id=...
                    var params = {};

                    if (identifier.pan) params.pan = identifier.pan;
                    if (identifier.mobile) params.mobile = identifier.mobile;
                    if (identifier.email) params.email = identifier.email;
                    if (identifier.client_id) params.client_id = identifier.client_id;

                    return $http({
                        method: 'GET',
                        url: cibilUrls.risk.enhanced,
                        params: params
                    });
                },

                getRiskComparison: function(identifier) {
                    // Backend: GET /risk-comparison?pan=...&mobile=...&email=...&client_id=...
                    var params = {};

                    if (identifier.pan) params.pan = identifier.pan;
                    if (identifier.mobile) params.mobile = identifier.mobile;
                    if (identifier.email) params.email = identifier.email;
                    if (identifier.client_id) params.client_id = identifier.client_id;

                    return $http({
                        method: 'GET',
                        url: cibilUrls.risk.comparison,
                        params: params
                    });
                },

                getDefaultProbability: function(identifier) {
                    // Backend: GET /default-probability?pan=...&mobile=...&email=...&client_id=...
                    var params = {};

                    if (identifier.pan) params.pan = identifier.pan;
                    if (identifier.mobile) params.mobile = identifier.mobile;
                    if (identifier.email) params.email = identifier.email;
                    if (identifier.client_id) params.client_id = identifier.client_id;

                    return $http({
                        method: 'GET',
                        url: cibilUrls.risk.defaultProbability,
                        params: params
                    });
                },

                getCreditWorthiness: function(identifier) {
                    // Backend: GET /credit-worthiness?pan=...&mobile=...&email=...&client_id=...
                    var params = {};

                    if (identifier.pan) params.pan = identifier.pan;
                    if (identifier.mobile) params.mobile = identifier.mobile;
                    if (identifier.email) params.email = identifier.email;
                    if (identifier.client_id) params.client_id = identifier.client_id;

                    return $http({
                        method: 'GET',
                        url: cibilUrls.risk.creditWorthiness,
                        params: params
                    });
                },

                getEligibleInstitutions: function(identifier) {
                    // Backend: GET /eligible-institutions?pan=...&mobile=...&email=...&client_id=...
                    var params = {};

                    if (identifier.pan) params.pan = identifier.pan;
                    if (identifier.mobile) params.mobile = identifier.mobile;
                    if (identifier.email) params.email = identifier.email;
                    if (identifier.client_id) params.client_id = identifier.client_id;

                    return $http({
                        method: 'GET',
                        url: cibilUrls.improvement.eligibleInstitutions,
                        params: params
                    });
                },

                // 4. Grades & Scores
                getClientGrade: function(identifier) {
                    // Backend: GET /get/api/cibil/client/grade?pan=...&mobile=...&email=...&client_id=...
                    var params = {};

                    if (identifier.pan) params.pan = identifier.pan;
                    if (identifier.mobile) params.mobile = identifier.mobile;
                    if (identifier.email) params.email = identifier.email;
                    if (identifier.client_id) params.client_id = identifier.client_id;

                    return $http({
                        method: 'GET',
                        url: cibilUrls.grades.client,
                        params: params
                    });
                },

                getAllClientsGrades: function(filters) {
                    // Backend: GET /get/api/cibil/clients/grades?min_score=...&max_score=...&grade=...&pan=...&mobile=...&email=...&name=...&page=...&limit=...&sort_by=...&sort_order=...
                    var params = filters || {};

                    // Add pagination defaults if not provided
                    if (!params.page) params.page = 1;
                    if (!params.limit) params.limit = 50;
                    if (!params.sort_by) params.sort_by = 'credit_score';
                    if (!params.sort_order) params.sort_order = 'desc';

                    return $http({
                        method: 'GET',
                        url: cibilUrls.grades.allClients,
                        params: params
                    });
                },

                getGradesStatistics: function() {
                    // Backend: GET /get/api/cibil/grades/statistics (no params)
                    return $http({
                        method: 'GET',
                        url: cibilUrls.grades.statistics
                    });
                },

                // 5. Score History
                getScoreHistory: function(identifier) {
                    // Backend: GET /get/api/cibil/score-history?pan=...&mobile=...&email=...&client_id=...
                    var params = {};

                    if (identifier.pan) params.pan = identifier.pan;
                    if (identifier.mobile) params.mobile = identifier.mobile;
                    if (identifier.email) params.email = identifier.email;
                    if (identifier.client_id) params.client_id = identifier.client_id;

                    return $http({
                        method: 'GET',
                        url: cibilUrls.history.get,
                        params: params
                    });
                },

                addScoreToHistory: function(scoreData) {
                    // Backend: POST /post/api/cibil/score-history/add
                    // Body: { client_id, pan, mobile, email, name, score, grade, source }
                    var data = {
                        client_id: scoreData.client_id,
                        score: scoreData.score,
                        grade: scoreData.grade,
                        source: scoreData.source || 'manual'
                    };

                    // Optional fields
                    if (scoreData.pan) data.pan = scoreData.pan;
                    if (scoreData.mobile) data.mobile = scoreData.mobile;
                    if (scoreData.email) data.email = scoreData.email;
                    if (scoreData.name) data.name = scoreData.name;

                    return $http({
                        method: 'POST',
                        url: cibilUrls.history.add,
                        data: data,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                },

                searchScoreHistory: function(query) {
                    // Backend: GET /get/api/cibil/score-history/search?query=...
                    return $http({
                        method: 'GET',
                        url: cibilUrls.history.search,
                        params: { query: query }
                    });
                },

                getScoreTrend: function(identifier) {
                    // Backend: GET /get/api/cibil/score-trend?pan=...&mobile=...&email=...&client_id=...
                    var params = {};

                    if (identifier.pan) params.pan = identifier.pan;
                    if (identifier.mobile) params.mobile = identifier.mobile;
                    if (identifier.email) params.email = identifier.email;
                    if (identifier.client_id) params.client_id = identifier.client_id;

                    return $http({
                        method: 'GET',
                        url: cibilUrls.history.trend,
                        params: params
                    });
                },

                // 6. Improvement & Suggestions
                getImprovementPlan: function(identifier) {
                    // Backend: GET /improvement-plan?pan=...&mobile=...&email=...&client_id=...
                    var params = {};

                    if (identifier.pan) params.pan = identifier.pan;
                    if (identifier.mobile) params.mobile = identifier.mobile;
                    if (identifier.email) params.email = identifier.email;
                    if (identifier.client_id) params.client_id = identifier.client_id;

                    return $http({
                        method: 'GET',
                        url: cibilUrls.improvement.plan,
                        params: params
                    });
                },

                getBankSuggestions: function(identifier) {
                    // Backend: GET /bank-suggestions?pan=...&mobile=...&email=...&client_id=...
                    var params = {};

                    if (identifier.pan) params.pan = identifier.pan;
                    if (identifier.mobile) params.mobile = identifier.mobile;
                    if (identifier.email) params.email = identifier.email;
                    if (identifier.client_id) params.client_id = identifier.client_id;

                    return $http({
                        method: 'GET',
                        url: cibilUrls.improvement.bankSuggestions,
                        params: params
                    });
                },

                // 7. Visualization
                getChartData: function(identifier) {
                    // Backend: GET /chart-data?pan=...&mobile=...&email=...&client_id=...
                    var params = {};

                    if (identifier.pan) params.pan = identifier.pan;
                    if (identifier.mobile) params.mobile = identifier.mobile;
                    if (identifier.email) params.email = identifier.email;
                    if (identifier.client_id) params.client_id = identifier.client_id;

                    return $http({
                        method: 'GET',
                        url: cibilUrls.charts.data,
                        params: params
                    });
                },

                getCreditSummary: function(identifier) {
                    // Backend: GET /credit-summary?pan=...&mobile=...&email=...&client_id=...
                    var params = {};

                    if (identifier.pan) params.pan = identifier.pan;
                    if (identifier.mobile) params.mobile = identifier.mobile;
                    if (identifier.email) params.email = identifier.email;
                    if (identifier.client_id) params.client_id = identifier.client_id;

                    return $http({
                        method: 'GET',
                        url: cibilUrls.charts.summary,
                        params: params
                    });
                },

                // 8. Economic Data
                getEconomicData: function() {
                    // Backend: GET /economic-data (no params)
                    return $http({
                        method: 'GET',
                        url: cibilUrls.economic.data
                    });
                },

                getEconomicTrends: function(params) {
                    // Backend: GET /economic-trends?period=...&indicators=...
                    var queryParams = params || {};
                    if (!queryParams.period) queryParams.period = '30d';

                    return $http({
                        method: 'GET',
                        url: cibilUrls.economic.trends,
                        params: queryParams
                    });
                },

                // 9. Health & Monitoring
                checkHealth: function() {
                    // Backend: GET /get/api/cibil/health (no params)
                    return $http({
                        method: 'GET',
                        url: cibilUrls.health.check
                    });
                },

                quickHealthCheck: function() {
                    // Backend: GET /get/api/cibil/health/quick (no params)
                    return $http({
                        method: 'GET',
                        url: cibilUrls.health.quick
                    });
                },

                checkComponentHealth: function(component) {
                    // Backend: GET /get/api/cibil/health/:component
                    return $http({
                        method: 'GET',
                        url: cibilUrls.health.component + component
                    });
                },

                // 10. Database Maintenance
                fixIndexes: function() {
                    // Backend: GET /get/api/cibil/fix-indexes (no params)
                    return $http({
                        method: 'GET',
                        url: cibilUrls.database.fixIndexes
                    });
                },

                // 11. Legacy/Compatibility
                legacyCibil: function(profile) {
                    // Backend: GET /get/api/cibil/upload?profile=...
                    return $http({
                        method: 'GET',
                        url: cibilUrls.legacy.cibil,
                        params: {
                            profile: profile
                        }
                    });
                },

                // 🔧 HELPER METHODS FOR DATA NORMALIZATION
                normalizeData: function(cibilData) {
                    var normalized = angular.copy(cibilData);

                    // Normalize identifiers (as per backend requirements)
                    if (!normalized.pan_number && normalized.pan) {
                        normalized.pan_number = normalized.pan;
                    }
                    if (!normalized.mobile_number && normalized.mobile) {
                        normalized.mobile_number = normalized.mobile;
                    }
                    if (!normalized.name && normalized.pan_comprehensive &&
                        normalized.pan_comprehensive.data &&
                        normalized.pan_comprehensive.data.pan_details) {
                        normalized.name = normalized.pan_comprehensive.data.pan_details.full_name;
                    }
                    if (!normalized.email && normalized.user_email) {
                        normalized.email = normalized.user_email;
                    }

                    // Ensure credit_score is a number
                    if (normalized.credit_score && typeof normalized.credit_score === 'string') {
                        normalized.credit_score = parseInt(normalized.credit_score);
                    }

                    return normalized;
                },

                interpretPaymentStatus: function(statusCode) {
                    // Backend payment status interpretation
                    var statusMap = {
                        '0': { status: 'Paid/No Due', color: 'success', numeric: 0 },
                        'XXX': { status: 'No Data', color: 'secondary', numeric: 0 },
                        '1-30': { status: '1-30 Days Late', color: 'warning', numeric: 15 },
                        '31-60': { status: '31-60 Days Late', color: 'warning', numeric: 45 },
                        '61-90': { status: '61-90 Days Late', color: 'danger', numeric: 75 },
                        '91+': { status: '91+ Days Late', color: 'danger', numeric: 120 },
                        '107': { status: '107 Days Late', color: 'danger', numeric: 107 },
                        '92': { status: '92 Days Late', color: 'danger', numeric: 92 },
                        '61': { status: '61 Days Late', color: 'danger', numeric: 61 },
                        '31': { status: '31 Days Late', color: 'warning', numeric: 31 },
                        '28': { status: '28 Days Late', color: 'warning', numeric: 28 },
                        '26': { status: '26 Days Late', color: 'warning', numeric: 26 },
                        '25': { status: '25 Days Late', color: 'warning', numeric: 25 },
                        '12': { status: '12 Days Late', color: 'warning', numeric: 12 },
                        '11': { status: '11 Days Late', color: 'warning', numeric: 11 },
                        '10': { status: '10 Days Late', color: 'warning', numeric: 10 },
                        '9': { status: '9 Days Late', color: 'warning', numeric: 9 },
                        '56': { status: '56 Days Late', color: 'danger', numeric: 56 },
                        '72': { status: '72 Days Late', color: 'danger', numeric: 72 },
                        '88': { status: '88 Days Late', color: 'danger', numeric: 88 }
                    };

                    return statusMap[statusCode] || { status: 'Unknown', color: 'secondary', numeric: 0 };
                },

                calculateCreditUtilization: function(accounts) {
                    // Backend calculation method
                    if (!accounts || !accounts.length) return 0;

                    var totalBalance = 0;
                    var totalLimit = 0;

                    accounts.forEach(function(account) {
                        var balance = parseFloat(account.current_balance) || 0;
                        var limit = parseFloat(account.highCreditAmount) || 0;

                        totalBalance += balance;
                        totalLimit += limit;
                    });

                    return totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
                },

                // 🧪 TESTING CHECKLIST - Helper methods matching backend tests
                testUploadWithSample: function() {
                    // 1. Upload data - Uses sample data structure from backend
                    return this.uploadData(window.sampleData || this.createSampleData());
                },

                testBasicAnalysis: function(pan) {
                    // 2. Get analysis - With proper identifier
                    return this.getAnalysis({ pan: pan || 'IVZPK2103N' });
                },

                testRiskAssessment: function(pan) {
                    // 3. Risk Assessment - With proper identifier
                    return this.getRiskAssessment({ pan: pan || 'IVZPK2103N' });
                },

                testGradeCheck: function(pan) {
                    // 4. Grade Check - With proper identifier
                    return this.getClientGrade({ pan: pan || 'IVZPK2103N' });
                },

                testScoreHistory: function() {
                    // 5. Score History - Add test score
                    return this.addScoreToHistory({
                        client_id: "credit_report_cibil_jIifktiYhrHTbZcMdlsU",
                        pan: "IVZPK2103N",
                        mobile: "9708016996",
                        name: "SHIV KUMAR",
                        score: 670,
                        grade: "B",
                        source: "test"
                    });
                },

                // Create sample data matching backend structure
                createSampleData: function() {
                    return {
                        client_id: "credit_report_cibil_jIifktiYhrHTbZcMdlsU",
                        mobile: "9708016996",
                        pan: "IVZPK2103N",
                        name: "SHIV KUMAR",
                        gender: "male",
                        user_email: "MANGALDHAWANI@GMAIL.COM",
                        credit_score: "670",
                        credit_report: [ /*... full credit report data ...*/ ]
                    };
                },

                runAllTests: function() {
                    var tests = [];

                    // 🚀 IMMEDIATE ACTION PLAN from backend
                    tests.push(this.checkHealth()); // Health check

                    if (window.sampleData || this.createSampleData()) {
                        var sampleData = window.sampleData || this.createSampleData();

                        // Upload data
                        tests.push(this.uploadData(this.normalizeData(sampleData)));

                        // Test analysis endpoints
                        tests.push(this.testBasicAnalysis(sampleData.pan));
                        tests.push(this.testRiskAssessment(sampleData.pan));
                        tests.push(this.testGradeCheck(sampleData.pan));
                        tests.push(this.testScoreHistory());
                    }

                    return Promise.all(tests);
                },

                // Utility method to get all URLs (for debugging)
                getUrls: function() {
                    return cibilUrls;
                },

                // Quick test commands from backend
                quickTestCommands: function() {
                    return {
                        upload: "curl -X POST " + cibilUrls.upload.data + " -H 'Content-Type: application/json' -d @sample-data.json",
                        analysis: "curl '" + cibilUrls.analysis.basic + "?pan=IVZPK2103N'",
                        health: "curl '" + cibilUrls.health.check + "'"
                    };
                }
            };
        }]
    };
}]);