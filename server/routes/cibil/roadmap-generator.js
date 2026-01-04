// Enhanced Roadmap Generator
// Supports 6/12/18/24 month roadmaps with phase-based planning
(function() {
    var AdvancedAnalytics = require('./api/analytics-engine-advance.js');
    var GradingEngine = require('./api/grading-engine.js');
    var CibilDataModel = require('../../schema/cibil/cibil-data-schema.js');

    // Generate roadmap for different timelines
    app.get('/get/api/cibil/roadmap/:months', async function(req, res) {
        try {
            var months = parseInt(req.params.months);
            var { pan, mobile, email } = req.query;

            // Validate months
            var validMonths = [6, 12, 18, 24];
            if (!validMonths.includes(months)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid timeline. Supported timelines: 6, 12, 18, 24 months'
                });
            }

            if (!pan && !mobile && !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, or email)'
                });
            }

            // Find CIBIL data
            var query = {};
            if (pan) query.pan = pan.toUpperCase();
            if (mobile) query.mobile = mobile;
            if (email) query.email = email.toLowerCase();

            var cibilData = await CibilDataModel.findOne(query).lean();
            if (!cibilData) {
                return res.status(404).json({
                    success: false,
                    error: 'CIBIL data not found'
                });
            }

            // Generate roadmap
            var gradingEngine = new GradingEngine(cibilData);
            var advancedAnalytics = new AdvancedAnalytics(cibilData, gradingEngine);
            var roadmap = generateRoadmap(advancedAnalytics, gradingEngine, months);

            res.json({
                success: true,
                timeline_months: months,
                roadmap: roadmap,
                generated_at: new Date()
            });

        } catch (error) {
            log('Error generating roadmap:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate roadmap',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Generate roadmap with phases
    function generateRoadmap(advancedAnalytics, gradingEngine, months) {
        var currentGrade = gradingEngine.calculateOverallGrade();
        var currentScore = parseInt(advancedAnalytics.cibilData.credit_score) || 0;
        var recommendations = gradingEngine.generateRecommendations ? gradingEngine.generateRecommendations() : [];
        
        // Determine phases based on timeline
        var phases = determinePhases(months, currentGrade, currentScore);
        
        // Calculate target score and grade
        var targetScore = calculateTargetScore(currentScore, months);
        var targetGrade = scoreToGrade(targetScore);
        
        // Generate phase-based plans
        var phasePlans = phases.map(function(phase, index) {
            return generatePhasePlan(phase, index, phases, recommendations, currentGrade, targetGrade, months);
        });

        return {
            user_info: {
                name: advancedAnalytics.userInfo.name,
                pan: advancedAnalytics.userInfo.pan,
                mobile: advancedAnalytics.userInfo.mobile
            },
            current_status: {
                score: currentScore,
                grade: typeof currentGrade === 'object' ? currentGrade.grade : currentGrade
            },
            target_status: {
                score: targetScore,
                grade: targetGrade
            },
            timeline_months: months,
            start_date: new Date().toISOString().split('T')[0],
            estimated_completion: getCompletionDate(months),
            phases: phasePlans,
            milestones: generateMilestones(phasePlans, months),
            expected_improvements: calculateExpectedImprovements(currentScore, targetScore, months),
            priority_actions: getPriorityActions(recommendations)
        };
    }

    // Determine phases based on timeline
    function determinePhases(months, currentGrade, currentScore) {
        var phases = [];
        
        if (months === 6) {
            // 6 months: 2 phases
            phases = [
                { name: 'Crisis Management', duration_months: 3, focus: 'Immediate actions' },
                { name: 'Stability & Growth', duration_months: 3, focus: 'Building positive history' }
            ];
        } else if (months === 12) {
            // 12 months: 3 phases
            phases = [
                { name: 'Crisis Management', duration_months: 3, focus: 'Stop negative behavior' },
                { name: 'Stability', duration_months: 4, focus: 'Establish positive patterns' },
                { name: 'Acceleration', duration_months: 5, focus: 'Optimize and grow' }
            ];
        } else if (months === 18) {
            // 18 months: 4 phases
            phases = [
                { name: 'Crisis Management', duration_months: 3, focus: 'Immediate damage control' },
                { name: 'Stability', duration_months: 5, focus: 'Establish foundation' },
                { name: 'Acceleration', duration_months: 5, focus: 'Build momentum' },
                { name: 'Optimization', duration_months: 5, focus: 'Maximize potential' }
            ];
        } else if (months === 24) {
            // 24 months: 4 phases
            phases = [
                { name: 'Crisis Management', duration_months: 4, focus: 'Immediate damage control' },
                { name: 'Stability', duration_months: 6, focus: 'Establish solid foundation' },
                { name: 'Acceleration', duration_months: 7, focus: 'Build strong momentum' },
                { name: 'Optimization', duration_months: 7, focus: 'Reach peak performance' }
            ];
        }

        return phases;
    }

    // Generate plan for a phase
    function generatePhasePlan(phase, phaseIndex, allPhases, recommendations, currentGrade, targetGrade, totalMonths) {
        var startMonth = phaseIndex === 0 ? 1 : allPhases.slice(0, phaseIndex).reduce(function(sum, p) { return sum + p.duration_months; }, 1);
        var endMonth = startMonth + phase.duration_months - 1;
        
        // Get recommendations for this phase
        var phaseRecommendations = getPhaseRecommendations(phase, recommendations, phaseIndex);
        
            // Generate monthly tasks
            var monthlyTasks = [];
            for (var month = startMonth; month <= endMonth; month++) {
                monthlyTasks.push(generateMonthlyTasks(month, phase, recommendations, phaseIndex, allPhases));
            }

        return {
            phase_number: phaseIndex + 1,
            phase_name: phase.name,
            duration_months: phase.duration_months,
            focus: phase.focus,
            start_month: startMonth,
            end_month: endMonth,
            expected_score_improvement: calculatePhaseScoreImprovement(phaseIndex, totalMonths),
            key_objectives: getPhaseObjectives(phase, phaseIndex),
            monthly_tasks: monthlyTasks,
            recommendations: phaseRecommendations,
            success_metrics: getPhaseSuccessMetrics(phase, phaseIndex),
            risk_factors: getPhaseRisks(phase, phaseIndex)
        };
    }

    // Generate monthly tasks
    function generateMonthlyTasks(month, phase, recommendations, phaseIndex, allPhases) {
        var tasks = [];
        
        // Phase-specific tasks
        if (phase.name === 'Crisis Management') {
            tasks = [
                'Ensure all payments are made on time',
                'Clear any overdue amounts immediately',
                'Review credit report for errors',
                'Contact banks for settlement if needed',
                'Set up payment reminders'
            ];
        } else if (phase.name === 'Stability') {
            tasks = [
                'Maintain perfect payment history',
                'Reduce credit utilization below 50%',
                'Avoid new credit applications',
                'Review and optimize existing accounts',
                'Build emergency fund'
            ];
        } else if (phase.name === 'Acceleration') {
            tasks = [
                'Request credit limit increases',
                'Maintain utilization below 30%',
                'Diversify credit mix if possible',
                'Monitor credit score monthly',
                'Consider secured credit products'
            ];
        } else if (phase.name === 'Optimization') {
            tasks = [
                'Optimize credit utilization to 10-20%',
                'Maintain excellent payment history',
                'Keep oldest accounts active',
                'Monitor and dispute any errors',
                'Consider premium credit products'
            ];
        }

        // Add month-specific tasks
        if (month % 3 === 0) {
            tasks.push('Review credit report');
            tasks.push('Reassess financial goals');
        }

        return {
            month: month,
            tasks: tasks.slice(0, 5), // Limit to 5 tasks per month
            priority: phaseIndex === 0 ? 'High' : phaseIndex === 1 ? 'Medium-High' : 'Medium'
        };
    }

    // Helper functions
    function calculateTargetScore(currentScore, months) {
        var maxImprovement = Math.min(150, months * 10); // Cap at 150 points improvement
        return Math.min(900, currentScore + maxImprovement);
    }

    function scoreToGrade(score) {
        if (score >= 800) return 'A+';
        if (score >= 750) return 'A';
        if (score >= 700) return 'B+';
        if (score >= 650) return 'B';
        if (score >= 600) return 'C+';
        if (score >= 550) return 'C';
        if (score >= 500) return 'D+';
        if (score >= 450) return 'D';
        return 'F';
    }

    function getCompletionDate(months) {
        var date = new Date();
        date.setMonth(date.getMonth() + months);
        return date.toISOString().split('T')[0];
    }

    function getPhaseRecommendations(phase, recommendations, phaseIndex) {
        if (phaseIndex === 0) {
            return recommendations.filter(function(r) {
                return r.priority === 'Critical' || r.priority === 'High';
            }).slice(0, 5);
        }
        return recommendations.slice(0, 3);
    }

    function calculatePhaseScoreImprovement(phaseIndex, totalMonths) {
        var improvements = {
            0: totalMonths === 6 ? 30 : totalMonths === 12 ? 40 : totalMonths === 18 ? 50 : 60,
            1: totalMonths === 6 ? 20 : totalMonths === 12 ? 35 : totalMonths === 18 ? 40 : 50,
            2: totalMonths === 12 ? 30 : totalMonths === 18 ? 35 : 40,
            3: totalMonths === 18 ? 25 : 30
        };
        return improvements[phaseIndex] || 15;
    }

    function getPhaseObjectives(phase, phaseIndex) {
        var objectives = {
            'Crisis Management': [
                'Stop all negative credit behavior',
                'Clear overdue accounts',
                'Establish payment discipline'
            ],
            'Stability': [
                'Build consistent payment history',
                'Reduce credit utilization',
                'Establish financial stability'
            ],
            'Acceleration': [
                'Improve credit mix',
                'Increase credit limits',
                'Build positive credit history'
            ],
            'Optimization': [
                'Reach optimal credit utilization',
                'Maintain excellent credit behavior',
                'Achieve target credit score'
            ]
        };
        return objectives[phase.name] || [];
    }

    function getPhaseSuccessMetrics(phase, phaseIndex) {
        return [
            'All payments made on time',
            'Credit utilization below target',
            'No new defaults',
            'Score improvement of ' + calculatePhaseScoreImprovement(phaseIndex, 12) + '+ points'
        ];
    }

    function getPhaseRisks(phase, phaseIndex) {
        if (phaseIndex === 0) {
            return ['Missed payments', 'New defaults', 'High utilization'];
        }
        return ['Slipping back into old habits', 'Taking on too much debt'];
    }

    function generateMilestones(phasePlans, totalMonths) {
        return phasePlans.map(function(phase, index) {
            return {
                milestone_number: index + 1,
                phase_name: phase.phase_name,
                target_month: phase.end_month,
                expected_score_improvement: phase.expected_score_improvement,
                key_deliverables: phase.key_objectives
            };
        });
    }

    function calculateExpectedImprovements(currentScore, targetScore, months) {
        var improvement = targetScore - currentScore;
        return {
            total_points: improvement,
            monthly_average: Math.round(improvement / months),
            percentage_improvement: Math.round((improvement / currentScore) * 100)
        };
    }

    function getPriorityActions(recommendations) {
        return recommendations
            .filter(function(r) { return r.priority === 'Critical' || r.priority === 'High'; })
            .slice(0, 5)
            .map(function(r) {
                return {
                    title: r.title,
                    description: r.description,
                    priority: r.priority,
                    action: r.action
                };
            });
    }

})();

