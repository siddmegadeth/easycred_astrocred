(function() {
    
    // Schema for score history
    var ScoreHistorySchema = new mongoose.Schema({
        client_id: {
            type: String,
            required: true,
            index: true
        },
        mobile: {
            type: String,
            index: true
        },
        name: String,
        scores: [{
            score: Number,
            grade: String,
            date: {
                type: Date,
                default: Date.now
            },
            source: {
                type: String,
                default: 'manual'  // 'manual', 'surepass', 'sample'
            }
        }],
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    });

    var ScoreHistoryModel = mongoose.model('ScoreHistoryModel', ScoreHistorySchema);

    // Get score history for a client
    app.get('/get/api/cibil/score-history/:client_id', async function(req, res) {
        try {
            log('/get/api/cibil/score-history/:client_id');
            var client_id = req.params.client_id;
            
            if (!client_id) {
                return res.status(400).json({ error: 'client_id is required' });
            }

            var history = await ScoreHistoryModel.findOne({ client_id: client_id });
            
            if (!history) {
                return res.json({ 
                    success: true, 
                    client_id: client_id,
                    scores: [],
                    message: 'No history found for this client'
                });
            }

            res.json({
                success: true,
                client_id: history.client_id,
                name: history.name,
                mobile: history.mobile,
                scores: history.scores.sort((a, b) => new Date(a.date) - new Date(b.date)),
                totalRecords: history.scores.length
            });
        } catch (error) {
            log('Error fetching score history:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });

    // Add score to history
    app.post('/post/api/cibil/score-history/add', async function(req, res) {
        try {
            log('/post/api/cibil/score-history/add');
            
            var { client_id, mobile, name, score, grade, source } = req.body;
            
            if (!client_id || !score) {
                return res.status(400).json({ error: 'client_id and score are required' });
            }

            var history = await ScoreHistoryModel.findOne({ client_id: client_id });
            
            if (history) {
                // Add to existing history
                history.scores.push({
                    score: parseInt(score),
                    grade: grade,
                    date: new Date(),
                    source: source || 'manual'
                });
                history.updatedAt = new Date();
                await history.save();
            } else {
                // Create new history
                history = new ScoreHistoryModel({
                    client_id: client_id,
                    mobile: mobile,
                    name: name,
                    scores: [{
                        score: parseInt(score),
                        grade: grade,
                        date: new Date(),
                        source: source || 'manual'
                    }]
                });
                await history.save();
            }

            res.json({
                success: true,
                message: 'Score added to history',
                client_id: client_id,
                totalRecords: history.scores.length
            });
        } catch (error) {
            log('Error adding score to history:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });

    // Get score history by mobile
    app.get('/get/api/cibil/score-history/mobile/:mobile', async function(req, res) {
        try {
            log('/get/api/cibil/score-history/mobile/:mobile');
            var mobile = req.params.mobile;
            
            if (!mobile) {
                return res.status(400).json({ error: 'mobile is required' });
            }

            var history = await ScoreHistoryModel.findOne({ mobile: mobile });
            
            if (!history) {
                return res.json({ 
                    success: true, 
                    mobile: mobile,
                    scores: [],
                    message: 'No history found for this mobile'
                });
            }

            res.json({
                success: true,
                client_id: history.client_id,
                name: history.name,
                mobile: history.mobile,
                scores: history.scores.sort((a, b) => new Date(a.date) - new Date(b.date)),
                totalRecords: history.scores.length
            });
        } catch (error) {
            log('Error fetching score history:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });

    // Get all users with score history (for admin)
    app.get('/get/api/cibil/score-history/all', async function(req, res) {
        try {
            log('/get/api/cibil/score-history/all');
            
            var histories = await ScoreHistoryModel.find({})
                .select('client_id name mobile scores')
                .lean();
            
            var summary = histories.map(h => ({
                client_id: h.client_id,
                name: h.name,
                mobile: h.mobile,
                latestScore: h.scores.length > 0 ? h.scores[h.scores.length - 1].score : null,
                latestGrade: h.scores.length > 0 ? h.scores[h.scores.length - 1].grade : null,
                totalRecords: h.scores.length,
                firstRecord: h.scores.length > 0 ? h.scores[0].date : null,
                lastRecord: h.scores.length > 0 ? h.scores[h.scores.length - 1].date : null
            }));

            res.json({
                success: true,
                total: summary.length,
                users: summary
            });
        } catch (error) {
            log('Error fetching all score histories:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });

    // Calculate score trend
    app.get('/get/api/cibil/score-trend/:client_id', async function(req, res) {
        try {
            log('/get/api/cibil/score-trend/:client_id');
            var client_id = req.params.client_id;
            
            var history = await ScoreHistoryModel.findOne({ client_id: client_id });
            
            if (!history || history.scores.length < 2) {
                return res.json({ 
                    success: true, 
                    trend: 'neutral',
                    message: 'Not enough data to calculate trend'
                });
            }

            var scores = history.scores.sort((a, b) => new Date(a.date) - new Date(b.date));
            var latestScore = scores[scores.length - 1].score;
            var previousScore = scores[scores.length - 2].score;
            var firstScore = scores[0].score;
            
            var recentChange = latestScore - previousScore;
            var overallChange = latestScore - firstScore;
            
            var trend = 'neutral';
            if (recentChange > 10) trend = 'improving';
            else if (recentChange < -10) trend = 'declining';

            res.json({
                success: true,
                client_id: client_id,
                currentScore: latestScore,
                previousScore: previousScore,
                firstScore: firstScore,
                recentChange: recentChange,
                overallChange: overallChange,
                trend: trend,
                message: trend === 'improving' ? 'Your score is improving!' :
                         trend === 'declining' ? 'Your score needs attention.' :
                         'Your score is stable.'
            });
        } catch (error) {
            log('Error calculating score trend:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });

})();


