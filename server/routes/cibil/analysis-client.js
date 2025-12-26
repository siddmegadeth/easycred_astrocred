(function() {

    // Get analysis for a client (uses cached analysis for better performance)
    app.get('/get/api/cibil/analysis/:client_id', async function(req, res) {
        try {
            var client_id = req.params.client_id;

            var cibilData = await CibilDataModel.findOne({ client_id: client_id });
            
            if (!cibilData) {
                return res.status(404).json({ error: 'Client data not found' });
            }

            // Use cached analysis if available
            var AnalysisCache = require('./api/analysis-cache');
            var analysisResult = await AnalysisCache.getOrComputeAnalysis(cibilData, false);
            var analysis = analysisResult.analysis;
            
            log('Analysis endpoint: Using ' + (analysisResult.cached ? 'cached' : 'fresh') + ' analysis');

            res.json({
                success: true,
                client_id: client_id,
                name: cibilData.name,
                credit_score: cibilData.credit_score,
                overallGrade: analysis.overallGrade,
                componentScores: analysis.componentScores,
                defaulters: analysis.defaulters,
                recommendations: analysis.recommendations,
                creditUtilization: analysis.creditUtilization,
                creditAge: analysis.creditAge,
                paymentAnalysis: analysis.paymentAnalysis,
                totalAccounts: cibilData.credit_report && cibilData.credit_report[0] ? 
                              cibilData.credit_report[0].accounts.length : 0,
                cached: analysisResult.cached,
                analyzedAt: analysis.analyzedAt
            });
        } catch (error) {
            console.error('Error fetching analysis:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });

})();