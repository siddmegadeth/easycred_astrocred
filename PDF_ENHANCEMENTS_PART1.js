/**
 * ASTROCRED - Enterprise-Level PDF Enhancement Methods
 * Add these methods to pdf-generator.js after line 636 (before ROADMAP section)
 */

// ============== NEW COMPREHENSIVE SECTIONS ==============

// Add Risk Assessment Section
PDFGenerator.prototype.addRiskAssessmentSection = function (doc, cibilData) {
    doc.fillColor('#1c1fbe')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('Risk Assessment & Credit Worthiness', 50, 50);

    doc.moveDown(0.5);

    var analysis = cibilData.analysis || {};
    var riskReport = analysis.riskReport || analysis.riskAssessment || {};

    // Risk Level Box
    var riskLevel = riskReport.risk_level || this.getRiskLevel(parseInt(cibilData.credit_score));
    var riskColor = this.getRiskColor(riskLevel);
    var defaultProb = riskReport.default_probability || riskReport.defaultProbability || 0;

    var y = doc.y;
    doc.rect(50, y, 495, 100)
        .fillColor(riskColor + '20')
        .fill()
        .strokeColor(riskColor)
        .lineWidth(2)
        .stroke();

    doc.fillColor(riskColor)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Risk Level: ' + riskLevel.toUpperCase(), 70, y + 20);

    doc.fillColor('#333333')
        .fontSize(14)
        .font('Helvetica')
        .text('Default Probability: ' + defaultProb.toFixed(1) + '%', 70, y + 50);

    doc.fontSize(12)
        .text('Credit Worthiness Score: ' + ((riskReport.credit_worthiness || riskReport.creditWorthiness || 0).toFixed(1)) + '/10', 70, y + 70);

    doc.y = y + 110;
    doc.moveDown();

    // Risk Factors
    doc.fillColor('#1c1fbe')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Key Risk Factors:', 50, doc.y);

    doc.moveDown(0.5);

    var riskFactors = riskReport.risk_factors || riskReport.riskFactors || [
        'Payment history: ' + (analysis.paymentAnalysis?.on_time_percentage || 0) + '% on-time',
        'Credit utilization: ' + (analysis.creditUtilization?.percentage || 0) + '%',
        'Total exposure: ₹' + ((analysis.totalExposure || 0).toLocaleString()),
        'Default accounts: ' + (analysis.defaultAccounts || 0)
    ];

    riskFactors.slice(0, 6).forEach(function (factor) {
        doc.fillColor('#333333')
            .fontSize(11)
            .font('Helvetica')
            .text('• ' + factor, 70, doc.y, { width: 470 });
        doc.moveDown(0.7);
    });

    doc.moveDown();
};

// Add Component Scores Section
PDFGenerator.prototype.addComponentScoresSection = function (doc, cibilData) {
    if (doc.y > 600) doc.addPage();

    doc.fillColor('#1c1fbe')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Credit Score Component Breakdown', 50, doc.y);

    doc.moveDown(0.5);

    var analysis = cibilData.analysis || {};
    var componentScores = analysis.componentScores || analysis.component_grades || {
        payment_history: 30,
        credit_utilization: 25,
        credit_age: 20,
        credit_mix: 15,
        new_credit: 10
    };

    var components = [
        { name: 'Payment History', key: 'payment_history', weight: '35%', color: '#28a745' },
        { name: 'Credit Utilization', key: 'credit_utilization', weight: '30%', color: '#ffc107' },
        { name: 'Credit Age', key: 'credit_age', weight: '15%', color: '#17a2b8' },
        { name: 'Credit Mix', key: 'credit_mix', weight: '10%', color: '#6f42c1' },
        { name: 'New Credit', key: 'new_credit', weight: '10%', color: '#fd7e14' }
    ];

    components.forEach(function (comp) {
        var score = componentScores[comp.key] || 0;
        var y = doc.y;

        // Component name and weight
        doc.fillColor('#333333')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(comp.name, 70, y);

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#666666')
            .text('(Weight: ' + comp.weight + ')', 250, y);

        // Score bar
        var barWidth = 200;
        var scoreWidth = (score / 100) * barWidth;

        doc.rect(70, y + 20, barWidth, 15)
            .fillColor('#e9ecef')
            .fill();

        doc.rect(70, y + 20, scoreWidth, 15)
            .fillColor(comp.color)
            .fill();

        doc.fillColor('#333333')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text(score.toFixed(0) + '%', 280, y + 22);

        doc.y = y + 45;
    });

    doc.moveDown();
};

// Continue with remaining methods in next file...
