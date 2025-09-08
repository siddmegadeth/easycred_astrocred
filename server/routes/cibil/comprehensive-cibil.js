(function() {

    var AdvancedAnalytics = require("./api/analytics-engine-advance.js");

    // Add these new routes to your existing router

    // Get comprehensive credit health report
    app.get('/comprehensive-report/:client_id', function(req, res) {
        try {
            var client_id = req.params.client_id;

            CibilData.findOne({ client_id: client_id }, function(err, cibilData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (!cibilData) {
                    return res.status(404).json({ error: 'Client data not found' });
                }

                var gradingEngine = new GradingEngine(cibilData);
                var advancedAnalytics = new AdvancedAnalytics(cibilData, gradingEngine);
                var report = advancedAnalytics.generateComprehensiveReport();

                res.json(report);
            });
        } catch (error) {
            console.error('Error generating comprehensive report:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get improvement plan
    app.get('/improvement-plan/:client_id', function(req, res) {
        try {
            var client_id = req.params.client_id;

            CibilData.findOne({ client_id: client_id }, function(err, cibilData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (!cibilData) {
                    return res.status(404).json({ error: 'Client data not found' });
                }

                var gradingEngine = new GradingEngine(cibilData);
                var advancedAnalytics = new AdvancedAnalytics(cibilData, gradingEngine);
                var plan = advancedAnalytics.generateImprovementPlan();

                res.json(plan);
            });
        } catch (error) {
            console.error('Error generating improvement plan:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get bank suggestions
    app.get('/bank-suggestions/:client_id', function(req, res) {
        try {
            var client_id = req.params.client_id;

            CibilData.findOne({ client_id: client_id }, function(err, cibilData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (!cibilData) {
                    return res.status(404).json({ error: 'Client data not found' });
                }

                var gradingEngine = new GradingEngine(cibilData);
                var advancedAnalytics = new AdvancedAnalytics(cibilData, gradingEngine);
                var suggestions = advancedAnalytics.suggestBanks();

                res.json(suggestions);
            });
        } catch (error) {
            console.error('Error generating bank suggestions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Get chart data for visualization
    app.get('/chart-data/:client_id', function(req, res) {
        try {
            var client_id = req.params.client_id;

            CibilData.findOne({ client_id: client_id }, function(err, cibilData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (!cibilData) {
                    return res.status(404).json({ error: 'Client data not found' });
                }

                var gradingEngine = new GradingEngine(cibilData);
                var advancedAnalytics = new AdvancedAnalytics(cibilData, gradingEngine);

                var chartData = {
                    loanHistory: advancedAnalytics.generateLoanHistoryChartData(),
                    paymentTimeline: advancedAnalytics.generatePaymentTimelineData()
                };

                res.json(chartData);
            });
        } catch (error) {
            console.error('Error generating chart data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
})();