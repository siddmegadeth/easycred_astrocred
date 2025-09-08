(function() {
    GradingEngine = require("./api/grading-engine");
    var AdvancedAnalytics = require("./api/analytics-engine-advance.js");

    // Upload and analyze CIBIL data
    app.get('/get/api/cibil/upload', function(req, res) {
        try {
            log('/get/api/cibil/upload');
            var cibilData = require("./../../../data/cibil/sample-data.json");
            cibilData = cibilData.data;
            log('-------------CIBIL DATA SAMPLE-------------------');
            log(cibilData);
            log('--------------------------------');

            // Validate required fields
            if (!cibilData.client_id || !cibilData.credit_report) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Check if data already exists for this client
            CibilDataModel.findOne({ client_id: cibilData.client_id }, function(err, existingData) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (existingData) {
                    // Update existing record
                    CibilDataModel.findByIdAndUpdate(existingData._id, {
                        $set: {
                            ...cibilData,
                            updatedAt: new Date()
                        }
                    }, function(err) {
                        if (err) {
                            console.error('Error updating CIBIL data:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }

                        // Analyze the data
                        var analyzer = new GradingEngine(cibilData);
                        var overallGrade = analyzer.calculateOverallGrade();
                        var defaulters = analyzer.identifyDefaulters();
                        var recommendations = analyzer.generateRecommendations();
                        var advanced = new AdvancedAnalytics(cibilData, analyzer);



                        // Generate comprehensive report
                        var report = advanced.generateComprehensiveReport();
                        console.log('Comprehensive Report:', report);

                        // Generate improvement plan
                        var plan = advanced.generateImprovementPlan();
                        console.log('Improvement Plan:', plan);

                        // Get bank suggestions
                        var bankSuggestions = advanced.suggestBanks();
                        console.log('Bank Suggestions:', bankSuggestions);



                        res.json({
                            success: true,
                            client_id: cibilData.client_id,
                            name: cibilData.name,
                            credit_score: cibilData.credit_score,
                            overallGrade: overallGrade,
                            defaulters: defaulters,
                            recommendations: recommendations,
                            report: report,
                            plan: plan,
                            bankSuggestions: bankSuggestions,
                            message: 'CIBIL data analyzed successfully'
                        });
                    });
                } else {
                    // Create new record
                    CibilDataModel.create(cibilData, function(err) {
                        if (err) {
                            console.error('Error creating CIBIL data:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }

                        // Analyze the data
                        var analyzer = new GradingEngine(cibilData);
                        var overallGrade = analyzer.calculateOverallGrade();
                        var defaulters = analyzer.identifyDefaulters();
                        var recommendations = analyzer.generateRecommendations();
                        var advanced = new AdvancedAnalytics(cibilData, analyzer);



                        // Generate comprehensive report
                        var report = advanced.generateComprehensiveReport();
                        console.log('Comprehensive Report:', report);

                        // Generate improvement plan
                        var plan = advanced.generateImprovementPlan();
                        console.log('Improvement Plan:', plan);

                        // Get bank suggestions
                        var bankSuggestions = advanced.suggestBanks();
                        console.log('Bank Suggestions:', bankSuggestions);

                        res.json({
                            success: true,
                            client_id: cibilData.client_id,
                            name: cibilData.name,
                            credit_score: cibilData.credit_score,
                            overallGrade: overallGrade,
                            defaulters: defaulters,
                            recommendations: recommendations,
                            report: report,
                            plan: plan,
                            bankSuggestions: bankSuggestions,
                            message: 'CIBIL data analyzed successfully'
                        });
                    });
                }
            });
        } catch (error) {
            console.error('Error processing CIBIL data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
})();