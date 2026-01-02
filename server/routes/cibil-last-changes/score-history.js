(function() {
    
    // Schema for score history
    var ScoreHistorySchema = new mongoose.Schema({
        client_id: {
            type: String,
            required: true,
            index: true
        },
        pan: {
            type: String,
            index: true
        },
        mobile: {
            type: String,
            index: true
        },
        email: {
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

    // Get score history by multiple identifiers (pan, mobile, or email)
    app.get('/get/api/cibil/score-history', async function(req, res) {
        try {
            log('/get/api/cibil/score-history');
            var { pan, mobile, email, client_id } = req.query;
            
            // Validate at least one identifier is provided
            if (!pan && !mobile && !email && !client_id) {
                return res.status(400).json({ 
                    error: 'Please provide at least one identifier (pan, mobile, email, or client_id)' 
                });
            }
            
            // Build query based on provided identifiers
            var query = {};
            if (client_id) query.client_id = client_id;
            if (pan) query.pan = pan;
            if (mobile) query.mobile = mobile;
            if (email) query.email = email;

            var history = await ScoreHistoryModel.findOne(query);
            
            if (!history) {
                return res.json({ 
                    success: true, 
                    identifiers: { pan, mobile, email, client_id },
                    scores: [],
                    message: 'No history found for the provided identifiers'
                });
            }

            res.json({
                success: true,
                client_id: history.client_id,
                name: history.name,
                pan: history.pan,
                mobile: history.mobile,
                email: history.email,
                scores: history.scores.sort((a, b) => new Date(b.date) - new Date(a.date)), // Latest first
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
            
            var { client_id, pan, mobile, email, name, score, grade, source } = req.body;
            
            if (!client_id || !score) {
                return res.status(400).json({ 
                    error: 'client_id and score are required',
                    received: { client_id, score }
                });
            }

            // Try to find by any identifier
            var query = { client_id: client_id };
            if (pan) query.pan = pan;
            if (mobile) query.mobile = mobile;
            if (email) query.email = email;

            var history = await ScoreHistoryModel.findOne(query);
            
            var newScoreEntry = {
                score: parseInt(score),
                grade: grade,
                date: new Date(),
                source: source || 'manual'
            };

            if (history) {
                // Add to existing history
                history.scores.push(newScoreEntry);
                history.updatedAt = new Date();
                // Update other identifiers if provided
                if (pan) history.pan = pan;
                if (mobile) history.mobile = mobile;
                if (email) history.email = email;
                if (name) history.name = name;
                await history.save();
            } else {
                // Create new history
                history = new ScoreHistoryModel({
                    client_id: client_id,
                    pan: pan,
                    mobile: mobile,
                    email: email,
                    name: name,
                    scores: [newScoreEntry]
                });
                await history.save();
            }

            res.json({
                success: true,
                message: 'Score added to history',
                client_id: history.client_id,
                score: newScoreEntry.score,
                grade: newScoreEntry.grade,
                source: newScoreEntry.source,
                totalRecords: history.scores.length
            });
        } catch (error) {
            log('Error adding score to history:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });

    // Get all users with score history (for admin)
    app.get('/get/api/cibil/score-history/all', async function(req, res) {
        try {
            log('/get/api/cibil/score-history/all');
            
            var histories = await ScoreHistoryModel.find({})
                .select('client_id name pan mobile email scores')
                .lean();
            
            var summary = histories.map(h => ({
                client_id: h.client_id,
                name: h.name,
                pan: h.pan,
                mobile: h.mobile,
                email: h.email,
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

    // Calculate score trend by multiple identifiers
    app.get('/get/api/cibil/score-trend', async function(req, res) {
        try {
            log('/get/api/cibil/score-trend');
            var { pan, mobile, email, client_id } = req.query;
            
            if (!pan && !mobile && !email && !client_id) {
                return res.status(400).json({ 
                    error: 'Please provide at least one identifier (pan, mobile, email, or client_id)' 
                });
            }
            
            var query = {};
            if (client_id) query.client_id = client_id;
            if (pan) query.pan = pan;
            if (mobile) query.mobile = mobile;
            if (email) query.email = email;

            var history = await ScoreHistoryModel.findOne(query);
            
            if (!history || history.scores.length < 2) {
                return res.json({ 
                    success: true, 
                    identifiers: { pan, mobile, email, client_id },
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
                client_id: history.client_id,
                name: history.name,
                currentScore: latestScore,
                previousScore: previousScore,
                firstScore: firstScore,
                recentChange: recentChange,
                overallChange: overallChange,
                trend: trend,
                scoreCount: history.scores.length,
                message: trend === 'improving' ? 'Your score is improving!' :
                         trend === 'declining' ? 'Your score needs attention.' :
                         'Your score is stable.',
                recommendations: trend === 'declining' ? [
                    'Check for any recent missed payments',
                    'Review your credit utilization ratio',
                    'Avoid applying for new credit unnecessarily'
                ] : trend === 'improving' ? [
                    'Continue with your good credit habits',
                    'Keep credit utilization below 30%',
                    'Maintain timely payments'
                ] : [
                    'Monitor your credit score regularly',
                    'Maintain current credit management practices'
                ]
            });
        } catch (error) {
            log('Error calculating score trend:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });

    // Search users by any identifier (for admin/analytics)
    app.get('/get/api/cibil/score-history/search', async function(req, res) {
        try {
            log('/get/api/cibil/score-history/search');
            var { query } = req.query;
            
            if (!query) {
                return res.status(400).json({ 
                    error: 'Search query is required' 
                });
            }

            var histories = await ScoreHistoryModel.find({
                $or: [
                    { client_id: { $regex: query, $options: 'i' } },
                    { pan: { $regex: query, $options: 'i' } },
                    { mobile: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } },
                    { name: { $regex: query, $options: 'i' } }
                ]
            })
            .select('client_id name pan mobile email scores')
            .limit(50)
            .lean();

            var results = histories.map(h => ({
                client_id: h.client_id,
                name: h.name,
                pan: h.pan,
                mobile: h.mobile,
                email: h.email,
                latestScore: h.scores.length > 0 ? h.scores[h.scores.length - 1].score : null,
                latestGrade: h.scores.length > 0 ? h.scores[h.scores.length - 1].grade : null,
                totalRecords: h.scores.length
            }));

            res.json({
                success: true,
                query: query,
                count: results.length,
                results: results
            });
        } catch (error) {
            log('Error searching score histories:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });

})();