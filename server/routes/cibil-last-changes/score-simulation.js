(function() {

    // Score Simulation API
//request paylod '/post/api/cibil/score-simulation'
//     {
        //   "client_id": "credit_report_cibil_jIifktiYhrHTbZcMdlsU",
        //   "pan": "IVZPK2103N",
        //   "current_score": 670,
        //   "simulation_type": "optimistic",
        //   "user_actions": [
        //     {
        //       "type": "clear_overdue",
        //       "amount": 2,
        //       "month": 1
        //     },
        //     {
        //       "type": "reduce_utilization",
        //       "reduction": 20,
        //       "month": 3
        //     }
        //   ],
        //   "months": 24
        // }
// response payload
//     {
        //   "success": true,
        //   "client_info": { ... },
        //   "simulation_type": "optimistic",
        //   "simulation_period": "24 months",
        //   "current_analysis": { ... },
        //   "monthly_projections": [
        //     {
        //       "month": 1,
        //       "score": 685,
        //       "improvement": 15,
        //       "cumulative_improvement": 15,
        //       "estimated_date": "2024-02-15"
        //     },
        //     ...
        //   ],
        //   "key_milestones": [ ... ],
        //   "quick_actions": [ ... ],
        //   "recommendations": [ ... ]
        // }

// 2. GET /get/api/cibil/quick-simulation
// Query Parameters: ?pan=IVZPK2103N or ?mobile=9708016996

// Response: Quick 3-scenario simulation

// 3. GET /get/api/cibil/simulation-scenarios
// Response: All available simulation scenarios with descriptions

// 4. POST /post/api/cibil/save-simulation
// Request Body: Save simulation results for history

// 5. GET /get/api/cibil/simulation-history
// Query Parameters: Get past simulations for a client






    app.post('/post/api/cibil/score-simulation', async function(req, res) {
        try {
            log('/post/api/cibil/score-simulation');

            var {
                client_id,
                pan,
                mobile,
                email,
                current_score,
                simulation_type = 'optimistic',
                user_actions = [],
                months = 24
            } = req.body;

            // Validate at least one identifier is provided
            if (!client_id && !pan && !mobile && !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide at least one identifier (client_id, pan, mobile, or email)'
                });
            }

            // Build query based on provided identifiers
            var query = {};
            if (client_id) query.client_id = client_id;
            if (pan) query.pan_number = pan;
            if (mobile) query.mobile_number = mobile;
            if (email) query.email = email;

            // Fetch client data
            var cibilData = await CibilDataModel.findOne(query)
                .select('client_id credit_score credit_report name pan_number mobile_number email')
                .lean();

            if (!cibilData) {
                return res.status(404).json({
                    success: false,
                    error: 'Client data not found for simulation',
                    identifiers: { client_id, pan, mobile, email }
                });
            }

            // Use provided current_score or fetch from data
            var startingScore = current_score || cibilData.credit_score;
            if (typeof startingScore === 'string') {
                startingScore = parseInt(startingScore);
            }

            // Analyze current credit profile
            var GradingEngine = require('./api/grading-engine.js');
            var RiskAssessment = require('./api/risk-assessment.js');
            var gradingEngine = new GradingEngine(cibilData);
            var riskAssessment = new RiskAssessment(cibilData, gradingEngine);

            var currentAnalysis = {
                score: startingScore,
                grade: gradingEngine.calculateOverallGrade().grade,
                riskLevel: riskAssessment.calculateDefaultProbability().riskLevel,
                creditUtilization: calculateCreditUtilization(cibilData),
                paymentHistory: calculatePaymentHistoryScore(cibilData),
                defaultAccounts: countDefaultAccounts(cibilData),
                recentEnquiries: countRecentEnquiries(cibilData),
                creditAge: calculateCreditAge(cibilData)
            };

            // Generate simulation
            var simulation = generateScoreSimulation(
                currentAnalysis,
                simulation_type,
                user_actions,
                months
            );

            // Add recommendations based on simulation
            var recommendations = generateRecommendations(simulation);

            res.json({
                success: true,
                client_info: {
                    client_id: cibilData.client_id,
                    name: cibilData.name || cibilData.full_name,
                    pan: cibilData.pan_number,
                    mobile: cibilData.mobile_number,
                    email: cibilData.email,
                    current_score: startingScore
                },
                simulation_type: simulation_type,
                simulation_period: months + ' months',
                current_analysis: currentAnalysis,
                monthly_projections: simulation.monthlyProjections,
                key_milestones: simulation.keyMilestones,
                quick_actions: simulation.quickActions,
                recommendations: recommendations,
                assumptions: getSimulationAssumptions(simulation_type),
                generated_at: new Date()
            });

        } catch (error) {
            console.error('Error in score simulation:', error);
            res.status(500).json({
                success: false,
                error: 'Score simulation failed',
                details: error.message
            });
        }
    });

    // Quick simulation endpoint (lightweight)
    app.get('/get/api/cibil/quick-simulation', async function(req, res) {
        try {
            log('/get/api/cibil/quick-simulation');

            var { pan, mobile, email, client_id } = req.query;

            if (!pan && !mobile && !email && !client_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, email, or client_id)'
                });
            }

            var query = {};
            if (client_id) query.client_id = client_id;
            if (pan) query.pan_number = pan;
            if (mobile) query.mobile_number = mobile;
            if (email) query.email = email;

            var cibilData = await CibilDataModel.findOne(query)
                .select('client_id credit_score name')
                .lean();

            if (!cibilData) {
                return res.status(404).json({
                    success: false,
                    error: 'Client data not found',
                    identifiers: { pan, mobile, email, client_id }
                });
            }

            var currentScore = parseInt(cibilData.credit_score) || 670;

            // Quick optimistic simulation
            var quickSimulation = generateQuickSimulation(currentScore);

            res.json({
                success: true,
                client_id: cibilData.client_id,
                name: cibilData.name,
                current_score: currentScore,
                quick_simulation: quickSimulation,
                generated_at: new Date()
            });

        } catch (error) {
            console.error('Error in quick simulation:', error);
            res.status(500).json({
                success: false,
                error: 'Quick simulation failed',
                details: error.message
            });
        }
    });

    // Get simulation scenarios
    app.get('/get/api/cibil/simulation-scenarios', function(req, res) {
        try {
            log('/get/api/cibil/simulation-scenarios');

            var scenarios = {
                optimistic: {
                    description: 'Best-case scenario with optimal actions',
                    monthly_gain: '10-20 points',
                    total_gain: '150-250 points in 24 months',
                    actions: [
                        'Clear all overdue amounts immediately',
                        'Reduce credit utilization below 30%',
                        'No new credit enquiries for 12 months',
                        'Perfect payment history',
                        'Add positive credit mix'
                    ],
                    target_score: '750+'
                },
                realistic: {
                    description: 'Achievable scenario with consistent effort',
                    monthly_gain: '5-10 points',
                    total_gain: '80-150 points in 24 months',
                    actions: [
                        'Clear major overdue amounts in 3 months',
                        'Reduce credit utilization below 40%',
                        'Limit new enquiries to 2 per year',
                        'Maintain 90% on-time payments',
                        'Gradual credit improvement'
                    ],
                    target_score: '700-750'
                },
                conservative: {
                    description: 'Slow but steady improvement',
                    monthly_gain: '3-7 points',
                    total_gain: '50-100 points in 24 months',
                    actions: [
                        'Clear overdue amounts in 6 months',
                        'Reduce credit utilization below 50%',
                        'Minimal new credit activity',
                        'Focus on payment consistency',
                        'Maintain current accounts'
                    ],
                    target_score: '650-700'
                },
                what_if: {
                    description: 'What-if analysis for specific actions',
                    actions: [
                        'Clear specific overdue amount',
                        'Reduce credit utilization by X%',
                        'Add secured credit card',
                        'Close specific account',
                        'Take new loan'
                    ],
                    customizable: true
                }
            };

            res.json({
                success: true,
                scenarios: scenarios,
                factors_considered: [
                    'Payment History (35% impact)',
                    'Credit Utilization (30% impact)',
                    'Credit Age (15% impact)',
                    'Credit Mix (10% impact)',
                    'New Credit (10% impact)'
                ],
                generated_at: new Date()
            });

        } catch (error) {
            console.error('Error fetching simulation scenarios:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch scenarios',
                details: error.message
            });
        }
    });

    // Save simulation result
    app.post('/post/api/cibil/save-simulation', async function(req, res) {
        try {
            log('/post/api/cibil/save-simulation');

            var simulationData = req.body;

            if (!simulationData.client_id || !simulationData.simulation_result) {
                return res.status(400).json({
                    success: false,
                    error: 'client_id and simulation_result are required'
                });
            }

            // Create or update simulation history schema
            var SimulationHistorySchema = new mongoose.Schema({
                client_id: { type: String, required: true, index: true },
                pan: { type: String, index: true },
                simulation_type: String,
                starting_score: Number,
                projected_score: Number,
                simulation_result: Object,
                user_actions: Array,
                simulation_date: { type: Date, default: Date.now },
                notes: String
            });

            var SimulationHistoryModel = mongoose.models.SimulationHistoryModel ||
                mongoose.model('SimulationHistoryModel', SimulationHistorySchema);

            var simulationRecord = new SimulationHistoryModel({
                client_id: simulationData.client_id,
                pan: simulationData.pan,
                simulation_type: simulationData.simulation_type,
                starting_score: simulationData.starting_score,
                projected_score: simulationData.projected_score,
                simulation_result: simulationData.simulation_result,
                user_actions: simulationData.user_actions || [],
                notes: simulationData.notes
            });

            await simulationRecord.save();

            res.json({
                success: true,
                message: 'Simulation saved successfully',
                simulation_id: simulationRecord._id,
                saved_at: simulationRecord.simulation_date
            });

        } catch (error) {
            console.error('Error saving simulation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to save simulation',
                details: error.message
            });
        }
    });

    // Get simulation history
    app.get('/get/api/cibil/simulation-history', async function(req, res) {
        try {
            log('/get/api/cibil/simulation-history');

            var { pan, mobile, email, client_id } = req.query;

            if (!pan && !mobile && !email && !client_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, email, or client_id)'
                });
            }

            var SimulationHistorySchema = new mongoose.Schema({
                client_id: { type: String, index: true },
                pan: { type: String, index: true },
                simulation_type: String,
                starting_score: Number,
                projected_score: Number,
                simulation_result: Object,
                simulation_date: Date
            });

            var SimulationHistoryModel = mongoose.models.SimulationHistoryModel ||
                mongoose.model('SimulationHistoryModel', SimulationHistorySchema);

            var query = {};
            if (client_id) query.client_id = client_id;
            if (pan) query.pan = pan;

            var history = await SimulationHistoryModel.find(query)
                .sort({ simulation_date: -1 })
                .limit(10)
                .lean();

            res.json({
                success: true,
                total_simulations: history.length,
                simulations: history,
                generated_at: new Date()
            });

        } catch (error) {
            console.error('Error fetching simulation history:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch simulation history',
                details: error.message
            });
        }
    });

    // Helper Functions

    function calculateCreditUtilization(cibilData) {
        if (!cibilData.credit_report || !cibilData.credit_report[0] || !cibilData.credit_report[0].accounts) {
            return 0;
        }

        var totalBalance = 0;
        var totalLimit = 0;

        cibilData.credit_report[0].accounts.forEach(function(account) {
            var balance = parseFloat(account.current_balance) || 0;
            var limit = parseFloat(account.highCreditAmount) || 0;

            totalBalance += balance;
            totalLimit += limit;
        });

        return totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
    }

    function calculatePaymentHistoryScore(cibilData) {
        if (!cibilData.credit_report || !cibilData.credit_report[0] || !cibilData.credit_report[0].accounts) {
            return 85; // Default
        }

        var onTimePayments = 0;
        var totalPayments = 0;

        cibilData.credit_report[0].accounts.forEach(function(account) {
            if (account.monthlyPayStatus) {
                account.monthlyPayStatus.forEach(function(payment) {
                    if (payment.status === '0') {
                        onTimePayments++;
                    }
                    totalPayments++;
                });
            }
        });

        return totalPayments > 0 ? Math.round((onTimePayments / totalPayments) * 100) : 85;
    }

    function countDefaultAccounts(cibilData) {
        if (!cibilData.credit_report || !cibilData.credit_report[0] || !cibilData.credit_report[0].accounts) {
            return 0;
        }

        var defaults = 0;
        cibilData.credit_report[0].accounts.forEach(function(account) {
            if (account.amountOverdue && parseFloat(account.amountOverdue) > 0) {
                defaults++;
            }
        });

        return defaults;
    }

    function countRecentEnquiries(cibilData) {
        if (!cibilData.credit_report || !cibilData.credit_report[0] || !cibilData.credit_report[0].enquiries) {
            return 0;
        }

        var recentCount = 0;
        var threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        cibilData.credit_report[0].enquiries.forEach(function(enquiry) {
            var enquiryDate = new Date(enquiry.enquiryDate);
            if (enquiryDate > threeMonthsAgo) {
                recentCount++;
            }
        });

        return recentCount;
    }

    function calculateCreditAge(cibilData) {
        if (!cibilData.credit_report || !cibilData.credit_report[0] || !cibilData.credit_report[0].accounts) {
            return 2; // Default 2 years
        }

        var oldestAccount = new Date();
        var hasAccounts = false;

        cibilData.credit_report[0].accounts.forEach(function(account) {
            if (account.dateOpened && account.dateOpened !== 'NA') {
                var openedDate = new Date(account.dateOpened);
                if (openedDate < oldestAccount) {
                    oldestAccount = openedDate;
                    hasAccounts = true;
                }
            }
        });

        if (!hasAccounts) return 2;

        var ageInYears = (new Date() - oldestAccount) / (1000 * 60 * 60 * 24 * 365.25);
        return Math.round(ageInYears * 10) / 10;
    }

    function generateScoreSimulation(currentAnalysis, scenario, userActions, months) {
        var monthlyProjections = [];
        var currentScore = currentAnalysis.score;

        // Base monthly improvement based on scenario
        var baseMonthlyImprovement = {
            'optimistic': 12,
            'realistic': 7,
            'conservative': 4,
            'what-if': 5
        } [scenario] || 7;

        // Adjust based on current profile
        var profileMultiplier = calculateProfileMultiplier(currentAnalysis);

        for (var month = 1; month <= months; month++) {
            var monthlyImprovement = baseMonthlyImprovement * profileMultiplier;

            // Apply user actions if specified for this month
            if (userActions && userActions.length > 0) {
                userActions.forEach(function(action) {
                    if (action.month === month) {
                        monthlyImprovement += calculateActionImpact(action, currentAnalysis);
                    }
                });
            }

            // Apply diminishing returns as score increases
            if (currentScore > 750) {
                monthlyImprovement *= 0.5;
            } else if (currentScore > 700) {
                monthlyImprovement *= 0.7;
            } else if (currentScore > 650) {
                monthlyImprovement *= 0.9;
            }

            // Add some randomness (±20%)
            var randomFactor = 0.8 + (Math.random() * 0.4);
            monthlyImprovement = Math.round(monthlyImprovement * randomFactor);

            // Ensure minimum improvement of 1 point
            monthlyImprovement = Math.max(1, monthlyImprovement);

            // Cap at 900
            currentScore = Math.min(900, currentScore + monthlyImprovement);

            monthlyProjections.push({
                month: month,
                score: Math.round(currentScore),
                improvement: monthlyImprovement,
                cumulative_improvement: Math.round(currentScore - currentAnalysis.score),
                estimated_date: getFutureDate(month)
            });
        }

        // Generate key milestones
        var keyMilestones = generateKeyMilestones(monthlyProjections, currentAnalysis.score);

        // Generate quick actions
        var quickActions = generateQuickActions(currentAnalysis);

        return {
            monthlyProjections: monthlyProjections,
            finalScore: Math.round(currentScore),
            totalImprovement: Math.round(currentScore - currentAnalysis.score),
            averageMonthlyImprovement: Math.round((currentScore - currentAnalysis.score) / months),
            keyMilestones: keyMilestones,
            quickActions: quickActions
        };
    }

    function calculateProfileMultiplier(analysis) {
        var multiplier = 1.0;

        // Negative factors reduce improvement
        if (analysis.defaultAccounts > 0) multiplier *= 0.7;
        if (analysis.creditUtilization > 70) multiplier *= 0.8;
        if (analysis.paymentHistory < 80) multiplier *= 0.9;
        if (analysis.recentEnquiries > 5) multiplier *= 0.9;

        // Positive factors increase improvement
        if (analysis.creditAge > 5) multiplier *= 1.2;
        if (analysis.creditUtilization < 30) multiplier *= 1.1;
        if (analysis.paymentHistory > 95) multiplier *= 1.1;

        return Math.max(0.5, Math.min(1.5, multiplier));
    }

    function calculateActionImpact(action, analysis) {
        var impact = 0;

        switch (action.type) {
            case 'clear_overdue':
                impact = 25 * (action.amount || 1); // 25 points per default cleared
                break;
            case 'reduce_utilization':
                var reduction = action.reduction || 10;
                impact = reduction * 0.5; // 0.5 points per percentage reduction
                break;
            case 'add_secured_card':
                impact = 15; // 15 points for adding positive credit
                break;
            case 'perfect_payments':
                impact = 30; // 30 points for 6 months perfect payments
                break;
            case 'no_new_credit':
                impact = 20; // 20 points for avoiding new enquiries
                break;
            case 'close_account':
                impact = -10; // Negative impact for closing old accounts
                break;
            case 'pay_off_loan':
                impact = 15; // 15 points for paying off installment loan
                break;
        }

        return impact;
    }

    function generateKeyMilestones(projections, startingScore) {
        var milestones = [];
        var targetScores = [700, 720, 750, 780, 800];

        targetScores.forEach(function(target) {
            if (target > startingScore) {
                var milestoneMonth = projections.find(function(proj) {
                    return proj.score >= target;
                });

                if (milestoneMonth) {
                    milestones.push({
                        target_score: target,
                        achievement_month: milestoneMonth.month,
                        estimated_date: milestoneMonth.estimated_date,
                        improvement_needed: target - startingScore
                    });
                }
            }
        });

        return milestones;
    }

    function generateQuickActions(analysis) {
        var actions = [];
        var priority = 'high';

        if (analysis.defaultAccounts > 0) {
            actions.push({
                action: 'Clear overdue accounts',
                impact: 'High (+25-50 points)',
                priority: 'high',
                timeline: 'Immediate',
                description: 'Clear ' + analysis.defaultAccounts + ' default account(s)'
            });
        }

        if (analysis.creditUtilization > 70) {
            actions.push({
                action: 'Reduce credit utilization',
                impact: 'High (+20-40 points)',
                priority: 'high',
                timeline: '1-3 months',
                description: 'Reduce utilization from ' + analysis.creditUtilization + '% to below 30%'
            });
        } else if (analysis.creditUtilization > 50) {
            actions.push({
                action: 'Further reduce credit utilization',
                impact: 'Medium (+10-20 points)',
                priority: 'medium',
                timeline: '1-3 months',
                description: 'Reduce utilization from ' + analysis.creditUtilization + '% to below 40%'
            });
        }

        if (analysis.paymentHistory < 90) {
            actions.push({
                action: 'Improve payment history',
                impact: 'High (+30-50 points)',
                priority: 'high',
                timeline: '6 months',
                description: 'Achieve 100% on-time payments for next 6 months'
            });
        }

        if (analysis.recentEnquiries > 3) {
            actions.push({
                action: 'Avoid new credit applications',
                impact: 'Medium (+10-15 points)',
                priority: 'medium',
                timeline: '6 months',
                description: 'No new credit enquiries for next 6 months'
            });
        }

        if (analysis.creditAge < 3) {
            actions.push({
                action: 'Maintain old accounts',
                impact: 'Low (+5-10 points annually)',
                priority: 'low',
                timeline: 'Long-term',
                description: 'Keep oldest credit accounts open to improve credit age'
            });
        }

        // Sort by priority
        actions.sort(function(a, b) {
            var priorityOrder = { high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        return actions.slice(0, 5); // Return top 5 actions
    }

    function generateQuickSimulation(currentScore) {
        var scenarios = [
            { name: 'Optimistic', multiplier: 1.2 },
            { name: 'Realistic', multiplier: 1.0 },
            { name: 'Conservative', multiplier: 0.8 }
        ];

        var results = scenarios.map(function(scenario) {
            var finalScore = Math.min(900, currentScore + (30 * scenario.multiplier));

            return {
                scenario: scenario.name,
                current_score: currentScore,
                projected_score_3m: Math.min(900, currentScore + (15 * scenario.multiplier)),
                projected_score_6m: Math.min(900, currentScore + (30 * scenario.multiplier)),
                projected_score_12m: Math.min(900, currentScore + (60 * scenario.multiplier)),
                projected_score_24m: finalScore,
                total_improvement: Math.round(finalScore - currentScore),
                key_action: scenario.name === 'Optimistic' ? 'Clear all defaults immediately' : scenario.name === 'Realistic' ? 'Reduce utilization below 40%' : 'Maintain current payment pattern'
            };
        });

        return {
            current_score: currentScore,
            scenarios: results,
            best_case: results[0],
            realistic_case: results[1],
            generated_at: new Date()
        };
    }

    function generateRecommendations(simulation) {
        var recommendations = [];

        if (simulation.finalScore >= 750) {
            recommendations.push('Excellent progress! Maintain current credit habits.');
            recommendations.push('You qualify for premium credit offers and lowest interest rates.');
            recommendations.push('Consider strategic credit optimization for long-term benefits.');
        } else if (simulation.finalScore >= 700) {
            recommendations.push('Good progress! Focus on maintaining utilization below 30%.');
            recommendations.push('Continue perfect payment history for maximum score impact.');
            recommendations.push('Consider adding a secured credit card to diversify credit mix.');
        } else if (simulation.finalScore >= 650) {
            recommendations.push('Solid improvement! Prioritize clearing any remaining defaults.');
            recommendations.push('Work on reducing credit utilization further.');
            recommendations.push('Avoid new credit applications for next 6 months.');
        } else {
            recommendations.push('Focus on foundational improvements first.');
            recommendations.push('Clear all overdue amounts as priority.');
            recommendations.push('Establish consistent payment pattern.');
        }

        return recommendations;
    }

    function getSimulationAssumptions(scenario) {
        var assumptions = {
            base: [
                'Simulation based on standard credit scoring models',
                'Assumes continued economic stability',
                'Does not account for major life events',
                'Based on typical scoring algorithm behavior'
            ],
            optimistic: [
                'All overdue amounts cleared within 3 months',
                'Credit utilization reduced to below 30%',
                'Perfect payment history maintained',
                'No new credit enquiries for 12 months',
                'Positive credit actions implemented'
            ],
            realistic: [
                'Major overdue amounts cleared within 6 months',
                'Credit utilization reduced to below 40%',
                '90%+ on-time payment history',
                'Limited new credit activity',
                'Gradual credit improvement'
            ],
            conservative: [
                'Overdue amounts cleared within 12 months',
                'Credit utilization below 50%',
                'Maintain current payment patterns',
                'Minimal credit activity changes',
                'Slow but steady improvement'
            ]
        };

        return assumptions.base.concat(assumptions[scenario] || assumptions.realistic);
    }

    function getFutureDate(monthsFromNow) {
        var date = new Date();
        date.setMonth(date.getMonth() + monthsFromNow);
        return date.toISOString().split('T')[0];
    }

})();