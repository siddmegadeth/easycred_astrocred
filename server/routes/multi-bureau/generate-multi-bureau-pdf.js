// PDF Generator for Multi-Bureau Comparison Reports
(function() {
    var PDFDocument = require('pdfkit');
    var fs = require('fs');
    var path = require('path');
    var MultiBureauComparisonModel = require('../../schema/multi-bureau/multi-bureau-comparison-schema.js');

    function MultiBureauPDFGenerator() {}

    // Generate Multi-Bureau PDF
    MultiBureauPDFGenerator.prototype.generateMultiBureauPDF = function(comparisonData, outputPath, callback) {
        try {
            var doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'Multi-Bureau Credit Comparison Report',
                    Author: 'ASTROCRED',
                    Subject: 'Credit Report Comparison'
                }
            });

            var stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // Header
            this.addHeader(doc, 'Multi-Bureau Credit Comparison', comparisonData.pan || comparisonData.mobile);

            // Comparison Summary
            this.addComparisonSummary(doc, comparisonData);

            // Bureau Scores Comparison
            this.addBureauScoresComparison(doc, comparisonData);

            // Detailed Bureau Breakdown
            this.addBureauBreakdown(doc, comparisonData);

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
    MultiBureauPDFGenerator.prototype.addHeader = function(doc, title, identifier) {
        doc.fillColor('#1c1fbe')
            .fontSize(24)
            .font('Helvetica-Bold')
            .text('ASTROCRED', 50, 50, { align: 'center' });

        doc.fillColor('#333333')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(title, 50, 80, { align: 'center' });

        if (identifier) {
            doc.fontSize(12)
                .font('Helvetica')
                .fillColor('#666666')
                .text('PAN: ' + identifier, 50, 105, { align: 'center' });
        }

        doc.moveDown(2);
    };

    // Add Comparison Summary
    MultiBureauPDFGenerator.prototype.addComparisonSummary = function(doc, data) {
        var y = doc.y;
        var avgScore = data.average_score || 0;
        var overallGrade = data.overall_grade || 'C';

        // Summary Box
        doc.rect(50, y, 495, 80)
            .fillColor('#f8f9fa')
            .fill()
            .strokeColor('#1c1fbe')
            .lineWidth(2)
            .stroke();

        doc.fillColor('#1c1fbe')
            .fontSize(36)
            .font('Helvetica-Bold')
            .text(Math.round(avgScore).toString(), 100, y + 15);

        doc.fontSize(16)
            .text('/ 900', 180, y + 25);

        doc.fillColor('#333333')
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('Average Credit Score', 300, y + 20);

        doc.fontSize(12)
            .font('Helvetica')
            .text('Overall Grade: ' + overallGrade, 300, y + 40);

        doc.text('Comparison Date: ' + new Date(data.comparison_date || Date.now()).toLocaleDateString(), 300, y + 55);

        doc.y = y + 100;
        doc.moveDown();
    };

    // Add Bureau Scores Comparison
    MultiBureauPDFGenerator.prototype.addBureauScoresComparison = function(doc, data) {
        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Bureau Scores Comparison', 50, doc.y);

        doc.moveDown(0.5);

        var headerY = doc.y;
        doc.fillColor('#f8f9fa')
            .rect(50, headerY, 495, 25)
            .fill();

        doc.fillColor('#333333')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Credit Bureau', 55, headerY + 8, { width: 150 })
            .text('Credit Score', 205, headerY + 8, { width: 120 })
            .text('Grade', 325, headerY + 8, { width: 80 })
            .text('Status', 405, headerY + 8, { width: 135 });

        doc.y = headerY + 30;

        var bureaus = [
            { name: 'CIBIL', data: data.cibil_summary },
            { name: 'EQUIFAX', data: data.equifax_summary },
            { name: 'EXPERION', data: data.experion_summary },
            { name: 'CRIF', data: data.crif_summary }
        ];

        bureaus.forEach(function(bureau, index) {
            if (doc.y > 750) {
                doc.addPage();
                doc.y = 50;
            }

            var rowY = doc.y;
            var bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            doc.fillColor(bgColor)
                .rect(50, rowY, 495, 25)
                .fill();

            if (bureau.data && bureau.data.credit_score) {
                doc.fillColor('#333333')
                    .fontSize(10)
                    .font('Helvetica-Bold')
                    .text(bureau.name, 55, rowY + 8, { width: 150 });

                doc.font('Helvetica')
                    .text(bureau.data.credit_score.toString(), 205, rowY + 8, { width: 120 })
                    .text(bureau.data.grade || 'N/A', 325, rowY + 8, { width: 80 })
                    .text('Available', 405, rowY + 8, { width: 135 });
            } else {
                doc.fillColor('#999999')
                    .fontSize(10)
                    .font('Helvetica')
                    .text(bureau.name, 55, rowY + 8, { width: 150 })
                    .text('N/A', 205, rowY + 8, { width: 120 })
                    .text('N/A', 325, rowY + 8, { width: 80 })
                    .text('Not Available', 405, rowY + 8, { width: 135 });
            }

            doc.y = rowY + 30;
        });

        doc.moveDown();
    };

    // Add Bureau Breakdown
    MultiBureauPDFGenerator.prototype.addBureauBreakdown = function(doc, data) {
        if (doc.y > 650) {
            doc.addPage();
        }

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Detailed Bureau Breakdown', 50, doc.y);

        doc.moveDown(0.5);

        var bureaus = [
            { name: 'CIBIL', data: data.cibil_summary },
            { name: 'EQUIFAX', data: data.equifax_summary },
            { name: 'EXPERION', data: data.experion_summary }
        ];

        bureaus.forEach(function(bureau) {
            if (!bureau.data || !bureau.data.credit_score) {
                return;
            }

            if (doc.y > 700) {
                doc.addPage();
            }

            doc.fillColor('#333333')
                .fontSize(14)
                .font('Helvetica-Bold')
                .text(bureau.name + ' Details', 70, doc.y);

            doc.moveDown(0.5);

            var details = [
                ['Credit Score:', bureau.data.credit_score],
                ['Grade:', bureau.data.grade || 'N/A'],
                ['Total Accounts:', (bureau.data.total_accounts || 0).toString()],
                ['Credit Utilization:', (bureau.data.credit_utilization || 0) + '%']
            ];

            details.forEach(function(row) {
                doc.fillColor('#666666')
                    .fontSize(10)
                    .font('Helvetica-Bold')
                    .text(row[0], 90, doc.y, { width: 150 });

                doc.fillColor('#333333')
                    .fontSize(10)
                    .font('Helvetica')
                    .text(row[1].toString(), 240, doc.y, { width: 300 });

                doc.moveDown(0.7);
            });

            doc.moveDown();
        });
    };

    // Add Footer
    MultiBureauPDFGenerator.prototype.addFooter = function(doc) {
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

    // API Endpoint
    app.get('/get/api/multi-bureau/generate-pdf', async function(req, res) {
        try {
            var { pan, mobile, email } = req.query;

            if (!pan && !mobile && !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide at least one identifier'
                });
            }

            var query = {};
            if (pan) query.pan = pan.toUpperCase();
            if (mobile) query.mobile = mobile;
            if (email) query.email = email.toLowerCase();

            var comparisonData = await MultiBureauComparisonModel.findOne(query)
                .sort({ comparison_date: -1 })
                .lean();

            if (!comparisonData) {
                return res.status(404).json({
                    success: false,
                    error: 'Multi-bureau comparison data not found'
                });
            }

            var outputDir = path.join(__dirname, '../../temp/pdf');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            var fileName = 'MultiBureau_Report_' + (pan || mobile || email) + '_' + Date.now() + '.pdf';
            var outputPath = path.join(outputDir, fileName);

            var generator = new MultiBureauPDFGenerator();
            generator.generateMultiBureauPDF(comparisonData, outputPath, function(error, filePath) {
                if (error) {
                    log('Error generating multi-bureau PDF:', error);
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to generate PDF',
                        details: process.env.NODE_ENV === 'development' ? error.message : undefined
                    });
                }

                res.download(filePath, fileName, function(downloadError) {
                    if (downloadError) {
                        log('Error downloading PDF:', downloadError);
                    }
                });
            });

        } catch (error) {
            log('Error in multi-bureau PDF generation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate PDF',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    module.exports = MultiBureauPDFGenerator;

})();

