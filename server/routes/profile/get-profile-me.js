(function () {
    /**
     * GET /api/profile/me
     * Returns full profile (user-provided from signup/onboarding) + CIBIL-derived profile data
     * and analysis summary so the portal can show everything in one place.
     * Analysis is run on the full CIBIL data; this endpoint returns a simplified view for the profile page.
     */
    var ProfileModel = require('../../schema/profile/profile-schema');
    var getCibilForUser = require('../cibil/api/cibil-data-resolver.js').getCibilForUser;
    var GradingEngine = require('../cibil/api/grading-engine');
    var AdvancedAnalytics = require('../cibil/api/analytics-engine-advance.js');
    var RiskAssessment = require('../cibil/api/risk-assessment.js');

    app.get('/api/profile/me', async function (req, res) {
        try {
            var mobile = (req.session && req.session.mobile) ? String(req.session.mobile).trim() : null;
            if (!mobile) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized',
                    requiresAuth: true
                });
            }

            var profile = await ProfileModel.findOne({ mobile: mobile }).lean();
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: 'Profile not found'
                });
            }

            var cibilProfile = null;
            var analysisSummary = null;

            try {
                var cibilData = await getCibilForUser({ mobile: mobile, email: '', pan: '' });
                if (cibilData && cibilData.credit_report && cibilData.credit_report[0]) {
                    var report0 = cibilData.credit_report[0];

                    // Extract every detail from CIBIL report for profile display
                    cibilProfile = {
                        controlNumber: report0.control_number || null,
                        creditScore: cibilData.credit_score || null,
                        names: report0.names || [],
                        ids: report0.ids || [],
                        telephones: report0.telephones || [],
                        emails: report0.emails || [],
                        employment: report0.employment || [],
                        addresses: report0.addresses || [],
                        consumerSummary: null,
                        reasonCodes: []
                    };

                    if (report0.response && report0.response.consumerSummaryresp) {
                        cibilProfile.consumerSummary = {
                            accountSummary: report0.response.consumerSummaryresp.accountSummary || {},
                            inquirySummary: report0.response.consumerSummaryresp.inquirySummary || {}
                        };
                    }
                    if (report0.scores && report0.scores[0] && report0.scores[0].reasonCodes) {
                        cibilProfile.reasonCodes = report0.scores[0].reasonCodes;
                    }

                    // Run full analysis on whole CIBIL data for simplified portal view
                    var gradingEngine = new GradingEngine(cibilData);
                    var analytics = new AdvancedAnalytics(cibilData, gradingEngine);
                    var risk = new RiskAssessment(cibilData, gradingEngine);
                    var grade = gradingEngine.calculateOverallGrade();
                    var comprehensiveReport = analytics.generateComprehensiveReport();
                    var riskReport = risk.generateRiskReport();

                    var utilization = comprehensiveReport.creditUtilization;
                    if (utilization == null && gradingEngine.getCreditUtilization) {
                        try { utilization = gradingEngine.getCreditUtilization(); } catch (e) { utilization = 0; }
                    }
                    var age = comprehensiveReport.creditAge;
                    if (age == null && gradingEngine.getCreditAge) {
                        try { age = gradingEngine.getCreditAge(); } catch (e) { age = 0; }
                    }
                    analysisSummary = {
                        grade: grade,
                        score: parseInt(cibilData.credit_score, 10) || 0,
                        totalAccounts: (report0.accounts && report0.accounts.length) || 0,
                        totalEnquiries: (report0.enquiries && report0.enquiries.length) || 0,
                        creditUtilization: utilization != null ? utilization : 0,
                        creditAge: age != null ? age : 0,
                        riskLevel: (riskReport.creditAssessment && riskReport.creditAssessment.defaultProbability && riskReport.creditAssessment.defaultProbability.riskLevel) || 'MEDIUM',
                        defaultProbability: (riskReport.creditAssessment && riskReport.creditAssessment.defaultProbability && riskReport.creditAssessment.defaultProbability.probability) != null
                            ? riskReport.creditAssessment.defaultProbability.probability : null,
                        accountSummary: cibilProfile.consumerSummary && cibilProfile.consumerSummary.accountSummary
                            ? cibilProfile.consumerSummary.accountSummary : null,
                        inquirySummary: cibilProfile.consumerSummary && cibilProfile.consumerSummary.inquirySummary
                            ? cibilProfile.consumerSummary.inquirySummary : null
                    };
                }
            } catch (cibilErr) {
                console.error('Profile me: CIBIL fetch/analysis error:', cibilErr);
                cibilProfile = null;
                analysisSummary = null;
            }

            return res.json({
                success: true,
                profile: profile,
                cibilProfile: cibilProfile,
                analysisSummary: analysisSummary
            });
        } catch (err) {
            console.error('GET /api/profile/me error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to load profile'
            });
        }
    });
})();
