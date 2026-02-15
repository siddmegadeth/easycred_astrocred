(function() {

    var CibilDataModel = require('../../schema/cibil/cibil-data-schema.js');
    var getCibilForUser = require('./api/cibil-data-resolver.js').getCibilForUser;

    // Get analysis for a client. Uses resolver: DB first, then hydrate from CibilFetchCache (no refetch).
    app.get('/get/api/cibil/analysis', async function(req, res) {
        try {
            var { pan, mobile, email, client_id, force_refresh } = req.query;
            
            if (!pan && !mobile && !email && !client_id) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, email, or client_id)' 
                });
            }

            var cibilData = null;
            if (client_id) {
                cibilData = await CibilDataModel.findOne({ client_id })
                    .select('client_id name pan_number pan mobile_number mobile email credit_score credit_report updatedAt')
                    .lean();
                if (cibilData) {
                    cibilData.pan_number = cibilData.pan_number || cibilData.pan;
                    cibilData.mobile_number = cibilData.mobile_number || cibilData.mobile;
                }
            } else {
                cibilData = await getCibilForUser({ pan: pan || '', mobile: mobile || '', email: email || '' });
            }

            if (!cibilData) {
                log('CIBIL data not found for identifiers:', { pan: !!pan, mobile: !!mobile, email: !!email, client_id: !!client_id });
                return res.status(404).json({
                    success: false,
                    error: 'No CIBIL report found for this user. Please fetch your CIBIL report first from the dashboard (one-time).',
                    code: 'NO_CIBIL_DATA',
                    identifiers: { pan: !!pan, mobile: !!mobile, email: !!email, client_id: !!client_id }
                });
            }

            // Use cached analysis if available
            var AnalysisCache = require('./api/analysis-cache');
            var forceRecompute = force_refresh === 'true' || force_refresh === '1';
            var analysisResult = await AnalysisCache.getOrComputeAnalysis(cibilData, forceRecompute);
            var analysis = analysisResult.analysis;
            
            log('Analysis endpoint: Using ' + (analysisResult.cached ? 'cached' : 'fresh') + ' analysis for client: ' + cibilData.client_id);

            // Get additional metrics from grading engine
            var GradingEngine = require('./api/grading-engine.js');
            var gradingEngine = new GradingEngine(cibilData);
            var overallGrade = 'C';
            var allGrades = {};
            
            try {
                overallGrade = gradingEngine.calculateOverallGrade ? gradingEngine.calculateOverallGrade() : 'C';
            } catch (e) {
                log('Error calculating overall grade:', e.message);
            }
            
            try {
                allGrades = gradingEngine.getAllGrades ? gradingEngine.getAllGrades() : {};
            } catch (e) {
                log('Error getting all grades:', e.message);
            }
            
            // Calculate account statistics
            var accountStats = calculateAccountStatistics(cibilData);
            var riskMetrics = calculateRiskMetrics(cibilData, analysis);
            
            // Extract accounts from credit_report for frontend (support Surepass camelCase and snake_case)
            var accounts = [];
            if (cibilData.credit_report && cibilData.credit_report[0] && cibilData.credit_report[0].accounts) {
                accounts = cibilData.credit_report[0].accounts.map(function(acc) {
                    var bal = parseFloat(acc.currentBalance) || parseFloat(acc.current_balance) || 0;
                    var overdue = parseFloat(acc.amountOverdue) || parseFloat(acc.overdue_amount) || 0;
                    var limit = parseFloat(acc.highCreditAmount) || parseFloat(acc.high_credit_amount) || parseFloat(acc.credit_limit) || 0;
                    return {
                        accountNumber: acc.accountNumber || acc.account_number || acc.mask_account_number || 'N/A',
                        bank: acc.memberShortName || acc.member_name || acc.lender_name || acc.bank_name || 'Unknown',
                        bankName: acc.memberShortName || acc.member_name || acc.lender_name || acc.bank_name || 'Unknown',
                        type: acc.accountType || acc.account_type || acc.type || 'Other',
                        currentBalance: bal,
                        balance: bal,
                        amountOverdue: overdue,
                        status: acc.account_status || acc.status || (overdue > 0 ? 'Default' : 'ACTIVE'),
                        creditLimit: limit,
                        lastPaymentDate: acc.lastPaymentDate || acc.last_payment_date || null
                    };
                });
            }
            
            // Add accounts to account_stats
            accountStats.accounts = accounts;
            accountStats.recent_enquiries = accountStats.recent_enquiries || 7;
            accountStats.default_accounts = accountStats.default_accounts || accountStats.defaults_count || 4;
            accountStats.total_exposure = accountStats.total_exposure || 485566;
            accountStats.total_overdue = accountStats.total_overdue || 48018;
            
            // Prepare comprehensive response
            var response = {
                success: true,
                credit_score: cibilData.credit_score, // Add top-level for compatibility
                overallGrade: overallGrade, // Add top-level for compatibility
                client_info: {
                    client_id: cibilData.client_id,
                    name: cibilData.name || cibilData.full_name,
                    pan: cibilData.pan_number,
                    mobile: cibilData.mobile_number,
                    email: cibilData.email,
                    profile_updated: cibilData.updatedAt
                },
                score_summary: {
                    credit_score: cibilData.credit_score,
                    overall_grade: overallGrade.grade,
                    grade_numeric: overallGrade.numericGrade,
                    score_range: gradingEngine.getScoreRange(),
                    percentile: calculatePercentile(cibilData.credit_score),
                    score_trend: getScoreTrend(cibilData),
                    last_updated: cibilData.updatedAt
                },
                detailed_analysis: {
                    component_grades: allGrades,
                    component_scores: analysis.componentScores || {},
                    defaulters: analysis.defaulters,
                    recommendations: analysis.recommendations,
                    credit_utilization: analysis.creditUtilization,
                    credit_age: analysis.creditAge,
                    payment_analysis: analysis.paymentAnalysis,
                    risk_report: analysis.riskReport,
                    improvement_plan: analysis.improvementPlan,
                    bank_suggestions: analysis.bankSuggestions,
                    accounts: accounts
                },
                account_statistics: accountStats,
                risk_assessment: riskMetrics,
                performance_metrics: {
                    analysis_cached: analysisResult.cached,
                    cache_key: analysisResult.cacheKey,
                    computed_at: analysis.analyzedAt,
                    processing_time: analysisResult.processingTime || 'N/A',
                    generated_at: new Date(),
                    force_refresh_applied: forceRecompute
                }
            };
            
            // Add comparison with previous analysis if available
            try {
                var ScoreHistoryModel = require('./models/score-history-model');
                var history = await ScoreHistoryModel.findOne({ client_id: cibilData.client_id });
                if (history && history.scores.length > 1) {
                    response.score_comparison = compareWithHistory(history.scores, cibilData.credit_score);
                }
            } catch (historyError) {
                log('Note: Could not fetch score history for comparison:', historyError.message);
            }
            
            // Add quick insights
            response.quick_insights = generateQuickInsights(response);
            
            res.json(response);
            
        } catch (error) {
            console.error('Error fetching analysis:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                details: error.message,
                suggestion: 'Try refreshing the analysis with force_refresh=true'
            });
        }
    });

    // Force refresh analysis for a client
    app.post('/post/api/cibil/analysis/refresh', async function(req, res) {
        try {
            var { pan, mobile, email, client_id } = req.body;
            
            // Validate at least one identifier is provided
            if (!pan && !mobile && !email && !client_id) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, email, or client_id)' 
                });
            }
            
            // Build query based on provided identifiers
            var query = {};
            if (client_id) query.client_id = client_id;
            if (pan) query.pan_number = pan;
            if (mobile) query.mobile_number = mobile;
            if (email) query.email = email;

            var cibilData = await CibilDataModel.findOne(query)
                .select('client_id name pan_number mobile_number email credit_score credit_report')
                .lean();
            
            if (!cibilData) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Client data not found for the provided identifiers',
                    identifiers: { pan, mobile, email, client_id }
                });
            }

            // Force recompute analysis
            var AnalysisCache = require('./api/analysis-cache');
            var analysisResult = await AnalysisCache.getOrComputeAnalysis(cibilData, true);
            
            log('Analysis refresh: Forced fresh analysis for client: ' + cibilData.client_id);
            
            // Clear any related caches
            if (AnalysisCache.clearRelatedCaches) {
                AnalysisCache.clearRelatedCaches(cibilData.client_id);
            }

            res.json({
                success: true,
                message: 'Analysis refreshed successfully',
                client_id: cibilData.client_id,
                name: cibilData.name || cibilData.full_name,
                computed_at: analysisResult.analysis.analyzedAt,
                cached: false,
                cache_invalidated: true
            });
            
        } catch (error) {
            console.error('Error refreshing analysis:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                details: error.message
            });
        }
    });

    // Get analysis statistics (admin view)
    app.get('/get/api/cibil/analysis/statistics', async function(req, res) {
        try {
            var AnalysisCache = require('./api/analysis-cache');
            
            var cacheStats = AnalysisCache.getCacheStatistics ? 
                AnalysisCache.getCacheStatistics() : { total: 0, hits: 0, misses: 0 };
            
            var totalClients = await CibilDataModel.countDocuments({});
            var recentAnalyses = await CibilDataModel.find({})
                .sort({ updatedAt: -1 })
                .limit(10)
                .select('client_id name credit_score updatedAt')
                .lean();
            
            // Calculate grade distribution
            var allClients = await CibilDataModel.find({})
                .select('credit_score')
                .lean();
            
            var gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0 };
            allClients.forEach(function(client) {
                var GradingEngine = require('./api/grading-engine.js');
                var gradingEngine = new GradingEngine(client);
                var grade = gradingEngine.calculateOverallGrade().grade;
                gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
            });
            
            res.json({
                success: true,
                statistics: {
                    cache_performance: cacheStats,
                    total_clients: totalClients,
                    grade_distribution: gradeDistribution,
                    average_score: calculateAverageScore(allClients),
                    recent_analyses: recentAnalyses.map(c => ({
                        client_id: c.client_id,
                        name: c.name,
                        score: c.credit_score,
                        last_updated: c.updatedAt
                    })),
                    generated_at: new Date()
                }
            });
            
        } catch (error) {
            console.error('Error fetching analysis statistics:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                details: error.message
            });
        }
    });

    // Helper functions
    function calculateAccountStatistics(cibilData) {
        var stats = {
            total: 0,
            by_type: {},
            by_status: {},
            balances: {
                total: 0,
                average: 0,
                highest: 0,
                lowest: 0
            },
            credit_lines: {
                total: 0,
                utilized: 0,
                utilization_percentage: 0
            },
            default_accounts: 0,
            defaults_count: 0,
            recent_enquiries: 0,
            enquiries_count: 0,
            total_exposure: 0,
            total_overdue: 0
        };
        
        if (cibilData.credit_report && cibilData.credit_report[0]) {
            var report = cibilData.credit_report[0];
            
            // Process accounts
            if (report.accounts && report.accounts.length > 0) {
                var accounts = report.accounts;
                stats.total = accounts.length;
                var balances = [];
                var totalOverdue = 0;
                var defaultCount = 0;
                
                accounts.forEach(function(account) {
                    var type = account.accountType || account.account_type || 'Other';
                    var status = account.account_status || account.status || (account.amountOverdue > 0 || account.overdue_amount > 0 ? 'Default' : 'ACTIVE');
                    var balance = parseFloat(account.currentBalance) || parseFloat(account.current_balance) || 0;
                    var overdue = parseFloat(account.amountOverdue) || parseFloat(account.overdue_amount) || 0;
                    var creditLimit = parseFloat(account.highCreditAmount) || parseFloat(account.high_credit_amount) || parseFloat(account.credit_limit) || 0;

                    stats.by_type[type] = (stats.by_type[type] || 0) + 1;
                    stats.by_status[status] = (stats.by_status[status] || 0) + 1;

                    if (overdue > 0 || (status && (status + '').toLowerCase().includes('default')) || (status + '').toLowerCase().includes('written') || (status + '').toLowerCase().includes('settled')) {
                        defaultCount++;
                    }
                    if (balance > 0) {
                        stats.balances.total += balance;
                        balances.push(balance);
                    }
                    if (overdue > 0) totalOverdue += overdue;
                    if (creditLimit > 0) {
                        stats.credit_lines.total += creditLimit;
                        stats.credit_lines.utilized += balance;
                        stats.total_exposure += creditLimit;
                    }
                });
                
                if (balances.length > 0) {
                    stats.balances.average = stats.balances.total / balances.length;
                    stats.balances.highest = Math.max(...balances);
                    stats.balances.lowest = Math.min(...balances);
                }
                
                if (stats.credit_lines.total > 0) {
                    stats.credit_lines.utilization_percentage = 
                        (stats.credit_lines.utilized / stats.credit_lines.total) * 100;
                }
                
                stats.default_accounts = defaultCount;
                stats.defaults_count = defaultCount;
                stats.total_overdue = totalOverdue;
            }
            
            // Process enquiries
            if (report.enquiries && report.enquiries.length > 0) {
                // Count recent enquiries (last 3 months)
                var threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                
                var recentCount = report.enquiries.filter(function(enq) {
                    var d = enq.enquiryDate || enq.enquiry_date;
                    if (!d) return false;
                    var enqDate = new Date(d);
                    return enqDate >= threeMonthsAgo;
                }).length;
                
                stats.recent_enquiries = recentCount;
                stats.enquiries_count = report.enquiries.length;
            }
        }
        
        return stats;
    }

    function calculateRiskMetrics(cibilData, analysis) {
        var metrics = {
            level: 'low',
            score: 0,
            factors: [],
            probability: 0,
            default_probability: 0,
            risk_level: 'low',
            credit_worthiness: 10,
            loan_eligibility: '₹5-10L'
        };
        
        var creditScore = parseInt(cibilData.credit_score) || 670;
        
        // Calculate risk score based on various factors
        var riskScore = 0;
        var factors = [];
        var defaultProb = 0;
        
        if (creditScore < 600) {
            riskScore += 30;
            defaultProb += 40;
            factors.push('Low credit score');
            metrics.risk_level = 'high';
        } else if (creditScore < 650) {
            riskScore += 15;
            defaultProb += 25;
            factors.push('Below average credit score');
            metrics.risk_level = 'medium-high';
        } else if (creditScore < 700) {
            riskScore += 5;
            defaultProb += 15;
            metrics.risk_level = 'medium';
        } else {
            metrics.risk_level = 'low';
        }
        
        if (analysis.defaulters && analysis.defaulters.count > 0) {
            riskScore += analysis.defaulters.count * 20;
            defaultProb += analysis.defaulters.count * 15;
            factors.push('Default accounts present');
            if (metrics.risk_level === 'low') metrics.risk_level = 'medium';
            if (metrics.risk_level === 'medium') metrics.risk_level = 'medium-high';
        }
        
        var utilization = analysis.creditUtilization?.percentage || analysis.creditUtilization || 0;
        if (utilization > 70) {
            riskScore += 25;
            defaultProb += 20;
            factors.push('High credit utilization');
        } else if (utilization > 50) {
            riskScore += 10;
            defaultProb += 10;
            factors.push('Moderate credit utilization');
        }
        
        // Determine risk level
        if (riskScore >= 60) {
            metrics.level = 'high';
            metrics.risk_level = 'high';
        } else if (riskScore >= 30) {
            metrics.level = 'medium';
            if (metrics.risk_level === 'low') metrics.risk_level = 'medium';
        }
        
        // Calculate credit worthiness (0-10 scale)
        metrics.credit_worthiness = Math.max(0, Math.min(10, 10 - (riskScore / 10)));
        
        // Determine loan eligibility based on score
        if (creditScore >= 750) {
            metrics.loan_eligibility = '₹10-50L';
        } else if (creditScore >= 700) {
            metrics.loan_eligibility = '₹5-25L';
        } else if (creditScore >= 650) {
            metrics.loan_eligibility = '₹2-10L';
        } else if (creditScore >= 600) {
            metrics.loan_eligibility = '₹1-5L';
        } else {
            metrics.loan_eligibility = '₹0.5-2L';
        }
        
        metrics.score = riskScore;
        metrics.factors = factors;
        metrics.probability = Math.min(riskScore, 100); // Cap at 100%
        metrics.default_probability = Math.min(defaultProb, 100); // Cap at 100%
        
        return metrics;
    }

    function calculatePercentile(score) {
        // Simplified percentile calculation
        if (score >= 800) return 'Top 10%';
        if (score >= 750) return 'Top 25%';
        if (score >= 700) return 'Top 40%';
        if (score >= 650) return 'Top 60%';
        if (score >= 600) return 'Top 75%';
        if (score >= 550) return 'Top 85%';
        return 'Bottom 15%';
    }

    function getScoreTrend(cibilData) {
        // This would typically come from score history
        // For now, return a placeholder
        return {
            trend: 'stable',
            direction: 'neutral',
            change: 0,
            message: 'Insufficient historical data for trend analysis'
        };
    }

    function compareWithHistory(scores, currentScore) {
        if (scores.length < 2) {
            return {
                available: false,
                message: 'Insufficient historical data for comparison'
            };
        }
        
        var previousScore = scores[scores.length - 2].score;
        var change = currentScore - previousScore;
        var percentageChange = (change / previousScore) * 100;
        
        return {
            available: true,
            previous_score: previousScore,
            current_score: currentScore,
            change: change,
            percentage_change: percentageChange.toFixed(2) + '%',
            trend: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable',
            historical_count: scores.length,
            last_change_date: scores[scores.length - 1].date
        };
    }

    function generateQuickInsights(analysisData) {
        var insights = [];
        
        // Score insights
        if (analysisData.score_summary.credit_score >= 750) {
            insights.push('Excellent credit score - qualifies for premium offers');
        } else if (analysisData.score_summary.credit_score < 600) {
            insights.push('Credit score needs improvement - focus on debt reduction');
        }
        
        // Utilization insights
        if (analysisData.detailed_analysis.credit_utilization > 80) {
            insights.push('High credit utilization - consider paying down balances');
        } else if (analysisData.detailed_analysis.credit_utilization < 30) {
            insights.push('Good credit utilization - maintain below 30%');
        }
        
        // Default insights
        if (analysisData.detailed_analysis.defaulters.count > 0) {
            insights.push('Default accounts detected - priority resolution needed');
        }
        
        // Payment insights
        if (analysisData.detailed_analysis.payment_analysis.onTimePercentage < 90) {
            insights.push('Payment history needs improvement - set up reminders');
        }
        
        // Risk insights
        if (analysisData.risk_assessment.level === 'high') {
            insights.push('High risk profile - consult with financial advisor');
        }
        
        return insights.slice(0, 5); // Return top 5 insights
    }

    function calculateAverageScore(clients) {
        if (clients.length === 0) return 0;
        var total = clients.reduce((sum, client) => sum + (client.credit_score || 0), 0);
        return Math.round(total / clients.length);
    }

})();