// PDF Generator for CIBIL Reports
// Uses PDFKit for generating PDF reports
(function () {
    var PDFDocument = require('pdfkit');
    var fs = require('fs');
    var path = require('path');
    var puppeteer = require('puppeteer'); // Added for high-quality PDF generation

    function PDFGenerator() {
        this.fontsPath = path.join(__dirname, '../../assets/fonts');
    }

    // Generate CIBIL PDF Report - ENTERPRISE LEVEL with ALL ANALYSIS
    PDFGenerator.prototype.generateCIBILPDF = function (cibilData, outputPath, callback) {
        try {
            var doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'ASTROCRED Comprehensive Credit Analysis - ' + (cibilData.name || 'Report'),
                    Author: 'ASTROCRED - AI Credit Intelligence',
                    Subject: 'Complete Credit Report with Risk Assessment & Recommendations'
                }
            });

            var stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // PAGE 1: Header & Credit Score
            this.addHeader(doc, 'COMPREHENSIVE CREDIT ANALYSIS', cibilData.name);
            this.addCreditScoreSection(doc, cibilData);

            // Profile Information
            this.addProfileSection(doc, cibilData);

            // Credit Summary
            this.addCreditSummarySection(doc, cibilData);

            // PAGE 2: Accounts Section
            doc.addPage();
            this.addAccountsSection(doc, cibilData);

            // PAGE 3: Recommendations & Action Plan
            doc.addPage();
            this.addRecommendationsSection(doc, cibilData);
            
            // Note: Advanced sections (Risk Assessment, Component Scores, Payment Analysis, etc.)
            // are handled by the Puppeteer HTML template. This fallback PDF uses basic sections only.

            // Add footer to current page before ending
            this.addFooterToCurrentPage(doc);

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

    /**
     * Generate High-Quality PDF using Puppeteer and HTML Template
     * This restores the "earlier" PDF quality requested by the user
     */
    PDFGenerator.prototype.generatePuppeteerPDF = async function (cibilData, outputPath, callback) {
        try {
            // Load the comprehensive template
            var templatePath = path.join(__dirname, './pdf-template-comprehensive.js');
            var generateHTML = require(templatePath);

            // Ensure accounts array for template (from credit_report[0].accounts)
            var report0 = (cibilData.credit_report && cibilData.credit_report[0]) ? cibilData.credit_report[0] : {};
            if (!cibilData.accounts && report0.accounts && report0.accounts.length) {
                cibilData.accounts = report0.accounts.map(function (acc) {
                    var bal = parseFloat(acc.currentBalance) || parseFloat(acc.current_balance) || 0;
                    var overdue = parseFloat(acc.amountOverdue) || parseFloat(acc.overdue_amount) || 0;
                    var status = (acc.account_status || acc.status || (overdue > 0 ? 'Default' : 'ACTIVE'));
                    return {
                        accountNumber: acc.accountNumber || acc.account_number || acc.mask_account_number || 'N/A',
                        bank: acc.memberShortName || acc.member_name || acc.lender_name || acc.bank_name || 'Unknown',
                        type: acc.accountType || acc.account_type || acc.type || 'Other',
                        currentBalance: bal,
                        balance: bal,
                        amountOverdue: overdue,
                        overdue_amount: overdue,
                        status: status,
                        lastPaymentDate: acc.lastPaymentDate || acc.last_payment_date || null,
                        highCreditAmount: parseFloat(acc.highCreditAmount) || parseFloat(acc.high_credit_amount) || 0
                    };
                });
            }

            // Get analysis data if not present
            if (!cibilData.analysis) {
                try {
                    var GradingEngine = require('./api/grading-engine');
                    var AdvancedAnalytics = require('./api/analytics-engine-advance.js');
                    var RiskAssessment = require('./api/risk-assessment.js');
                    var params = new GradingEngine(cibilData);
                    var analytics = new AdvancedAnalytics(cibilData, params);
                    cibilData.analysis = analytics.generateComprehensiveReport();

                    // Add other analysis parts that the template might expect
                    cibilData.analysis.overallGrade = params.calculateOverallGrade();
                    var risk = new RiskAssessment(cibilData, params);
                    cibilData.analysis.riskReport = risk.generateRiskReport();
                } catch (e) {
                    console.log('Error generating analysis for PDF:', e);
                    // Proceed with partial data
                }
            }

            var analysis = cibilData.analysis || {};
            var accounts = cibilData.accounts || (cibilData.cibil_data && cibilData.cibil_data.accounts) || (report0.accounts || []);
            var enquiries = cibilData.enquiries || (cibilData.cibil_data && cibilData.cibil_data.enquiries) || (report0.enquiries || []);

            // Extract rich data from credit_report[0] for full PDF report
            var profileFromReport = {};
            if (report0.names && report0.names.length) {
                profileFromReport.names = report0.names;
                profileFromReport.primaryName = report0.names[0].name;
                profileFromReport.birthDate = report0.names[0].birthDate;
                profileFromReport.gender = report0.names[0].gender;
            }
            if (report0.ids && report0.ids.length) profileFromReport.ids = report0.ids;
            if (report0.telephones && report0.telephones.length) profileFromReport.telephones = report0.telephones;
            if (report0.emails && report0.emails.length) profileFromReport.emails = report0.emails;
            if (report0.employment && report0.employment.length) profileFromReport.employment = report0.employment;
            if (report0.addresses && report0.addresses.length) profileFromReport.addresses = report0.addresses;
            profileFromReport.controlNumber = report0.control_number;

            var reasonCodes = [];
            if (report0.scores && report0.scores[0] && report0.scores[0].reasonCodes && report0.scores[0].reasonCodes.length) {
                reasonCodes = report0.scores[0].reasonCodes;
            }

            var consumerSummary = {};
            if (report0.response && report0.response.consumerSummaryresp) {
                consumerSummary.accountSummary = report0.response.consumerSummaryresp.accountSummary || {};
                consumerSummary.inquirySummary = report0.response.consumerSummaryresp.inquirySummary || {};
            }

            var htmlContent = generateHTML({
                data: cibilData,
                grade: analysis.overallGrade || 'B',
                defaulters: analysis.defaulters || [],
                recommendations: analysis.recommendations || [],
                comprehensiveReport: analysis,
                riskReport: analysis.riskReport || {},
                improvementPlan: analysis.improvementPlan || {},
                bankSuggestions: analysis.bankSuggestions || [],
                creditUtilization: analysis.creditUtilization || 0,
                creditAge: analysis.creditAge || 0,
                paymentAnalysis: analysis.paymentAnalysis || {},
                componentScores: analysis.componentScores || {},
                riskDetails: analysis.riskDetails || {},
                accounts: accounts,
                enquiries: enquiries,
                profileFromReport: profileFromReport,
                reasonCodes: reasonCodes,
                consumerSummary: consumerSummary
            });

            // Launch Puppeteer
            var launchOptions = {
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
            };

            var browser = await puppeteer.launch(launchOptions);
            var page = await browser.newPage();

            // Set content and wait for network idle to ensure fonts/images load
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            // Generate PDF
            var pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '10mm',
                    right: '10mm',
                    bottom: '10mm',
                    left: '10mm'
                }
            });

            await browser.close();

            // Write to file
            fs.writeFileSync(outputPath, pdfBuffer);
            callback(null, outputPath);

        } catch (error) {
            console.error('Puppeteer PDF Generation Error:', error);
            // Fallback to PDFKit if Puppeteer fails
            console.log('Falling back to basic PDF generator...');
            this.generateCIBILPDF(cibilData, outputPath, callback);
        }
    };

    // Add Header
    PDFGenerator.prototype.addHeader = function (doc, title, name) {
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

    // Add Credit Score Section - Enhanced with better formatting
    PDFGenerator.prototype.addCreditScoreSection = function (doc, cibilData) {
        var y = doc.y;
        var score = parseInt(cibilData.credit_score) || 0;
        var grade = cibilData.analysis && cibilData.analysis.overallGrade ?
            (typeof cibilData.analysis.overallGrade === 'object' ? cibilData.analysis.overallGrade.grade : cibilData.analysis.overallGrade) : 'C';

        // Enhanced Score Box with gradient effect (simulated)
        doc.rect(50, y, 495, 120)
            .fillColor('#f8f9fa')
            .fill()
            .strokeColor('#1c1fbe')
            .lineWidth(3)
            .stroke();

        // Score display - larger and more prominent
        var scoreColor = this.getScoreColor(score);
        doc.fillColor(scoreColor)
            .fontSize(56)
            .font('Helvetica-Bold')
            .text(score.toString(), 80, y + 25);

        doc.fillColor('#666666')
            .fontSize(18)
            .font('Helvetica')
            .text('/ 900', 180, y + 50);

        // Grade badge
        doc.rect(350, y + 20, 150, 40)
            .fillColor(this.getGradeColor(grade))
            .fill()
            .strokeColor('#333333')
            .lineWidth(1)
            .stroke();

        doc.fillColor('#ffffff')
            .fontSize(20)
            .font('Helvetica-Bold')
            .text('Grade: ' + grade, 355, y + 35, { width: 140, align: 'center' });

        // Score range and interpretation
        var scoreRange = this.getScoreRange(score);
        doc.fillColor('#333333')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Credit Score', 350, y + 70);

        doc.fillColor('#666666')
            .fontSize(11)
            .font('Helvetica')
            .text(scoreRange, 350, y + 85, { width: 145 });

        // Risk level indicator
        var riskLevel = this.getRiskLevel(score);
        doc.fillColor(this.getRiskColor(riskLevel))
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Risk: ' + riskLevel.toUpperCase(), 350, y + 100, { width: 145 });

        doc.y = y + 130;
        doc.moveDown();
    };

    // Helper: Get score color based on value
    PDFGenerator.prototype.getScoreColor = function (score) {
        if (score >= 750) return '#28a745'; // Green
        if (score >= 700) return '#4CAF50'; // Light green
        if (score >= 650) return '#8bc34a'; // Yellow-green
        if (score >= 600) return '#ffc107'; // Yellow
        if (score >= 550) return '#ff9800'; // Orange
        return '#dc3545'; // Red
    };

    // Helper: Get grade color
    PDFGenerator.prototype.getGradeColor = function (grade) {
        var gradeColors = {
            'A+': '#28a745',
            'A': '#4CAF50',
            'B+': '#8bc34a',
            'B': '#ffc107',
            'C+': '#ff9800',
            'C': '#ff5722',
            'D+': '#f44336',
            'D': '#dc3545'
        };
        return gradeColors[grade] || '#666666';
    };

    // Helper: Get risk level
    PDFGenerator.prototype.getRiskLevel = function (score) {
        if (score >= 750) return 'Low';
        if (score >= 700) return 'Low-Medium';
        if (score >= 650) return 'Medium';
        if (score >= 600) return 'Medium-High';
        if (score >= 550) return 'High';
        return 'Very High';
    };

    // Helper: Get risk color
    PDFGenerator.prototype.getRiskColor = function (riskLevel) {
        var riskColors = {
            'Low': '#28a745',
            'Low-Medium': '#4CAF50',
            'Medium': '#ffc107',
            'Medium-High': '#ff9800',
            'High': '#ff5722',
            'Very High': '#dc3545'
        };
        return riskColors[riskLevel] || '#666666';
    };

    // Add Profile Section
    PDFGenerator.prototype.addProfileSection = function (doc, cibilData) {
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

        profileData.forEach(function (row) {
            // Enhanced profile row with better contrast
            var rowY = doc.y;
            doc.fillColor('#1c1fbe')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text(row[0], 70, rowY, { width: 150 });

            doc.fillColor('#212529')
                .fontSize(11)
                .font('Helvetica')
                .text(row[1] || 'N/A', 220, rowY, { width: 300 });

            doc.moveDown(0.8);
        });

        doc.moveDown();
    };

    // Add Credit Summary Section
    PDFGenerator.prototype.addCreditSummarySection = function (doc, cibilData) {
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

        summaryData.forEach(function (row) {
            // Enhanced summary row with better visibility
            var rowY = doc.y;
            doc.fillColor('#1c1fbe')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text(row[0], 70, rowY, { width: 200 });

            doc.fillColor('#212529')
                .fontSize(11)
                .font('Helvetica')
                .text(row[1] || 'N/A', 270, rowY, { width: 200 });

            doc.moveDown(0.8);
        });

        doc.moveDown();
    };

    // Add Accounts Section
    PDFGenerator.prototype.addAccountsSection = function (doc, cibilData) {
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
        accounts.slice(0, 15).forEach(function (account, index) {
            if (doc.y > 750) {
                doc.addPage();
                doc.y = 50;
            }

            var rowY = doc.y;
            var bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            doc.fillColor(bgColor)
                .rect(50, rowY, 495, 20)
                .fill();

            doc.fillColor('#212529')
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
    PDFGenerator.prototype.addRecommendationsSection = function (doc, cibilData) {
        if (doc.y > 700) {
            doc.addPage();
        }

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Recommendations', 50, doc.y);

        doc.moveDown(0.5);

        // Handle recommendations - ensure it's an array
        var recommendations = [];
        if (cibilData.analysis && cibilData.analysis.recommendations) {
            if (Array.isArray(cibilData.analysis.recommendations)) {
                recommendations = cibilData.analysis.recommendations.slice(0, 5);
            } else if (typeof cibilData.analysis.recommendations === 'string') {
                recommendations = [cibilData.analysis.recommendations];
            } else if (typeof cibilData.analysis.recommendations === 'object') {
                // Try to extract array from object
                recommendations = cibilData.analysis.recommendations.items ||
                    cibilData.analysis.recommendations.list ||
                    Object.values(cibilData.analysis.recommendations).slice(0, 5);
            }
        }

        if (!Array.isArray(recommendations) || recommendations.length === 0) {
            doc.fillColor('#666666')
                .fontSize(11)
                .font('Helvetica')
                .text('No specific recommendations available.', 70, doc.y);
            doc.moveDown();
            return;
        }

        recommendations.forEach(function (rec, index) {
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

    // Add Footer to current page (safe method that doesn't switch pages)
    PDFGenerator.prototype.addFooterToCurrentPage = function (doc) {
        try {
            var currentY = doc.y;
            var pageHeight = doc.page.height;

            // Move to bottom of page if not already there
            if (currentY < pageHeight - 50) {
                doc.y = pageHeight - 50;
            }

            doc.fillColor('#999999')
                .fontSize(8)
                .font('Helvetica')
                .text('Generated by ASTROCRED - ' + new Date().toLocaleDateString(),
                    50, doc.y, { align: 'center', width: doc.page.width - 100 });
            doc.text('Page 1',
                50, doc.y + 10, { align: 'center', width: doc.page.width - 100 });
        } catch (error) {
            // Footer is optional, don't fail PDF generation
            console.error('Error adding footer:', error.message);
        }
    };

    // Add Footer - Legacy method, now just adds footer to current page
    PDFGenerator.prototype.addFooter = function (doc) {
        this.addFooterToCurrentPage(doc);
    };

    // Helper Methods
    PDFGenerator.prototype.getScoreRange = function (score) {
        if (score >= 800) return 'Excellent Credit History';
        if (score >= 750) return 'Very Good Credit History';
        if (score >= 700) return 'Good Credit History';
        if (score >= 650) return 'Fair Credit History';
        if (score >= 550) return 'Poor Credit History';
        return 'Very Poor Credit History';
    };

    PDFGenerator.prototype.calculateUtilization = function (accounts) {
        var totalLimit = 0;
        var totalBalance = 0;
        accounts.forEach(function (acc) {
            totalLimit += acc.highCreditAmount || 0;
            totalBalance += acc.currentBalance || 0;
        });
        return totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
    };

    PDFGenerator.prototype.getPaymentHistorySummary = function (accounts) {
        if (!accounts || accounts.length === 0) return 'No payment history available';

        var totalPayments = 0;
        var onTimePayments = 0;
        var delayedPayments = 0;
        var missedPayments = 0;

        accounts.forEach(function (account) {
            var paymentHistory = account.paymentHistory || '';
            var monthlyPayStatus = account.monthlyPayStatus || [];

            if (Array.isArray(monthlyPayStatus) && monthlyPayStatus.length > 0) {
                monthlyPayStatus.forEach(function (payment) {
                    totalPayments++;
                    var status = String(payment.status || '').toUpperCase();
                    if (['0', '00', '000', 'C', 'CUR'].includes(status)) {
                        onTimePayments++;
                    } else if (['1', '01', '001', '2', '02', '002'].includes(status)) {
                        delayedPayments++;
                    } else if (['3', '03', '003', '4', '04', '004', '5', '05', '005', '8', '9', 'D', 'W'].includes(status)) {
                        missedPayments++;
                    }
                });
            } else if (paymentHistory && paymentHistory.length > 0) {
                for (var i = 0; i < Math.min(36, paymentHistory.length); i++) {
                    totalPayments++;
                    var statusCode = String(paymentHistory.charAt(i)).toUpperCase();
                    if (['0', '00', '000', 'C', 'CUR'].includes(statusCode)) {
                        onTimePayments++;
                    } else if (['1', '01', '001', '2', '02', '002'].includes(statusCode)) {
                        delayedPayments++;
                    } else if (['3', '03', '003', '4', '04', '004', '5', '05', '005', '8', '9', 'D', 'W'].includes(statusCode)) {
                        missedPayments++;
                    }
                }
            }
        });

        if (totalPayments === 0) return 'No payment history available';

        var onTimePercent = Math.round((onTimePayments / totalPayments) * 100);

        if (onTimePercent >= 90) return onTimePercent + '% On-time (Excellent)';
        if (onTimePercent >= 80) return onTimePercent + '% On-time (Good)';
        if (onTimePercent >= 70) return onTimePercent + '% On-time (Fair)';
        if (onTimePercent >= 60) return onTimePercent + '% On-time (Poor)';
        return onTimePercent + '% On-time (Very Poor)';
    };

    // ============== ROADMAP PDF GENERATOR ==============

    PDFGenerator.prototype.generateRoadmapPDF = function (roadmapData, cibilData, outputPath, callback) {
        try {
            var doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'Credit Improvement Roadmap - ' + (cibilData.name || 'Report'),
                    Author: 'ASTROCRED',
                    Subject: 'Credit Score Improvement Plan'
                }
            });

            var stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // Header
            this.addHeader(doc, roadmapData.timeline_months + '-Month Credit Improvement Roadmap', cibilData.name);

            // Current Status
            this.addRoadmapCurrentStatus(doc, cibilData, roadmapData);

            // Phases Overview
            this.addRoadmapPhases(doc, roadmapData);

            // Monthly Plan
            this.addRoadmapMonthlyPlan(doc, roadmapData);

            // Milestones
            this.addRoadmapMilestones(doc, roadmapData);

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

    PDFGenerator.prototype.addRoadmapCurrentStatus = function (doc, cibilData, roadmapData) {
        var y = doc.y;
        var currentScore = parseInt(cibilData.credit_score) || 0;
        var targetScore = roadmapData.target_score || currentScore + 100;

        doc.rect(50, y, 495, 80)
            .fillColor('#f0f8ff')
            .fill()
            .strokeColor('#1c1fbe')
            .lineWidth(2)
            .stroke();

        doc.fillColor('#1c1fbe')
            .fontSize(36)
            .font('Helvetica-Bold')
            .text(currentScore.toString(), 80, y + 15);

        doc.fontSize(14)
            .text('Current', 80, y + 55);

        doc.fillColor('#28a745')
            .fontSize(24)
            .text('→', 180, y + 25);

        doc.fillColor('#28a745')
            .fontSize(36)
            .font('Helvetica-Bold')
            .text(targetScore.toString(), 220, y + 15);

        doc.fontSize(14)
            .text('Target (' + roadmapData.timeline_months + ' months)', 220, y + 55);

        var improvement = targetScore - currentScore;
        doc.fillColor('#333333')
            .fontSize(16)
            .text('+' + improvement + ' points improvement goal', 350, y + 30);

        doc.y = y + 100;
        doc.moveDown();
    };

    PDFGenerator.prototype.addRoadmapPhases = function (doc, roadmapData) {
        if (!roadmapData.phases || roadmapData.phases.length === 0) return;

        if (doc.y > 650) doc.addPage();

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Improvement Phases', 50, doc.y);

        doc.moveDown(0.5);

        var phases = roadmapData.phases || [];
        phases.forEach(function (phase, index) {
            if (doc.y > 700) {
                doc.addPage();
                doc.y = 50;
            }

            var phaseY = doc.y;
            var phaseColor = index === 0 ? '#e74c3c' : (index === 1 ? '#f39c12' : '#27ae60');

            // Phase box
            doc.rect(50, phaseY, 495, 60)
                .fillColor('#f8f9fa')
                .fill();

            // Phase indicator
            doc.rect(50, phaseY, 8, 60)
                .fillColor(phaseColor)
                .fill();

            doc.fillColor('#333333')
                .fontSize(14)
                .font('Helvetica-Bold')
                .text('Phase ' + (index + 1) + ': ' + (phase.name || 'Action Phase'), 70, phaseY + 10);

            doc.fontSize(11)
                .font('Helvetica')
                .text('Duration: ' + (phase.duration_months || 'N/A') + ' months', 70, phaseY + 30);

            if (phase.target_score) {
                doc.text('Target Score: ' + phase.target_score, 250, phaseY + 30);
            }

            doc.y = phaseY + 70;
        });

        doc.moveDown();
    };

    PDFGenerator.prototype.addRoadmapMonthlyPlan = function (doc, roadmapData) {
        if (!roadmapData.phases) return;

        if (doc.y > 600) doc.addPage();

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Monthly Action Plan', 50, doc.y);

        doc.moveDown(0.5);

        var self = this;
        roadmapData.phases.forEach(function (phase) {
            if (!phase.monthly_plan) return;

            phase.monthly_plan.forEach(function (month) {
                if (doc.y > 720) {
                    doc.addPage();
                    doc.y = 50;
                }

                doc.fillColor('#1c1fbe')
                    .fontSize(12)
                    .font('Helvetica-Bold')
                    .text('Month ' + month.month, 70, doc.y);

                doc.moveDown(0.3);

                var tasks = month.tasks || [];
                tasks.slice(0, 3).forEach(function (task) {
                    doc.fillColor('#333333')
                        .fontSize(10)
                        .font('Helvetica')
                        .text('• ' + (typeof task === 'string' ? task : task.description || 'Action item'), 90, doc.y, { width: 440 });
                    doc.moveDown(0.5);
                });

                doc.moveDown(0.5);
            });
        });

        doc.moveDown();
    };

    PDFGenerator.prototype.addRoadmapMilestones = function (doc, roadmapData) {
        if (!roadmapData.milestones || roadmapData.milestones.length === 0) return;

        if (doc.y > 650) doc.addPage();

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Key Milestones', 50, doc.y);

        doc.moveDown(0.5);

        roadmapData.milestones.forEach(function (milestone, index) {
            if (doc.y > 750) {
                doc.addPage();
                doc.y = 50;
            }

            doc.fillColor('#28a745')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('✓ ' + (milestone.title || 'Milestone ' + (index + 1)), 70, doc.y);

            if (milestone.description) {
                doc.fillColor('#666666')
                    .fontSize(10)
                    .font('Helvetica')
                    .text(milestone.description, 90, doc.y);
            }

            doc.moveDown(0.8);
        });
    };

    // ============== SCORE SIMULATION PDF GENERATOR ==============

    PDFGenerator.prototype.generateSimulationPDF = function (simulationData, cibilData, outputPath, callback) {
        try {
            var doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'Credit Score Simulation - ' + (cibilData.name || 'Report'),
                    Author: 'ASTROCRED',
                    Subject: 'What-If Score Analysis'
                }
            });

            var stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            this.addHeader(doc, 'Credit Score Simulation Report', cibilData.name);

            // Current Status
            this.addSimulationCurrentStatus(doc, cibilData, simulationData);

            // Scenarios
            this.addSimulationScenarios(doc, simulationData);

            // Projections
            this.addSimulationProjections(doc, simulationData);

            // Recommendations
            if (simulationData.recommendations) {
                this.addSimulationRecommendations(doc, simulationData);
            }

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

    PDFGenerator.prototype.addSimulationCurrentStatus = function (doc, cibilData, simulationData) {
        var y = doc.y;
        var currentScore = parseInt(cibilData.credit_score) || 0;

        doc.rect(50, y, 495, 70)
            .fillColor('#fff8e1')
            .fill()
            .strokeColor('#ffc107')
            .lineWidth(2)
            .stroke();

        doc.fillColor('#333333')
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('Current Credit Score', 70, y + 15);

        doc.fillColor('#1c1fbe')
            .fontSize(36)
            .font('Helvetica-Bold')
            .text(currentScore.toString(), 70, y + 35);

        doc.fillColor('#666666')
            .fontSize(12)
            .font('Helvetica')
            .text('Simulation Date: ' + new Date().toLocaleDateString(), 300, y + 25);

        doc.y = y + 90;
        doc.moveDown();
    };

    PDFGenerator.prototype.addSimulationScenarios = function (doc, simulationData) {
        if (!simulationData.scenarios) return;

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('What-If Scenarios', 50, doc.y);

        doc.moveDown(0.5);

        var scenarios = simulationData.scenarios || [];
        scenarios.forEach(function (scenario, index) {
            if (doc.y > 700) {
                doc.addPage();
                doc.y = 50;
            }

            var scenarioY = doc.y;
            var impactColor = scenario.impact > 0 ? '#28a745' : (scenario.impact < 0 ? '#dc3545' : '#6c757d');

            doc.rect(50, scenarioY, 495, 50)
                .fillColor(index % 2 === 0 ? '#f8f9fa' : '#ffffff')
                .fill();

            doc.fillColor('#333333')
                .fontSize(12)
                .font('Helvetica-Bold')
                .text(scenario.name || 'Scenario ' + (index + 1), 60, scenarioY + 10);

            doc.fontSize(10)
                .font('Helvetica')
                .text(scenario.description || '', 60, scenarioY + 28, { width: 350 });

            doc.fillColor(impactColor)
                .fontSize(16)
                .font('Helvetica-Bold')
                .text((scenario.impact > 0 ? '+' : '') + (scenario.impact || 0) + ' pts', 450, scenarioY + 15);

            doc.y = scenarioY + 55;
        });

        doc.moveDown();
    };

    PDFGenerator.prototype.addSimulationProjections = function (doc, simulationData) {
        if (!simulationData.projections) return;

        if (doc.y > 600) doc.addPage();

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('6-Month Projections', 50, doc.y);

        doc.moveDown(0.5);

        var projections = simulationData.projections || [];

        // Table header
        var headerY = doc.y;
        doc.fillColor('#f8f9fa')
            .rect(50, headerY, 495, 25)
            .fill();

        doc.fillColor('#333333')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Month', 60, headerY + 8)
            .text('Optimistic', 150, headerY + 8)
            .text('Expected', 280, headerY + 8)
            .text('Pessimistic', 410, headerY + 8);

        doc.y = headerY + 30;

        projections.slice(0, 6).forEach(function (proj, index) {
            var rowY = doc.y;

            doc.fillColor('#333333')
                .fontSize(10)
                .font('Helvetica')
                .text('Month ' + (index + 1), 60, rowY)
                .text((proj.optimistic || proj.high || '-').toString(), 150, rowY)
                .text((proj.expected || proj.mid || '-').toString(), 280, rowY)
                .text((proj.pessimistic || proj.low || '-').toString(), 410, rowY);

            doc.y = rowY + 20;
        });

        doc.moveDown();
    };

    PDFGenerator.prototype.addSimulationRecommendations = function (doc, simulationData) {
        if (doc.y > 650) doc.addPage();

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Recommended Actions', 50, doc.y);

        doc.moveDown(0.5);

        var recommendations = simulationData.recommendations || [];
        recommendations.slice(0, 5).forEach(function (rec, index) {
            if (doc.y > 750) {
                doc.addPage();
                doc.y = 50;
            }

            doc.fillColor('#333333')
                .fontSize(11)
                .font('Helvetica')
                .text((index + 1) + '. ' + (typeof rec === 'string' ? rec : rec.description || rec.title || ''), 70, doc.y, { width: 455 });

            doc.moveDown(0.8);
        });
    };

    // ============== ML PREDICTION PDF GENERATOR ==============

    PDFGenerator.prototype.generatePredictionPDF = function (predictionData, cibilData, outputPath, callback) {
        try {
            var doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'ML Credit Score Prediction - ' + (cibilData.name || 'Report'),
                    Author: 'ASTROCRED',
                    Subject: 'AI-Powered Score Prediction'
                }
            });

            var stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            this.addHeader(doc, 'AI-Powered Credit Score Prediction', cibilData.name);

            // Current vs Predicted
            this.addPredictionSummary(doc, cibilData, predictionData);

            // Confidence Intervals
            this.addPredictionConfidence(doc, predictionData);

            // Key Factors
            this.addPredictionFactors(doc, predictionData);

            // Recommendations
            if (predictionData.recommendations) {
                this.addPredictionRecommendations(doc, predictionData);
            }

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

    PDFGenerator.prototype.addPredictionSummary = function (doc, cibilData, predictionData) {
        var y = doc.y;
        var currentScore = parseInt(cibilData.credit_score) || 0;
        var predictedScore = predictionData.sixMonthPrediction || predictionData.predicted_score || currentScore;

        doc.rect(50, y, 495, 90)
            .fillColor('#e8f5e9')
            .fill()
            .strokeColor('#4caf50')
            .lineWidth(2)
            .stroke();

        doc.fillColor('#333333')
            .fontSize(12)
            .font('Helvetica')
            .text('Current Score', 80, y + 15);

        doc.fillColor('#1c1fbe')
            .fontSize(32)
            .font('Helvetica-Bold')
            .text(currentScore.toString(), 80, y + 35);

        doc.fillColor('#28a745')
            .fontSize(24)
            .text('→', 180, y + 40);

        doc.fillColor('#333333')
            .fontSize(12)
            .font('Helvetica')
            .text('6-Month Prediction', 220, y + 15);

        doc.fillColor('#28a745')
            .fontSize(32)
            .font('Helvetica-Bold')
            .text(Math.round(predictedScore).toString(), 220, y + 35);

        var confidence = predictionData.confidence || 85;
        doc.fillColor('#666666')
            .fontSize(11)
            .font('Helvetica')
            .text('Confidence: ' + confidence + '%', 380, y + 35);

        doc.y = y + 110;
        doc.moveDown();
    };

    PDFGenerator.prototype.addPredictionConfidence = function (doc, predictionData) {
        if (!predictionData.monthlyPredictions && !predictionData.projections) return;

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Monthly Prediction Breakdown', 50, doc.y);

        doc.moveDown(0.5);

        var predictions = predictionData.monthlyPredictions || predictionData.projections || [];

        predictions.slice(0, 6).forEach(function (pred, index) {
            if (doc.y > 720) {
                doc.addPage();
                doc.y = 50;
            }

            var rowY = doc.y;
            var score = pred.predicted || pred.expected || pred.score || 0;
            var range = pred.range || { low: score - 20, high: score + 20 };

            doc.fillColor('#333333')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('Month ' + (index + 1), 70, rowY);

            doc.font('Helvetica')
                .text('Predicted: ' + Math.round(score), 150, rowY);

            doc.fillColor('#666666')
                .text('Range: ' + Math.round(range.low || range.min || score - 20) + ' - ' + Math.round(range.high || range.max || score + 20), 280, rowY);

            doc.y = rowY + 22;
        });

        doc.moveDown();
    };

    PDFGenerator.prototype.addPredictionFactors = function (doc, predictionData) {
        if (!predictionData.factors && !predictionData.improvementFactors) return;

        if (doc.y > 600) doc.addPage();

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Key Improvement Factors', 50, doc.y);

        doc.moveDown(0.5);

        var factors = predictionData.factors || predictionData.improvementFactors || [];
        factors.slice(0, 5).forEach(function (factor, index) {
            if (doc.y > 750) {
                doc.addPage();
                doc.y = 50;
            }

            var factorName = typeof factor === 'string' ? factor : (factor.name || factor.factor || 'Factor');
            var impact = factor.impact || factor.potentialGain || '';

            doc.fillColor('#333333')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text((index + 1) + '. ' + factorName, 70, doc.y);

            if (impact) {
                doc.fillColor('#28a745')
                    .font('Helvetica')
                    .text(' (+' + impact + ' pts potential)', 70 + doc.widthOfString((index + 1) + '. ' + factorName) + 5, doc.y);
            }

            doc.moveDown(0.8);
        });
    };

    PDFGenerator.prototype.addPredictionRecommendations = function (doc, predictionData) {
        if (doc.y > 650) doc.addPage();

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('AI Recommendations', 50, doc.y);

        doc.moveDown(0.5);

        var recommendations = predictionData.recommendations || [];
        recommendations.slice(0, 5).forEach(function (rec, index) {
            doc.fillColor('#333333')
                .fontSize(11)
                .font('Helvetica')
                .text((index + 1) + '. ' + (typeof rec === 'string' ? rec : rec.description || rec.action || ''), 70, doc.y, { width: 455 });
            doc.moveDown(0.8);
        });
    };

    // ============== RISK ASSESSMENT PDF GENERATOR ==============

    PDFGenerator.prototype.generateRiskAssessmentPDF = function (riskData, cibilData, outputPath, callback) {
        try {
            var doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'Risk Assessment Report - ' + (cibilData.name || 'Report'),
                    Author: 'ASTROCRED',
                    Subject: 'Credit Risk Analysis'
                }
            });

            var stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            this.addHeader(doc, 'Credit Risk Assessment Report', cibilData.name);

            // Overall Risk
            this.addRiskOverview(doc, cibilData, riskData);

            // Risk Factors
            this.addRiskFactors(doc, riskData);

            // Risk Breakdown
            this.addRiskBreakdown(doc, riskData);

            // Mitigation Strategies
            this.addRiskMitigation(doc, riskData);

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

    PDFGenerator.prototype.addRiskOverview = function (doc, cibilData, riskData) {
        var y = doc.y;
        var riskLevel = riskData.overall_risk || riskData.riskLevel || 'Medium';
        var riskScore = riskData.risk_score || riskData.defaultProbability || 25;

        var riskColor = riskLevel.toLowerCase() === 'low' ? '#28a745' :
            (riskLevel.toLowerCase() === 'high' ? '#dc3545' : '#ffc107');

        doc.rect(50, y, 495, 80)
            .fillColor(riskLevel.toLowerCase() === 'low' ? '#e8f5e9' :
                (riskLevel.toLowerCase() === 'high' ? '#ffebee' : '#fff8e1'))
            .fill()
            .strokeColor(riskColor)
            .lineWidth(2)
            .stroke();

        doc.fillColor('#333333')
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('Overall Risk Level', 80, y + 15);

        doc.fillColor(riskColor)
            .fontSize(28)
            .font('Helvetica-Bold')
            .text(riskLevel.toUpperCase(), 80, y + 38);

        doc.fillColor('#333333')
            .fontSize(12)
            .font('Helvetica')
            .text('Default Probability: ' + riskScore + '%', 280, y + 28);

        doc.fillColor('#666666')
            .text('Credit Score: ' + (cibilData.credit_score || 'N/A'), 280, y + 48);

        doc.y = y + 100;
        doc.moveDown();
    };

    PDFGenerator.prototype.addRiskFactors = function (doc, riskData) {
        if (!riskData.factors && !riskData.riskFactors) return;

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Risk Factors', 50, doc.y);

        doc.moveDown(0.5);

        var factors = riskData.factors || riskData.riskFactors || [];
        factors.slice(0, 6).forEach(function (factor, index) {
            if (doc.y > 700) {
                doc.addPage();
                doc.y = 50;
            }

            var factorY = doc.y;
            var severity = factor.severity || factor.weight || 'medium';
            var severityColor = severity.toLowerCase() === 'low' ? '#28a745' :
                (severity.toLowerCase() === 'high' ? '#dc3545' : '#ffc107');

            doc.rect(50, factorY, 495, 40)
                .fillColor('#f8f9fa')
                .fill();

            doc.rect(50, factorY, 6, 40)
                .fillColor(severityColor)
                .fill();

            doc.fillColor('#333333')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text(factor.name || factor.category || 'Risk Factor', 65, factorY + 8);

            doc.fontSize(10)
                .font('Helvetica')
                .text(factor.description || factor.impact || '', 65, factorY + 24, { width: 400 });

            doc.fillColor(severityColor)
                .fontSize(10)
                .font('Helvetica-Bold')
                .text(severity.toUpperCase(), 480, factorY + 15);

            doc.y = factorY + 45;
        });

        doc.moveDown();
    };

    PDFGenerator.prototype.addRiskBreakdown = function (doc, riskData) {
        if (!riskData.breakdown && !riskData.categoryRisks) return;

        if (doc.y > 600) doc.addPage();

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Risk Category Breakdown', 50, doc.y);

        doc.moveDown(0.5);

        var breakdown = riskData.breakdown || riskData.categoryRisks || {};
        Object.keys(breakdown).slice(0, 5).forEach(function (category) {
            var value = breakdown[category];
            var percentage = typeof value === 'object' ? (value.score || value.percentage || 0) : value;

            doc.fillColor('#333333')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text(category.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); }), 70, doc.y);

            doc.font('Helvetica')
                .text(percentage + '%', 400, doc.y);

            doc.moveDown(0.8);
        });
    };

    PDFGenerator.prototype.addRiskMitigation = function (doc, riskData) {
        if (!riskData.mitigation && !riskData.recommendations) return;

        if (doc.y > 650) doc.addPage();

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Risk Mitigation Strategies', 50, doc.y);

        doc.moveDown(0.5);

        var strategies = riskData.mitigation || riskData.recommendations || [];
        strategies.slice(0, 5).forEach(function (strategy, index) {
            doc.fillColor('#28a745')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('✓', 70, doc.y);

            doc.fillColor('#333333')
                .font('Helvetica')
                .text(typeof strategy === 'string' ? strategy : (strategy.action || strategy.description || ''), 90, doc.y, { width: 440 });

            doc.moveDown(0.8);
        });
    };

    // ============== LOAN PROBABILITY PDF GENERATOR ==============

    PDFGenerator.prototype.generateLoanProbabilityPDF = function (loanData, cibilData, outputPath, callback) {
        try {
            var doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'Loan Approval Probability - ' + (cibilData.name || 'Report'),
                    Author: 'ASTROCRED',
                    Subject: 'Loan Eligibility Analysis'
                }
            });

            var stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            this.addHeader(doc, 'Loan Approval Probability Report', cibilData.name);

            // Loan Request Details
            this.addLoanRequestDetails(doc, loanData);

            // Approval Probability
            this.addApprovalProbability(doc, loanData);

            // Eligible Banks
            this.addEligibleBanks(doc, loanData);

            // Recommendations
            this.addLoanRecommendations(doc, loanData);

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

    PDFGenerator.prototype.addLoanRequestDetails = function (doc, loanData) {
        var y = doc.y;

        doc.rect(50, y, 495, 70)
            .fillColor('#e3f2fd')
            .fill()
            .strokeColor('#2196f3')
            .lineWidth(2)
            .stroke();

        doc.fillColor('#333333')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Loan Request Details', 70, y + 15);

        doc.fontSize(11)
            .font('Helvetica')
            .text('Loan Type: ' + (loanData.loanType || 'Personal Loan'), 70, y + 35)
            .text('Amount: ₹' + (loanData.amount || 0).toLocaleString('en-IN'), 250, y + 35)
            .text('Tenure: ' + (loanData.tenure || 36) + ' months', 420, y + 35);

        doc.y = y + 90;
        doc.moveDown();
    };

    PDFGenerator.prototype.addApprovalProbability = function (doc, loanData) {
        var y = doc.y;
        var probability = loanData.approval_probability || loanData.probability || 75;
        var probColor = probability >= 70 ? '#28a745' : (probability >= 40 ? '#ffc107' : '#dc3545');

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Approval Probability', 50, y);

        y += 30;

        doc.rect(50, y, 495, 60)
            .fillColor('#f8f9fa')
            .fill();

        doc.fillColor(probColor)
            .fontSize(48)
            .font('Helvetica-Bold')
            .text(probability + '%', 80, y + 10);

        var status = probability >= 70 ? 'HIGH CHANCE' : (probability >= 40 ? 'MODERATE CHANCE' : 'LOW CHANCE');
        doc.fontSize(16)
            .text(status, 250, y + 20);

        doc.y = y + 80;
        doc.moveDown();
    };

    PDFGenerator.prototype.addEligibleBanks = function (doc, loanData) {
        if (!loanData.eligible_banks && !loanData.banks) return;

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Eligible Lenders', 50, doc.y);

        doc.moveDown(0.5);

        var banks = loanData.eligible_banks || loanData.banks || [];
        banks.slice(0, 8).forEach(function (bank, index) {
            if (doc.y > 720) {
                doc.addPage();
                doc.y = 50;
            }

            var bankName = typeof bank === 'string' ? bank : (bank.name || bank.bank || 'Lender');
            var rate = bank.interestRate || bank.rate || '';
            var probability = bank.approvalChance || bank.probability || '';

            doc.fillColor('#333333')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text((index + 1) + '. ' + bankName, 70, doc.y);

            if (rate) {
                doc.font('Helvetica')
                    .text('Rate: ' + rate + '%', 300, doc.y);
            }

            if (probability) {
                doc.fillColor('#28a745')
                    .text('Prob: ' + probability + '%', 420, doc.y);
            }

            doc.moveDown(0.8);
        });

        doc.moveDown();
    };

    PDFGenerator.prototype.addLoanRecommendations = function (doc, loanData) {
        if (!loanData.recommendations) return;

        if (doc.y > 650) doc.addPage();

        doc.fillColor('#1c1fbe')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Recommendations to Improve Approval Chances', 50, doc.y);

        doc.moveDown(0.5);

        var recommendations = loanData.recommendations || [];
        recommendations.slice(0, 5).forEach(function (rec, index) {
            doc.fillColor('#333333')
                .fontSize(11)
                .font('Helvetica')
                .text((index + 1) + '. ' + (typeof rec === 'string' ? rec : rec.description || ''), 70, doc.y, { width: 455 });
            doc.moveDown(0.8);
        });
    };

    var pdfGenerator = new PDFGenerator();

    // ============== API ENDPOINTS ==============

    // Get CIBIL PDF Report – uses resolver (DB + hydrate from cache). No sample data for real users.
    app.get('/get/api/cibil/generate-pdf', async function (req, res) {
        try {
            var fs = require('fs');
            var { pan, mobile, email } = req.query;
            var getCibilForUser = require('./api/cibil-data-resolver.js').getCibilForUser;

            if (!pan && !mobile && !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Provide at least one identifier: pan, mobile, or email'
                });
            }

            var cibilData = await getCibilForUser({ pan: pan || '', mobile: mobile || '', email: email || '' });
            if (!cibilData) {
                return res.status(404).json({
                    success: false,
                    error: 'No CIBIL report found. Fetch your CIBIL report from the dashboard first.'
                });
            }

            var outputDir = path.join(__dirname, '../../temp/pdf');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            var fileName = 'CIBIL_Report_' + (pan || mobile || email || cibilData.pan || cibilData.pan_number || 'report') + '_' + Date.now() + '.pdf';
            var outputPath = path.join(outputDir, fileName);

            // Use Puppeteer Generator for high quality
            pdfGenerator.generatePuppeteerPDF(cibilData, outputPath, function (error, filePath) {
                if (error) {
                    console.error('Error generating CIBIL PDF:', error);
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
            console.error('Error in CIBIL PDF generation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate PDF',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get ASTROCRED Analysis PDF Report – uses resolver (DB + hydrate from cache). No sample for real users.
    app.get('/get/api/cibil/astrocred-report-pdf', async function (req, res) {
        try {
            var fs = require('fs');
            var { pan, mobile, email } = req.query;
            var getCibilForUser = require('./api/cibil-data-resolver.js').getCibilForUser;
            var AdvancedAnalytics = require('./api/analytics-engine-advance.js');
            var GradingEngine = require('./api/grading-engine.js');

            if (!pan && !mobile && !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Provide at least one identifier: pan, mobile, or email'
                });
            }

            var cibilData = await getCibilForUser({ pan: pan || '', mobile: mobile || '', email: email || '' });
            if (!cibilData) {
                return res.status(404).json({
                    success: false,
                    error: 'No CIBIL report found. Fetch your CIBIL report from the dashboard first.'
                });
            }

            // Generate comprehensive analysis
            var gradingEngine = new GradingEngine(cibilData);
            var advancedAnalytics = new AdvancedAnalytics(cibilData, gradingEngine);
            var comprehensiveReport = advancedAnalytics.generateComprehensiveReport();

            // Add analysis to cibilData for PDF generation
            cibilData.analysis = comprehensiveReport;
            cibilData.analysis.overallGrade = gradingEngine.calculateOverallGrade();

            // Generate Risk Report
            try {
                var RiskAssessment = require('./api/risk-assessment.js');
                var risk = new RiskAssessment(cibilData, gradingEngine);
                cibilData.analysis.riskReport = risk.generateRiskReport();
            } catch (e) { console.log('Risk report gen error:', e); }

            var outputDir = path.join(__dirname, '../../temp/pdf');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            var fileName = 'ASTROCRED_Analysis_' + (pan || mobile || email || cibilData.pan || cibilData.pan_number || 'report') + '_' + Date.now() + '.pdf';
            var outputPath = path.join(outputDir, fileName);

            // Use Puppeteer Generator
            pdfGenerator.generatePuppeteerPDF(cibilData, outputPath, function (error, filePath) {
                if (error) {
                    console.error('Error generating ASTROCRED PDF:', error);
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
            console.error('Error in ASTROCRED PDF generation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate PDF',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get Roadmap PDF (Enhanced with dedicated generator)
    app.get('/get/api/cibil/roadmap-pdf/:months', async function (req, res) {
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

            var getCibilForUser = require('./api/cibil-data-resolver.js').getCibilForUser;
            var cibilData = await getCibilForUser({ pan: pan || '', mobile: mobile || '', email: email || '' });
            if (!cibilData) {
                return res.status(404).json({
                    success: false,
                    error: 'No CIBIL report found. Fetch your CIBIL report from the dashboard first.'
                });
            }

            // Generate roadmap data
            var gradingEngine = new GradingEngine(cibilData);
            var advancedAnalytics = new AdvancedAnalytics(cibilData, gradingEngine);
            var roadmapData = advancedAnalytics.generateImprovementPlan(months);
            roadmapData.timeline_months = months;
            roadmapData.target_score = parseInt(cibilData.credit_score || 0) + (months * 5);

            var outputDir = path.join(__dirname, '../../temp/pdf');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            var fileName = 'Roadmap_' + months + 'Months_' + (pan || mobile || email) + '_' + Date.now() + '.pdf';
            var outputPath = path.join(outputDir, fileName);

            // Use dedicated Roadmap PDF generator
            pdfGenerator.generateRoadmapPDF(roadmapData, cibilData, outputPath, function (error, filePath) {
                if (error) {
                    console.error('Error generating Roadmap PDF:', error);
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
            console.error('Error in Roadmap PDF generation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate PDF',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get Score Simulation PDF
    app.get('/get/api/cibil/simulation-pdf', async function (req, res) {
        try {
            var fs = require('fs');
            var { pan, mobile, email } = req.query;
            var getCibilForUser = require('./api/cibil-data-resolver.js').getCibilForUser;

            if (!pan && !mobile && !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, or email)'
                });
            }

            var cibilData = await getCibilForUser({ pan: pan || '', mobile: mobile || '', email: email || '' });
            if (!cibilData) {
                return res.status(404).json({
                    success: false,
                    error: 'No CIBIL report found. Fetch your CIBIL report from the dashboard first.'
                });
            }

            var currentScore = parseInt(cibilData.credit_score) || 0;

            // Generate quick simulation data
            var simulationData = {
                current_score: currentScore,
                scenarios: [
                    { name: 'Pay All Due EMIs', description: 'Clear all overdue payments', impact: 25 },
                    { name: 'Reduce Credit Utilization to 30%', description: 'Pay down credit card balances', impact: 35 },
                    { name: 'No New Credit Inquiries (6 months)', description: 'Avoid applying for new loans', impact: 15 },
                    { name: 'Close Unused Credit Cards', description: 'Reduce number of open accounts', impact: -10 },
                    { name: 'Add Secured Credit Card', description: 'Build positive credit history', impact: 20 }
                ],
                projections: [
                    { optimistic: currentScore + 15, expected: currentScore + 10, pessimistic: currentScore + 5 },
                    { optimistic: currentScore + 30, expected: currentScore + 20, pessimistic: currentScore + 10 },
                    { optimistic: currentScore + 50, expected: currentScore + 35, pessimistic: currentScore + 20 },
                    { optimistic: currentScore + 70, expected: currentScore + 50, pessimistic: currentScore + 30 },
                    { optimistic: currentScore + 90, expected: currentScore + 65, pessimistic: currentScore + 40 },
                    { optimistic: currentScore + 110, expected: currentScore + 80, pessimistic: currentScore + 50 }
                ],
                recommendations: [
                    'Prioritize paying overdue EMIs to improve payment history',
                    'Reduce credit card utilization to below 30%',
                    'Avoid multiple loan applications in short period',
                    'Maintain a mix of secured and unsecured credit',
                    'Check your credit report regularly for errors'
                ]
            };

            var outputDir = path.join(__dirname, '../../temp/pdf');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            var fileName = 'Simulation_' + (pan || mobile || email) + '_' + Date.now() + '.pdf';
            var outputPath = path.join(outputDir, fileName);

            pdfGenerator.generateSimulationPDF(simulationData, cibilData, outputPath, function (error, filePath) {
                if (error) {
                    console.error('Error generating Simulation PDF:', error);
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
            console.error('Error in Simulation PDF generation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate PDF',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get ML Prediction PDF
    app.get('/get/api/cibil/prediction-pdf', async function (req, res) {
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

            var getCibilForUser = require('./api/cibil-data-resolver.js').getCibilForUser;
            var cibilData = await getCibilForUser({ pan: pan || '', mobile: mobile || '', email: email || '' });
            if (!cibilData) {
                return res.status(404).json({
                    success: false,
                    error: 'No CIBIL report found. Fetch your CIBIL report from the dashboard first.'
                });
            }

            var currentScore = parseInt(cibilData.credit_score) || 0;
            var improvementRate = 12; // Average monthly improvement potential

            // Generate prediction data
            var predictionData = {
                sixMonthPrediction: currentScore + (improvementRate * 6),
                confidence: 78,
                monthlyPredictions: [
                    { predicted: currentScore + 12, range: { low: currentScore + 5, high: currentScore + 20 } },
                    { predicted: currentScore + 25, range: { low: currentScore + 15, high: currentScore + 38 } },
                    { predicted: currentScore + 40, range: { low: currentScore + 28, high: currentScore + 55 } },
                    { predicted: currentScore + 52, range: { low: currentScore + 38, high: currentScore + 70 } },
                    { predicted: currentScore + 65, range: { low: currentScore + 50, high: currentScore + 85 } },
                    { predicted: currentScore + 78, range: { low: currentScore + 60, high: currentScore + 100 } }
                ],
                factors: [
                    { name: 'Payment History Improvement', potentialGain: 35 },
                    { name: 'Credit Utilization Optimization', potentialGain: 25 },
                    { name: 'Credit Age Growth', potentialGain: 10 },
                    { name: 'Credit Mix Diversification', potentialGain: 8 },
                    { name: 'Inquiry Reduction', potentialGain: 5 }
                ],
                recommendations: [
                    'Focus on consistent on-time payments for maximum score boost',
                    'Target credit utilization below 30% across all cards',
                    'Avoid closing old credit accounts to maintain credit age',
                    'Consider a mix of secured loans and revolving credit',
                    'Monitor your credit report monthly for accuracy'
                ]
            };

            var outputDir = path.join(__dirname, '../../temp/pdf');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            var fileName = 'Prediction_' + (pan || mobile || email) + '_' + Date.now() + '.pdf';
            var outputPath = path.join(outputDir, fileName);

            pdfGenerator.generatePredictionPDF(predictionData, cibilData, outputPath, function (error, filePath) {
                if (error) {
                    console.error('Error generating Prediction PDF:', error);
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
            console.error('Error in Prediction PDF generation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate PDF',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get Risk Assessment PDF
    app.get('/get/api/cibil/risk-assessment-pdf', async function (req, res) {
        try {
            var fs = require('fs');
            var { pan, mobile, email } = req.query;
            var getCibilForUser = require('./api/cibil-data-resolver.js').getCibilForUser;

            if (!pan && !mobile && !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, or email)'
                });
            }

            var cibilData = await getCibilForUser({ pan: pan || '', mobile: mobile || '', email: email || '' });
            if (!cibilData) {
                return res.status(404).json({
                    success: false,
                    error: 'No CIBIL report found. Fetch your CIBIL report from the dashboard first.'
                });
            }

            var currentScore = parseInt(cibilData.credit_score) || 0;
            var riskLevel = currentScore >= 750 ? 'Low' : (currentScore >= 650 ? 'Medium' : 'High');
            var defaultProb = currentScore >= 750 ? 5 : (currentScore >= 650 ? 18 : 35);

            // Generate risk assessment data
            var riskData = {
                overall_risk: riskLevel,
                risk_score: defaultProb,
                factors: [
                    { name: 'Payment Behavior', severity: currentScore >= 700 ? 'low' : 'high', description: 'Based on historical payment patterns' },
                    { name: 'Credit Utilization', severity: 'medium', description: 'Current credit card usage relative to limits' },
                    { name: 'Account Age', severity: 'low', description: 'Average age of credit accounts' },
                    { name: 'Credit Inquiries', severity: currentScore >= 650 ? 'low' : 'medium', description: 'Recent hard inquiries on credit report' },
                    { name: 'Debt-to-Income Ratio', severity: 'medium', description: 'Total debt relative to income capacity' }
                ],
                breakdown: {
                    payment_history: 35,
                    credit_utilization: 25,
                    credit_age: 15,
                    credit_mix: 10,
                    new_credit: 15
                },
                recommendations: [
                    'Maintain consistent payment schedule to reduce payment risk',
                    'Keep credit utilization below 30% to lower utilization risk',
                    'Avoid opening multiple new accounts in short period',
                    'Monitor credit report for unauthorized activities',
                    'Build emergency fund to prevent payment defaults'
                ]
            };

            var outputDir = path.join(__dirname, '../../temp/pdf');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            var fileName = 'RiskAssessment_' + (pan || mobile || email) + '_' + Date.now() + '.pdf';
            var outputPath = path.join(outputDir, fileName);

            pdfGenerator.generateRiskAssessmentPDF(riskData, cibilData, outputPath, function (error, filePath) {
                if (error) {
                    console.error('Error generating Risk Assessment PDF:', error);
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
            console.error('Error in Risk Assessment PDF generation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate PDF',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Get Loan Probability PDF
    app.post('/post/api/cibil/loan-probability-pdf', async function (req, res) {
        try {
            var fs = require('fs');
            var { pan, mobile, email, loanType, amount, tenure } = req.body;
            var getCibilForUser = require('./api/cibil-data-resolver.js').getCibilForUser;

            if (!pan && !mobile && !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide at least one identifier (pan, mobile, or email)'
                });
            }

            var cibilData = await getCibilForUser({ pan: pan || '', mobile: mobile || '', email: email || '' });
            if (!cibilData) {
                return res.status(404).json({
                    success: false,
                    error: 'No CIBIL report found. Fetch your CIBIL report from the dashboard first.'
                });
            }

            var currentScore = parseInt(cibilData.credit_score) || 0;
            var baseProb = currentScore >= 750 ? 85 : (currentScore >= 700 ? 70 : (currentScore >= 650 ? 55 : 30));

            // Generate loan probability data
            var loanData = {
                loanType: loanType || 'Personal Loan',
                amount: amount || 500000,
                tenure: tenure || 36,
                approval_probability: baseProb,
                eligible_banks: [
                    { name: 'HDFC Bank', interestRate: 10.5, approvalChance: baseProb + 5 },
                    { name: 'ICICI Bank', interestRate: 10.75, approvalChance: baseProb + 3 },
                    { name: 'SBI', interestRate: 9.8, approvalChance: baseProb - 2 },
                    { name: 'Axis Bank', interestRate: 11.0, approvalChance: baseProb + 8 },
                    { name: 'Kotak Mahindra Bank', interestRate: 10.99, approvalChance: baseProb + 4 },
                    { name: 'Bajaj Finserv', interestRate: 11.5, approvalChance: baseProb + 10 }
                ],
                recommendations: [
                    'Improve credit score by 50 points to unlock better rates',
                    'Reduce existing loan EMI burden before applying',
                    'Provide complete documentation for faster approval',
                    'Consider a co-applicant to improve approval chances',
                    'Apply with banks where you have existing relationship'
                ]
            };

            var outputDir = path.join(__dirname, '../../temp/pdf');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            var fileName = 'LoanProbability_' + (pan || mobile || email) + '_' + Date.now() + '.pdf';
            var outputPath = path.join(outputDir, fileName);

            pdfGenerator.generateLoanProbabilityPDF(loanData, cibilData, outputPath, function (error, filePath) {
                if (error) {
                    console.error('Error generating Loan Probability PDF:', error);
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
            console.error('Error in Loan Probability PDF generation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate PDF',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    module.exports = pdfGenerator;

})();
