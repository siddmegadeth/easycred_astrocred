// PDF Generator for Equifax Reports
// Uses PDFKit for generating PDF reports
(function () {
    var PDFDocument = require('pdfkit');
    var fs = require('fs');
    var path = require('path');

    function EquifaxPDFGenerator() {
        this.fontsPath = path.join(__dirname, '../../assets/fonts');
    }

    // Generate Equifax PDF Report
    EquifaxPDFGenerator.prototype.generateEquifaxPDF = function (equifaxData, outputPath, callback) {
        try {
            var doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'Equifax Credit Report - ' + (equifaxData.name || 'Report'),
                    Author: 'ASTROCRED',
                    Subject: 'Equifax Credit Report Analysis'
                }
            });

            var stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // Header
            this.addHeader(doc, 'Equifax Credit Report', equifaxData.name);

            // Credit Score Section
            this.addCreditScoreSection(doc, equifaxData);

            // Profile Information
            this.addProfileSection(doc, equifaxData);

            // Credit Summary
            this.addCreditSummarySection(doc, equifaxData);

            // Accounts Section
            this.addAccountsSection(doc, equifaxData);

            // Analysis Section
            if (equifaxData.analysis) {
                this.addAnalysisSection(doc, equifaxData);
            }

            // Footer
            this.addFooter(doc);

            doc.end();

            stream.on('finish', function () {
                callback(null, outputPath);
            });

            stream.on('error', function (error) {
                callback(error, null);
            });

        } catch (error) {
            callback(error, null);
        }
    };

    // Add Header
    EquifaxPDFGenerator.prototype.addHeader = function (doc, title, name) {
        doc.fillColor('#c41e3a')
            .fontSize(24)
            .font('Helvetica-Bold')
            .text('ASTROCRED', 50, 50, { align: 'center' });

        doc.fillColor('#333333')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(title, 50, 80, { align: 'center' });

        doc.fillColor('#c41e3a')
            .fontSize(12)
            .text('Powered by Equifax', 50, 105, { align: 'center' });

        if (name) {
            doc.fillColor('#333333')
                .fontSize(14)
                .font('Helvetica')
                .text('Report for: ' + name, 50, 125, { align: 'center' });
        }

        doc.moveDown(2);
    };

    // Add Credit Score Section
    EquifaxPDFGenerator.prototype.addCreditScoreSection = function (doc, equifaxData) {
        var y = doc.y;
        var score = parseInt(equifaxData.credit_score) || parseInt(equifaxData.score) || 0;

        // Score Box with Equifax branding
        doc.rect(50, y, 495, 100)
            .fillColor('#fff5f5')
            .fill()
            .strokeColor('#c41e3a')
            .lineWidth(2)
            .stroke();

        doc.fillColor('#c41e3a')
            .fontSize(48)
            .font('Helvetica-Bold')
            .text(score.toString(), 100, y + 20);

        doc.fontSize(20)
            .text('/ 900', 200, y + 35);

        doc.fillColor('#333333')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Equifax Score', 350, y + 25);

        var scoreRange = this.getScoreRange(score);
        doc.fontSize(14)
            .font('Helvetica')
            .text(scoreRange, 350, y + 50);

        doc.text('Report Date: ' + new Date().toLocaleDateString(), 350, y + 70);

        doc.y = y + 120;
        doc.moveDown();
    };

    // Add Profile Section
    EquifaxPDFGenerator.prototype.addProfileSection = function (doc, equifaxData) {
        doc.fillColor('#c41e3a')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Profile Information', 50, doc.y);

        doc.moveDown(0.5);

        var profileData = [
            ['Name:', equifaxData.name || 'N/A'],
            ['PAN:', equifaxData.pan || 'N/A'],
            ['Mobile:', equifaxData.mobile || 'N/A'],
            ['Email:', equifaxData.email || 'N/A'],
            ['Bureau:', 'Equifax India']
        ];

        profileData.forEach(function (row) {
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
    EquifaxPDFGenerator.prototype.addCreditSummarySection = function (doc, equifaxData) {
        doc.fillColor('#c41e3a')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Credit Summary', 50, doc.y);

        doc.moveDown(0.5);

        var report = equifaxData.credit_report && equifaxData.credit_report[0] ? equifaxData.credit_report[0] : {};
        var accounts = report.accounts || equifaxData.accounts || [];
        var enquiries = report.enquiries || equifaxData.enquiries || [];

        var summaryData = [
            ['Total Accounts:', accounts.length.toString()],
            ['Active Accounts:', accounts.filter(function (a) { return a.accountStatus !== 'Closed'; }).length.toString()],
            ['Total Enquiries:', enquiries.length.toString()],
            ['Credit Utilization:', this.calculateUtilization(accounts) + '%']
        ];

        summaryData.forEach(function (row) {
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
    EquifaxPDFGenerator.prototype.addAccountsSection = function (doc, equifaxData) {
        var report = equifaxData.credit_report && equifaxData.credit_report[0] ? equifaxData.credit_report[0] : {};
        var accounts = report.accounts || equifaxData.accounts || [];

        if (accounts.length === 0) return;

        if (doc.y > 650) doc.addPage();

        doc.fillColor('#c41e3a')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Accounts Overview', 50, doc.y);

        doc.moveDown(0.5);

        // Table Header
        var headerY = doc.y;
        doc.fillColor('#fff5f5')
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
        accounts.slice(0, 12).forEach(function (account, index) {
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
                .text(account.lenderName || account.memberShortName || 'N/A', 55, rowY + 6, { width: 120 })
                .text(account.accountType || 'N/A', 175, rowY + 6, { width: 80 })
                .text('₹' + (account.highCreditAmount || 0).toLocaleString('en-IN'), 255, rowY + 6, { width: 90 })
                .text('₹' + (account.currentBalance || 0).toLocaleString('en-IN'), 345, rowY + 6, { width: 90 })
                .text(account.accountStatus || account.creditFacilityStatus || 'N/A', 435, rowY + 6, { width: 105 });

            doc.y = rowY + 25;
        });

        doc.moveDown();
    };

    // Add Analysis Section
    EquifaxPDFGenerator.prototype.addAnalysisSection = function (doc, equifaxData) {
        if (doc.y > 600) doc.addPage();

        doc.fillColor('#c41e3a')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Credit Analysis', 50, doc.y);

        doc.moveDown(0.5);

        var analysis = equifaxData.analysis || {};

        if (analysis.grade) {
            doc.fillColor('#333333')
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('Overall Grade: ', 70, doc.y, { continued: true })
                .fillColor('#c41e3a')
                .text(analysis.grade);
            doc.moveDown(0.5);
        }

        if (analysis.recommendations && analysis.recommendations.length > 0) {
            doc.fillColor('#333333')
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('Recommendations:', 70, doc.y);
            doc.moveDown(0.3);

            analysis.recommendations.slice(0, 4).forEach(function (rec, index) {
                doc.fillColor('#333333')
                    .fontSize(10)
                    .font('Helvetica')
                    .text((index + 1) + '. ' + (typeof rec === 'string' ? rec : rec.description || ''), 90, doc.y, { width: 440 });
                doc.moveDown(0.6);
            });
        }
    };

    // Add Footer
    EquifaxPDFGenerator.prototype.addFooter = function (doc) {
        var pageCount = doc.bufferedPageRange().count;
        for (var i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fillColor('#999999')
                .fontSize(8)
                .font('Helvetica')
                .text('Generated by ASTROCRED (Equifax Data) - ' + new Date().toLocaleDateString(),
                    50, doc.page.height - 30, { align: 'center' });
            doc.text('Page ' + (i + 1) + ' of ' + pageCount,
                50, doc.page.height - 20, { align: 'center' });
        }
    };

    // Helper Methods
    EquifaxPDFGenerator.prototype.getScoreRange = function (score) {
        if (score >= 800) return 'Excellent Credit History';
        if (score >= 750) return 'Very Good Credit History';
        if (score >= 700) return 'Good Credit History';
        if (score >= 650) return 'Fair Credit History';
        if (score >= 550) return 'Poor Credit History';
        return 'Very Poor Credit History';
    };

    EquifaxPDFGenerator.prototype.calculateUtilization = function (accounts) {
        var totalLimit = 0;
        var totalBalance = 0;
        accounts.forEach(function (acc) {
            totalLimit += acc.highCreditAmount || 0;
            totalBalance += acc.currentBalance || 0;
        });
        return totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
    };

    var equifaxPdfGenerator = new EquifaxPDFGenerator();

    // ============== API ENDPOINTS ==============

    // Get Equifax PDF Report
    app.get('/get/api/equifax/generate-pdf', async function (req, res) {
        try {
            var { pan, mobile, email } = req.query;
            var EquifaxDataModel = require('../../schema/equifax/equifax-data-schema.js');

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

            var equifaxData = await EquifaxDataModel.findOne(query).lean();
            if (!equifaxData) {
                return res.status(404).json({
                    success: false,
                    error: 'Equifax data not found'
                });
            }

            var outputDir = path.join(__dirname, '../../temp/pdf');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            var fileName = 'Equifax_Report_' + (pan || mobile || email) + '_' + Date.now() + '.pdf';
            var outputPath = path.join(outputDir, fileName);

            equifaxPdfGenerator.generateEquifaxPDF(equifaxData, outputPath, function (error, filePath) {
                if (error) {
                    console.error('Error generating Equifax PDF:', error);
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to generate PDF',
                        details: process.env.NODE_ENV === 'development' ? error.message : undefined
                    });
                }

                res.download(filePath, fileName, function (downloadError) {
                    if (downloadError) {
                        console.error('Error downloading PDF:', downloadError);
                    }
                    setTimeout(function () {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    }, 5000);
                });
            });

        } catch (error) {
            console.error('Error in Equifax PDF generation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate PDF',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    module.exports = equifaxPdfGenerator;

})();
