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
        // Extract data from comprehensiveReport if available (more accurate)
        var portfolioAnalysis = comprehensiveReport.portfolioAnalysis || {};
        var creditAssessment = comprehensiveReport.creditAssessment || {};
        var riskAssessment = comprehensiveReport.riskAssessment || {};
        
        // Calculate utilization from accounts first (most accurate)
        var creditUtilization = 0;
        if (accounts && accounts.length > 0) {
            var totalLimit = 0;
            var totalBalance = 0;
            accounts.forEach(function(acc) {
                var limit = parseFloat(acc.highCreditAmount || acc.creditLimit || acc.high_credit_amount || acc.highCredit || 0);
                var balance = parseFloat(acc.currentBalance || acc.balance || acc.current_balance || 0);
                if (limit > 0) {
                    totalLimit += limit;
                    totalBalance += balance;
                }
            });
            if (totalLimit > 0) {
                creditUtilization = (totalBalance / totalLimit) * 100;
            }
        }
        
        // Fallback to consumerSummary if accounts calculation didn't work
        if ((creditUtilization === 0 || creditUtilization == null || isNaN(creditUtilization)) && consumerSummary && consumerSummary.accountSummary) {
            var accSum = consumerSummary.accountSummary;
            var highCredit = parseFloat(accSum.highCreditAmount || 0);
            var currentBal = parseFloat(accSum.currentBalance || 0);
            if (highCredit > 0) {
                creditUtilization = (currentBal / highCredit) * 100;
            }
        }
        
        // Final fallback to portfolioAnalysis or params
        if ((creditUtilization === 0 || creditUtilization == null || isNaN(creditUtilization))) {
            creditUtilization = portfolioAnalysis.creditUtilization != null ? portfolioAnalysis.creditUtilization : (params.creditUtilization || 0);
        }
        
        // Ensure it's a valid number
        creditUtilization = isNaN(creditUtilization) ? 0 : Math.max(0, Math.min(100, creditUtilization));
        
        var creditAgeMonths = portfolioAnalysis.creditAgeMonths != null ? portfolioAnalysis.creditAgeMonths : (params.creditAge || 0);
        var creditAgeYears = portfolioAnalysis.creditAgeYears != null ? portfolioAnalysis.creditAgeYears : (creditAgeMonths > 0 ? Math.round(creditAgeMonths / 12 * 10) / 10 : 0);
        
        // Calculate credit age from consumerSummary or accounts if not provided
        if (creditAgeMonths === 0) {
            // Try consumerSummary first
            if (consumerSummary && consumerSummary.accountSummary) {
                var accSum = consumerSummary.accountSummary;
                if (accSum.oldestDateOpened) {
                    var oldestDate = new Date(accSum.oldestDateOpened);
                    if (!isNaN(oldestDate.getTime())) {
                        var now = new Date();
                        var monthsDiff = (now.getFullYear() - oldestDate.getFullYear()) * 12 + (now.getMonth() - oldestDate.getMonth());
                        creditAgeMonths = Math.max(0, monthsDiff);
                        creditAgeYears = Math.round(creditAgeMonths / 12 * 10) / 10;
                    }
                }
            }
            
            // Fallback to accounts if still 0
            if (creditAgeMonths === 0 && accounts && accounts.length > 0) {
                var oldestDate = null;
                accounts.forEach(function(acc) {
                    var dateOpened = acc.dateOpened || acc.date_opened || acc.accountOpenDate;
                    if (dateOpened) {
                        var date = new Date(dateOpened);
                        if (!isNaN(date.getTime()) && (!oldestDate || date < oldestDate)) {
                            oldestDate = date;
                        }
                    }
                });
                if (oldestDate) {
                    var now = new Date();
                    var monthsDiff = (now.getFullYear() - oldestDate.getFullYear()) * 12 + (now.getMonth() - oldestDate.getMonth());
                    creditAgeMonths = Math.max(0, monthsDiff);
                    creditAgeYears = Math.round(creditAgeMonths / 12 * 10) / 10;
                }
            }
        }
        var paymentAnalysis = portfolioAnalysis.paymentHistory || params.paymentAnalysis || {};
        var componentScores = creditAssessment.componentBreakdown || params.componentScores || {};
        var riskDetails = riskAssessment || params.riskDetails || {};
        
        // Extract default probability and credit worthiness from risk assessment
        var defaultProbData = riskAssessment.defaultProbability || riskDetails.defaultProbability || {};
        var creditWorthinessData = riskAssessment.creditWorthiness || riskDetails.creditWorthiness || {};
        var allAccounts = Array.isArray(params.allAccounts) ? params.allAccounts : [];
        var accounts = Array.isArray(params.accounts) ? params.accounts : [];
        var enquiries = Array.isArray(params.enquiries) ? params.enquiries : [];
        var profileFromReport = params.profileFromReport || {};
        var reasonCodes = Array.isArray(params.reasonCodes) ? params.reasonCodes : [];
        var consumerSummary = params.consumerSummary || {};
        
        var gradeColor = getGradeColor(grade);
        var reportDate = new Date().toLocaleDateString('en-IN', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
        
        // Extract risk details - use comprehensiveReport first, then riskReport, then params
        var defaultProbability = defaultProbData || (riskReport && riskReport.creditAssessment && riskReport.creditAssessment.defaultProbability) || riskDetails.defaultProbability || {};
        var creditWorthiness = creditWorthinessData || (riskReport && riskReport.creditAssessment && riskReport.creditAssessment.creditWorthiness) || riskDetails.creditWorthiness || {};
        var eligibleInstitutions = (riskAssessment && riskAssessment.eligibleInstitutions) || riskDetails.eligibleInstitutions || [];
        
        // Extract risk level
        var riskLevel = 'MEDIUM';
        if (defaultProbability && defaultProbability.riskLevel) {
            riskLevel = defaultProbability.riskLevel;
        } else if (riskReport && riskReport.creditAssessment && riskReport.creditAssessment.defaultProbability && riskReport.creditAssessment.defaultProbability.riskLevel) {
            riskLevel = riskReport.creditAssessment.defaultProbability.riskLevel;
        } else if (riskAssessment && riskAssessment.riskLevel) {
            riskLevel = riskAssessment.riskLevel;
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
                '                    <div class="report-title">AI-Powered Credit Analysis Report</div>\n' +
                '                    <div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">🤖 Simplified Insights • Actionable Recommendations • Score Projections</div>\n' +
                '                </div>\n' +
                '                <div class="report-meta">\n' +
                '                    <div>Report ID: ' + escapeHtml(String(data.client_id || 'N/A')) + '</div>\n' +
                '                    <div class="report-date">' + reportDate + '</div>\n' +
                '                    <div style="margin-top: 8px; font-size: 11px; opacity: 0.85;">Data Source: CIBIL TransUnion</div>\n' +
                '                </div>\n' +
                '            </div>\n' +
                '        </div>\n';
        
        // What Makes This Report Different
        html += '        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">\n' +
                '            <div style="display: flex; align-items: start;">\n' +
                '                <span style="font-size: 32px; margin-right: 15px;">✨</span>\n' +
                '                <div style="flex: 1;">\n' +
                '                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 10px;">What Makes This Report Different?</h3>\n' +
                '                    <p style="font-size: 13px; line-height: 1.7; opacity: 0.95; margin-bottom: 12px;">\n' +
                '                        Unlike the standard CIBIL report which shows raw data, this <strong>AI Analysis Report</strong> provides:\n' +
                '                    </p>\n' +
                '                    <ul style="font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px; opacity: 0.95;">\n' +
                '                        <li><strong>Simplified Explanations:</strong> What each metric means in plain English</li>\n' +
                '                        <li><strong>Impact Analysis:</strong> How each factor affects your credit score</li>\n' +
                '                        <li><strong>Prioritized Recommendations:</strong> Actions ranked by potential score impact</li>\n' +
                '                        <li><strong>Score Projections:</strong> See your projected score after improvements</li>\n' +
                '                        <li><strong>Risk Assessment:</strong> Understand your default probability and creditworthiness</li>\n' +
                '                        <li><strong>Action Plan:</strong> Month-by-month roadmap to improve your score</li>\n' +
                '                    </ul>\n' +
                '                </div>\n' +
                '            </div>\n' +
                '        </div>\n';
        
        // Executive Summary with AI Analysis
        var execSummary = comprehensiveReport.executiveSummary || {};
        html += '        <div class="executive-summary">\n' +
                '            <div class="summary-title">Executive Summary</div>\n' +
                '            <div class="summary-grid">\n' +
                '                <div class="summary-card">\n' +
                '                    <div class="summary-value" style="color: ' + gradeColor + ';">' + (data.credit_score || 'N/A') + '</div>\n' +
                '                    <div class="summary-label">Credit Score</div>\n' +
                '                    <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">' + (data.credit_score >= 750 ? 'Excellent - Best loan rates' : data.credit_score >= 700 ? 'Good - Competitive rates' : data.credit_score >= 650 ? 'Fair - Higher rates' : 'Poor - Limited options') + '</div>\n' +
                '                </div>\n' +
                '                <div class="summary-card">\n' +
                '                    <div class="summary-value" style="color: ' + gradeColor + ';">' + grade + '</div>\n' +
                '                    <div class="summary-label">Overall Grade</div>\n' +
                '                    <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">' + (comprehensiveReport.creditAssessment && comprehensiveReport.creditAssessment.gradeInterpretation ? comprehensiveReport.creditAssessment.gradeInterpretation : 'Grade assessment') + '</div>\n' +
                '                </div>\n' +
                '                <div class="summary-card">\n' +
                '                    <div class="summary-value" style="color: ' + riskColor + ';">' + formatPercent(creditUtilization) + '</div>\n' +
                '                    <div class="summary-label">Credit Utilization</div>\n' +
                '                    <div style="font-size: 11px; color: ' + (creditUtilization > 50 ? '#ef4444' : creditUtilization > 30 ? '#f59e0b' : '#10b981') + '; margin-top: 5px;">' + (creditUtilization > 50 ? 'High - Reduce usage' : creditUtilization > 30 ? 'Moderate - Monitor' : 'Excellent - Keep it low') + '</div>\n' +
                '                </div>\n' +
                '                <div class="summary-card">\n' +
                '                    <div class="summary-value" style="color: ' + (creditWorthinessScore >= 60 ? '#10b981' : '#ef4444') + ';">' + Math.round(creditWorthinessScore) + '/100</div>\n' +
                '                    <div class="summary-label">Credit Worthiness</div>\n' +
                '                    <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">' + (isCreditWorthy ? 'Credit Worthy' : 'Needs Improvement') + '</div>\n' +
                '                </div>\n' +
                '            </div>\n';
        
        // AI Analysis Insights Box
        if (execSummary.overallStatus || execSummary.keyStrengths || execSummary.keyConcerns) {
            html += '            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 12px; margin-top: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">\n' +
                    '                <div style="display: flex; align-items: center; margin-bottom: 15px;">\n' +
                    '                    <span style="font-size: 24px; margin-right: 10px;">🤖</span>\n' +
                    '                    <h3 style="font-size: 18px; font-weight: 700; margin: 0;">AI Analysis: ' + escapeHtml(String(execSummary.overallStatus || 'Credit Profile Assessment')) + '</h3>\n' +
                    '                </div>\n';
            
            if (execSummary.outlook) {
                html += '                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; margin-bottom: 15px; font-size: 14px; line-height: 1.6;">\n' +
                        '                    <strong>Outlook:</strong> ' + escapeHtml(String(execSummary.outlook)) + '\n' +
                        '                </div>\n';
            }
            
            if (execSummary.keyStrengths && execSummary.keyStrengths.length > 0) {
                html += '                <div style="margin-bottom: 15px;">\n' +
                        '                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">✅ Key Strengths:</div>\n' +
                        '                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">\n';
                execSummary.keyStrengths.forEach(function(strength) {
                    html += '                        <li>' + escapeHtml(String(strength)) + '</li>\n';
                });
                html += '                    </ul>\n' +
                        '                </div>\n';
            }
            
            if (execSummary.keyConcerns && execSummary.keyConcerns.length > 0) {
                html += '                <div style="margin-bottom: 15px;">\n' +
                        '                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">⚠️ Key Concerns:</div>\n' +
                        '                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">\n';
                execSummary.keyConcerns.forEach(function(concern) {
                    html += '                        <li>' + escapeHtml(String(concern)) + '</li>\n';
                });
                html += '                    </ul>\n' +
                        '                </div>\n';
            }
            
            if (execSummary.immediateActions && execSummary.immediateActions.length > 0) {
                html += '                <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; border-left: 4px solid #fbbf24;">\n' +
                        '                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">🎯 Immediate Actions:</div>\n' +
                        '                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">\n';
                execSummary.immediateActions.forEach(function(action) {
                    html += '                        <li>' + escapeHtml(String(action)) + '</li>\n';
                });
                html += '                    </ul>\n' +
                        '                </div>\n';
            }
            
            html += '            </div>\n';
        }
        
        html += '        </div>\n';
        
        // Profile Information (from report when available for full profile)
        var displayName = profileFromReport.primaryName || data.name || 'N/A';
        var displayMobile = (profileFromReport.telephones && profileFromReport.telephones[0]) ? (profileFromReport.telephones[0].telephoneNumber || data.mobile) : (data.mobile || 'N/A');
        var displayPan = data.pan || 'N/A';
        if (profileFromReport.ids && profileFromReport.ids.length) {
            for (var pi = 0; pi < profileFromReport.ids.length; pi++) {
                if (profileFromReport.ids[pi].idType === 'TaxId') {
                    displayPan = profileFromReport.ids[pi].idNumber || displayPan;
                    break;
                }
            }
        }
        html += '        <div class="section">\n' +
                '            <div class="section-title"><span class="section-icon">👤</span> Client Profile</div>\n' +
                '            <div class="info-grid">\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Full Name</div>\n' +
                '                    <div class="info-value">' + escapeHtml(String(displayName)) + '</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Date of Birth</div>\n' +
                '                    <div class="info-value">' + escapeHtml(String(profileFromReport.birthDate || (data.date_of_birth && data.date_of_birth.$date ? data.date_of_birth.$date.split('T')[0] : '') || 'N/A')) + '</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Mobile Number</div>\n' +
                '                    <div class="info-value">' + escapeHtml(String(displayMobile)) + '</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">PAN Number</div>\n' +
                '                    <div class="info-value">' + escapeHtml(String(displayPan)) + '</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Control Number</div>\n' +
                '                    <div class="info-value" style="font-size: 12px;">' + escapeHtml(String(profileFromReport.controlNumber || data.client_id || 'N/A')) + '</div>\n' +
                '                </div>\n' +
                '            </div>\n';
        if (profileFromReport.ids && profileFromReport.ids.length > 0) {
            html += '            <div style="margin-top: 15px;"><strong style="color: #6b7280; font-size: 12px;">IDs on file</strong><div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px;">';
            profileFromReport.ids.forEach(function(id) {
                html += '<span style="background: #f3f4f6; padding: 6px 12px; border-radius: 6px; font-size: 12px;">' + escapeHtml(String(id.idType || '')) + ': ' + escapeHtml(String(id.idNumber || '')) + '</span>';
            });
            html += '</div></div>\n';
        }
        if (profileFromReport.emails && profileFromReport.emails.length > 0) {
            html += '            <div style="margin-top: 12px;"><strong style="color: #6b7280; font-size: 12px;">Email addresses</strong><div style="margin-top: 6px; font-size: 13px;">' + profileFromReport.emails.map(function(e) { return escapeHtml(String(e.emailID || '')); }).join(', ') + '</div></div>\n';
        }
        if (profileFromReport.employment && profileFromReport.employment.length > 0) {
            var emp = profileFromReport.employment[0];
            html += '            <div style="margin-top: 12px;"><strong style="color: #6b7280; font-size: 12px;">Employment</strong><div style="margin-top: 6px;">Reported: ' + escapeHtml(String(emp.dateReported || '')) + ', Occupation code: ' + escapeHtml(String(emp.occupationCode || '')) + '</div></div>\n';
        }
        if (profileFromReport.addresses && profileFromReport.addresses.length > 0) {
            html += '            <div style="margin-top: 15px;"><strong style="color: #6b7280; font-size: 12px;">Addresses on file</strong>';
            profileFromReport.addresses.forEach(function(addr, i) {
                html += '<div style="margin-top: 8px; padding: 10px; background: #f9fafb; border-radius: 6px; font-size: 12px;">' + (i + 1) + '. ' + escapeHtml(String(addr.line1 || '')) + (addr.line2 ? ' ' + escapeHtml(String(addr.line2)) : '') + ', PIN ' + escapeHtml(String(addr.pinCode || '')) + '</div>';
            });
            html += '</div>\n';
        }
        html += '        </div>\n';
        
        // Credit Score Breakdown
        html += '        <div class="section">\n' +
                '            <div class="section-title"><span class="section-icon">📊</span> Credit Score Component Analysis</div>\n' +
                '            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">\n' +
                '                <p style="font-size: 13px; color: #1e40af; margin: 0; line-height: 1.6;">\n' +
                '                    <strong>📊 How Your Score is Calculated:</strong> Your credit score of <strong>' + (data.credit_score || 'N/A') + '</strong> is calculated from these six components. ' +
                'Each component has a different weight in determining your overall score. Focus on improving components with lower scores and higher weights for maximum impact.\n' +
                '                </p>\n' +
                '            </div>\n' +
                '            <div class="scores-grid">\n';
        
        // Calculate component scores from actual data
        // Payment History Score
        var paymentHistoryScore = componentScores.paymentHistory;
        if ((paymentHistoryScore == null || paymentHistoryScore === 0) && paymentAnalysis.onTimePercentage != null) {
            paymentHistoryScore = paymentAnalysis.onTimePercentage; // Use on-time percentage as score
        }
        if (paymentHistoryScore == null || isNaN(paymentHistoryScore)) {
            // Calculate from payment analysis data
            var onTimePct = paymentAnalysis.onTimePercentage;
            if (onTimePct == null && paymentAnalysis.total > 0) {
                onTimePct = (paymentAnalysis.onTime || 0) / paymentAnalysis.total * 100;
            }
            paymentHistoryScore = onTimePct || 0;
        }
        
        // Credit Utilization Score - always calculate from actual utilization
        var utilizationScore = componentScores.creditUtilization;
        if (utilizationScore == null || utilizationScore === 0 || isNaN(utilizationScore)) {
            // Convert utilization % to score (lower utilization = higher score)
            if (creditUtilization > 0 && !isNaN(creditUtilization)) {
                utilizationScore = creditUtilization <= 30 ? 85 : creditUtilization <= 50 ? 70 : creditUtilization <= 70 ? 50 : 30;
            } else {
                utilizationScore = 0;
            }
        }
        
        // Credit Age Score - always calculate from actual age
        var creditAgeScore = componentScores.creditAge;
        if (creditAgeScore == null || creditAgeScore === 0 || isNaN(creditAgeScore)) {
            if (creditAgeMonths > 0) {
                // Convert age in months to score (older = higher score)
                creditAgeScore = creditAgeMonths >= 84 ? 85 : creditAgeMonths >= 36 ? 70 : creditAgeMonths >= 12 ? 50 : 30;
            } else {
                creditAgeScore = 0;
            }
        }
        
        // Debt Burden Score
        var debtBurdenScore = componentScores.debtBurden || componentScores.debtToIncome;
        if (debtBurdenScore == null || isNaN(debtBurdenScore)) {
            // Estimate from utilization and accounts
            debtBurdenScore = creditUtilization <= 30 ? 80 : creditUtilization <= 50 ? 60 : creditUtilization <= 70 ? 40 : 20;
        }
        
        // Credit Mix Score
        var creditMixScore = componentScores.creditMix;
        if (creditMixScore == null || isNaN(creditMixScore)) {
            // Calculate from account types
            var accountTypes = new Set(accounts.map(function(a) { return a.accountType || a.type; }).filter(Boolean)).size;
            creditMixScore = accountTypes >= 3 ? 80 : accountTypes >= 2 ? 60 : accountTypes >= 1 ? 40 : 0;
        }
        
        // Recent Inquiries Score
        var recentInquiriesScore = componentScores.recentInquiries || componentScores.recentEnquiries;
        if (recentInquiriesScore == null || isNaN(recentInquiriesScore)) {
            // Calculate from enquiry count
            var enquiryCount = totalEnquiries || enquiries.length || 0;
            recentInquiriesScore = enquiryCount <= 2 ? 90 : enquiryCount <= 5 ? 70 : enquiryCount <= 10 ? 50 : enquiryCount <= 20 ? 30 : 10;
        }
        
        var scoreComponents = [
            { name: 'Payment History', score: Math.round(paymentHistoryScore), weight: '35%' },
            { name: 'Credit Utilization', score: Math.round(utilizationScore), weight: '30%' },
            { name: 'Credit Age', score: Math.round(creditAgeScore), weight: '15%' },
            { name: 'Debt Burden', score: Math.round(debtBurdenScore), weight: '10%' },
            { name: 'Credit Mix', score: Math.round(creditMixScore), weight: '5%' },
            { name: 'Recent Inquiries', score: Math.round(recentInquiriesScore), weight: '5%' }
        ];
        
        scoreComponents.forEach(function(comp) {
            var scoreColor = getScoreColor(comp.score);
            var interpretation = '';
            var impact = '';
            
            // Add interpretations for each component
            if (comp.name === 'Payment History') {
                interpretation = comp.score >= 80 ? 'Excellent - Consistent on-time payments' : comp.score >= 60 ? 'Good - Mostly on-time' : comp.score >= 40 ? 'Fair - Some delays' : 'Poor - Frequent late payments';
                impact = comp.score < 60 ? 'This is hurting your score significantly. Focus on paying all bills on time.' : 'This is helping your score. Keep it up!';
            } else if (comp.name === 'Credit Utilization') {
                interpretation = comp.score >= 80 ? 'Excellent - Low utilization (<30%)' : comp.score >= 60 ? 'Good - Moderate utilization' : comp.score >= 40 ? 'Fair - High utilization' : 'Poor - Very high utilization (>70%)';
                impact = comp.score < 60 ? 'High utilization is reducing your score. Pay down balances to below 30%.' : 'Good utilization management.';
            } else if (comp.name === 'Credit Age') {
                interpretation = comp.score >= 80 ? 'Excellent - Long credit history' : comp.score >= 60 ? 'Good - Established history' : comp.score >= 40 ? 'Fair - Building history' : 'Poor - New to credit';
                impact = comp.score < 60 ? 'Short credit history limits your score. Keep old accounts open.' : 'Good credit history length.';
            } else if (comp.name === 'Recent Inquiries') {
                interpretation = comp.score >= 80 ? 'Excellent - Few recent inquiries' : comp.score >= 60 ? 'Good - Moderate inquiries' : comp.score >= 40 ? 'Fair - Many inquiries' : 'Poor - Too many inquiries';
                impact = comp.score < 60 ? 'Too many loan applications hurt your score. Avoid unnecessary applications.' : 'Good inquiry management.';
            } else {
                interpretation = comp.score >= 60 ? 'Good' : comp.score >= 40 ? 'Fair' : 'Needs Improvement';
                impact = comp.score < 60 ? 'This area needs attention.' : 'This is helping your score.';
            }
            
            html += '                <div class="score-card">\n' +
                    '                    <div class="score-header">\n' +
                    '                        <div class="score-name">' + comp.name + '</div>\n' +
                    '                        <div class="score-value" style="color: ' + scoreColor + ';">' + comp.score + '</div>\n' +
                    '                    </div>\n' +
                    '                    <div class="score-bar">\n' +
                    '                        <div class="score-bar-fill" style="width: ' + comp.score + '%; background: ' + scoreColor + ';"></div>\n' +
                    '                    </div>\n' +
                    '                    <div class="score-weight">Weight: ' + comp.weight + '</div>\n' +
                    '                    <div style="font-size: 11px; color: #6b7280; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">\n' +
                    '                        <div style="margin-bottom: 4px;"><strong>What this means:</strong> ' + interpretation + '</div>\n' +
                    '                        <div style="color: ' + (comp.score < 60 ? '#ef4444' : '#10b981') + ';"><strong>Impact:</strong> ' + impact + '</div>\n' +
                    '                    </div>\n' +
                    '                </div>\n';
        });
        
        html += '            </div>\n';
        
        // Add Score Impact Analysis
        html += '            <div style="background: #fef3c7; padding: 20px; border-radius: 10px; border-left: 5px solid #f59e0b; margin-top: 20px;">\n' +
                '                <h3 style="font-size: 16px; font-weight: 600; color: #92400e; margin-bottom: 12px;">📊 Score Impact Analysis</h3>\n' +
                '                <div style="font-size: 13px; color: #78350f; line-height: 1.6;">\n';
        
        // Find biggest issue (lowest score with highest weight)
        var biggestIssue = scoreComponents.reduce(function(prev, curr) {
            if (curr.score < prev.score) return curr;
            if (curr.score === prev.score) {
                // If scores are equal, prefer the one with higher weight
                var prevWeight = parseFloat(prev.weight);
                var currWeight = parseFloat(curr.weight);
                return currWeight > prevWeight ? curr : prev;
            }
            return prev;
        });
        
        // Find biggest strength (highest score)
        var biggestStrength = scoreComponents.reduce(function(prev, curr) {
            return (curr.score > prev.score) ? curr : prev;
        });
        
        // Only show if there's a meaningful difference
        if (biggestIssue.score < biggestStrength.score) {
            html += '                    <p style="margin-bottom: 10px;"><strong>⚠️ Biggest Issue:</strong> Your <strong>' + biggestIssue.name.toLowerCase() + '</strong> score is <strong>' + biggestIssue.score + '/100</strong>. ' +
                    'Since this factor has <strong>' + biggestIssue.weight + ' weight</strong>, improving it could boost your overall score significantly. ' +
                    'Focus on this area first for maximum impact.</p>\n';
            
            html += '                    <p><strong>✅ Biggest Strength:</strong> Your <strong>' + biggestStrength.name.toLowerCase() + '</strong> score is <strong>' + biggestStrength.score + '/100</strong>. ' +
                    'This is helping maintain your credit score. Continue maintaining this good practice to keep your score strong.</p>\n';
        } else {
            html += '                    <p style="margin-bottom: 10px;">All components are performing similarly. Focus on maintaining consistent payment history and keeping utilization low.</p>\n';
        }
        
        html += '                </div>\n' +
                '            </div>\n' +
                '        </div>\n';

        // Score Reason Codes (from CIBIL report)
        if (reasonCodes.length > 0) {
            html += '        <div class="section">\n' +
                    '            <div class="section-title"><span class="section-icon">📋</span> Score Reason Codes</div>\n' +
                    '            <div style="font-size: 13px; color: #6b7280; margin-bottom: 12px;">Factors influencing your credit score (CIBIL)</div>\n' +
                    '            <div style="display: flex; flex-wrap: wrap; gap: 10px;">\n';
            reasonCodes.forEach(function(rc) {
                html += '                <div style="background: #f3f4f6; padding: 10px 14px; border-radius: 8px; font-size: 13px;"><strong>' + escapeHtml(String(rc.reasonCodeName || rc.reasonCodeValue || '')) + '</strong></div>\n';
            });
            html += '            </div>\n' +
                    '        </div>\n';
        }

        // Consumer Summary (accountSummary + inquirySummary from report)
        var accSum = (consumerSummary && consumerSummary.accountSummary) ? consumerSummary.accountSummary : {};
        var inqSum = (consumerSummary && consumerSummary.inquirySummary) ? consumerSummary.inquirySummary : {};
        if (accSum.totalAccounts !== undefined || inqSum.totalInquiry !== undefined) {
            html += '        <div class="section">\n' +
                    '            <div class="section-title"><span class="section-icon">📑</span> Consumer Summary</div>\n' +
                    '            <div class="info-grid">\n';
            if (accSum.totalAccounts !== undefined) {
                html += '                <div class="info-card"><div class="info-label">Total Accounts</div><div class="info-value">' + (accSum.totalAccounts) + '</div></div>\n';
                html += '                <div class="info-card"><div class="info-label">High Credit (Limit)</div><div class="info-value">' + formatCurrency(Number(accSum.highCreditAmount) || 0) + '</div></div>\n';
                html += '                <div class="info-card"><div class="info-label">Current Balance</div><div class="info-value">' + formatCurrency(Number(accSum.currentBalance) || 0) + '</div></div>\n';
                html += '                <div class="info-card"><div class="info-label">Overdue Accounts</div><div class="info-value" style="color: ' + ((accSum.overdueAccounts || 0) > 0 ? '#ef4444' : '#10b981') + ';">' + (accSum.overdueAccounts || 0) + '</div></div>\n';
                html += '                <div class="info-card"><div class="info-label">Overdue Balance</div><div class="info-value">' + formatCurrency(Number(accSum.overdueBalance) || 0) + '</div></div>\n';
                html += '                <div class="info-card"><div class="info-label">Zero Balance Accounts</div><div class="info-value">' + (accSum.zeroBalanceAccounts || 0) + '</div></div>\n';
                if (accSum.recentDateOpened) html += '                <div class="info-card"><div class="info-label">Recent Account Opened</div><div class="info-value">' + escapeHtml(String(accSum.recentDateOpened)) + '</div></div>\n';
                if (accSum.oldestDateOpened) html += '                <div class="info-card"><div class="info-label">Oldest Account Opened</div><div class="info-value">' + escapeHtml(String(accSum.oldestDateOpened)) + '</div></div>\n';
            }
            if (inqSum.totalInquiry !== undefined) {
                html += '                <div class="info-card"><div class="info-label">Total Enquiries</div><div class="info-value">' + (inqSum.totalInquiry) + '</div></div>\n';
                if (inqSum.inquiryPast30Days !== undefined && inqSum.inquiryPast30Days !== '') html += '                <div class="info-card"><div class="info-label">Enquiries (30 days)</div><div class="info-value">' + escapeHtml(String(inqSum.inquiryPast30Days)) + '</div></div>\n';
                if (inqSum.recentInquiryDate) html += '                <div class="info-card"><div class="info-label">Recent Enquiry Date</div><div class="info-value">' + escapeHtml(String(inqSum.recentInquiryDate)) + '</div></div>\n';
            }
            html += '            </div>\n' +
                    '        </div>\n';
        }

        html += '    </div>\n'; // End Page 1
        
        // PAGE 2: Risk Assessment & Payment Analysis
        html += '    <div class="page">\n';
        
        // Risk Assessment with Explanations
        var defaultProb = 0;
        if (defaultProbability) {
            if (typeof defaultProbability === 'object') {
                defaultProb = defaultProbability.probability != null ? defaultProbability.probability : (defaultProbability.value != null ? defaultProbability.value : 0);
            } else if (typeof defaultProbability === 'number') {
                defaultProb = defaultProbability;
            }
        }
        
        // Calculate default probability if not provided
        if (defaultProb === 0 || isNaN(defaultProb)) {
            // Estimate from credit score, utilization, and payment history
            var scoreFactor = (data.credit_score || 650) >= 750 ? 5 : (data.credit_score || 650) >= 700 ? 10 : (data.credit_score || 650) >= 650 ? 20 : 35;
            var utilFactor = creditUtilization <= 30 ? 5 : creditUtilization <= 50 ? 10 : creditUtilization <= 70 ? 20 : 30;
            var paymentFactor = paymentHistoryScore >= 80 ? 5 : paymentHistoryScore >= 60 ? 10 : paymentHistoryScore >= 40 ? 20 : 35;
            defaultProb = Math.min(100, Math.max(0, (scoreFactor + utilFactor + paymentFactor) / 3));
        }
        
        var riskLevelText = ((defaultProbability && defaultProbability.riskLevel) || riskLevel || 'MEDIUM');
        // Determine risk level from probability if not provided
        if (!riskLevelText || riskLevelText === 'MEDIUM') {
            if (defaultProb < 20) riskLevelText = 'LOW';
            else if (defaultProb < 40) riskLevelText = 'MEDIUM';
            else if (defaultProb < 60) riskLevelText = 'MEDIUM-HIGH';
            else riskLevelText = 'HIGH';
        }
        
        // Calculate credit worthiness score if not provided
        var creditWorthinessScore = null;
        if (creditWorthiness && typeof creditWorthiness === 'object') {
            creditWorthinessScore = creditWorthiness.score;
        } else if (typeof creditWorthiness === 'number') {
            creditWorthinessScore = creditWorthiness;
        }
        
        if (creditWorthinessScore == null || isNaN(creditWorthinessScore)) {
            // Estimate from credit score and other factors
            var baseScore = data.credit_score || 650;
            var utilizationFactor = creditUtilization <= 30 ? 10 : creditUtilization <= 50 ? 5 : creditUtilization <= 70 ? 0 : -10;
            var paymentFactor = paymentHistoryScore >= 80 ? 10 : paymentHistoryScore >= 60 ? 5 : 0;
            var ageFactor = creditAgeMonths >= 84 ? 5 : creditAgeMonths >= 36 ? 3 : 0;
            
            creditWorthinessScore = Math.min(100, Math.max(0, 
                (baseScore >= 750 ? 75 : baseScore >= 700 ? 65 : baseScore >= 650 ? 55 : baseScore >= 600 ? 45 : 35) +
                utilizationFactor + paymentFactor + ageFactor
            ));
        }
        
        var isCreditWorthy = (creditWorthiness && creditWorthiness.isCreditWorthy != null) ? creditWorthiness.isCreditWorthy : (creditWorthinessScore >= 60);
        var riskExplanation = '';
        if (riskLevelText.indexOf('LOW') >= 0 || riskLevelText.indexOf('LOW') >= 0) {
            riskExplanation = 'Low risk indicates you have a strong credit profile with minimal likelihood of defaulting on payments. Lenders view you as a reliable borrower.';
        } else if (riskLevelText.indexOf('MEDIUM') >= 0 || riskLevelText.indexOf('MODERATE') >= 0) {
            riskExplanation = 'Medium risk suggests some areas need attention. While you\'re generally reliable, improving payment consistency and reducing utilization will lower your risk.';
        } else {
            riskExplanation = 'High risk indicates significant credit challenges. Focus on clearing defaults, reducing utilization, and maintaining consistent payments to improve your risk profile.';
        }
        
        html += '        <div class="section">\n' +
                '            <div class="section-title"><span class="section-icon">⚠️</span> Risk Assessment & Analysis</div>\n' +
                '            <div class="risk-grid">\n' +
                '                <div class="risk-card" style="border-color: ' + riskColor + ';">\n' +
                '                    <div class="risk-value" style="color: ' + riskColor + ';">' + formatPercent(defaultProb) + '</div>\n' +
                '                    <div class="risk-label">Default Probability</div>\n' +
                '                    <div class="risk-badge" style="background: ' + riskColor + '; color: white;">' + riskLevelText + '</div>\n' +
                '                    <div style="font-size: 11px; color: #6b7280; margin-top: 10px; text-align: center; line-height: 1.4;">' +
                '                        ' + (defaultProb < 20 ? 'Very Low Risk' : defaultProb < 40 ? 'Low-Moderate Risk' : defaultProb < 60 ? 'Moderate-High Risk' : 'High Risk') +
                '                    </div>\n' +
                '                </div>\n' +
                '                <div class="risk-card" style="border-color: ' + (creditWorthinessScore >= 60 ? '#10b981' : '#ef4444') + ';">\n' +
                '                    <div class="risk-value" style="color: ' + (creditWorthinessScore >= 60 ? '#10b981' : '#ef4444') + ';">' + Math.round(creditWorthinessScore) + '/100</div>\n' +
                '                    <div class="risk-label">Credit Worthiness</div>\n' +
                '                    <div class="risk-badge" style="background: ' + (isCreditWorthy ? '#10b981' : '#ef4444') + '; color: white;">' + (isCreditWorthy ? 'Credit Worthy' : 'Needs Improvement') + '</div>\n' +
                '                    <div style="font-size: 11px; color: #6b7280; margin-top: 10px; text-align: center; line-height: 1.4;">' +
                '                        ' + (creditWorthinessScore >= 70 ? 'Excellent' : creditWorthinessScore >= 60 ? 'Good' : creditWorthinessScore >= 50 ? 'Fair' : 'Poor') +
                '                    </div>\n' +
                '                </div>\n' +
                '                <div class="risk-card">\n' +
                '                    <div class="risk-value" style="color: #6366f1;">' + (comprehensiveReport.summary?.totalAccounts || accounts.length || 0) + '</div>\n' +
                '                    <div class="risk-label">Total Accounts</div>\n' +
                '                    <div style="font-size: 11px; color: #6b7280; margin-top: 10px; text-align: center;">' +
                '                        ' + ((comprehensiveReport.summary?.totalAccounts || accounts.length || 0) >= 5 ? 'Good Mix' : 'Building Portfolio') +
                '                    </div>\n' +
                '                </div>\n' +
                '            </div>\n';
        
        // Add Risk Explanation Box
        html += '            <div style="background: ' + (riskLevelText.indexOf('LOW') >= 0 ? '#f0fdf4' : riskLevelText.indexOf('MEDIUM') >= 0 ? '#fffbeb' : '#fef2f2') + '; padding: 20px; border-radius: 10px; margin-top: 20px; border-left: 5px solid ' + riskColor + ';">\n' +
                '                <h3 style="font-size: 16px; font-weight: 600; color: ' + (riskLevelText.indexOf('LOW') >= 0 ? '#065f46' : riskLevelText.indexOf('MEDIUM') >= 0 ? '#92400e' : '#991b1b') + '; margin-bottom: 12px;">📊 What This Means</h3>\n' +
                '                <p style="font-size: 13px; color: ' + (riskLevelText.indexOf('LOW') >= 0 ? '#047857' : riskLevelText.indexOf('MEDIUM') >= 0 ? '#78350f' : '#991b1b') + '; line-height: 1.6; margin-bottom: 12px;">' +
                escapeHtml(String(riskExplanation)) +
                '                </p>\n';
        
        if (defaultProb >= 40) {
            html += '                <div style="background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: 6px; margin-top: 12px;">\n' +
                    '                    <p style="font-size: 12px; color: #991b1b; margin: 0; line-height: 1.5;"><strong>⚠️ Action Required:</strong> ' +
                    'Your default probability is ' + formatPercent(defaultProb) + '. ' +
                    'To reduce this risk, focus on: (1) Clearing all overdue accounts, (2) Reducing credit utilization below 30%, (3) Making all future payments on time.</p>\n' +
                    '                </div>\n';
        }
        
        html += '            </div>\n';
        
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
        var onTimePayments = paymentAnalysis.onTime || 0;
        var delayedPayments = paymentAnalysis.delayed || 0;
        var missedPayments = paymentAnalysis.missed || 0;
        var totalPayments = paymentAnalysis.total || (onTimePayments + delayedPayments + missedPayments) || 0;
        var onTimePercentage = paymentAnalysis.onTimePercentage != null ? paymentAnalysis.onTimePercentage : (totalPayments > 0 ? Math.round((onTimePayments / totalPayments) * 100) : 0);
        
        html += '        <div class="section">\n' +
                '            <div class="section-title"><span class="section-icon">💳</span> Payment History Analysis</div>\n' +
                '            <div class="info-grid">\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">On-Time Payments</div>\n' +
                '                    <div class="info-value" style="color: #10b981;">' + onTimePayments + ' / ' + totalPayments + '</div>\n' +
                '                    <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">' + formatPercent(onTimePercentage) + ' on-time rate</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Delayed Payments</div>\n' +
                '                    <div class="info-value" style="color: #f59e0b;">' + delayedPayments + '</div>\n' +
                '                    <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">' + (totalPayments > 0 ? formatPercent((delayedPayments / totalPayments) * 100) : '0%') + ' of total</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Missed Payments</div>\n' +
                '                    <div class="info-value" style="color: #ef4444;">' + missedPayments + '</div>\n' +
                '                    <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">' + (totalPayments > 0 ? formatPercent((missedPayments / totalPayments) * 100) : '0%') + ' missed rate</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Total Payments Tracked</div>\n' +
                '                    <div class="info-value">' + totalPayments + '</div>\n' +
                '                    <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">' + (paymentAnalysis.performanceRating || 'Not Rated') + '</div>\n' +
                '                </div>\n' +
                '            </div>\n' +
                '        </div>\n';
        
        // Credit Metrics
        var totalEnquiries = portfolioAnalysis.totalEnquiries != null ? portfolioAnalysis.totalEnquiries : (comprehensiveReport.summary && comprehensiveReport.summary.totalEnquiries) || enquiries.length || 0;
        var accountTypes = new Set(accounts.map(function(a) { return a.accountType || a.type; }).filter(Boolean)).size;
        var creditAgeDisplay = creditAgeMonths > 0 ? creditAgeMonths + ' months (' + creditAgeYears + ' years)' : '0 months';
        
        html += '        <div class="section">\n' +
                '            <div class="section-title"><span class="section-icon">📈</span> Credit Metrics</div>\n' +
                '            <div class="info-grid">\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Credit Utilization</div>\n' +
                '                    <div class="info-value" style="color: ' + (creditUtilization > 50 ? '#ef4444' : creditUtilization > 30 ? '#f59e0b' : '#10b981') + ';">' + formatPercent(creditUtilization) + '</div>\n' +
                '                    <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">Recommended: &lt;30%</div>\n' +
                '                    <div style="font-size: 11px; color: ' + (creditUtilization > 50 ? '#ef4444' : creditUtilization > 30 ? '#f59e0b' : '#10b981') + '; margin-top: 3px;">' + (creditUtilization > 50 ? '⚠️ High - Reduce usage' : creditUtilization > 30 ? '⚡ Moderate - Monitor' : '✅ Excellent') + '</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Credit Age</div>\n' +
                '                    <div class="info-value">' + creditAgeDisplay + '</div>\n' +
                '                    <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">' + (creditAgeMonths >= 84 ? 'Excellent - Long history' : creditAgeMonths >= 36 ? 'Good - Established' : creditAgeMonths >= 12 ? 'Building - Growing' : 'New - Just starting') + '</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Total Enquiries</div>\n' +
                '                    <div class="info-value" style="color: ' + (totalEnquiries > 10 ? '#ef4444' : totalEnquiries > 5 ? '#f59e0b' : '#10b981') + ';">' + totalEnquiries + '</div>\n' +
                '                    <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">' + (totalEnquiries > 10 ? '⚠️ Too many' : totalEnquiries > 5 ? '⚡ Moderate' : '✅ Good') + '</div>\n' +
                '                </div>\n' +
                '                <div class="info-card">\n' +
                '                    <div class="info-label">Account Types</div>\n' +
                '                    <div class="info-value">' + accountTypes + ' types</div>\n' +
                '                    <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">' + (accountTypes >= 3 ? 'Good mix' : 'Limited variety') + '</div>\n' +
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
            
            accounts.slice(0, 30).forEach(function(acc) {
                var limit = acc.highCreditAmount || acc.creditLimit || 0;
                var balance = acc.currentBalance || 0;
                var overdue = acc.amountOverdue || 0;
                var util = limit > 0 ? ((balance / limit) * 100) : 0;
                var utilColor = util > 80 ? '#ef4444' : util > 50 ? '#f59e0b' : '#10b981';
                
                html += '                    <tr>\n' +
                        '                        <td>' + escapeHtml(String(acc.memberShortName || acc.bank || acc.institution || 'N/A')) + '</td>\n' +
                        '                        <td>' + escapeHtml(String(acc.accountType || acc.type || 'N/A')) + '</td>\n' +
                        '                        <td>' + formatCurrency(limit) + '</td>\n' +
                        '                        <td>' + formatCurrency(balance) + '</td>\n' +
                        '                        <td style="color: ' + (overdue > 0 ? '#ef4444' : '#10b981') + '; font-weight: 600;">' + formatCurrency(overdue) + '</td>\n' +
                        '                        <td style="color: ' + utilColor + '; font-weight: 600;">' + formatPercent(util) + '</td>\n' +
                        '                    </tr>\n';
            });
            
            html += '                </tbody>\n' +
                    '            </table>\n';
            
            if (accounts.length > 30) {
                html += '            <div style="margin-top: 15px; text-align: center; color: #6b7280; font-size: 12px;">Showing 30 of ' + accounts.length + ' accounts</div>\n';
            }
            
            html += '        </div>\n';
        }
        
        // Accounts Needing Attention - include defaulters and high utilization accounts
        var accountsNeedingAttention = [];
        
        // Add defaulters
        if (defaulters && defaulters.length > 0) {
            defaulters.forEach(function(d) {
                accountsNeedingAttention.push({
                    lender: d.lender || d.institution || d.subscriberName || 'N/A',
                    accountType: d.accountType || d.type || 'N/A',
                    balance: d.currentBalance || d.balance || 0,
                    overdue: d.overdueAmount || d.overdue || 0,
                    utilization: d.overduePercentage || 0,
                    reason: 'Overdue'
                });
            });
        }
        
        // Add high utilization accounts (>70%)
        if (accounts && accounts.length > 0) {
            accounts.forEach(function(acc) {
                var limit = parseFloat(acc.highCreditAmount || acc.creditLimit || acc.high_credit_amount || 0);
                var balance = parseFloat(acc.currentBalance || acc.balance || acc.current_balance || 0);
                var overdue = parseFloat(acc.amountOverdue || acc.overdue_amount || 0);
                if (limit > 0) {
                    var util = (balance / limit) * 100;
                    if (util > 70 && overdue <= 0) { // High utilization but not overdue (avoid duplicates)
                        var lender = acc.memberShortName || acc.bank || acc.institution || 'N/A';
                        // Check if not already in list
                        var alreadyAdded = accountsNeedingAttention.some(function(a) {
                            return a.lender === lender && a.balance === balance;
                        });
                        if (!alreadyAdded) {
                            accountsNeedingAttention.push({
                                lender: lender,
                                accountType: acc.accountType || acc.type || 'N/A',
                                balance: balance,
                                overdue: overdue,
                                utilization: util,
                                reason: 'High Utilization'
                            });
                        }
                    }
                }
            });
        }
        
        if (accountsNeedingAttention.length > 0) {
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
                    '                        <th>Issue</th>\n' +
                    '                    </tr>\n' +
                    '                </thead>\n' +
                    '                <tbody>\n';
            
            accountsNeedingAttention.forEach(function(acc) {
                html += '                    <tr>\n' +
                        '                        <td style="font-weight: 600;">' + escapeHtml(String(acc.lender)) + '</td>\n' +
                        '                        <td>' + escapeHtml(String(acc.accountType)) + '</td>\n' +
                        '                        <td>' + formatCurrency(acc.balance) + '</td>\n' +
                        '                        <td style="color: ' + (acc.overdue > 0 ? '#ef4444' : '#10b981') + '; font-weight: 600;">' + formatCurrency(acc.overdue) + '</td>\n' +
                        '                        <td style="color: ' + (acc.utilization > 70 ? '#ef4444' : acc.utilization > 50 ? '#f59e0b' : '#10b981') + '; font-weight: 600;">' + formatPercent(acc.utilization) + '</td>\n' +
                        '                        <td><span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; background: ' + (acc.reason === 'Overdue' ? '#fef2f2' : '#fffbeb') + '; color: ' + (acc.reason === 'Overdue' ? '#991b1b' : '#92400e') + ';">' + escapeHtml(String(acc.reason)) + '</span></td>\n' +
                        '                    </tr>\n';
            });
            
            html += '                </tbody>\n' +
                    '            </table>\n' +
                    '        </div>\n';
        }
        
        html += '    </div>\n'; // End Page 3
        
        // PAGE 4: Recommendations & Improvement Plan
        html += '    <div class="page">\n';
        
        // Generate recommendations if not provided
        if ((!recommendations || recommendations.length === 0) && comprehensiveReport.recommendations) {
            recommendations = [];
            if (comprehensiveReport.recommendations.immediate && comprehensiveReport.recommendations.immediate.length > 0) {
                recommendations = recommendations.concat(comprehensiveReport.recommendations.immediate);
            }
            if (comprehensiveReport.recommendations.shortTerm && comprehensiveReport.recommendations.shortTerm.length > 0) {
                recommendations = recommendations.concat(comprehensiveReport.recommendations.shortTerm);
            }
            if (comprehensiveReport.recommendations.longTerm && comprehensiveReport.recommendations.longTerm.length > 0) {
                recommendations = recommendations.concat(comprehensiveReport.recommendations.longTerm);
            }
        }
        
        // Generate recommendations from data if still empty
        if (!recommendations || recommendations.length === 0) {
            recommendations = [];
            if (creditUtilization > 70) {
                recommendations.push({
                    priority: 'High',
                    area: 'Credit Utilization',
                    message: 'Reduce credit card balances. Your utilization is ' + formatPercent(creditUtilization) + '%. Aim to keep it below 30% for optimal credit score.'
                });
            } else if (creditUtilization > 50) {
                recommendations.push({
                    priority: 'Medium',
                    area: 'Credit Utilization',
                    message: 'Monitor your credit utilization. Currently at ' + formatPercent(creditUtilization) + '%. Consider reducing balances to below 30%.'
                });
            }
            if (accountsNeedingAttention && accountsNeedingAttention.length > 0) {
                var highUtilAccounts = accountsNeedingAttention.filter(function(a) { return a.utilization > 70; });
                if (highUtilAccounts.length > 0) {
                    recommendations.push({
                        priority: 'High',
                        area: 'Account Management',
                        message: 'Pay down high utilization accounts. ' + highUtilAccounts.length + ' account(s) have utilization above 70%, which is hurting your score.'
                    });
                }
            }
            if (totalEnquiries > 10) {
                recommendations.push({
                    priority: 'Medium',
                    area: 'Credit Enquiries',
                    message: 'Limit new credit applications. You have ' + totalEnquiries + ' recent enquiries. Too many applications can lower your score.'
                });
            }
            if (paymentHistoryScore < 80) {
                recommendations.push({
                    priority: 'High',
                    area: 'Payment History',
                    message: 'Improve payment consistency. Your on-time payment rate is ' + formatPercent(paymentHistoryScore) + '%. Aim for 100% on-time payments.'
                });
            }
        }
        
        // Recommendations with Impact Analysis
        if (recommendations && recommendations.length > 0) {
            html += '        <div class="section">\n' +
                    '            <div class="section-title"><span class="section-icon">💡</span> AI-Powered Personalized Recommendations</div>\n' +
                    '            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">\n' +
                    '                <p style="font-size: 13px; color: #1e40af; margin: 0; line-height: 1.6;">\n' +
                    '                    <strong>🤖 AI Analysis:</strong> These recommendations are prioritized by potential impact on your credit score. ' +
                    'Actions marked as "High Priority" will have the biggest positive effect on your score. ' +
                    'Focus on completing high-priority items first for maximum improvement.\n' +
                    '                </p>\n' +
                    '            </div>\n' +
                    '            <div class="recommendations-list">\n';
            
            // Sort recommendations by priority (High first)
            var sortedRecs = recommendations.slice().sort(function(a, b) {
                var priorityOrder = { 'High': 1, 'Critical': 1, 'Medium': 2, 'Low': 3 };
                var aPriority = priorityOrder[a.priority] || 3;
                var bPriority = priorityOrder[b.priority] || 3;
                return aPriority - bPriority;
            });
            
            sortedRecs.forEach(function(rec, index) {
                if (!rec) return;
                var priority = (rec.priority || 'Medium').toLowerCase();
                var area = rec.area || 'General';
                var message = rec.message || 'No specific recommendation';
                
                // Estimate score impact based on priority
                var estimatedImpact = '';
                if (priority === 'high' || priority === 'critical') {
                    estimatedImpact = '<div style="margin-top: 8px; padding: 8px; background: rgba(239, 68, 68, 0.1); border-radius: 6px; font-size: 12px; color: #991b1b;"><strong>📈 Estimated Impact:</strong> +20 to +50 points if completed within 30 days</div>';
                } else if (priority === 'medium') {
                    estimatedImpact = '<div style="margin-top: 8px; padding: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 6px; font-size: 12px; color: #92400e;"><strong>📈 Estimated Impact:</strong> +10 to +25 points if completed within 60 days</div>';
                } else {
                    estimatedImpact = '<div style="margin-top: 8px; padding: 8px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; font-size: 12px; color: #1e40af;"><strong>📈 Estimated Impact:</strong> +5 to +15 points if completed within 90 days</div>';
                }
                
                html += '                <div class="recommendation-card ' + priority + '">\n' +
                        '                    <div class="rec-header">\n' +
                        '                        <div>\n' +
                        '                            <div class="rec-area">' + escapeHtml(String(area)) + '</div>\n' +
                        '                            <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">Recommendation #' + (index + 1) + ' of ' + sortedRecs.length + '</div>\n' +
                        '                        </div>\n' +
                        '                        <div class="rec-priority">' + escapeHtml(String(rec.priority || 'Medium')) + ' Priority</div>\n' +
                        '                    </div>\n' +
                        '                    <div class="rec-message">' + escapeHtml(String(message)) + '</div>\n' +
                        estimatedImpact +
                        '                </div>\n';
            });
            
            html += '            </div>\n';
            
            // Add Action Priority Summary
            var highPriorityCount = sortedRecs.filter(function(r) { return (r.priority || '').toLowerCase() === 'high' || (r.priority || '').toLowerCase() === 'critical'; }).length;
            var mediumPriorityCount = sortedRecs.filter(function(r) { return (r.priority || '').toLowerCase() === 'medium'; }).length;
            
            html += '            <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin-top: 25px; border: 2px solid #e5e7eb;">\n' +
                    '                <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 15px;">🎯 Action Priority Summary</h3>\n' +
                    '                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">\n' +
                    '                    <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">\n' +
                    '                        <div style="font-size: 32px; font-weight: 700; color: #ef4444;">' + highPriorityCount + '</div>\n' +
                    '                        <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">High Priority Actions</div>\n' +
                    '                        <div style="font-size: 11px; color: #991b1b; margin-top: 8px;">Complete these first</div>\n' +
                    '                    </div>\n' +
                    '                    <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">\n' +
                    '                        <div style="font-size: 32px; font-weight: 700; color: #f59e0b;">' + mediumPriorityCount + '</div>\n' +
                    '                        <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Medium Priority</div>\n' +
                    '                        <div style="font-size: 11px; color: #92400e; margin-top: 8px;">Next steps</div>\n' +
                    '                    </div>\n' +
                    '                    <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">\n' +
                    '                        <div style="font-size: 32px; font-weight: 700; color: #10b981;">' + sortedRecs.length + '</div>\n' +
                    '                        <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Total Recommendations</div>\n' +
                    '                        <div style="font-size: 11px; color: #065f46; margin-top: 8px;">All actionable items</div>\n' +
                    '                    </div>\n' +
                    '                </div>\n' +
                    '            </div>\n' +
                    '        </div>\n';
        }
        
        // Improvement Plan with Score Projections
        if (improvementPlan && improvementPlan.monthlyActions && improvementPlan.monthlyActions.length > 0) {
            html += '        <div class="section">\n' +
                    '            <div class="section-title"><span class="section-icon">📅</span> 6-Month Improvement Plan</div>\n' +
                    '            <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #e5e7eb;">\n' +
                    '                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">\n' +
                    '                    <div>\n' +
                    '                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Current Grade</div>\n' +
                    '                        <div style="font-size: 24px; font-weight: 700; color: ' + gradeColor + ';">' + grade + '</div>\n' +
                    '                        <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">Score: ' + (data.credit_score || 'N/A') + '</div>\n' +
                    '                    </div>\n' +
                    '                    <div style="text-align: center; flex: 1; margin: 0 20px;">\n' +
                    '                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Projected Score (6 months)</div>\n' +
                    '                        <div style="font-size: 32px; font-weight: 700; color: #10b981;">' + Math.min((data.credit_score || 650) + 50, 850) + '</div>\n' +
                    '                        <div style="font-size: 12px; color: #10b981; margin-top: 5px;">+' + Math.min(50, 850 - (data.credit_score || 650)) + ' points</div>\n' +
                    '                    </div>\n' +
                    '                    <div style="text-align: right;">\n' +
                    '                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Target Grade</div>\n' +
                    '                        <div style="font-size: 24px; font-weight: 700; color: #10b981;">' + (improvementPlan.targetGrade || grade) + '</div>\n' +
                    '                        <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">If plan followed</div>\n' +
                    '                    </div>\n' +
                    '                </div>\n' +
                    '                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin-top: 15px;">\n' +
                    '                    <p style="font-size: 13px; color: #065f46; margin: 0; line-height: 1.6;">\n' +
                    '                        <strong>📊 Score Projection:</strong> By following this plan consistently, your credit score is projected to improve by approximately ' +
                    Math.min(50, 850 - (data.credit_score || 650)) + ' points over 6 months. ' +
                    'This projection assumes you complete all high-priority recommendations and maintain good credit practices.\n' +
                    '                    </p>\n' +
                    '                </div>\n' +
                    '            </div>\n' +
                    '            <div class="plan-timeline">\n';
            
            var currentScore = data.credit_score || 650;
            improvementPlan.monthlyActions.slice(0, 6).forEach(function(month, idx) {
                var projectedScore = Math.min(currentScore + Math.floor((idx + 1) * 8), 850);
                var scoreIncrease = Math.floor((idx + 1) * 8);
                
                html += '                <div class="plan-month">\n' +
                        '                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">\n' +
                        '                        <div class="plan-month-title">Month ' + month.month + '</div>\n' +
                        '                        <div style="font-size: 14px; font-weight: 600; color: #10b981;">Projected: ' + projectedScore + ' (+' + scoreIncrease + ')</div>\n' +
                        '                    </div>\n' +
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
            
            html += '            </div>\n';
            
            // Add Key Milestones
            html += '            <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin-top: 25px; border-left: 5px solid #f59e0b;">\n' +
                    '                <h3 style="font-size: 16px; font-weight: 600; color: #92400e; margin-bottom: 15px;">🎯 Key Milestones</h3>\n' +
                    '                <div style="display: grid; gap: 12px;">\n';
            
            var milestones = [
                { month: 1, text: 'Complete all high-priority recommendations', score: Math.min(currentScore + 10, 850) },
                { month: 3, text: 'Clear all overdue accounts', score: Math.min(currentScore + 25, 850) },
                { month: 6, text: 'Reach target grade ' + (improvementPlan.targetGrade || grade), score: Math.min(currentScore + 50, 850) }
            ];
            
            milestones.forEach(function(milestone) {
                html += '                    <div style="background: white; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">\n' +
                        '                        <div>\n' +
                        '                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Month ' + milestone.month + '</div>\n' +
                        '                            <div style="font-size: 13px; color: #6b7280;">' + escapeHtml(String(milestone.text)) + '</div>\n' +
                        '                        </div>\n' +
                        '                        <div style="text-align: right;">\n' +
                        '                            <div style="font-size: 20px; font-weight: 700; color: #10b981;">' + milestone.score + '</div>\n' +
                        '                            <div style="font-size: 11px; color: #6b7280;">Projected Score</div>\n' +
                        '                        </div>\n' +
                        '                    </div>\n';
            });
            
            html += '                </div>\n' +
                    '            </div>\n' +
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
            
            enquiries.slice(0, 25).forEach(function(enq) {
                html += '                    <tr>\n' +
                        '                        <td>' + escapeHtml(String(enq.enquiryDate || 'N/A')) + '</td>\n' +
                        '                        <td>' + escapeHtml(String(enq.memberShortName || 'N/A')) + '</td>\n' +
                        '                        <td>' + escapeHtml(String(enq.enquiryPurpose || 'N/A')) + '</td>\n' +
                        '                        <td>' + (enq.enquiryAmount ? formatCurrency(enq.enquiryAmount) : 'N/A') + '</td>\n' +
                        '                    </tr>\n';
            });
            
            html += '                </tbody>\n' +
                    '            </table>\n';
            
            if (enquiries.length > 25) {
                html += '            <div style="margin-top: 15px; text-align: center; color: #6b7280; font-size: 12px;">Showing 25 of ' + enquiries.length + ' enquiries</div>\n';
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

