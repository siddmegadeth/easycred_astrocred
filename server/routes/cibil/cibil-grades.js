(function() {
    var GradingEngine = require("./api/grading-engine.js");

    // Get all clients with their grades (for admin/analytics) with filtering options
    app.get('/get/api/cibil/clients/grades', async function(req, res) {
        try {
            var { 
                min_score, 
                max_score, 
                grade, 
                pan, 
                mobile, 
                email, 
                name, 
                page = 1, 
                limit = 50,
                sort_by = 'credit_score',
                sort_order = 'desc'
            } = req.query;
            
            // Build query based on filters
            var query = {};
            
            // Score range filter
            if (min_score || max_score) {
                query.credit_score = {};
                if (min_score) query.credit_score.$gte = parseInt(min_score);
                if (max_score) query.credit_score.$lte = parseInt(max_score);
            }
            
            // Identifier filters
            if (pan) query.pan_number = { $regex: pan, $options: 'i' };
            if (mobile) query.mobile_number = { $regex: mobile, $options: 'i' };
            if (email) query.email = { $regex: email, $options: 'i' };
            if (name) query.name = { $regex: name, $options: 'i' };
            
            // Calculate pagination
            var skip = (parseInt(page) - 1) * parseInt(limit);
            
            // Build sort object
            var sort = {};
            sort[sort_by] = sort_order === 'desc' ? -1 : 1;
            
            // Execute query with pagination
            var [clients, totalCount] = await Promise.all([
                CibilDataModel.find(query)
                    .select('client_id name pan_number mobile_number email credit_score credit_report updatedAt')
                    .sort(sort)
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                CibilDataModel.countDocuments(query)
            ]);
            
            // Calculate grades and additional info for each client
            var clientsWithGrades = clients.map(function(clientData) {
                var analyzer = new GradingEngine(clientData);
                var overallGrade = analyzer.calculateOverallGrade();
                
                // Extract account information
                var totalAccounts = 0;
                var activeAccounts = 0;
                var totalBalance = 0;
                var defaultAccounts = 0;
                
                if (clientData.credit_report && clientData.credit_report[0] && clientData.credit_report[0].accounts) {
                    totalAccounts = clientData.credit_report[0].accounts.length;
                    clientData.credit_report[0].accounts.forEach(function(account) {
                        if (account.account_status === 'Active') {
                            activeAccounts++;
                        }
                        if (account.current_balance) {
                            totalBalance += parseFloat(account.current_balance) || 0;
                        }
                        if (account.account_status === 'Default') {
                            defaultAccounts++;
                        }
                    });
                }
                
                // Calculate risk indicators
                var riskIndicators = [];
                if (defaultAccounts > 0) riskIndicators.push('has_defaults');
                if (totalBalance > 1000000) riskIndicators.push('high_exposure');
                if (totalAccounts > 10) riskIndicators.push('multiple_accounts');
                if (clientData.credit_score < 600) riskIndicators.push('low_score');
                
                return {
                    client_id: clientData.client_id,
                    name: clientData.name || clientData.full_name,
                    pan: clientData.pan_number,
                    mobile: clientData.mobile_number,
                    email: clientData.email,
                    grade: overallGrade.grade,
                    grade_numeric: overallGrade.numericGrade,
                    credit_score: clientData.credit_score,
                    score_range: analyzer.getScoreRange(),
                    totalAccounts: totalAccounts,
                    activeAccounts: activeAccounts,
                    defaultAccounts: defaultAccounts,
                    totalBalance: Math.round(totalBalance),
                    riskIndicators: riskIndicators,
                    last_updated: clientData.updatedAt,
                    detailed_grades: analyzer.getAllGrades()
                };
            });
            
            // Calculate statistics
            var statistics = {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(totalCount / parseInt(limit)),
                gradeDistribution: calculateGradeDistribution(clientsWithGrades),
                scoreStatistics: calculateScoreStatistics(clientsWithGrades),
                riskDistribution: calculateRiskDistribution(clientsWithGrades)
            };
            
            res.json({
                success: true,
                filters: {
                    min_score: min_score,
                    max_score: max_score,
                    grade: grade,
                    pan: pan,
                    mobile: mobile,
                    email: email,
                    name: name,
                    sort_by: sort_by,
                    sort_order: sort_order
                },
                statistics: statistics,
                clients: clientsWithGrades
            });
            
        } catch (error) {
            console.error('Error fetching client grades:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Get client grade by identifier
    app.get('/get/api/cibil/client/grade', async function(req, res) {
        try {
            var { pan, mobile, email, client_id } = req.query;
            
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

            var clientData = await CibilDataModel.findOne(query)
                .select('client_id name pan_number mobile_number email credit_score credit_report updatedAt createdAt')
                .lean();
            
            if (!clientData) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Client data not found for the provided identifiers',
                    identifiers: { pan, mobile, email, client_id }
                });
            }

            var analyzer = new GradingEngine(clientData);
            var overallGrade = analyzer.calculateOverallGrade();
            var allGrades = analyzer.getAllGrades();
            
            // Get detailed account analysis
            var accountAnalysis = analyzeAccounts(clientData);
            var riskAssessment = analyzeRisk(clientData, overallGrade);
            
            res.json({
                success: true,
                client_info: {
                    client_id: clientData.client_id,
                    name: clientData.name || clientData.full_name,
                    pan: clientData.pan_number,
                    mobile: clientData.mobile_number,
                    email: clientData.email,
                    profile_created: clientData.createdAt,
                    last_updated: clientData.updatedAt
                },
                grade_summary: {
                    overall_grade: overallGrade.grade,
                    numeric_grade: overallGrade.numericGrade,
                    credit_score: clientData.credit_score,
                    score_range: analyzer.getScoreRange(),
                    grade_meaning: getGradeMeaning(overallGrade.grade)
                },
                detailed_grades: allGrades,
                account_analysis: accountAnalysis,
                risk_assessment: riskAssessment,
                recommendations: getGradeBasedRecommendations(overallGrade.grade, accountAnalysis),
                generated_at: new Date()
            });
            
        } catch (error) {
            console.error('Error fetching client grade:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Get grade statistics (admin dashboard)
    app.get('/get/api/cibil/grades/statistics', async function(req, res) {
        try {
            var allClients = await CibilDataModel.find({})
                .select('credit_score credit_report')
                .lean();
            
            var gradesData = allClients.map(function(clientData) {
                var analyzer = new GradingEngine(clientData);
                return {
                    grade: analyzer.calculateOverallGrade().grade,
                    score: clientData.credit_score
                };
            });
            
            var statistics = {
                total_clients: allClients.length,
                average_score: calculateAverage(gradesData.map(g => g.score)),
                median_score: calculateMedian(gradesData.map(g => g.score)),
                grade_distribution: calculateGradeCounts(gradesData),
                score_distribution: calculateScoreDistribution(gradesData.map(g => g.score)),
                top_performers: getTopPerformers(gradesData, 10),
                bottom_performers: getBottomPerformers(gradesData, 10)
            };
            
            res.json({
                success: true,
                statistics: statistics,
                generated_at: new Date()
            });
            
        } catch (error) {
            console.error('Error fetching grade statistics:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error',
                details: error.message 
            });
        }
    });

    // Helper functions
    function calculateGradeDistribution(clients) {
        var distribution = {};
        clients.forEach(function(client) {
            var grade = client.grade;
            distribution[grade] = (distribution[grade] || 0) + 1;
        });
        return distribution;
    }

    function calculateScoreStatistics(clients) {
        var scores = clients.map(c => c.credit_score).filter(s => !isNaN(s));
        if (scores.length === 0) return {};
        
        return {
            average: scores.reduce((a, b) => a + b, 0) / scores.length,
            min: Math.min(...scores),
            max: Math.max(...scores),
            median: calculateMedian(scores)
        };
    }

    function calculateRiskDistribution(clients) {
        var riskCounts = { low: 0, medium: 0, high: 0 };
        clients.forEach(function(client) {
            var risk = 'low';
            if (client.credit_score < 650) risk = 'medium';
            if (client.credit_score < 550) risk = 'high';
            riskCounts[risk]++;
        });
        return riskCounts;
    }

    function analyzeAccounts(clientData) {
        var analysis = {
            total: 0,
            active: 0,
            closed: 0,
            default: 0,
            types: {},
            balances: {
                total: 0,
                average: 0
            }
        };
        
        if (clientData.credit_report && clientData.credit_report[0] && clientData.credit_report[0].accounts) {
            var accounts = clientData.credit_report[0].accounts;
            analysis.total = accounts.length;
            
            accounts.forEach(function(account) {
                // Account status
                if (account.account_status === 'Active') analysis.active++;
                if (account.account_status === 'Closed') analysis.closed++;
                if (account.account_status === 'Default') analysis.default++;
                
                // Account types
                var type = account.account_type || 'Other';
                analysis.types[type] = (analysis.types[type] || 0) + 1;
                
                // Balances
                if (account.current_balance) {
                    var balance = parseFloat(account.current_balance) || 0;
                    analysis.balances.total += balance;
                }
            });
            
            if (analysis.total > 0) {
                analysis.balances.average = analysis.balances.total / analysis.total;
            }
        }
        
        return analysis;
    }

    function analyzeRisk(clientData, overallGrade) {
        var risk = {
            level: 'low',
            factors: [],
            score: clientData.credit_score
        };
        
        if (clientData.credit_score < 550) {
            risk.level = 'high';
            risk.factors.push('Very low credit score');
        } else if (clientData.credit_score < 650) {
            risk.level = 'medium';
            risk.factors.push('Below average credit score');
        }
        
        // Add more risk factors based on account analysis
        var accounts = analyzeAccounts(clientData);
        if (accounts.default > 0) {
            risk.factors.push('Has default accounts');
            risk.level = risk.level === 'low' ? 'medium' : risk.level;
        }
        
        if (accounts.balances.total > 500000) {
            risk.factors.push('High total exposure');
        }
        
        return risk;
    }

    function getGradeMeaning(grade) {
        var meanings = {
            'A': 'Excellent credit history, lowest risk',
            'B': 'Good credit history, low risk',
            'C': 'Fair credit history, moderate risk',
            'D': 'Poor credit history, high risk',
            'E': 'Very poor credit history, very high risk'
        };
        return meanings[grade] || 'Unknown grade';
    }

    function getGradeBasedRecommendations(grade, accountAnalysis) {
        var recommendations = [];
        
        switch(grade) {
            case 'A':
                recommendations.push('Maintain excellent payment history');
                recommendations.push('Consider premium credit card offers');
                recommendations.push('You qualify for the best loan rates');
                break;
            case 'B':
                recommendations.push('Continue timely payments');
                recommendations.push('Keep credit utilization below 30%');
                recommendations.push('Consider applying for credit limit increases');
                break;
            case 'C':
                recommendations.push('Focus on paying down existing debts');
                recommendations.push('Avoid new credit applications for 6 months');
                recommendations.push('Set up payment reminders to avoid late payments');
                break;
            case 'D':
            case 'E':
                recommendations.push('Immediate attention needed: Clear outstanding defaults');
                recommendations.push('Consult with credit counselor');
                recommendations.push('Create a structured debt repayment plan');
                recommendations.push('Avoid any new credit applications');
                break;
        }
        
        if (accountAnalysis.default > 0) {
            recommendations.push('Priority: Resolve default accounts immediately');
        }
        
        if (accountAnalysis.balances.total > 500000) {
            recommendations.push('Consider debt consolidation for high balances');
        }
        
        return recommendations;
    }

    function calculateAverage(numbers) {
        if (numbers.length === 0) return 0;
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }

    function calculateMedian(numbers) {
        if (numbers.length === 0) return 0;
        var sorted = numbers.sort((a, b) => a - b);
        var mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    function calculateGradeCounts(gradesData) {
        var counts = {};
        gradesData.forEach(function(item) {
            counts[item.grade] = (counts[item.grade] || 0) + 1;
        });
        return counts;
    }

    function calculateScoreDistribution(scores) {
        var ranges = {
            '300-500': 0,
            '500-600': 0,
            '600-700': 0,
            '700-800': 0,
            '800-900': 0
        };
        
        scores.forEach(function(score) {
            if (score >= 800) ranges['800-900']++;
            else if (score >= 700) ranges['700-800']++;
            else if (score >= 600) ranges['600-700']++;
            else if (score >= 500) ranges['500-600']++;
            else ranges['300-500']++;
        });
        
        return ranges;
    }

    function getTopPerformers(gradesData, count) {
        return gradesData
            .sort((a, b) => b.score - a.score)
            .slice(0, count)
            .map(item => ({ grade: item.grade, score: item.score }));
    }

    function getBottomPerformers(gradesData, count) {
        return gradesData
            .sort((a, b) => a.score - b.score)
            .slice(0, count)
            .map(item => ({ grade: item.grade, score: item.score }));
    }

})();