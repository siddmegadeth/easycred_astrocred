// PDF Generator for CIBIL Reports
// Uses PDFKit for generating PDF reports
(function () {
    var PDFDocument = require('pdfkit');
    var fs = require('fs');
    var path = require('path');

    function PDFGenerator() {
        this.fontsPath = path.join(__dirname, '../../assets/fonts');
    }

    // Generate CIBIL PDF Report
    PDFGenerator.prototype.generateCIBILPDF = function (cibilData, outputPath, callback) {
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

    // Add Credit Score Section
    PDFGenerator.prototype.addCreditScoreSection = function (doc, cibilData) {
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
    PDFGenerator.prototype.addRecommendationsSection = function (doc, cibilData) {
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

    // Add Footer
    PDFGenerator.prototype.addFooter = function (doc) {
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

    // Get CIBIL PDF Report
    app.get('/get/api/cibil/generate-pdf', async function (req, res) {
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

            pdfGenerator.generateCIBILPDF(cibilData, outputPath, function (error, filePath) {
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
                    // Clean up file after download
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

    // Get ASTROCRED Analysis PDF Report
    app.get('/get/api/cibil/astrocred-report-pdf', async function (req, res) {
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

            pdfGenerator.generateCIBILPDF(cibilData, outputPath, function (error, filePath) {
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
                    // Clean up file after download
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
