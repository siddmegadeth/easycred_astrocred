// PDF Generator for CIBIL Reports
// Uses PDFKit for generating PDF reports
(function() {
    var PDFDocument = require('pdfkit');
    var fs = require('fs');
    var path = require('path');

    function PDFGenerator() {
        this.fontsPath = path.join(__dirname, '../../assets/fonts');
    }

    // Generate CIBIL PDF Report
    PDFGenerator.prototype.generateCIBILPDF = function(cibilData, outputPath, callback) {
        try {
            var doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'CIBIL Credit Report - ' + (cibilData.name || 'Report'),
                    Author: 'ASTROCRED',
                    Subject: 'Credit Report Analysis'
                }
            });

            var stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // Header
            this.addHeader(doc, 'CIBIL Credit Report', cibilData.name);

            // Credit Score Section
            this.addCreditScoreSection(doc, cibilData);

            // Profile Information
            this.addProfileSection(doc, cibilData);

            // Credit Summary
            this.addCreditSummarySection(doc, cibilData);

            // Accounts Section
            this.addAccountsSection(doc, cibilData);

            // Recommendations
            this.addRecommendationsSection(doc, cibilData);

            // Footer
            this.addFooter(doc);

            doc.end();

            stream.on('finish', function() {
                callback(null, outputPath);
            });

            stream.on('error', function(error) {
                callback(error, null);
            });

        } catch (error) {
            callback(error, null);
        }
    };

    // Add Header
    PDFGenerator.prototype.addHeader = function(doc, title, name) {
        doc.fillColor('#1c1fbe')
            .fontSize(24)
            .font('Helvetica-Bold')
            .text('ASTROCRED', 50, 50, { align: 'center' });

        doc.fillColor('#333333')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(title, 50, 80, { align: 'center' });

        if (name) {
            doc.fontSize(14)
                .font('Helvetica')
                .text('Report for: ' + name, 50, 105, { align: 'center' });
        }

        doc.moveDown(2);
    };

    // Add Credit Score Section
    PDFGenerator.prototype.addCreditScoreSection = function(doc, cibilData) {
        var y = doc.y;
        var score = cibilData.credit_score || 0;
        var grade = cibilData.analysis && cibilData.analysis.overallGrade ? 
            (typeof cibilData.analysis.overallGrade === 'object' ? cibilData.analysis.overallGrade.grade : cibilData.analysis.overallGrade) : 'C';

        // Score Box
        doc.rect(50, y, 495, 100)
            .fillColor('#f8f9fa')
            .fill()
            .strokeColor('#1c1fbe')
            .lineWidth(2)
            .stroke();

        doc.fillColor('#1c1fbe')
            .fontSize(48)
            .font('Helvetica-Bold')
            .text(score.toString(), 100, y + 20);

        doc.fontSize(20)
            .text('/ 900', 200, y + 35);

        doc.fillColor('#333333')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Credit Score', 350, y + 25);

        doc.fontSize(14)
            .font('Helvetica')
            .text('Grade: ' + grade, 350, y + 50);

        var scoreRange = this.getScoreRange(score);
        doc.text(scoreRange, 350, y + 70);

        doc.y = y + 120;
        doc.moveDown();
    };

    // Add Profile Section
    PDFGenerator.prototype.addProfileSection = function(doc, cibilData) {
        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Profile Information', 50, doc.y);

        doc.moveDown(0.5);

        var profileData = [
            ['Name:', cibilData.name || 'N/A'],
            ['PAN:', cibilData.pan || 'N/A'],
            ['Mobile:', cibilData.mobile || 'N/A'],
            ['Email:', cibilData.email || 'N/A'],
            ['Report Date:', new Date(cibilData.updatedAt || Date.now()).toLocaleDateString()]
        ];

        profileData.forEach(function(row) {
            doc.fillColor('#666666')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text(row[0], 70, doc.y, { width: 150 });

            doc.fillColor('#333333')
                .fontSize(11)
                .font('Helvetica')
                .text(row[1], 220, doc.y, { width: 300 });

            doc.moveDown(0.8);
        });

        doc.moveDown();
    };

    // Add Credit Summary Section
    PDFGenerator.prototype.addCreditSummarySection = function(doc, cibilData) {
        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Credit Summary', 50, doc.y);

        doc.moveDown(0.5);

        var report = cibilData.credit_report && cibilData.credit_report[0] ? cibilData.credit_report[0] : {};
        var accounts = report.accounts || [];
        var enquiries = report.enquiries || [];

        var summaryData = [
            ['Total Accounts:', accounts.length.toString()],
            ['Total Enquiries:', enquiries.length.toString()],
            ['Credit Utilization:', this.calculateUtilization(accounts) + '%'],
            ['Payment History:', this.getPaymentHistorySummary(accounts)]
        ];

        summaryData.forEach(function(row) {
            doc.fillColor('#666666')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text(row[0], 70, doc.y, { width: 200 });

            doc.fillColor('#333333')
                .fontSize(11)
                .font('Helvetica')
                .text(row[1], 270, doc.y, { width: 200 });

            doc.moveDown(0.8);
        });

        doc.moveDown();
    };

    // Add Accounts Section
    PDFGenerator.prototype.addAccountsSection = function(doc, cibilData) {
        var report = cibilData.credit_report && cibilData.credit_report[0] ? cibilData.credit_report[0] : {};
        var accounts = report.accounts || [];

        if (accounts.length === 0) {
            return;
        }

        // Check if we need a new page
        if (doc.y > 650) {
            doc.addPage();
        }

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Accounts Overview', 50, doc.y);

        doc.moveDown(0.5);

        // Table Header
        var headerY = doc.y;
        doc.fillColor('#f8f9fa')
            .rect(50, headerY, 495, 25)
            .fill();

        doc.fillColor('#333333')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Lender', 55, headerY + 8, { width: 120 })
            .text('Type', 175, headerY + 8, { width: 80 })
            .text('Limit', 255, headerY + 8, { width: 90 })
            .text('Balance', 345, headerY + 8, { width: 90 })
            .text('Status', 435, headerY + 8, { width: 105 });

        doc.y = headerY + 30;

        // Table Rows
        accounts.slice(0, 15).forEach(function(account, index) {
            if (doc.y > 750) {
                doc.addPage();
                doc.y = 50;
            }

            var rowY = doc.y;
            var bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            doc.fillColor(bgColor)
                .rect(50, rowY, 495, 20)
                .fill();

            doc.fillColor('#333333')
                .fontSize(9)
                .font('Helvetica')
                .text(account.lenderName || account.accountHolderName || 'N/A', 55, rowY + 6, { width: 120 })
                .text(account.accountType || 'N/A', 175, rowY + 6, { width: 80 })
                .text('₹' + (account.highCreditAmount || 0).toLocaleString('en-IN'), 255, rowY + 6, { width: 90 })
                .text('₹' + (account.currentBalance || 0).toLocaleString('en-IN'), 345, rowY + 6, { width: 90 })
                .text(account.accountStatus || 'N/A', 435, rowY + 6, { width: 105 });

            doc.y = rowY + 25;
        });

        doc.moveDown();
    };

    // Add Recommendations Section
    PDFGenerator.prototype.addRecommendationsSection = function(doc, cibilData) {
        if (doc.y > 700) {
            doc.addPage();
        }

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Recommendations', 50, doc.y);

        doc.moveDown(0.5);

        var recommendations = cibilData.analysis && cibilData.analysis.recommendations ? 
            cibilData.analysis.recommendations.slice(0, 5) : [];

        if (recommendations.length === 0) {
            doc.fillColor('#666666')
                .fontSize(11)
                .font('Helvetica')
                .text('No specific recommendations available.', 70, doc.y);
            doc.moveDown();
            return;
        }

        recommendations.forEach(function(rec, index) {
            if (doc.y > 750) {
                doc.addPage();
                doc.y = 50;
            }

            var recText = typeof rec === 'string' ? rec : (rec.description || rec.title || rec);
            doc.fillColor('#333333')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text((index + 1) + '.', 70, doc.y, { width: 20 });

            doc.font('Helvetica')
                .text(recText, 90, doc.y, { width: 455 });

            doc.moveDown(1.2);
        });

        doc.moveDown();
    };

    // Add Footer
    PDFGenerator.prototype.addFooter = function(doc) {
        var pageCount = doc.bufferedPageRange().count;
        for (var i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fillColor('#999999')
                .fontSize(8)
                .font('Helvetica')
                .text('Generated by ASTROCRED - ' + new Date().toLocaleDateString(), 
                      50, doc.page.height - 30, { align: 'center' });
            doc.text('Page ' + (i + 1) + ' of ' + pageCount, 
                     50, doc.page.height - 20, { align: 'center' });
        }
    };

    // Helper Methods
    PDFGenerator.prototype.getScoreRange = function(score) {
        if (score >= 800) return 'Excellent Credit History';
        if (score >= 750) return 'Very Good Credit History';
        if (score >= 700) return 'Good Credit History';
        if (score >= 650) return 'Fair Credit History';
        if (score >= 550) return 'Poor Credit History';
        return 'Very Poor Credit History';
    };

    PDFGenerator.prototype.calculateUtilization = function(accounts) {
        var totalLimit = 0;
        var totalBalance = 0;
        accounts.forEach(function(acc) {
            totalLimit += acc.highCreditAmount || 0;
            totalBalance += acc.currentBalance || 0;
        });
        return totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
    };

    PDFGenerator.prototype.getPaymentHistorySummary = function(accounts) {
        // Simplified payment history summary
        var totalAccounts = accounts.length;
        var currentAccounts = accounts.filter(function(acc) {
            return acc.accountStatus && acc.accountStatus.includes('Current');
        }).length;
        return currentAccounts + ' of ' + totalAccounts + ' accounts current';
    };

    var pdfGenerator = new PDFGenerator();

    // ============== API ENDPOINTS ==============

    // Get CIBIL PDF Report
    app.get('/get/api/cibil/generate-pdf', async function(req, res) {
        try {
            var fs = require('fs');
            var { pan, mobile, email } = req.query;
            var CibilDataModel = require('../../schema/cibil/cibil-data-schema.js');

            if (!pan && !mobile && !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, or email)'
                });
            }

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

            var outputDir = path.join(__dirname, '../../temp/pdf');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            var fileName = 'CIBIL_Report_' + (pan || mobile || email) + '_' + Date.now() + '.pdf';
            var outputPath = path.join(outputDir, fileName);

            pdfGenerator.generateCIBILPDF(cibilData, outputPath, function(error, filePath) {
                if (error) {
                    console.error('Error generating CIBIL PDF:', error);
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to generate PDF',
                        details: process.env.NODE_ENV === 'development' ? error.message : undefined
                    });
                }

                res.download(filePath, fileName, function(downloadError) {
                    if (downloadError) {
                        console.error('Error downloading PDF:', downloadError);
                    }
                    // Clean up file after download
                    setTimeout(function() {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    }, 5000);
                });
            });

        } catch (error) {
            console.error('Error in CIBIL PDF generation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate PDF',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get ASTROCRED Analysis PDF Report
    app.get('/get/api/cibil/astrocred-report-pdf', async function(req, res) {
        try {
            var fs = require('fs');
            var { pan, mobile, email } = req.query;
            var CibilDataModel = require('../../schema/cibil/cibil-data-schema.js');
            var AdvancedAnalytics = require('./api/analytics-engine-advance.js');
            var GradingEngine = require('./api/grading-engine.js');

            if (!pan && !mobile && !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, or email)'
                });
            }

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

            // Generate comprehensive analysis
            var gradingEngine = new GradingEngine(cibilData);
            var advancedAnalytics = new AdvancedAnalytics(cibilData, gradingEngine);
            var comprehensiveReport = advancedAnalytics.generateComprehensiveReport();

            // Add analysis to cibilData for PDF generation
            cibilData.analysis = comprehensiveReport;

            var outputDir = path.join(__dirname, '../../temp/pdf');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            var fileName = 'ASTROCRED_Analysis_' + (pan || mobile || email) + '_' + Date.now() + '.pdf';
            var outputPath = path.join(outputDir, fileName);

            pdfGenerator.generateCIBILPDF(cibilData, outputPath, function(error, filePath) {
                if (error) {
                    console.error('Error generating ASTROCRED PDF:', error);
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to generate PDF',
                        details: process.env.NODE_ENV === 'development' ? error.message : undefined
                    });
                }

                res.download(filePath, fileName, function(downloadError) {
                    if (downloadError) {
                        console.error('Error downloading PDF:', downloadError);
                    }
                    // Clean up file after download
                    setTimeout(function() {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    }, 5000);
                });
            });

        } catch (error) {
            console.error('Error in ASTROCRED PDF generation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate PDF',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get Roadmap PDF
    app.get('/get/api/cibil/roadmap-pdf/:months', async function(req, res) {
        try {
            var fs = require('fs');
            var months = parseInt(req.params.months);
            var { pan, mobile, email } = req.query;
            var CibilDataModel = require('../../schema/cibil/cibil-data-schema.js');
            var AdvancedAnalytics = require('./api/analytics-engine-advance.js');
            var GradingEngine = require('./api/grading-engine.js');

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
            var roadmap = advancedAnalytics.generateImprovementPlan(months);

            // Create a document structure for PDF (simplified - you may want to create a dedicated roadmap PDF generator)
            cibilData.roadmap = roadmap;
            cibilData.analysis = { roadmap: roadmap };

            var outputDir = path.join(__dirname, '../../temp/pdf');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            var fileName = 'Roadmap_' + months + 'Months_' + (pan || mobile || email) + '_' + Date.now() + '.pdf';
            var outputPath = path.join(outputDir, fileName);

            // Use CIBIL PDF generator for now (you can create a dedicated roadmap PDF generator later)
            pdfGenerator.generateCIBILPDF(cibilData, outputPath, function(error, filePath) {
                if (error) {
                    console.error('Error generating Roadmap PDF:', error);
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to generate PDF',
                        details: process.env.NODE_ENV === 'development' ? error.message : undefined
                    });
                }

                res.download(filePath, fileName, function(downloadError) {
                    if (downloadError) {
                        console.error('Error downloading PDF:', downloadError);
                    }
                    // Clean up file after download
                    setTimeout(function() {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    }, 5000);
                });
            });

        } catch (error) {
            console.error('Error in Roadmap PDF generation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate PDF',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    module.exports = pdfGenerator;

})();
