/**
 * Score history model – used by analysis-client and upload-cibil for score comparison.
 * Schema matches server/routes/cibil/score-history.js (single source: ScoreHistoryModel).
 */
(function () {
    var mongoose = require('mongoose');
    var ScoreHistorySchema = new mongoose.Schema({
        client_id: { type: String, required: true, index: true },
        pan: { type: String, index: true },
        mobile: { type: String, index: true },
        email: { type: String, index: true },
        name: String,
        scores: [{
            score: Number,
            grade: String,
            date: { type: Date, default: Date.now },
            source: { type: String, default: 'manual' }
        }],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    });
    var ScoreHistoryModel = mongoose.models.ScoreHistoryModel || mongoose.model('ScoreHistoryModel', ScoreHistorySchema);
    module.exports = ScoreHistoryModel;
})();
