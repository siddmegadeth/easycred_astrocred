(function () {
    var GradingEngine = require("./api/grading-engine");
    var AdvancedAnalytics = require("./api/analytics-engine-advance.js");
    var RiskAssessment = require("./api/risk-assessment.js");
    var SpendingAnalyzer = require("../finvu/spending-analyzer");

    /**
     * Combined Financial Health Report
     * Integrates CIBIL credit data + FinVu banking data for comprehensive insights
     */

    app.get('/api/reports/financial-health', async function (req, res) {
        try {
            log('/api/reports/financial-health');

            var mobile = req.query.mobile || req.session?.mobile;
            var isDemoMode = req.query.demo === 'true' || mobile === '7764056669';

            if (!mobile) {
                return res.status(400).json({
                    success: false,
                    message: 'Mobile number is required'
                });
            }

            var report = {
                success: true,
                generatedAt: new Date(),
                mobile: mobile,
                cibil: null,
                banking: null,
                combined: {
                    financialHealthScore: 0,
                    rating: 'N/A',
                    strengths: [],
                    weaknesses: [],
                    recommendations: []
                }
            };

            // 1. Fetch and analyze CIBIL data
            var cibilData = await CibilDataModel.findOne({
                $or: [{ mobile_number: mobile }, { mobile: mobile }]
            }).lean();

            if (!cibilData && isDemoMode) {
                var sampleModule = require('./api/sample-data');
                cibilData = sampleModule.generateSampleCIBILData(mobile);
            }

            if (cibilData) {
                var analyzer = new GradingEngine(cibilData);
                var advanced = new AdvancedAnalytics(cibilData, analyzer);
                var risk = new RiskAssessment(cibilData, analyzer);

                report.cibil = {
                    score: parseInt(cibilData.credit_score) || 0,
                    grade: analyzer.calculateOverallGrade(),
                    utilization: advanced.getCreditUtilization(),
                    age: advanced.getCreditAge(),
                    accounts: cibilData.credit_report?.[0]?.accounts?.length || 0,
                    defaultProbability: risk.assessCreditWorthiness().defaultProbability
                };

                // Add CIBIL-based insights
                if (report.cibil.score >= 750) {
                    report.combined.strengths.push('Excellent credit score of ' + report.cibil.score);
                } else if (report.cibil.score < 650) {
                    report.combined.weaknesses.push('Credit score needs improvement (currently ' + report.cibil.score + ')');
                    report.combined.recommendations.push({
                        priority: 'high',
                        category: 'Credit Score',
                        action: 'Focus on making all payments on time for the next 6 months to improve score'
                    });
                }

                if (report.cibil.utilization < 30) {
                    report.combined.strengths.push('Low credit utilization (' + report.cibil.utilization.toFixed(0) + '%)');
                } else if (report.cibil.utilization > 70) {
                    report.combined.weaknesses.push('High credit utilization (' + report.cibil.utilization.toFixed(0) + '%)');
                    report.combined.recommendations.push({
                        priority: 'high',
                        category: 'Credit Utilization',
                        action: 'Reduce outstanding balances to below 30% of credit limit'
                    });
                }
            }

            // 2. Fetch and analyze Banking data from FinVu
            var LinkedAccountModel = require('../schema/financial-aggregator/linked-account-schema');
            var accounts = await LinkedAccountModel.find({
                mobile: mobile,
                status: 'ACTIVE'
            }).lean();

            // Mock banking data for demo
            if (accounts.length === 0 && isDemoMode) {
                accounts = [
                    {
                        bankName: 'HDFC Bank',
                        accountType: 'SAVINGS',
                        currentBalance: 45000,
                        accountNumber: 'XXXXXX1234',
                        transactions: [
                            { type: 'DEBIT', amount: -5000, narration: 'SWIGGY FOOD ORDER', date: new Date() },
                            { type: 'DEBIT', amount: -15000, narration: 'AMAZON SHOPPING', date: new Date() },
                            { type: 'DEBIT', amount: -8000, narration: 'EMI HDFC LOAN', date: new Date() },
                            { type: 'CREDIT', amount: 50000, narration: 'SALARY CREDIT', date: new Date() }
                        ]
                    },
                    {
                        bankName: 'SBI',
                        accountType: 'SALARY',
                        currentBalance: 12500,
                        accountNumber: 'XXXXXX5678',
                        transactions: []
                    }
                ];
            }

            if (accounts.length > 0) {
                var totalBalance = accounts.reduce(function (sum, acc) {
                    return sum + (acc.currentBalance || 0);
                }, 0);

                // Aggregate all transactions
                var allTransactions = [];
                accounts.forEach(function (acc) {
                    if (acc.transactions && acc.transactions.length > 0) {
                        allTransactions = allTransactions.concat(acc.transactions);
                    }
                });

                // Analyze spending if transactions exist
                var spendingInsights = null;
                if (allTransactions.length > 0) {
                    var spendingAnalyzer = new SpendingAnalyzer(allTransactions);
                    spendingInsights = spendingAnalyzer.generateInsights();
                }

                report.banking = {
                    totalBalance: totalBalance,
                    accountCount: accounts.length,
                    accounts: accounts.map(function (a) {
                        return {
                            bank: a.bankName,
                            type: a.accountType,
                            balance: a.currentBalance
                        };
                    }),
                    spending: spendingInsights
                };

                // Add banking insights
                if (totalBalance > 50000) {
                    report.combined.strengths.push('Healthy savings balance of ₹' + totalBalance.toLocaleString());
                } else if (totalBalance < 10000) {
                    report.combined.weaknesses.push('Low emergency fund (₹' + totalBalance.toLocaleString() + ')');
                    report.combined.recommendations.push({
                        priority: 'medium',
                        category: 'Emergency Fund',
                        action: 'Build an emergency fund worth 3-6 months of expenses'
                    });
                }

                if (spendingInsights) {
                    var savingsRate = parseFloat(spendingInsights.incomeExpense.savingsRate);
                    if (savingsRate >= 20) {
                        report.combined.strengths.push('Good savings rate of ' + savingsRate + '%');
                    } else if (savingsRate < 10) {
                        report.combined.weaknesses.push('Low savings rate (' + savingsRate + '%)');
                        report.combined.recommendations.push({
                            priority: 'high',
                            category: 'Savings',
                            action: 'Reduce discretionary spending and aim to save 20% of income'
                        });
                    }
                }
            }

            // 3. Calculate Combined Financial Health Score (0-100)
            var healthScore = 0;
            var maxScore = 100;

            if (report.cibil) {
                // CIBIL contributes 50 points
                healthScore += (report.cibil.score / 900) * 50;
            }

            if (report.banking) {
                // Banking health contributes 50 points
                var bankingScore = 0;

                // Balance (20 points)
                if (report.banking.totalBalance > 100000) bankingScore += 20;
                else if (report.banking.totalBalance > 50000) bankingScore += 15;
                else if (report.banking.totalBalance > 20000) bankingScore += 10;
                else bankingScore += 5;

                // Savings rate (30 points)
                if (report.banking.spending) {
                    var savingsRate = parseFloat(report.banking.spending.incomeExpense.savingsRate);
                    if (savingsRate >= 30) bankingScore += 30;
                    else if (savingsRate >= 20) bankingScore += 20;
                    else if (savingsRate >= 10) bankingScore += 10;
                    else bankingScore += 5;
                }

                healthScore += bankingScore;
            }

            report.combined.financialHealthScore = Math.round(healthScore);

            // Determine rating
            if (healthScore >= 80) report.combined.rating = 'Excellent';
            else if (healthScore >= 60) report.combined.rating = 'Good';
            else if (healthScore >= 40) report.combined.rating = 'Fair';
            else report.combined.rating = 'Needs Improvement';

            res.json(report);

        } catch (error) {
            console.error('Combined report error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate combined report',
                details: error.message
            });
        }
    });

    // PDF endpoint
    app.get('/api/reports/financial-health-pdf', async function (req, res) {
        try {
            // Fetch the combined report data
            var mobile = req.query.mobile || '7764056669';
            var reportUrl = req.protocol + '://' + req.get('host') + '/api/reports/financial-health?mobile=' + mobile + '&demo=true';

            var axios = require('axios');
            var response = await axios.get(reportUrl);
            var reportData = response.data;

            // Generate PDF using Puppeteer
            var puppeteer = require('puppeteer');
            var path = require('path');
            var fs = require('fs');

            var browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            var page = await browser.newPage();

            // Create HTML for combined report
            var html = generateCombinedReportHTML(reportData);
            await page.setContent(html, { waitUntil: 'networkidle0' });

            var outputPath = path.join(__dirname, '../../temp/combined-' + Date.now() + '.pdf');
            await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
            });

            await browser.close();

            // Send file
            res.download(outputPath, 'Financial-Health-Report.pdf', function (err) {
                if (!err) fs.unlinkSync(outputPath);
            });

        } catch (error) {
            console.error('Combined PDF error:', error);
            res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
        }
    });

    function generateCombinedReportHTML(data) {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        h1 { color: #6366f1; text-align: center; }
        .score-section { background: linear-gradient(135deg, #6366f1, #a855f7); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; }
        .score-value { font-size: 64px; font-weight: bold; }
        .rating { font-size: 24px; margin-top: 10px; }
        .section { margin: 30px 0; }
        .section-title { font-size: 20px; font-weight: bold; color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
        .strength { color: #10b981; margin: 10px 0; }
        .weakness { color: #ef4444; margin: 10px 0; }
        .recommendation { background: #f3f4f6; padding: 15px; margin: 10px 0; border-left: 4px solid #fbbf24; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: bold; }
    </style>
</head>
<body>
    <h1>💎 Complete Financial Health Report</h1>
    <p style="text-align: center; color: #6b7280;">Generated on ${new Date(data.generatedAt).toLocaleDateString()}</p>

    <div class="score-section">
        <div class="score-value">${data.combined.financialHealthScore}/100</div>
        <div class="rating">${data.combined.rating}</div>
    </div>

    <div class="section">
        <div class="section-title">📊 Credit Profile</div>
        ${data.cibil ? `
            <table>
                <tr><td>CIBIL Score</td><td><strong>${data.cibil.score}</strong></td></tr>
                <tr><td>Credit Grade</td><td><strong>${data.cibil.grade}</strong></td></tr>
                <tr><td>Credit Utilization</td><td>${data.cibil.utilization.toFixed(1)}%</td></tr>
                <tr><td>Credit Age</td><td>${data.cibil.age} months</td></tr>
                <tr><td>Total Accounts</td><td>${data.cibil.accounts}</td></tr>
            </table>
        ` : '<p>No credit data available</p>'}
    </div>

    <div class="section">
        <div class="section-title">🏦 Banking Overview</div>
        ${data.banking ? `
            <table>
                <tr><td>Total Balance</td><td><strong>₹${data.banking.totalBalance.toLocaleString()}</strong></td></tr>
                <tr><td>Linked Accounts</td><td>${data.banking.accountCount}</td></tr>
                ${data.banking.spending ? `
                    <tr><td>Monthly Income</td><td>₹${data.banking.spending.incomeExpense.income.toLocaleString()}</td></tr>
                    <tr><td>Monthly Expenses</td><td>₹${data.banking.spending.incomeExpense.expense.toLocaleString()}</td></tr>
                    <tr><td>Savings Rate</td><td><strong>${data.banking.spending.incomeExpense.savingsRate}%</strong></td></tr>
                ` : ''}
            </table>
        ` : '<p>No banking data available</p>'}
    </div>

    <div class="section">
        <div class="section-title">💪 Strengths</div>
        ${data.combined.strengths.map(s => `<div class="strength">✓ ${s}</div>`).join('')}
        ${data.combined.strengths.length === 0 ? '<p>Complete your profile to discover strengths</p>' : ''}
    </div>

    <div class="section">
        <div class="section-title">⚠️ Areas to Improve</div>
        ${data.combined.weaknesses.map(w => `<div class="weakness">✗ ${w}</div>`).join('')}
        ${data.combined.weaknesses.length === 0 ? '<div class="strength">✓ No major weaknesses detected!</div>' : ''}
    </div>

    <div class="section">
        <div class="section-title">🎯 Personalized Recommendations</div>
        ${data.combined.recommendations.map(r => `
            <div class="recommendation">
                <strong>${r.category}</strong> (Priority: ${r.priority})<br>
                ${r.action}
            </div>
        `).join('')}
        ${data.combined.recommendations.length === 0 ? '<p>Keep up the great work!</p>' : ''}
    </div>
</body>
</html>
        `;
    }

})();
