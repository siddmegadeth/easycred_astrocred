(function() {
    
    var puppeteer = require('puppeteer');
    
    // Test PDF endpoint - generates a simple test PDF
    app.get('/get/api/cibil/pdf-test', async function(req, res) {
        try {
            log('/get/api/cibil/pdf-test');
            
            var browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            var page = await browser.newPage();
            await page.setContent('<html><body><h1>Test PDF</h1><p>If you can see this, PDF generation is working!</p></body></html>');
            
            var pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true
            });
            
            await browser.close();
            
            res.contentType('application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="test.pdf"');
            res.send(pdfBuffer);
        } catch (error) {
            log('Test PDF error:', error);
            res.status(500).json({ error: 'PDF test failed', details: error.message });
        }
    });

    // PDF Generation endpoint - returns actual PDF file
    app.get('/get/api/cibil/pdf/:client_id', async function(req, res) {
        try {
            log('/get/api/cibil/pdf/:client_id');
            var client_id = req.params.client_id;
            
            if (!client_id) {
                return res.status(400).json({ error: 'client_id is required' });
            }

            var cibilData = null;

            // Try to get from MongoDB first
            if (mongoose.connection.readyState === 1) {
                try {
                    var dbData = await CibilDataModel.findOne({ client_id: client_id });
                    // Convert Mongoose document to plain object
                    if (dbData) {
                        cibilData = dbData.toObject ? dbData.toObject() : dbData;
                    }
                } catch (dbError) {
                    log('MongoDB query error:', dbError.message);
                }
            }

            // If not found in DB, try to load from sample data
            if (!cibilData) {
                try {
                    delete require.cache[require.resolve("./../../../data/cibil/sample-data.json")];
                    var sampleData = require("./../../../data/cibil/sample-data.json");
                    if (sampleData.data && sampleData.data.client_id === client_id) {
                        cibilData = sampleData.data;
                        log('Loaded sample data for PDF generation');
                    }
                } catch (sampleError) {
                    log('Error loading sample data:', sampleError.message);
                }
            }

            if (!cibilData) {
                return res.status(404).json({ error: 'CIBIL data not found for client_id: ' + client_id });
            }

            // Use cached analysis if available, otherwise compute
            var AnalysisCache = require('./api/analysis-cache');
            
            try {
                var analysisResult = await AnalysisCache.getOrComputeAnalysis(cibilData, false);
                var analysis = analysisResult.analysis;
                
                log('Using ' + (analysisResult.cached ? 'cached' : 'fresh') + ' analysis for PDF generation');
                
                // Extract data from cached analysis
                var overallGrade = analysis.overallGrade || 'B';
                var defaulters = analysis.defaulters || [];
                var recommendations = analysis.recommendations || [];
                var comprehensiveReport = analysis.comprehensiveReport || {};
                var riskReport = analysis.riskReport || {};
                var improvementPlan = analysis.improvementPlan || {};
                var bankSuggestions = analysis.bankSuggestions || [];
                var creditUtilization = analysis.creditUtilization || 0;
                var creditAge = analysis.creditAge || 0;
                var paymentAnalysis = analysis.paymentAnalysis || {};
                var componentScores = analysis.componentScores || {};
                var riskDetails = analysis.riskDetails || {};
                var allAccounts = analysis.allAccounts || [];
                
                var creditReport = cibilData.credit_report && cibilData.credit_report[0] ? cibilData.credit_report[0] : {};
                var accounts = creditReport.accounts || [];
                var enquiries = creditReport.enquiries || [];

                // Generate HTML report with ALL data
                var html = generatePDFHTML({
                    data: cibilData,
                    grade: overallGrade,
                    defaulters: defaulters,
                    recommendations: recommendations,
                    comprehensiveReport: comprehensiveReport,
                    riskReport: riskReport,
                    improvementPlan: improvementPlan,
                    bankSuggestions: bankSuggestions,
                    creditUtilization: creditUtilization,
                    creditAge: creditAge,
                    paymentAnalysis: paymentAnalysis,
                    componentScores: componentScores,
                    riskDetails: riskDetails,
                    allAccounts: allAccounts,
                    accounts: accounts,
                    enquiries: enquiries
                });

                // Generate actual PDF using Puppeteer
                try {
                    log('Launching browser for PDF generation...');
                var browser = await puppeteer.launch({
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--disable-gpu'
                    ]
                });
                
                var page = await browser.newPage();
                
                // Wait for content to load
                await page.setContent(html, { 
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });
                
                // Wait a bit more for any dynamic content (using Promise instead of waitForTimeout)
                await new Promise(function(resolve) { setTimeout(resolve, 1000); });
                
                // Generate PDF
                var pdfBuffer = await page.pdf({
                    format: 'A4',
                    printBackground: true,
                    preferCSSPageSize: false,
                    margin: {
                        top: '20mm',
                        right: '15mm',
                        bottom: '20mm',
                        left: '15mm'
                    }
                });
                
                await browser.close();
                
                // Validate PDF buffer
                if (!pdfBuffer) {
                    throw new Error('PDF buffer is null or undefined');
                }
                
                // Ensure it's a Buffer
                if (!Buffer.isBuffer(pdfBuffer)) {
                    pdfBuffer = Buffer.from(pdfBuffer);
                }
                
                if (pdfBuffer.length === 0) {
                    throw new Error('PDF buffer is empty');
                }
                
                // Validate PDF header (PDF files start with %PDF)
                var pdfHeader = pdfBuffer.toString('ascii', 0, 4);
                if (pdfHeader !== '%PDF') {
                    log('Warning: PDF buffer does not start with %PDF header. Header: ' + pdfHeader);
                    throw new Error('Invalid PDF format generated');
                }
                
                log('PDF generated successfully, size: ' + pdfBuffer.length + ' bytes');
                
                // Set headers BEFORE sending response
                var safeName = (cibilData.name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
                var fileName = 'CreditReport_' + safeName + '_' + new Date().toISOString().split('T')[0] + '.pdf';
                
                // Clear any existing headers
                res.removeHeader('Content-Type');
                res.removeHeader('Content-Disposition');
                res.removeHeader('Content-Length');
                
                // Set headers for PDF download
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '"');
                res.setHeader('Content-Length', pdfBuffer.length);
                
                // Send PDF buffer as binary
                res.end(pdfBuffer, 'binary');
                return;
                
            } catch (pdfError) {
                log('Error generating PDF with Puppeteer:', pdfError);
                log('Error details:', pdfError.message);
                log('Error stack:', pdfError.stack);
                log('Falling back to HTML download...');
                
                    // Fallback to HTML if PDF generation fails
                    var safeName = (cibilData.name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    res.setHeader('Content-Disposition', 'attachment; filename=CreditReport_' + 
                                  safeName + '_' + new Date().toISOString().split('T')[0] + '.html');
                    res.send(html);
                }
            } catch (analysisError) {
                log('Error getting analysis for PDF:', analysisError);
                res.status(500).json({ error: 'Analysis error', details: analysisError.message });
            }
        } catch (error) {
            log('Error generating PDF:', error);
            log('Error stack:', error.stack);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });

    // Generate printable credit report page
    app.get('/credit-report-print/:client_id', async function(req, res) {
        try {
            log('/credit-report-print/:client_id');
            var client_id = req.params.client_id;
            
            if (!client_id) {
                return res.status(400).send('client_id is required');
            }

            var cibilData = null;

            // Try to get from MongoDB first
            if (mongoose.connection.readyState === 1) {
                try {
                    cibilData = await CibilDataModel.findOne({ client_id: client_id });
                } catch (dbError) {
                    log('MongoDB query error:', dbError.message);
                }
            }

            // If not found in DB, try to load from sample data
            if (!cibilData) {
                try {
                    delete require.cache[require.resolve("./../../../data/cibil/sample-data.json")];
                    var sampleData = require("./../../../data/cibil/sample-data.json");
                    if (sampleData.data && sampleData.data.client_id === client_id) {
                        cibilData = sampleData.data;
                        log('Loaded sample data for print view');
                    }
                } catch (sampleError) {
                    log('Error loading sample data:', sampleError.message);
                }
            }

            if (!cibilData) {
                return res.status(404).send('CIBIL data not found for client_id: ' + client_id);
            }

            var GradingEngine = require('./api/grading-engine');
            var AdvancedAnalytics = require('./api/analytics-engine-advance.js');
            var RiskAssessment = require('./api/risk-assessment.js');
            
            var analyzer = new GradingEngine(cibilData);
            var overallGrade = analyzer.calculateOverallGrade() || 'B';
            var defaulters = analyzer.identifyDefaulters() || [];
            var recommendations = analyzer.generateRecommendations() || [];
            
            // Get additional analytics
            var advanced = new AdvancedAnalytics(cibilData, analyzer);
            var risk = new RiskAssessment(cibilData, analyzer);
            var comprehensiveReport = advanced.generateComprehensiveReport();
            var riskReport = risk.generateRiskReport();
            var creditUtilization = analyzer.getCreditUtilization();
            var creditAge = analyzer.getCreditAge();
            var paymentAnalysis = analyzer.getOverallPaymentAnalysis();

            var html = generatePDFHTML({
                data: cibilData,
                grade: overallGrade,
                defaulters: defaulters,
                recommendations: recommendations,
                comprehensiveReport: comprehensiveReport,
                riskReport: riskReport,
                creditUtilization: creditUtilization,
                creditAge: creditAge,
                paymentAnalysis: paymentAnalysis
            });

            res.send(html);
        } catch (error) {
            log('Error generating print view:', error);
            log('Error stack:', error.stack);
            res.status(500).send('Error generating report: ' + error.message);
        }
    });

    // Helper function to escape HTML
    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Import comprehensive PDF template
    var generateComprehensivePDFHTML = require('./pdf-template-comprehensive');
    
    // Helper function to generate HTML for PDF (uses comprehensive template)
    function generatePDFHTML(params) {
        // Use the comprehensive professional template
        return generateComprehensivePDFHTML(params);
    }
    
    // Legacy simple template (kept for fallback)
    function generatePDFHTMLSimple(params) {
        var data = params.data || {};
        var grade = params.grade || 'B';
        var defaulters = Array.isArray(params.defaulters) ? params.defaulters : [];
        var recommendations = Array.isArray(params.recommendations) ? params.recommendations : [];
        var comprehensiveReport = params.comprehensiveReport || {};
        var riskReport = params.riskReport || {};
        var improvementPlan = params.improvementPlan || {};
        var bankSuggestions = Array.isArray(params.bankSuggestions) ? params.bankSuggestions : [];
        var creditUtilization = params.creditUtilization || 0;
        var creditAge = params.creditAge || 0;
        var paymentAnalysis = params.paymentAnalysis || {};
        var componentScores = params.componentScores || {};
        var riskDetails = params.riskDetails || {};
        var allAccounts = Array.isArray(params.allAccounts) ? params.allAccounts : [];
        var accounts = Array.isArray(params.accounts) ? params.accounts : [];
        var enquiries = Array.isArray(params.enquiries) ? params.enquiries : [];

        // Ensure grade is a string
        if (typeof grade !== 'string') {
            grade = String(grade);
        }

        var gradeColor = grade.indexOf('A') >= 0 ? '#10b981' : 
                         grade.indexOf('B') >= 0 ? '#3b82f6' : 
                         grade.indexOf('C') >= 0 ? '#f59e0b' : '#ef4444';

        var html = '<!DOCTYPE html>\n' +
        '<html>\n' +
        '<head>\n' +
        '    <meta charset="UTF-8">\n' +
        '    <title>Credit Report - ' + data.name + '</title>\n' +
        '    <style>\n' +
        '        * { margin: 0; padding: 0; box-sizing: border-box; }\n' +
        '        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 40px; max-width: 800px; margin: 0 auto; }\n' +
        '        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid ' + gradeColor + '; }\n' +
        '        .logo { font-size: 28px; font-weight: bold; color: #6366f1; margin-bottom: 10px; }\n' +
        '        .report-title { font-size: 20px; color: #666; }\n' +
        '        .report-date { font-size: 14px; color: #999; margin-top: 10px; }\n' +
        '        .section { margin-bottom: 30px; }\n' +
        '        .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }\n' +
        '        .score-section { display: flex; justify-content: space-around; text-align: center; background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px; }\n' +
        '        .score-item { }\n' +
        '        .score-value { font-size: 48px; font-weight: bold; color: #333; }\n' +
        '        .score-label { font-size: 14px; color: #666; margin-top: 5px; }\n' +
        '        .grade-badge { display: inline-block; width: 80px; height: 80px; line-height: 80px; font-size: 36px; font-weight: bold; color: white; background: ' + gradeColor + '; border-radius: 50%; }\n' +
        '        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }\n' +
        '        .info-item { padding: 15px; background: #f8fafc; border-radius: 8px; }\n' +
        '        .info-label { font-size: 12px; color: #666; text-transform: uppercase; }\n' +
        '        .info-value { font-size: 16px; font-weight: bold; color: #333; margin-top: 5px; }\n' +
        '        .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }\n' +
        '        .metric-item { padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; text-align: center; }\n' +
        '        .metric-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }\n' +
        '        .metric-label { font-size: 12px; opacity: 0.9; }\n' +
        '        .risk-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-left: 10px; }\n' +
        '        .risk-low { background: #10b981; color: white; }\n' +
        '        .risk-medium { background: #f59e0b; color: white; }\n' +
        '        .risk-high { background: #ef4444; color: white; }\n' +
        '        .recommendation { padding: 15px; margin-bottom: 10px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; }\n' +
        '        .recommendation.high { background: #fee2e2; border-color: #ef4444; }\n' +
        '        .recommendation.low { background: #dbeafe; border-color: #3b82f6; }\n' +
        '        .rec-priority { font-size: 12px; font-weight: bold; text-transform: uppercase; }\n' +
        '        .rec-area { font-size: 12px; color: #666; margin-bottom: 5px; }\n' +
        '        .rec-message { font-size: 14px; }\n' +
        '        .defaulter-table { width: 100%; border-collapse: collapse; margin-top: 15px; }\n' +
        '        .defaulter-table th, .defaulter-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }\n' +
        '        .defaulter-table th { background: #fee2e2; color: #991b1b; font-weight: bold; }\n' +
        '        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #999; font-size: 12px; }\n' +
        '        @media print { \n' +
        '            body { padding: 20px; } \n' +
        '            .section { page-break-inside: avoid; }\n' +
        '            .score-section { page-break-inside: avoid; }\n' +
        '        }\n' +
        '        @page { margin: 0; }\n' +
        '    </style>\n' +
        '</head>\n' +
        '<body>\n' +
        '    <div class="header">\n' +
        '        <div class="logo">📊 EASYCRED ASTROCRED</div>\n' +
        '        <div class="report-title">Comprehensive Credit Health Report</div>\n' +
        '        <div class="report-date">Generated on: ' + new Date().toLocaleDateString('en-IN', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        }) + '</div>\n' +
        '    </div>\n' +
        '\n' +
        '    <div class="score-section">\n' +
        '        <div class="score-item">\n' +
        '            <div class="score-value">' + (data.credit_score || 'N/A') + '</div>\n' +
        '            <div class="score-label">Credit Score</div>\n' +
        '        </div>\n' +
        '        <div class="score-item">\n' +
        '            <div class="grade-badge">' + (grade || 'B') + '</div>\n' +
        '            <div class="score-label">Overall Grade</div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '\n' +
        '    <div class="section">\n' +
        '        <div class="section-title">📊 Credit Metrics</div>\n' +
        '        <div class="metrics-grid">\n' +
        '            <div class="metric-item">\n' +
        '                <div class="metric-value">' + (typeof creditUtilization === 'number' && !isNaN(creditUtilization) ? creditUtilization.toFixed(1) : '0') + '%</div>\n' +
        '                <div class="metric-label">Credit Utilization</div>\n' +
        '            </div>\n' +
        '            <div class="metric-item">\n' +
        '                <div class="metric-value">' + (typeof creditAge === 'number' && !isNaN(creditAge) ? creditAge : 0) + '</div>\n' +
        '                <div class="metric-label">Credit Age (Months)</div>\n' +
        '            </div>\n' +
        '            <div class="metric-item">\n' +
        '                <div class="metric-value">' + (paymentAnalysis && typeof paymentAnalysis.onTimeRate === 'number' && !isNaN(paymentAnalysis.onTimeRate) ? (paymentAnalysis.onTimeRate * 100).toFixed(1) : '0') + '%</div>\n' +
        '                <div class="metric-label">On-Time Payments</div>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '\n' +
        '    <div class="section">\n' +
        '        <div class="section-title">👤 Profile Information</div>\n' +
        '        <div class="info-grid">\n' +
        '            <div class="info-item">\n' +
        '                <div class="info-label">Name</div>\n' +
        '                <div class="info-value">' + escapeHtml(String(data.name || 'N/A')) + '</div>\n' +
        '            </div>\n' +
        '            <div class="info-item">\n' +
        '                <div class="info-label">Mobile</div>\n' +
        '                <div class="info-value">' + escapeHtml(String(data.mobile || 'N/A')) + '</div>\n' +
        '            </div>\n' +
        '            <div class="info-item">\n' +
        '                <div class="info-label">PAN</div>\n' +
        '                <div class="info-value">' + escapeHtml(String(data.pan || 'N/A')) + '</div>\n' +
        '            </div>\n' +
        '            <div class="info-item">\n' +
        '                <div class="info-label">Client ID</div>\n' +
        '                <div class="info-value" style="font-size: 12px;">' + (data.client_id || 'N/A') + '</div>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '\n' +
        '    <div class="section">\n' +
        '        <div class="section-title">💡 Recommendations</div>\n';

        // Add recommendations
        if (recommendations && recommendations.length > 0) {
            recommendations.slice(0, 5).forEach(function(rec) {
                if (!rec) return;
                var priority = rec.priority || 'Medium';
                var priorityClass = (priority.toLowerCase() || 'medium');
                var area = rec.area || 'General';
                var message = rec.message || 'No specific recommendation';
                
                html += '        <div class="recommendation ' + priorityClass + '">\n' +
                        '            <div class="rec-priority">' + escapeHtml(String(priority)) + ' Priority</div>\n' +
                        '            <div class="rec-area">' + escapeHtml(String(area)) + '</div>\n' +
                        '            <div class="rec-message">' + escapeHtml(String(message)) + '</div>\n' +
                        '        </div>\n';
            });
        } else {
            html += '        <div class="recommendation">\n' +
                    '            <div class="rec-message">No specific recommendations at this time.</div>\n' +
                    '        </div>\n';
        }

        html += '    </div>\n';

        // Add risk assessment section
        if (riskReport && riskReport.riskLevel) {
            var riskLevel = riskReport.riskLevel || 'MEDIUM';
            var riskClass = riskLevel.toLowerCase();
            var riskColor = riskLevel === 'LOW' ? '#10b981' : riskLevel === 'MEDIUM' ? '#f59e0b' : '#ef4444';
            
            html += '\n    <div class="section">\n' +
                    '        <div class="section-title">⚠️ Risk Assessment</div>\n' +
                    '        <div class="info-grid">\n' +
                    '            <div class="info-item">\n' +
                    '                <div class="info-label">Risk Level</div>\n' +
                    '                <div class="info-value">' + riskLevel + 
                    '                    <span class="risk-badge risk-' + riskClass + '">' + riskLevel + '</span>\n' +
                    '                </div>\n' +
                    '            </div>\n';
            
            if (riskReport.creditWorthiness !== undefined) {
                html += '            <div class="info-item">\n' +
                        '                <div class="info-label">Credit Worthiness</div>\n' +
                        '                <div class="info-value">' + riskReport.creditWorthiness + '/100</div>\n' +
                        '            </div>\n';
            }
            
            if (comprehensiveReport.summary) {
                var summary = comprehensiveReport.summary;
                html += '            <div class="info-item">\n' +
                        '                <div class="info-label">Total Accounts</div>\n' +
                        '                <div class="info-value">' + (summary.totalAccounts || 0) + '</div>\n' +
                        '            </div>\n' +
                        '            <div class="info-item">\n' +
                        '                <div class="info-label">Total Enquiries</div>\n' +
                        '                <div class="info-value">' + (summary.totalEnquiries || 0) + '</div>\n' +
                        '            </div>\n';
            }
            
            html += '        </div>\n' +
                    '    </div>\n';
        }

        // Add defaulters section if any
        if (defaulters && defaulters.length > 0) {
            html += '\n    <div class="section">\n' +
                    '        <div class="section-title">⚠️ Accounts Needing Attention</div>\n' +
                    '        <table class="defaulter-table">\n' +
                    '            <thead>\n' +
                    '                <tr>\n' +
                    '                    <th>Lender</th>\n' +
                    '                    <th>Account Type</th>\n' +
                    '                    <th>Balance</th>\n' +
                    '                    <th>Overdue</th>\n' +
                    '                </tr>\n' +
                    '            </thead>\n' +
                    '            <tbody>\n';
            
            defaulters.forEach(function(d) {
                if (!d) return;
                var lender = d.lender || d.institution || d.subscriberName || 'N/A';
                var accountType = d.accountType || d.type || 'N/A';
                var balance = d.currentBalance || d.balance || 0;
                var overdue = d.overdueAmount || d.overdue || 0;
                
                // Format numbers safely
                var balanceFormatted = typeof balance === 'number' ? balance.toLocaleString('en-IN') : String(balance || 0);
                var overdueFormatted = typeof overdue === 'number' ? overdue.toLocaleString('en-IN') : String(overdue || 0);
                
                html += '                <tr>\n' +
                        '                    <td>' + lender + '</td>\n' +
                        '                    <td>' + accountType + '</td>\n' +
                        '                    <td>₹' + balanceFormatted + '</td>\n' +
                        '                    <td>₹' + overdueFormatted + '</td>\n' +
                        '                </tr>\n';
            });

            html += '            </tbody>\n' +
                    '        </table>\n' +
                    '    </div>\n';
        }

        html += '\n    <div class="footer">\n' +
                '        <p>This report is generated by EasyCred AstroCred Credit Analysis System</p>\n' +
                '        <p>Report ID: ' + (data.client_id || 'N/A') + ' | Confidential</p>\n' +
                '        <p style="margin-top: 10px;">For support, visit: https://astrocred.easycred.co.in</p>\n' +
                '    </div>\n' +
                '</body>\n' +
                '</html>';

        return html;
    }

})();


