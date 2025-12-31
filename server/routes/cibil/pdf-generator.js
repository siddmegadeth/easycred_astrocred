(function() {
    
    var puppeteer = require('puppeteer');
    var path = require('path');
    var fs = require('fs');
    
    // Test PDF endpoint - generates a simple test PDF
    app.get('/get/api/cibil/pdf-test', async function(req, res) {
        try {
            log('/get/api/cibil/pdf-test');
            
            // For development/testing, you might want to use a different launch config
            var launchOptions = {
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            };
            
            // In production, you might want to use a remote browser or different settings
            if (process.env.NODE_ENV === 'production') {
                launchOptions.args.push('--disable-dev-shm-usage');
                launchOptions.args.push('--disable-accelerated-2d-canvas');
                launchOptions.args.push('--disable-gpu');
            }
            
            var browser = await puppeteer.launch(launchOptions);
            
            var page = await browser.newPage();
            await page.setContent(`
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 40px; }
                            h1 { color: #2c3e50; }
                            .success { color: #27ae60; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <h1>📄 PDF Generation Test</h1>
                        <p class="success">✓ PDF generation is working correctly!</p>
                        <p>Timestamp: ${new Date().toLocaleString('en-IN')}</p>
                        <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
                        <p>If you can see this PDF, the system is ready to generate credit reports.</p>
                    </body>
                </html>
            `);
            
            var pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                }
            });
            
            await browser.close();
            
            res.contentType('application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="pdf-test.pdf"');
            res.send(pdfBuffer);
        } catch (error) {
            log('Test PDF error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'PDF test failed', 
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    });

    /**
     * Main PDF Generation endpoint with updated schema support
     */
    app.get('/get/check/credit/report/cibil', async function(req, res) {
        try {
            log('/get/check/credit/report/cibil API called');
            
            // Extract parameters - support multiple identifier types
            var mobile = req.body.mobile || req.query.mobile || req.params.mobile;
            var pan = req.body.pan || req.query.pan || req.params.pan;
            var email = req.body.email || req.query.email || req.params.email;
            var client_id = req.body.client_id || req.query.client_id || req.params.client_id;
            
            // For backward compatibility, also check old parameter names
            if (!mobile && !pan && !email && !client_id) {
                client_id = req.params.client_id; // Check route param
            }
            
            // Validate that at least one identifier is provided
            if (!mobile && !pan && !email && !client_id) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'At least one identifier is required (mobile, pan, email, or client_id for backward compatibility)' 
                });
            }
            
            // If using old client_id, try to map to new schema
            var cibilData = await findCIBILData(mobile, pan, email, client_id);
            
            if (!cibilData) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'CIBIL data not found',
                    searched_with: { mobile, pan, email, client_id }
                });
            }
            
            log('Found CIBIL data for user:', {
                name: cibilData.name,
                mobile: cibilData.mobile,
                pan: cibilData.pan,
                email: cibilData.email
            });
            
            // Generate the PDF report
            var pdfResult = await generateCreditReportPDF(cibilData);
            
            if (!pdfResult.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to generate PDF',
                    details: pdfResult.error
                });
            }
            
            // Set headers for PDF download
            var safeName = (cibilData.name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
            var fileName = `CreditReport_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`;
            
            res.contentType('application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Length', pdfResult.buffer.length);
            res.send(pdfResult.buffer);
            
        } catch (error) {
            log('Error in PDF generation endpoint:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    /**
     * Alternative endpoint with POST support
     */
    app.post('/api/cibil/pdf', async function(req, res) {
        // Set start time for processing time calculation
        req.startTime = Date.now();
        
        // Call the GET endpoint with POST data
        req.method = 'GET';
        req.query = req.body; // Move body to query for GET handling
        
        // Remove params to avoid conflicts
        delete req.params;
        
        return app._router.handle(req, res);
    });

    /**
     * Find CIBIL data using any available identifier
     */
    async function findCIBILData(mobile, pan, email, client_id) {
        try {
            
            
            var query = {};
            
            // Build query based on available identifiers
            if (mobile) {
                query.mobile = mobile;
            } else if (pan) {
                query.pan = pan;
            } else if (email) {
                query.email = email.toLowerCase(); // Ensure lowercase for case-insensitive search
            } else if (client_id) {
                // For backward compatibility - try to find by client_id
                // This might need migration if you have old data
                query.client_id = client_id;
            } else {
                return null;
            }
            
            log('Searching CIBIL data with query:', query);
            
            var cibilData = await CibilDataModel.findOne(query);
            
            if (cibilData) {
                // Convert Mongoose document to plain object
                return cibilData.toObject ? cibilData.toObject() : cibilData;
            }
            
            // If not found by primary identifiers, try to load from sample data (for development)
            if (process.env.NODE_ENV === 'development') {
                return loadSampleData();
            }
            
            return null;
            
        } catch (error) {
            log('Error finding CIBIL data:', error);
            return null;
        }
    }

    /**
     * Load sample data for development/testing
     */
    function loadSampleData() {
        try {
            var samplePath = path.join(__dirname, '../../../data/cibil/sample-data.json');
            
            if (fs.existsSync(samplePath)) {
                delete require.cache[require.resolve(samplePath)];
                var sampleData = require(samplePath);
                
                // Transform sample data to new schema
                if (sampleData.data) {
                    var transformed = transformSampleToNewSchema(sampleData.data);
                    log('Loaded and transformed sample data');
                    return transformed;
                }
            }
        } catch (error) {
            log('Error loading sample data:', error);
        }
        return null;
    }

    /**
     * Transform old sample data to new schema
     */
    function transformSampleToNewSchema(oldData) {
        return {
            // Primary identifiers
            mobile: oldData.mobile || '+919876543210',
            email: oldData.email || 'user@example.com',
            pan: oldData.pan || 'ABCDE1234F',
            name: oldData.name || 'John Doe',
            gender: oldData.gender || 'Male',
            date_of_birth: oldData.date_of_birth || '1990-01-01',
            
            // Credit data
            credit_score: oldData.credit_score || '750',
            credit_report: oldData.credit_report || [],
            
            // Additional data
            pan_comprehensive: oldData.pan_comprehensive || {},
            params: oldData.params || {},
            status: oldData.status || true,
            status_code: oldData.status_code || 200,
            success: oldData.success || true,
            message: oldData.message || 'Sample data loaded',
            message_code: oldData.message_code || 'SAMPLE',
            
            // Analysis cache (if available)
            analysis: oldData.analysis || null,
            
            // Timestamps
            createdAt: oldData.createdAt || new Date(),
            updatedAt: oldData.updatedAt || new Date()
        };
    }

    /**
     * Main function to generate credit report PDF
     */
    async function generateCreditReportPDF(cibilData) {
        try {
            log('Starting PDF generation for:', cibilData.name || 'Unknown');
            
            // Step 1: Get or compute analysis
            var analysis = await getOrComputeAnalysis(cibilData);
            
            if (!analysis) {
                throw new Error('Failed to generate analysis for PDF');
            }
            
            // Step 2: Generate HTML content
            var htmlContent = generateReportHTML(cibilData, analysis);
            
            // Step 3: Generate PDF from HTML
            var pdfBuffer = await generatePDFFromHTML(htmlContent);
            
            // Step 4: Validate PDF
            if (!pdfBuffer || pdfBuffer.length === 0) {
                throw new Error('Generated PDF buffer is empty');
            }
            
            // Basic PDF validation (check for PDF header)
            if (pdfBuffer.length > 4) {
                var header = pdfBuffer.toString('ascii', 0, 4);
                if (header !== '%PDF') {
                    log('Warning: PDF buffer does not start with %PDF header. Actual header:', header);
                }
            }
            
            log(`PDF generated successfully. Size: ${pdfBuffer.length} bytes`);
            
            return {
                success: true,
                buffer: pdfBuffer,
                size: pdfBuffer.length,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            log('Error generating credit report PDF:', error);
            return {
                success: false,
                error: error.message,
                stack: error.stack
            };
        }
    }

    /**
     * Get or compute analysis for CIBIL data
     */
    async function getOrComputeAnalysis(cibilData) {
        try {
            // Use analysis cache helper if available
            var analysisHelperPath = path.join(__dirname, './api/analysis-cache.js');
            if (fs.existsSync(analysisHelperPath)) {
                var AnalysisHelper = require(analysisHelperPath);
                var result = await AnalysisHelper.getOrComputeAnalysis(cibilData, false);
                return result.analysis;
            }
            
            // Fallback: compute analysis manually
            return computeAnalysisManually(cibilData);
            
        } catch (error) {
            log('Error getting analysis:', error);
            return computeAnalysisManually(cibilData);
        }
    }

    /**
     * Compute analysis manually (fallback)
     */
    function computeAnalysisManually(cibilData) {
        try {
            var GradingEngine = require('./api/grading-engine');
            var AdvancedAnalytics = require('./api/analytics-engine-advance.js');
            var RiskAssessment = require('./api/risk-assessment.js');
            
            var analyzer = new GradingEngine(cibilData);
            var advanced = new AdvancedAnalytics(cibilData, analyzer);
            var risk = new RiskAssessment(cibilData, analyzer);
            
            return {
                overallGrade: analyzer.calculateOverallGrade(),
                defaulters: analyzer.identifyDefaulters(),
                recommendations: analyzer.generateRecommendations(),
                comprehensiveReport: advanced.generateComprehensiveReport(),
                riskReport: risk.generateRiskReport(),
                improvementPlan: advanced.generateImprovementPlan(),
                bankSuggestions: advanced.suggestBanks(),
                creditUtilization: analyzer.getCreditUtilization(),
                creditAge: analyzer.getCreditAge(),
                paymentAnalysis: analyzer.getOverallPaymentAnalysis(),
                componentScores: analyzer.getComponentScores ? analyzer.getComponentScores() : {},
                riskDetails: {
                    creditWorthiness: risk.calculateCreditWorthiness(),
                    defaultProbability: risk.calculateDefaultProbability(),
                    eligibleInstitutions: risk.getEligibleInstitutions()
                },
                allAccounts: analyzer.processAccounts ? analyzer.processAccounts() : [],
                analyzedAt: new Date(),
                analysisVersion: '1.0'
            };
            
        } catch (error) {
            log('Error computing analysis manually:', error);
            return getBasicAnalysis(cibilData);
        }
    }

    /**
     * Get basic analysis when all else fails
     */
    function getBasicAnalysis(cibilData) {
        return {
            overallGrade: 'C',
            defaulters: [],
            recommendations: [{
                priority: 'Medium',
                message: 'Unable to compute detailed analysis. Please try again later.',
                area: 'System'
            }],
            comprehensiveReport: {
                summary: {
                    grade: 'C',
                    creditScore: cibilData.credit_score || 'N/A',
                    totalAccounts: cibilData.credit_report && cibilData.credit_report[0] && 
                                  cibilData.credit_report[0].accounts ? cibilData.credit_report[0].accounts.length : 0
                }
            },
            riskReport: {
                riskLevel: 'Medium',
                creditWorthiness: { score: 50, isCreditWorthy: false }
            },
            analyzedAt: new Date(),
            analysisVersion: 'basic'
        };
    }

    /**
     * Generate HTML content for the report
     */
    function generateReportHTML(cibilData, analysis) {
        try {
            // Use comprehensive template if available
            var templatePath = path.join(__dirname, './pdf-template-comprehensive.js');
            if (fs.existsSync(templatePath)) {
                var generateComprehensiveHTML = require(templatePath);
                return generateComprehensiveHTML({
                    data: cibilData,
                    analysis: analysis
                });
            }
            
            // Fallback to built-in template
            return generateModernReportHTML(cibilData, analysis);
            
        } catch (error) {
            log('Error generating report HTML:', error);
            return generateSimpleReportHTML(cibilData, analysis);
        }
    }

    /**
     * Modern HTML template for PDF
     */
    function generateModernReportHTML(cibilData, analysis) {
        var name = cibilData.name || 'Unknown';
        var mobile = cibilData.mobile || 'N/A';
        var pan = cibilData.pan || 'N/A';
        var email = cibilData.email || 'N/A';
        var creditScore = cibilData.credit_score || 'N/A';
        var overallGrade = analysis.overallGrade || 'C';
        
        // Determine grade color
        var gradeColor = '#4CAF50'; // Default green
        if (overallGrade.includes('A')) gradeColor = '#4CAF50'; // Green
        else if (overallGrade.includes('B')) gradeColor = '#2196F3'; // Blue
        else if (overallGrade.includes('C')) gradeColor = '#FF9800'; // Orange
        else if (overallGrade.includes('D') || overallGrade.includes('E') || overallGrade.includes('F')) gradeColor = '#F44336'; // Red
        
        var currentDate = new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        var html = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Credit Health Report - ${escapeHtml(name)}</title>
            <style>
                /* Modern CSS Reset */
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                /* Base Styles */
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background: #f8f9fa;
                    padding: 0;
                    margin: 0;
                }
                
                .container {
                    max-width: 210mm; /* A4 width */
                    min-height: 297mm; /* A4 height */
                    margin: 0 auto;
                    background: white;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                    position: relative;
                    padding: 25mm;
                }
                
                /* Header Styles */
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid ${gradeColor};
                    position: relative;
                }
                
                .logo {
                    font-size: 28px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                
                .logo-icon {
                    font-size: 32px;
                }
                
                .report-title {
                    font-size: 22px;
                    color: #2c3e50;
                    font-weight: 600;
                    margin-bottom: 5px;
                }
                
                .report-subtitle {
                    font-size: 16px;
                    color: #7f8c8d;
                    margin-bottom: 15px;
                }
                
                .report-date {
                    font-size: 14px;
                    color: #95a5a6;
                    background: #f8f9fa;
                    padding: 8px 15px;
                    border-radius: 20px;
                    display: inline-block;
                }
                
                /* Score Section */
                .score-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 40px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 30px;
                    border-radius: 15px;
                    color: white;
                }
                
                .score-item {
                    text-align: center;
                }
                
                .score-value {
                    font-size: 52px;
                    font-weight: bold;
                    margin-bottom: 5px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
                }
                
                .score-label {
                    font-size: 16px;
                    opacity: 0.9;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .grade-badge {
                    display: inline-block;
                    width: 100px;
                    height: 100px;
                    line-height: 100px;
                    font-size: 42px;
                    font-weight: bold;
                    color: white;
                    background: ${gradeColor};
                    border-radius: 50%;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                    border: 5px solid rgba(255,255,255,0.3);
                }
                
                /* Metrics Grid */
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin-bottom: 40px;
                }
                
                .metric-card {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    text-align: center;
                    transition: transform 0.3s ease;
                }
                
                .metric-card:hover {
                    transform: translateY(-5px);
                }
                
                .metric-value {
                    font-size: 32px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                
                .metric-label {
                    font-size: 14px;
                    color: #7f8c8d;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                /* User Info Section */
                .user-info-section {
                    background: #f8f9fa;
                    padding: 25px;
                    border-radius: 10px;
                    margin-bottom: 40px;
                }
                
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }
                
                .info-item {
                    padding: 15px;
                    background: white;
                    border-radius: 8px;
                    border-left: 4px solid ${gradeColor};
                }
                
                .info-label {
                    font-size: 12px;
                    color: #7f8c8d;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 5px;
                }
                
                .info-value {
                    font-size: 16px;
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                /* Recommendations Section */
                .recommendations-section {
                    margin-bottom: 40px;
                }
                
                .section-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #ecf0f1;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .section-title::before {
                    content: '';
                    width: 30px;
                    height: 4px;
                    background: ${gradeColor};
                    border-radius: 2px;
                }
                
                .recommendations-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
                
                .recommendation-card {
                    padding: 20px;
                    border-radius: 8px;
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                }
                
                .recommendation-card.high {
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
                    color: white;
                }
                
                .recommendation-card.medium {
                    background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);
                    color: white;
                }
                
                .recommendation-card.low {
                    background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%);
                    color: white;
                }
                
                .priority-badge {
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .rec-content {
                    flex: 1;
                }
                
                .rec-message {
                    font-size: 15px;
                    margin-bottom: 5px;
                }
                
                .rec-area {
                    font-size: 13px;
                    opacity: 0.9;
                }
                
                /* Risk Assessment */
                .risk-section {
                    background: #fff3e0;
                    padding: 25px;
                    border-radius: 10px;
                    margin-bottom: 40px;
                    border-left: 4px solid #ff9800;
                }
                
                .risk-level {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 20px;
                    border-radius: 25px;
                    font-weight: bold;
                    font-size: 16px;
                }
                
                .risk-level.high {
                    background: #ffebee;
                    color: #c62828;
                }
                
                .risk-level.medium {
                    background: #fff3e0;
                    color: #ef6c00;
                }
                
                .risk-level.low {
                    background: #e8f5e9;
                    color: #2e7d32;
                }
                
                /* Table Styles */
                .table-container {
                    overflow-x: auto;
                    margin-bottom: 40px;
                }
                
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                }
                
                .data-table th {
                    background: #f8f9fa;
                    padding: 15px;
                    text-align: left;
                    font-weight: 600;
                    color: #2c3e50;
                    border-bottom: 2px solid #ecf0f1;
                }
                
                .data-table td {
                    padding: 12px 15px;
                    border-bottom: 1px solid #ecf0f1;
                }
                
                .data-table tr:hover {
                    background: #f8f9fa;
                }
                
                /* Footer */
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ecf0f1;
                    color: #95a5a6;
                    font-size: 12px;
                }
                
                .footer-logo {
                    font-size: 18px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                
                /* Print Styles */
                @media print {
                    body {
                        background: white;
                        padding: 0;
                    }
                    
                    .container {
                        box-shadow: none;
                        padding: 15mm;
                        margin: 0;
                        max-width: none;
                        min-height: auto;
                    }
                    
                    .score-section {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    
                    .metric-card {
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .recommendation-card.high,
                    .recommendation-card.medium,
                    .recommendation-card.low {
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                }
                
                /* Utility Classes */
                .text-center { text-align: center; }
                .mb-20 { margin-bottom: 20px; }
                .mb-30 { margin-bottom: 30px; }
                .mt-30 { margin-top: 30px; }
                .p-20 { padding: 20px; }
                .rounded { border-radius: 10px; }
                .shadow { box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Header -->
                <div class="header">
                    <div class="logo">
                        <span class="logo-icon">📊</span>
                        EASYCRED ASTROCRED
                    </div>
                    <div class="report-title">Comprehensive Credit Health Report</div>
                    <div class="report-subtitle">Personalized Credit Analysis & Improvement Plan</div>
                    <div class="report-date">${currentDate}</div>
                </div>
                
                <!-- Score Section -->
                <div class="score-section">
                    <div class="score-item">
                        <div class="score-value">${creditScore}</div>
                        <div class="score-label">Credit Score</div>
                    </div>
                    <div class="score-item">
                        <div class="grade-badge">${overallGrade}</div>
                        <div class="score-label">Overall Grade</div>
                    </div>
                </div>
                
                <!-- Key Metrics -->
                <div class="section-title">📈 Key Credit Metrics</div>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${analysis.creditUtilization ? analysis.creditUtilization.toFixed(1) : '0'}%</div>
                        <div class="metric-label">Credit Utilization</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${analysis.creditAge || 0}</div>
                        <div class="metric-label">Credit Age (Months)</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${analysis.paymentAnalysis && analysis.paymentAnalysis.onTimeRate ? (analysis.paymentAnalysis.onTimeRate * 100).toFixed(1) : '0'}%</div>
                        <div class="metric-label">On-Time Payments</div>
                    </div>
                </div>
                
                <!-- User Information -->
                <div class="section-title">👤 Profile Information</div>
                <div class="user-info-section">
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Full Name</div>
                            <div class="info-value">${escapeHtml(name)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Mobile Number</div>
                            <div class="info-value">${escapeHtml(mobile)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">PAN Number</div>
                            <div class="info-value">${escapeHtml(pan)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Email Address</div>
                            <div class="info-value">${escapeHtml(email)}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Recommendations -->
                <div class="section-title">💡 Actionable Recommendations</div>
                <div class="recommendations-grid">
        `;
        
        // Add recommendations
        var recommendations = analysis.recommendations || [];
        if (recommendations.length > 0) {
            recommendations.slice(0, 5).forEach(function(rec, index) {
                if (!rec) return;
                var priority = (rec.priority || 'Medium').toLowerCase();
                var area = rec.area || 'General';
                var message = rec.message || 'No specific recommendation';
                
                html += `
                    <div class="recommendation-card ${priority}">
                        <div class="priority-badge" style="background: rgba(255,255,255,0.2);">${priority.toUpperCase()}</div>
                        <div class="rec-content">
                            <div class="rec-message">${escapeHtml(message)}</div>
                            <div class="rec-area">${escapeHtml(area)}</div>
                        </div>
                    </div>
                `;
            });
        } else {
            html += `
                <div class="recommendation-card medium">
                    <div class="rec-content">
                        <div class="rec-message">No specific recommendations at this time. Maintain good payment habits and keep credit utilization low.</div>
                        <div class="rec-area">General Advice</div>
                    </div>
                </div>
            `;
        }
        
        // Risk Assessment
        var riskLevel = (analysis.riskReport && analysis.riskReport.riskLevel) || 'Medium';
        var riskLevelClass = riskLevel.toLowerCase();
        var riskDescription = '';
        
        if (riskLevelClass === 'high' || riskLevelClass === 'very high') {
            riskDescription = 'High risk profile. Requires careful consideration and possibly collateral.';
        } else if (riskLevelClass === 'medium') {
            riskDescription = 'Moderate risk. Standard lending terms with some monitoring.';
        } else {
            riskDescription = 'Low risk. Eligible for best interest rates and terms.';
        }
        
        html += `
                </div>
                
                <!-- Risk Assessment -->
                <div class="section-title">⚠️ Risk Assessment</div>
                <div class="risk-section">
                    <div class="risk-level ${riskLevelClass}">
                        <span>Risk Level:</span>
                        <strong>${riskLevel.toUpperCase()}</strong>
                    </div>
                    <p class="mt-30">${riskDescription}</p>
                    <div class="info-grid mt-30">
                        <div class="info-item">
                            <div class="info-label">Credit Worthiness</div>
                            <div class="info-value">${analysis.riskDetails && analysis.riskDetails.creditWorthiness ? analysis.riskDetails.creditWorthiness.score : '50'}/100</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Default Probability</div>
                            <div class="info-value">${analysis.riskDetails && analysis.riskDetails.defaultProbability ? analysis.riskDetails.defaultProbability.probability : '50'}%</div>
                        </div>
                    </div>
                </div>
        `;
        
        // Defaulters Table (if any)
        var defaulters = analysis.defaulters || [];
        if (defaulters.length > 0) {
            html += `
                <div class="section-title">⚠️ Accounts Needing Attention</div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Lender</th>
                                <th>Account Type</th>
                                <th>Current Balance</th>
                                <th>Overdue Amount</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            defaulters.forEach(function(defaulter, index) {
                if (index >= 5) return; // Limit to 5 rows
                var lender = defaulter.lender || defaulter.memberShortName || 'Unknown';
                var accountType = defaulter.accountType || 'Unknown';
                var balance = defaulter.currentBalance || 0;
                var overdue = defaulter.overdueAmount || defaulter.amountOverdue || 0;
                
                html += `
                    <tr>
                        <td>${escapeHtml(lender)}</td>
                        <td>${escapeHtml(accountType)}</td>
                        <td>₹${formatIndianCurrency(balance)}</td>
                        <td>₹${formatIndianCurrency(overdue)}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        // Footer
        html += `
                <div class="footer">
                    <div class="footer-logo">EASYCRED ASTROCRED</div>
                    <p>This report is generated by EasyCred AstroCred Credit Analysis System</p>
                    <p>Report ID: ${escapeHtml(cibilData.mobile || cibilData.pan || 'N/A')} | Confidential Document</p>
                    <p style="margin-top: 10px;">For support: https://astrocred.easycred.co.in | Email: support@easycred.co.in</p>
                    <p style="font-size: 11px; margin-top: 10px; color: #bdc3c7;">
                        Generated on: ${new Date().toLocaleString('en-IN')} | 
                        Analysis Version: ${analysis.analysisVersion || '1.0'}
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;
        
        return html;
    }

    /**
     * Simple HTML template (fallback)
     */
    function generateSimpleReportHTML(cibilData, analysis) {
        var name = cibilData.name || 'Unknown';
        var creditScore = cibilData.credit_score || 'N/A';
        var overallGrade = analysis.overallGrade || 'C';
        
        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Credit Report - ${escapeHtml(name)}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                h1 { color: #2c3e50; }
                .header { text-align: center; margin-bottom: 40px; }
                .score { font-size: 48px; font-weight: bold; color: #27ae60; }
                .grade { font-size: 36px; color: #2980b9; }
                .section { margin-bottom: 30px; }
                .section-title { font-size: 18px; font-weight: bold; color: #2c3e50; margin-bottom: 15px; }
                .recommendation { padding: 15px; background: #f8f9fa; margin-bottom: 10px; border-left: 4px solid #3498db; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Credit Health Report</h1>
                <p>Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
            </div>
            
            <div class="section">
                <div class="score">Credit Score: ${creditScore}</div>
                <div class="grade">Overall Grade: ${overallGrade}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Profile Information</div>
                <p><strong>Name:</strong> ${escapeHtml(name)}</p>
                <p><strong>Mobile:</strong> ${escapeHtml(cibilData.mobile || 'N/A')}</p>
                <p><strong>PAN:</strong> ${escapeHtml(cibilData.pan || 'N/A')}</p>
            </div>
            
            <div class="section">
                <div class="section-title">Recommendations</div>
                ${(analysis.recommendations || []).slice(0, 3).map(rec => 
                    `<div class="recommendation">${escapeHtml(rec.message || 'No recommendation')}</div>`
                ).join('')}
            </div>
            
            <div class="section">
                <div class="section-title">Report Information</div>
                <p>This report is generated by EasyCred AstroCred Credit Analysis System</p>
                <p>Confidential Document - For authorized use only</p>
            </div>
        </body>
        </html>`;
    }

    /**
     * Generate PDF from HTML using Puppeteer
     */
    async function generatePDFFromHTML(htmlContent) {
        var browser = null;
        
        try {
            // Configure Puppeteer launch options
            var launchOptions = {
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920,1080'
                ]
            };
            
            // Add production-specific options
            if (process.env.NODE_ENV === 'production') {
                if (process.env.PUPPETEER_EXECUTABLE_PATH) {
                    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
                }
            }
            
            log('Launching Puppeteer browser...');
            browser = await puppeteer.launch(launchOptions);
            
            var page = await browser.newPage();
            
            // Set viewport
            await page.setViewport({ width: 1920, height: 1080 });
            
            // Set content with proper waiting
            await page.setContent(htmlContent, {
                waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
                timeout: 30000
            });
            
            // Wait for any dynamic content
            await page.evaluateHandle('document.fonts.ready');
            
            // Additional wait for stability
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Generate PDF
            log('Generating PDF...');
            var pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                },
                preferCSSPageSize: false,
                timeout: 30000
            });
            
            await browser.close();
            browser = null;
            
            return pdfBuffer;
            
        } catch (error) {
            if (browser) {
                try {
                    await browser.close();
                } catch (closeError) {
                    log('Error closing browser:', closeError);
                }
            }
            throw error;
        }
    }

    /**
     * Helper function to escape HTML
     */
    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Format Indian currency
     */
    function formatIndianCurrency(amount) {
        if (!amount) return '0';
        
        var num = parseFloat(amount);
        if (isNaN(num)) return '0';
        
        // Format with Indian numbering system
        var formatted = num.toLocaleString('en-IN', {
            maximumFractionDigits: 0
        });
        
        return formatted;
    }

    /**
     * Alternative print view endpoint
     */
    app.get('/api/cibil/print-view', async function(req, res) {
        try {
            var mobile = req.query.mobile || req.params.mobile;
            var pan = req.query.pan || req.params.pan;
            
            if (!mobile && !pan) {
                return res.status(400).send('Mobile or PAN is required');
            }
            
            var cibilData = await findCIBILData(mobile, pan, null, null);
            
            if (!cibilData) {
                return res.status(404).send('CIBIL data not found');
            }
            
            var analysis = await getOrComputeAnalysis(cibilData);
            var html = generateReportHTML(cibilData, analysis);
            
            res.send(html);
            
        } catch (error) {
            log('Error generating print view:', error);
            res.status(500).send('Error: ' + error.message);
        }
    });

    /**
     * Health check for PDF generation
     */
    app.get('/api/cibil/pdf-health', async function(req, res) {
        try {
            var browser = null;
            var isHealthy = false;
            var errorDetails = null;
            
            try {
                browser = await puppeteer.launch({
                    headless: 'new',
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                
                var page = await browser.newPage();
                await page.setContent('<h1>Test</h1>');
                var pdf = await page.pdf({ format: 'A4' });
                
                if (pdf && pdf.length > 0) {
                    isHealthy = true;
                }
                
                await browser.close();
                
            } catch (error) {
                errorDetails = error.message;
                if (browser) {
                    try { await browser.close(); } catch (e) {}
                }
            }
            
            res.json({
                service: 'PDF Generation',
                status: isHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                details: errorDetails,
                environment: process.env.NODE_ENV
            });
            
        } catch (error) {
            res.status(500).json({
                service: 'PDF Generation',
                status: 'error',
                error: error.message
            });
        }
    });

})();