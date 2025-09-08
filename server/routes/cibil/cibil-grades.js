(function() {


    // Get all clients with their grades (for admin/analytics)
    app.get('/get/api/cibil/clients/grades', function(req, res) {
        try {
            CibilData.find({}, function(err, allClients) {
                if (err) {
                    console.error('Error finding CIBIL data:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                var clientsWithGrades = allClients.map(function(clientData) {
                    var analyzer = new GradingEngine(clientData);
                    return {
                        client_id: clientData.client_id,
                        name: clientData.name,
                        grade: analyzer.calculateOverallGrade(),
                        credit_score: clientData.credit_score,
                        totalAccounts: clientData.credit_report[0].accounts.length
                    };
                });

                res.json(clientsWithGrades);
            });
        } catch (error) {
            console.error('Error fetching client grades:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

})();