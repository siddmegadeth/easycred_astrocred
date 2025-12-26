(function() {
    
    /**
     * Comprehensive Professional PDF Template Generator
     * Includes ALL analysis data in a detailed, professional format
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
    
    function formatCurrency(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
        return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }
    
    function formatPercent(value) {
        if (typeof value !== 'number' || isNaN(value)) return '0%';
        return value.toFixed(1) + '%';
    }
    
    function getScoreColor(score) {
        if (score >= 80) return '#10b981'; // Green
        if (score >= 60) return '#3b82f6'; // Blue
        if (score >= 40) return '#f59e0b'; // Orange
        return '#ef4444'; // Red
    }
    
    function getGradeColor(grade) {
        if (grade.indexOf('A') >= 0) return '#10b981';
        if (grade.indexOf('B') >= 0) return '#3b82f6';
        if (grade.indexOf('C') >= 0) return '#f59e0b';
        return '#ef4444';
    }
    
    function getRiskColor(riskLevel) {
        var risk = String(riskLevel).toUpperCase();
        if (risk.indexOf('LOW') >= 0) return '#10b981';
        if (risk.indexOf('MEDIUM') >= 0 || risk.indexOf('MODERATE') >= 0) return '#f59e0b';
        return '#ef4444';
    }
    
    function generateComprehensivePDFHTML(params) {
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
        
        var gradeColor = getGradeColor(grade);
        var reportDate = new Date().toLocaleDateString('en-IN', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
        
        // Extract risk details
        var defaultProbability = riskDetails.defaultProbability || {};
        var creditWorthiness = riskDetails.creditWorthiness || {};
        var eligibleInstitutions = riskDetails.eligibleInstitutions || [];
        
        // Extract risk report details
        var riskLevel = 'MEDIUM';
        if (riskReport && riskReport.creditAssessment) {
            var riskProb = riskReport.creditAssessment.defaultProbability;
            riskLevel = (riskProb && riskProb.riskLevel) || 
                       (defaultProbability && defaultProbability.riskLevel) || 'MEDIUM';
        } else if (defaultProbability && defaultProbability.riskLevel) {
            riskLevel = defaultProbability.riskLevel;
        }
        var riskColor = getRiskColor(riskLevel);
        
        var html = '<!DOCTYPE html>\n' +
        '<html>\n' +
        '<head>\n' +
        '    <meta charset="UTF-8">\n' +
        '    <title>Comprehensive Credit Report - ' + escapeHtml(String(data.name || 'Client')) + '</title>\n' +
        '    <style>\n' +
        '        * { margin: 0; padding: 0; box-sizing: border-box; }\n' +
        '        body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; background: #ffffff; }\n' +
        '        .page { padding: 40px 50px; page-break-after: always; min-height: 100vh; }\n' +
        '        .page:last-child { page-break-after: auto; }\n' +
        '        \n' +
        '        /* Header */\n' +
        '        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }\n' +
        '        .header-content { display: flex; justify-content: space-between; align-items: center; }\n' +
        '        .logo-section { flex: 1; }\n' +
        '        .logo { font-size: 32px; font-weight: 700; margin-bottom: 5px; letter-spacing: 1px; }\n' +
        '        .report-title { font-size: 18px; opacity: 0.95; font-weight: 500; }\n' +
        '        .report-meta { text-align: right; font-size: 12px; opacity: 0.9; }\n' +
        '        .report-date { margin-top: 5px; }\n' +
        '        \n' +
        '        /* Executive Summary */\n' +
        '        .executive-summary { background: #f8fafc; padding: 25px; border-radius: 12px; border-left: 5px solid ' + gradeColor + '; margin-bottom: 30px; }\n' +
        '        .summary-title { font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 20px; }\n' +
        '        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }\n' +
        '        .summary-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }\n' +
        '        .summary-value { font-size: 36px; font-weight: 700; color: ' + gradeColor + '; margin-bottom: 5px; }\n' +
        '        .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }\n' +
        '        \n' +
        '        /* Section Styling */\n' +
        '        .section { margin-bottom: 35px; page-break-inside: avoid; }\n' +
        '        .section-title { font-size: 22px; font-weight: 700; color: #1f2937; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid ' + gradeColor + '; display: flex; align-items: center; }\n' +
        '        .section-icon { margin-right: 10px; font-size: 24px; }\n' +
        '        \n' +
        '        /* Component Scores */\n' +
        '        .scores-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; }\n' +
        '        .score-card { background: #f8fafc; padding: 20px; border-radius: 10px; border-left: 4px solid #6366f1; }\n' +
        '        .score-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }\n' +
        '        .score-name { font-size: 16px; font-weight: 600; color: #374151; }\n' +
        '        .score-value { font-size: 32px; font-weight: 700; }\n' +
        '        .score-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-top: 10px; }\n' +
        '        .score-bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }\n' +
        '        .score-weight { font-size: 12px; color: #6b7280; margin-top: 5px; }\n' +
        '        \n' +
        '        /* Risk Assessment */\n' +
        '        .risk-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 25px; }\n' +
        '        .risk-card { background: white; padding: 25px; border-radius: 10px; border: 2px solid #e5e7eb; text-align: center; }\n' +
        '        .risk-value { font-size: 42px; font-weight: 700; margin-bottom: 10px; }\n' +
        '        .risk-label { font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }\n' +
        '        .risk-badge { display: inline-block; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-top: 10px; }\n' +
        '        \n' +
        '        /* Tables */\n' +
        '        .data-table { width: 100%; border-collapse: collapse; margin-top: 15px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }\n' +
        '        .data-table th { background: #6366f1; color: white; padding: 15px; text-align: left; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }\n' +
        '        .data-table td { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }\n' +
        '        .data-table tr:last-child td { border-bottom: none; }\n' +
        '        .data-table tr:hover { background: #f9fafb; }\n' +
        '        \n' +
        '        /* Recommendations */\n' +
        '        .recommendations-list { display: grid; gap: 15px; }\n' +
        '        .recommendation-card { background: white; padding: 20px; border-radius: 10px; border-left: 5px solid #f59e0b; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }\n' +
        '        .recommendation-card.high { border-left-color: #ef4444; background: #fef2f2; }\n' +
        '        .recommendation-card.medium { border-left-color: #f59e0b; background: #fffbeb; }\n' +
        '        .recommendation-card.low { border-left-color: #3b82f6; background: #eff6ff; }\n' +
        '        .rec-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }\n' +
        '        .rec-priority { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 12px; background: rgba(0,0,0,0.1); }\n' +
        '        .rec-area { font-size: 12px; color: #6b7280; margin-bottom: 8px; }\n' +
        '        .rec-message { font-size: 14px; color: #374151; line-height: 1.6; }\n' +
        '        \n' +
        '        /* Bank Suggestions */\n' +
        '        .banks-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }\n' +
        '        .bank-card { background: white; padding: 20px; border-radius: 10px; border: 2px solid #e5e7eb; }\n' +
        '        .bank-name { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 10px; }\n' +
        '        .bank-probability { display: inline-block; padding: 5px 15px; border-radius: 15px; font-size: 12px; font-weight: 600; margin-top: 10px; background: #dbeafe; color: #1e40af; }\n' +
        '        .bank-loans { font-size: 12px; color: #6b7280; margin-top: 8px; }\n' +
        '        \n' +
        '        /* Improvement Plan */\n' +
        '        .plan-timeline { position: relative; padding-left: 30px; }\n' +
        '        .plan-timeline::before { content: ""; position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background: #e5e7eb; }\n' +
        '        .plan-month { position: relative; margin-bottom: 25px; }\n' +
        '        .plan-month::before { content: ""; position: absolute; left: -25px; top: 5px; width: 12px; height: 12px; border-radius: 50%; background: #6366f1; border: 3px solid white; box-shadow: 0 0 0 2px #6366f1; }\n' +
        '        .plan-month-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 10px; }\n' +
        '        .plan-actions { list-style: none; }\n' +
        '        .plan-action { padding: 10px; margin-bottom: 8px; background: #f8fafc; border-radius: 6px; font-size: 13px; }\n' +
        '        \n' +
        '        /* Info Grids */\n' +
        '        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }\n' +
        '        .info-card { background: #f8fafc; padding: 18px; border-radius: 8px; border: 1px solid #e5e7eb; }\n' +
        '        .info-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }\n' +
        '        .info-value { font-size: 16px; font-weight: 600; color: #1f2937; }\n' +
        '        \n' +
        '        /* Footer */\n' +
        '        .footer { margin-top: 50px; padding-top: 25px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 11px; }\n' +
        '        .footer-logo { font-size: 16px; font-weight: 700; color: #6366f1; margin-bottom: 5px; }\n' +
        '        \n' +
        '        /* Print Styles */\n' +
        '        @media print {\n' +
        '            .page { padding: 30px; }\n' +
        '            .section { page-break-inside: avoid; }\n' +
        '        }\n' +
        '        @page { margin: 0; }\n' +
        '    </style>\n' +
        '</head>\n' +
        '<body>\n';
        
        // PAGE 1: Executive Summary & Overview
        html += '    <div class="page">\n';
        
        // Header
        html += '        <div class="header">\n' +
                '            <div class="header-content">\n' +
                '                <div class="logo-section">\n' +
                '                    <div class="logo">EASYCRED ASTROCRED</div>\n' +
                '                    <div class="report-title">Comprehensive Credit Health Analysis Report</div>\n' +
                '                </div>\n' +
                '                <div class="report-meta">\n' +
                '                    <div>Report ID: ' + escapeHtml(String(data.client_id || 'N/A')) + '</div>\n' +
                '                    <div class="report-date">' + reportDate + '</div>\n' +
                '                </div>\n' +
                '            </div>\n' +
                '        </div>\n';
        
        // Executive Summary
        html += '        <div class="executive-summary">\n' +
                '            <div class="summary-title">Executive Summary</div>\n' +
                '            <div class="summary-grid">\n' +
                '                <div class="summary-card">\n' +
                '                    <div class="summary-value" style="color: ' + gradeColor + ';">' + (data.credit_score || 'N/A') + '</div>\n' +
                '                    <div class="summary-label">Credit Score</div>\n' +
                '                </div>\n' +
                '                <div class="summary-card">\n' +
                '                    <div class="summary-value" style="color: ' + gradeColor + ';">' + grade + '</div>\n' +
                '                    <div class="summary-label">Overall Grade</div>\n' +
                '                </div>\n' +
                '                <div class="summary-card">\n' +
                '                    <div class="summary-value" style="color: ' + riskColor + ';">' + formatPercent(creditUtilization) + '</div>\n' +
                '                    <div class="summary-label">Credit Utilization</div>\n' +
                '                </div>\n' +
                '                <div class="summary-card">\n' +
                '                    <div class="summary-value" style="color: ' + ((creditWorthiness && creditWorthiness.score >= 60) ? '#10b981' : '#ef4444') + ';">' + ((creditWorthiness && creditWorthiness.score) || (creditWorthiness && typeof creditWorthiness === 'object' ? 'N/A' : creditWorthiness) || 'N/A') + '</div>\n' +
                '                    <div class="summary-label">Credit Worthiness</div>\n' +
                '                </div>\n' +
                '            </div>\n' +
                '        </div>\n';
        
        // Profile Information
        html += '        <div class="section">\n' +
                '            <div class="section-title"><span class="section-icon">👤</span> Client Profile</div>\n' +
                '            <div class="info-grid">\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Full Name</div>\n' +
                '                    <div class="info-value">' + escapeHtml(String(data.name || 'N/A')) + '</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Mobile Number</div>\n' +
                '                    <div class="info-value">' + escapeHtml(String(data.mobile || 'N/A')) + '</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">PAN Number</div>\n' +
                '                    <div class="info-value">' + escapeHtml(String(data.pan || 'N/A')) + '</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Client ID</div>\n' +
                '                    <div class="info-value" style="font-size: 12px;">' + escapeHtml(String(data.client_id || 'N/A')) + '</div>\n' +
                '                </div>\n' +
                '            </div>\n' +
                '        </div>\n';
        
        // Credit Score Breakdown
        html += '        <div class="section">\n' +
                '            <div class="section-title"><span class="section-icon">📊</span> Credit Score Component Analysis</div>\n' +
                '            <div class="scores-grid">\n';
        
        var scoreComponents = [
            { name: 'Payment History', score: componentScores.paymentHistory || 0, weight: '35%' },
            { name: 'Credit Utilization', score: componentScores.creditUtilization || 0, weight: '30%' },
            { name: 'Credit Age', score: componentScores.creditAge || 0, weight: '15%' },
            { name: 'Debt Burden', score: componentScores.debtBurden || 0, weight: '10%' },
            { name: 'Credit Mix', score: componentScores.creditMix || 0, weight: '5%' },
            { name: 'Recent Inquiries', score: componentScores.recentInquiries || 0, weight: '5%' }
        ];
        
        scoreComponents.forEach(function(comp) {
            var scoreColor = getScoreColor(comp.score);
            html += '                <div class="score-card">\n' +
                    '                    <div class="score-header">\n' +
                    '                        <div class="score-name">' + comp.name + '</div>\n' +
                    '                        <div class="score-value" style="color: ' + scoreColor + ';">' + comp.score + '</div>\n' +
                    '                    </div>\n' +
                    '                    <div class="score-bar">\n' +
                    '                        <div class="score-bar-fill" style="width: ' + comp.score + '%; background: ' + scoreColor + ';"></div>\n' +
                    '                    </div>\n' +
                    '                    <div class="score-weight">Weight: ' + comp.weight + '</div>\n' +
                    '                </div>\n';
        });
        
        html += '            </div>\n' +
                '        </div>\n';
        
        html += '    </div>\n'; // End Page 1
        
        // PAGE 2: Risk Assessment & Payment Analysis
        html += '    <div class="page">\n';
        
        // Risk Assessment
        html += '        <div class="section">\n' +
                '            <div class="section-title"><span class="section-icon">⚠️</span> Risk Assessment</div>\n' +
                '            <div class="risk-grid">\n' +
                '                <div class="risk-card" style="border-color: ' + riskColor + ';">\n' +
                '                    <div class="risk-value" style="color: ' + riskColor + ';">' + formatPercent((defaultProbability && defaultProbability.probability) || (typeof defaultProbability === 'number' ? defaultProbability : 0)) + '</div>\n' +
                '                    <div class="risk-label">Default Probability</div>\n' +
                '                    <div class="risk-badge" style="background: ' + riskColor + '; color: white;">' + ((defaultProbability && defaultProbability.riskLevel) || riskLevel || 'MEDIUM') + '</div>\n' +
                '                </div>\n' +
                '                <div class="risk-card" style="border-color: ' + (creditWorthiness.score >= 60 ? '#10b981' : '#ef4444') + ';">\n' +
                '                    <div class="risk-value" style="color: ' + ((creditWorthiness && creditWorthiness.score >= 60) ? '#10b981' : '#ef4444') + ';">' + ((creditWorthiness && creditWorthiness.score) || (creditWorthiness && typeof creditWorthiness === 'object' ? 0 : creditWorthiness) || 0) + '/100</div>\n' +
                '                    <div class="risk-label">Credit Worthiness</div>\n' +
                '                    <div class="risk-badge" style="background: ' + ((creditWorthiness && creditWorthiness.isCreditWorthy) ? '#10b981' : '#ef4444') + '; color: white;">' + ((creditWorthiness && creditWorthiness.isCreditWorthy) ? 'Credit Worthy' : 'Not Credit Worthy') + '</div>\n' +
                '                </div>\n' +
                '                <div class="risk-card">\n' +
                '                    <div class="risk-value" style="color: #6366f1;">' + (comprehensiveReport.summary?.totalAccounts || accounts.length || 0) + '</div>\n' +
                '                    <div class="risk-label">Total Accounts</div>\n' +
                '                </div>\n' +
                '            </div>\n';
        
        // Risk Factors
        if (comprehensiveReport.riskFactors && comprehensiveReport.riskFactors.length > 0) {
            html += '            <div style="margin-top: 25px;">\n' +
                    '                <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 15px; color: #1f2937;">Identified Risk Factors</h3>\n';
            
            comprehensiveReport.riskFactors.forEach(function(factor) {
                var severityColor = factor.severity === 'High' || factor.severity === 'Critical' ? '#ef4444' : '#f59e0b';
                html += '                <div style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid ' + severityColor + ';">\n' +
                        '                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">\n' +
                        '                        <div style="font-weight: 600; color: #1f2937;">' + escapeHtml(String(factor.factor || 'Risk Factor')) + '</div>\n' +
                        '                        <span style="padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ' + severityColor + '; color: white;">' + escapeHtml(String(factor.severity || 'Medium')) + '</span>\n' +
                        '                    </div>\n' +
                        '                    <div style="font-size: 13px; color: #6b7280;">' + escapeHtml(String(factor.description || '')) + '</div>\n' +
                        '                </div>\n';
            });
            
            html += '            </div>\n';
        }
        
        html += '        </div>\n';
        
        // Payment History Analysis
        html += '        <div class="section">\n' +
                '            <div class="section-title"><span class="section-icon">💳</span> Payment History Analysis</div>\n' +
                '            <div class="info-grid">\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">On-Time Payments</div>\n' +
                '                    <div class="info-value" style="color: #10b981;">' + (paymentAnalysis.onTime || 0) + ' / ' + (paymentAnalysis.total || 0) + '</div>\n' +
                '                    <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">' + formatPercent((paymentAnalysis.onTimeRate || 0) * 100) + ' on-time rate</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Delayed Payments</div>\n' +
                '                    <div class="info-value" style="color: #f59e0b;">' + (paymentAnalysis.delayed || 0) + '</div>\n' +
                '                    <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">' + formatPercent((paymentAnalysis.delayed / (paymentAnalysis.total || 1)) * 100) + ' of total</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Missed Payments</div>\n' +
                '                    <div class="info-value" style="color: #ef4444;">' + (paymentAnalysis.missed || 0) + '</div>\n' +
                '                    <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">' + formatPercent((paymentAnalysis.missedRate || 0) * 100) + ' missed rate</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Total Payments Tracked</div>\n' +
                '                    <div class="info-value">' + (paymentAnalysis.total || 0) + '</div>\n' +
                '                </div>\n' +
                '            </div>\n' +
                '        </div>\n';
        
        // Credit Metrics
        html += '        <div class="section">\n' +
                '            <div class="section-title"><span class="section-icon">📈</span> Credit Metrics</div>\n' +
                '            <div class="info-grid">\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Credit Utilization</div>\n' +
                '                    <div class="info-value" style="color: ' + (creditUtilization > 50 ? '#ef4444' : creditUtilization > 30 ? '#f59e0b' : '#10b981') + ';">' + formatPercent(creditUtilization) + '</div>\n' +
                '                    <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">Recommended: &lt;30%</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Credit Age</div>\n' +
                '                    <div class="info-value">' + creditAge + ' months</div>\n' +
                '                    <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">' + (creditAge >= 84 ? 'Excellent' : creditAge >= 36 ? 'Good' : 'Building') + '</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Total Enquiries</div>\n' +
                '                    <div class="info-value">' + (comprehensiveReport.summary?.totalEnquiries || enquiries.length || 0) + '</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Account Types</div>\n' +
                '                    <div class="info-value">' + (new Set(accounts.map(function(a) { return a.accountType; })).size || 0) + ' types</div>\n' +
                '                </div>\n' +
                '            </div>\n' +
                '        </div>\n';
        
        html += '    </div>\n'; // End Page 2
        
        // PAGE 3: Accounts & Recommendations
        html += '    <div class="page">\n';
        
        // All Accounts Table
        if (accounts && accounts.length > 0) {
            html += '        <div class="section">\n' +
                    '            <div class="section-title"><span class="section-icon">🏦</span> Credit Accounts Overview</div>\n' +
                    '            <table class="data-table">\n' +
                    '                <thead>\n' +
                    '                    <tr>\n' +
                    '                        <th>Lender</th>\n' +
                    '                        <th>Account Type</th>\n' +
                    '                        <th>Credit Limit</th>\n' +
                    '                        <th>Current Balance</th>\n' +
                    '                        <th>Overdue</th>\n' +
                    '                        <th>Utilization</th>\n' +
                    '                    </tr>\n' +
                    '                </thead>\n' +
                    '                <tbody>\n';
            
            accounts.slice(0, 15).forEach(function(acc) {
                var limit = acc.highCreditAmount || acc.creditLimit || 0;
                var balance = acc.currentBalance || 0;
                var overdue = acc.amountOverdue || 0;
                var util = limit > 0 ? ((balance / limit) * 100) : 0;
                var utilColor = util > 80 ? '#ef4444' : util > 50 ? '#f59e0b' : '#10b981';
                
                html += '                    <tr>\n' +
                        '                        <td>' + escapeHtml(String(acc.memberShortName || acc.institution || 'N/A')) + '</td>\n' +
                        '                        <td>' + escapeHtml(String(acc.accountType || 'N/A')) + '</td>\n' +
                        '                        <td>' + formatCurrency(limit) + '</td>\n' +
                        '                        <td>' + formatCurrency(balance) + '</td>\n' +
                        '                        <td style="color: ' + (overdue > 0 ? '#ef4444' : '#10b981') + '; font-weight: 600;">' + formatCurrency(overdue) + '</td>\n' +
                        '                        <td style="color: ' + utilColor + '; font-weight: 600;">' + formatPercent(util) + '</td>\n' +
                        '                    </tr>\n';
            });
            
            html += '                </tbody>\n' +
                    '            </table>\n';
            
            if (accounts.length > 15) {
                html += '            <div style="margin-top: 15px; text-align: center; color: #6b7280; font-size: 12px;">Showing 15 of ' + accounts.length + ' accounts</div>\n';
            }
            
            html += '        </div>\n';
        }
        
        // Accounts Needing Attention
        if (defaulters && defaulters.length > 0) {
            html += '        <div class="section">\n' +
                    '            <div class="section-title"><span class="section-icon">⚠️</span> Accounts Requiring Immediate Attention</div>\n' +
                    '            <table class="data-table">\n' +
                    '                <thead>\n' +
                    '                    <tr>\n' +
                    '                        <th>Lender</th>\n' +
                    '                        <th>Account Type</th>\n' +
                    '                        <th>Balance</th>\n' +
                    '                        <th>Overdue Amount</th>\n' +
                    '                        <th>Utilization</th>\n' +
                    '                    </tr>\n' +
                    '                </thead>\n' +
                    '                <tbody>\n';
            
            defaulters.forEach(function(d) {
                var lender = d.lender || d.institution || d.subscriberName || 'N/A';
                var accountType = d.accountType || d.type || 'N/A';
                var balance = d.currentBalance || d.balance || 0;
                var overdue = d.overdueAmount || d.overdue || 0;
                var util = d.overduePercentage || 0;
                
                html += '                    <tr>\n' +
                        '                        <td style="font-weight: 600;">' + escapeHtml(String(lender)) + '</td>\n' +
                        '                        <td>' + escapeHtml(String(accountType)) + '</td>\n' +
                        '                        <td>' + formatCurrency(balance) + '</td>\n' +
                        '                        <td style="color: #ef4444; font-weight: 700;">' + formatCurrency(overdue) + '</td>\n' +
                        '                        <td style="color: #ef4444; font-weight: 600;">' + formatPercent(util) + '</td>\n' +
                        '                    </tr>\n';
            });
            
            html += '                </tbody>\n' +
                    '            </table>\n' +
                    '        </div>\n';
        }
        
        html += '    </div>\n'; // End Page 3
        
        // PAGE 4: Recommendations & Improvement Plan
        html += '    <div class="page">\n';
        
        // Recommendations
        if (recommendations && recommendations.length > 0) {
            html += '        <div class="section">\n' +
                    '            <div class="section-title"><span class="section-icon">💡</span> Personalized Recommendations</div>\n' +
                    '            <div class="recommendations-list">\n';
            
            recommendations.forEach(function(rec) {
                if (!rec) return;
                var priority = (rec.priority || 'Medium').toLowerCase();
                var area = rec.area || 'General';
                var message = rec.message || 'No specific recommendation';
                
                html += '                <div class="recommendation-card ' + priority + '">\n' +
                        '                    <div class="rec-header">\n' +
                        '                        <div class="rec-area">' + escapeHtml(String(area)) + '</div>\n' +
                        '                        <div class="rec-priority">' + escapeHtml(String(rec.priority || 'Medium')) + ' Priority</div>\n' +
                        '                    </div>\n' +
                        '                    <div class="rec-message">' + escapeHtml(String(message)) + '</div>\n' +
                        '                </div>\n';
            });
            
            html += '            </div>\n' +
                    '        </div>\n';
        }
        
        // Improvement Plan
        if (improvementPlan && improvementPlan.monthlyActions && improvementPlan.monthlyActions.length > 0) {
            html += '        <div class="section">\n' +
                    '            <div class="section-title"><span class="section-icon">📅</span> 6-Month Improvement Plan</div>\n' +
                    '            <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #e5e7eb;">\n' +
                    '                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">\n' +
                    '                    <div>\n' +
                    '                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Current Grade</div>\n' +
                    '                        <div style="font-size: 24px; font-weight: 700; color: ' + gradeColor + ';">' + grade + '</div>\n' +
                    '                    </div>\n' +
                    '                    <div style="text-align: right;">\n' +
                    '                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Target Grade</div>\n' +
                    '                        <div style="font-size: 24px; font-weight: 700; color: #10b981;">' + (improvementPlan.targetGrade || grade) + '</div>\n' +
                    '                    </div>\n' +
                    '                </div>\n' +
                    '            </div>\n' +
                    '            <div class="plan-timeline">\n';
            
            improvementPlan.monthlyActions.slice(0, 6).forEach(function(month) {
                html += '                <div class="plan-month">\n' +
                        '                    <div class="plan-month-title">Month ' + month.month + '</div>\n' +
                        '                    <ul class="plan-actions">\n';
                
                if (month.actions && month.actions.length > 0) {
                    month.actions.slice(0, 3).forEach(function(action) {
                        html += '                        <li class="plan-action">' + escapeHtml(String(action.action || action.message || '')) + '</li>\n';
                    });
                } else {
                    html += '                        <li class="plan-action">Continue maintaining good credit practices</li>\n';
                }
                
                html += '                    </ul>\n' +
                        '                </div>\n';
            });
            
            html += '            </div>\n' +
                    '        </div>\n';
        }
        
        html += '    </div>\n'; // End Page 4
        
        // PAGE 5: Bank Suggestions & Enquiries
        html += '    <div class="page">\n';
        
        // Bank Suggestions
        if (bankSuggestions && bankSuggestions.length > 0) {
            html += '        <div class="section">\n' +
                    '            <div class="section-title"><span class="section-icon">🏛️</span> Recommended Financial Institutions</div>\n' +
                    '            <div class="banks-grid">\n';
            
            bankSuggestions.slice(0, 8).forEach(function(bank) {
                var probColor = bank.probability >= 70 ? '#10b981' : bank.probability >= 50 ? '#f59e0b' : '#ef4444';
                html += '                <div class="bank-card">\n' +
                        '                    <div class="bank-name">' + escapeHtml(String(bank.name || 'Bank')) + '</div>\n';
                
                if (bank.loanTypes && bank.loanTypes.length > 0) {
                    html += '                    <div class="bank-loans">Available: ' + bank.loanTypes.join(', ') + '</div>\n';
                }
                
                if (bank.probability) {
                    html += '                    <div class="bank-probability" style="background: ' + probColor + '; color: white;">' + bank.probability + '% Approval Probability</div>\n';
                }
                
                html += '                </div>\n';
            });
            
            html += '            </div>\n' +
                    '        </div>\n';
        }
        
        // Eligible Institutions
        if (eligibleInstitutions && eligibleInstitutions.length > 0) {
            html += '        <div class="section">\n' +
                    '            <div class="section-title"><span class="section-icon">🏢</span> Eligible Financial Institutions</div>\n' +
                    '            <div style="display: grid; gap: 12px;">\n';
            
            eligibleInstitutions.forEach(function(inst) {
                html += '                <div style="background: white; padding: 18px; border-radius: 8px; border: 2px solid #e5e7eb;">\n' +
                        '                    <div style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">' + escapeHtml(String(inst.name || 'Institution')) + '</div>\n' +
                        '                    <div style="font-size: 13px; color: #6b7280;">' + escapeHtml(String(inst.description || '')) + '</div>\n' +
                        '                </div>\n';
            });
            
            html += '            </div>\n' +
                    '        </div>\n';
        }
        
        // Recent Enquiries
        if (enquiries && enquiries.length > 0) {
            html += '        <div class="section">\n' +
                    '            <div class="section-title"><span class="section-icon">🔍</span> Credit Enquiries (' + enquiries.length + ')</div>\n' +
                    '            <table class="data-table">\n' +
                    '                <thead>\n' +
                    '                    <tr>\n' +
                    '                        <th>Date</th>\n' +
                    '                        <th>Institution</th>\n' +
                    '                        <th>Purpose</th>\n' +
                    '                        <th>Amount</th>\n' +
                    '                    </tr>\n' +
                    '                </thead>\n' +
                    '                <tbody>\n';
            
            enquiries.slice(0, 10).forEach(function(enq) {
                html += '                    <tr>\n' +
                        '                        <td>' + escapeHtml(String(enq.enquiryDate || 'N/A')) + '</td>\n' +
                        '                        <td>' + escapeHtml(String(enq.memberShortName || 'N/A')) + '</td>\n' +
                        '                        <td>' + escapeHtml(String(enq.enquiryPurpose || 'N/A')) + '</td>\n' +
                        '                        <td>' + (enq.enquiryAmount ? formatCurrency(enq.enquiryAmount) : 'N/A') + '</td>\n' +
                        '                    </tr>\n';
            });
            
            html += '                </tbody>\n' +
                    '            </table>\n';
            
            if (enquiries.length > 10) {
                html += '            <div style="margin-top: 15px; text-align: center; color: #6b7280; font-size: 12px;">Showing 10 of ' + enquiries.length + ' enquiries</div>\n';
            }
            
            html += '        </div>\n';
        }
        
        // Footer
        html += '        <div class="footer">\n' +
                '            <div class="footer-logo">EASYCRED ASTROCRED</div>\n' +
                '            <div style="margin-top: 10px;">This comprehensive report is generated by EasyCred AstroCred Credit Analysis System</div>\n' +
                '            <div style="margin-top: 5px;">Report ID: ' + escapeHtml(String(data.client_id || 'N/A')) + ' | Confidential Document</div>\n' +
                '            <div style="margin-top: 10px;">For support and inquiries, visit: <strong>https://astrocred.easycred.co.in</strong></div>\n' +
                '            <div style="margin-top: 15px; font-size: 10px; color: #9ca3af;">© ' + new Date().getFullYear() + ' EasyCred. All rights reserved. This report is for informational purposes only.</div>\n' +
                '        </div>\n';
        
        html += '    </div>\n'; // End Page 5
        
        html += '</body>\n' +
                '</html>';
        
        return html;
    }
    
    // Export the function
    module.exports = generateComprehensivePDFHTML;
    
})();

