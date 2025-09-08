(function() {

    // Get analysis for a client
    app.get('/get/api/cibil/analysis/:client_id', function(req, res) {
        try {
            var client_id = req.params.client_id;

            CibilDataModel.findOne({ client_id: client_id }, function(err, cibilData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (!cibilData) {
                    return res.status(404).json({ error: 'Client data not found' });
                }

                var analyzer = new GradingEngine(cibilData);
                var overallGrade = analyzer.calculateOverallGrade();
                var defaulters = analyzer.identifyDefaulters();
                var recommendations = analyzer.generateRecommendations();

                // Calculate component scores
                var componentScores = {
                    paymentHistory: analyzer.calculatePaymentHistoryScore(),
                    creditUtilization: analyzer.calculateCreditUtilizationScore(),
                    creditAge: analyzer.calculateCreditAgeScore(),
                    debtBurden: analyzer.calculateDebtBurdenScore(),
                    creditMix: analyzer.calculateCreditMixScore(),
                    recentInquiries: analyzer.calculateRecentInquiriesScore()
                };

                res.json({
                    client_id: client_id,
                    name: cibilData.name,
                    credit_score: cibilData.credit_score,
                    overallGrade: overallGrade,
                    componentScores: componentScores,
                    defaulters: defaulters,
                    recommendations: recommendations,
                    creditUtilization: analyzer.getCreditUtilization(),
                    totalAccounts: cibilData.credit_report[0].accounts.length
                });
            });
        } catch (error) {
            console.error('Error fetching analysis:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

})();