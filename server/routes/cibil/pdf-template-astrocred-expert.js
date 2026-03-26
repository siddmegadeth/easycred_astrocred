(function () {
    'use strict';

    function escapeHtml(value) {
        return String(value === undefined || value === null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function money(value) {
        var amount = typeof value === 'number' && !isNaN(value) ? value : 0;
        return 'Rs ' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }

    function percent(value) {
        var numeric = typeof value === 'number' && !isNaN(value) ? value : 0;
        return numeric.toFixed(1) + '%';
    }

    function renderBulletCards(items, tone, emptyText) {
        if (!items || !items.length) return '<p class="muted">' + escapeHtml(emptyText || 'No items available') + '</p>';
        return items.map(function (item) {
            return '<div class="bullet-card ' + tone + '">' + escapeHtml(item) + '</div>';
        }).join('');
    }

    function renderRecommendationRows(items) {
        if (!items || !items.length) {
            return '<tr><td colspan="4">No recommendations generated from the current analysis object.</td></tr>';
        }

        return items.map(function (item) {
            return '' +
                '<tr>' +
                '<td>' + escapeHtml(item.priority || item.severity || 'Action') + '</td>' +
                '<td>' + escapeHtml(item.category || item.area || 'General') + '</td>' +
                '<td>' + escapeHtml(item.action || item.message || item.description || 'N/A') + '</td>' +
                '<td>' + escapeHtml(item.timeline || item.impact || 'N/A') + '</td>' +
                '</tr>';
        }).join('');
    }

    function renderActionRows(items) {
        if (!items || !items.length) {
            return '<tr><td colspan="4">No structured action plan was generated.</td></tr>';
        }

        return items.map(function (item) {
            return '' +
                '<tr>' +
                '<td>' + escapeHtml(item.title) + '</td>' +
                '<td>' + escapeHtml(item.why) + '</td>' +
                '<td>' + escapeHtml(item.target) + '</td>' +
                '<td>' + escapeHtml(item.impact) + '</td>' +
                '</tr>';
        }).join('');
    }

    function renderRiskAccounts(accounts) {
        if (!accounts || !accounts.length) {
            return '<tr><td colspan="7">No high-risk accounts were isolated from the current normalized dataset.</td></tr>';
        }

        return accounts.map(function (account) {
            return '' +
                '<tr>' +
                '<td>' + escapeHtml(account.lender) + '</td>' +
                '<td>' + escapeHtml(account.type) + '</td>' +
                '<td>' + escapeHtml(account.status) + '</td>' +
                '<td>' + money(account.currentBalance) + '</td>' +
                '<td>' + money(account.overdue) + '</td>' +
                '<td>' + percent(account.utilizationPercent) + '</td>' +
                '<td>' + escapeHtml(account.paymentSummary.remarks) + '</td>' +
                '</tr>';
        }).join('');
    }

    function renderBankSuggestions(banks) {
        if (!banks || !banks.length) return '<p class="muted">No lender recommendation list is available in the current analysis cache.</p>';
        return banks.map(function (bank) {
            return '' +
                '<div class="bank-card">' +
                '<div class="bank-name">' + escapeHtml(bank.name || 'Institution') + '</div>' +
                '<div class="bank-meta">Lender score: ' + escapeHtml(bank.probability || bank.approvalChance || bank.matchScore || 'N/A') + '</div>' +
                '<div class="bank-meta">Products: ' + escapeHtml((bank.loanTypes || bank.products || []).join(', ') || 'N/A') + '</div>' +
                '</div>';
        }).join('');
    }

    function renderProductMatches(matches) {
        if (!matches || !matches.length) return '<p class="muted">No product match analysis was generated.</p>';
        return matches.map(function (match) {
            return '' +
                '<div class="bank-card">' +
                '<div class="bank-name">' + escapeHtml(match.product) + '</div>' +
                '<div class="bank-meta">Match score: ' + escapeHtml(match.matchScore) + '/100</div>' +
                '<div class="bank-meta">Verdict: ' + escapeHtml(match.verdict) + '</div>' +
                '<div class="bank-meta">' + escapeHtml(match.note) + '</div>' +
                '</div>';
        }).join('');
    }

    function scoreTone(score) {
        var numeric = Number(score || 0);
        if (numeric >= 750) return '#0f766e';
        if (numeric >= 700) return '#1d4ed8';
        if (numeric >= 650) return '#b45309';
        return '#b91c1c';
    }

    function safe(value, fallback) {
        return (value === undefined || value === null || value === '') ? fallback : value;
    }

    function renderDriverMeters(drivers) {
        return (drivers || []).map(function (driver) {
            var tone = driver.impact === 'Helping' ? '#16a34a' : driver.impact === 'Neutral' ? '#d97706' : '#dc2626';
            return '' +
                '<div class="driver-card">' +
                '<div class="driver-top"><strong>' + escapeHtml(driver.label) + '</strong><span style="color:' + tone + ';font-weight:700;">' + escapeHtml(driver.impact) + '</span></div>' +
                '<div class="driver-meter"><span style="width:' + Math.max(6, Math.min(100, driver.score)) + '%;background:' + tone + ';"></span></div>' +
                '<div class="bank-meta">Driver score: ' + escapeHtml(Math.round(driver.score || 0)) + '/100</div>' +
                '<div class="bank-meta">' + escapeHtml(driver.detail) + '</div>' +
                '</div>';
        }).join('');
    }

    function narrative(report) {
        var score = Number(report.score.creditScore || 0);
        var utilization = report.summary.utilizationPercent;
        var defaultAccounts = report.summary.defaultAccounts;
        var recentEnquiries = report.summary.recentEnquiries6m;
        var parts = [];

        if (score >= 750) {
            parts.push('The file currently sits in a strong score band, which means the score itself is not the main obstacle.');
        } else if (score >= 700) {
            parts.push('The score is workable, but lender confidence will still depend on recent utilization, payment conduct, and enquiry behavior.');
        } else {
            parts.push('The score is below the comfort band for many lenders, so negative bureau signals are still outweighing positive history.');
        }

        if (defaultAccounts > 0) {
            parts.push('The biggest pressure point is the presence of overdue or high-risk accounts, which can dominate the lender reading of the profile.');
        }

        if (utilization > 30) {
            parts.push('High utilization is likely reducing the score because the profile appears dependent on available revolving credit.');
        } else if (utilization > 0) {
            parts.push('Utilization is not excessive, which is one stabilizing factor in the report.');
        }

        if (recentEnquiries >= 4) {
            parts.push('Recent enquiry intensity also suggests active credit seeking, which can weaken underwriting confidence temporarily.');
        }

        return parts.join(' ');
    }

    function generateExpertReviewHTML(report) {
        var scoreAccent = scoreTone(report.score.creditScore);
        var riskReport = report.analysis.riskReport || {};
        var executiveSummary = riskReport.executiveSummary || {};
        var creditAssessment = riskReport.creditAssessment || {};
        var defaultProbability = (creditAssessment.defaultProbability) || (report.analysis.riskDetails.defaultProbability) || {};
        var creditWorthiness = (creditAssessment.creditWorthiness) || (report.analysis.riskDetails.creditWorthiness) || {};
        var improvementRoadmap = riskReport.improvementRoadmap || {};
        var improvementPlan = report.analysis.improvementPlan || {};
        var targetGrade = improvementPlan.targetGrade || improvementRoadmap.targetGrade || 'Better than current';
        var riskLevel = defaultProbability.riskLevel || riskReport.riskAnalysis && riskReport.riskAnalysis.overallRiskLevel || 'N/A';
        var verdict = report.verdict || {};

        return '' +
            '<!DOCTYPE html>' +
            '<html>' +
            '<head>' +
            '<meta charset="UTF-8" />' +
            '<title>ASTROCRED Expert Review</title>' +
            '<style>' +
            '*{box-sizing:border-box;} body{margin:0;font-family:Arial,sans-serif;background:#f4f7fb;color:#162033;} .page{padding:28px 30px;} .hero{background:linear-gradient(135deg,#111827,#7c3aed);color:#fff;border-radius:22px;padding:28px 30px;margin-bottom:18px;} .hero-grid{display:grid;grid-template-columns:1.4fr .6fr;gap:18px;align-items:end;} .hero-title{font-size:30px;font-weight:800;line-height:1.1;margin:0;} .hero-copy{margin-top:12px;color:#ddd6fe;font-size:14px;line-height:1.6;} .hero-score{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:18px;padding:18px;text-align:center;} .score-value{font-size:52px;font-weight:800;color:#fff;} .score-meta{margin-top:6px;font-size:13px;color:#e9d5ff;} .section{background:#fff;border-radius:18px;padding:20px 22px;margin-bottom:16px;box-shadow:0 10px 24px rgba(15,23,42,.06);} .section-title{font-size:20px;font-weight:800;margin:0 0 14px;color:#111827;} .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;} .kpi{background:#f8fafc;border:1px solid #dbe4ef;border-radius:14px;padding:14px 16px;} .kpi-value{font-size:28px;font-weight:800;color:' + scoreAccent + ';line-height:1.1;} .kpi-label{margin-top:6px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;} .narrative{font-size:15px;line-height:1.7;color:#1f2937;} .split{display:grid;grid-template-columns:1fr 1fr;gap:16px;} .bullet-card{border-radius:14px;padding:12px 14px;margin-bottom:10px;border:1px solid #dbe4ef;background:#f8fafc;font-size:14px;line-height:1.5;} .bullet-card.good{background:#ecfdf5;border-color:#a7f3d0;} .bullet-card.warn{background:#fffbeb;border-color:#fcd34d;} .bullet-card.bad{background:#fef2f2;border-color:#fca5a5;} .muted{color:#64748b;} table{width:100%;border-collapse:collapse;} th{background:#e5e7eb;color:#111827;font-size:11px;text-transform:uppercase;letter-spacing:.08em;padding:10px 8px;text-align:left;vertical-align:top;} td{padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;vertical-align:top;} tr:nth-child(even) td{background:#f8fafc;} .table-wrap{overflow:hidden;border:1px solid #dbe4ef;border-radius:16px;} .roadmap-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;} .roadmap-card{background:#f8fafc;border:1px solid #dbe4ef;border-radius:14px;padding:14px 16px;} .roadmap-title{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:8px;} .roadmap-target{font-size:24px;font-weight:800;color:#111827;margin-bottom:6px;} .bank-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;} .bank-card{background:#f8fafc;border:1px solid #dbe4ef;border-radius:14px;padding:14px;} .bank-name{font-weight:800;margin-bottom:8px;} .bank-meta{font-size:13px;color:#475569;line-height:1.5;} .driver-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;} .driver-card{background:#f8fafc;border:1px solid #dbe4ef;border-radius:14px;padding:14px;} .driver-top{display:flex;justify-content:space-between;gap:10px;align-items:center;} .driver-meter{height:10px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin:10px 0 8px;} .driver-meter span{display:block;height:100%;border-radius:999px;} .verdict-banner{background:#0f172a;color:#fff;border-radius:16px;padding:18px 20px;margin-bottom:14px;} .verdict-head{font-size:22px;font-weight:800;margin-bottom:6px;} .footer{padding:18px 4px 2px;text-align:center;color:#64748b;font-size:11px;} @media print{body{background:#fff;} .section{box-shadow:none;border:1px solid #dbe4ef;} .page{padding:18px;}}' +
            '</style>' +
            '</head>' +
            '<body>' +
            '<div class="page">' +
            '<div class="hero">' +
            '<div class="hero-grid">' +
            '<div>' +
            '<h1 class="hero-title">ASTROCRED Expert Credit Review</h1>' +
            '<div class="hero-copy">Prepared for ' + escapeHtml(report.profile.name) + '. This is the interpretation report: what the bureau data is saying, where the score is under pressure, and what actions are most likely to improve it.</div>' +
            '<div class="hero-copy" style="margin-top:10px;">' + escapeHtml(narrative(report)) + '</div>' +
            '</div>' +
            '<div class="hero-score">' +
            '<div class="score-value">' + escapeHtml(report.score.creditScoreLabel) + '</div>' +
            '<div class="score-meta">Grade ' + escapeHtml(report.score.grade) + ' | ' + escapeHtml(report.score.band) + '</div>' +
            '<div class="score-meta">Generated on ' + escapeHtml(report.generatedAtLabel) + '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +

            '<div class="verdict-banner">' +
            '<div class="verdict-head">' + escapeHtml(verdict.headline || 'Credit review') + '</div>' +
            '<div>' + escapeHtml(verdict.summary || executiveSummary.overallAssessment || 'This profile needs review against current lender appetite.') + '</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">Analyst Verdict</h2>' +
            '<div class="kpi-grid">' +
            '<div class="kpi"><div class="kpi-value">' + escapeHtml(safe(riskLevel, 'N/A')) + '</div><div class="kpi-label">Risk level</div></div>' +
            '<div class="kpi"><div class="kpi-value">' + escapeHtml(safe(defaultProbability.probability || defaultProbability.defaultProbability, 'N/A')) + '</div><div class="kpi-label">Default probability</div></div>' +
            '<div class="kpi"><div class="kpi-value">' + escapeHtml(safe(creditWorthiness.score, 'N/A')) + '</div><div class="kpi-label">Credit worthiness</div></div>' +
            '<div class="kpi"><div class="kpi-value">' + escapeHtml(targetGrade) + '</div><div class="kpi-label">Reachable target grade</div></div>' +
            '</div>' +
            '<div class="narrative" style="margin-top:14px;">' + escapeHtml(executiveSummary.overallAssessment || 'No executive summary is available in the current risk object.') + '</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">What Is Happening Around Your CIBIL</h2>' +
            '<div class="split">' +
            '<div>' +
            renderBulletCards(report.observations.whatIsHappening, 'warn', 'No special pressure points were detected from the normalized analysis.') +
            '</div>' +
            '<div>' +
            renderBulletCards(report.observations.positives, 'good', 'No major strengths were extracted.') +
            '</div>' +
            '</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">Core Concerns and Why They Matter</h2>' +
            renderBulletCards(report.observations.concerns, 'bad', 'No major credit concerns were extracted from the current data object.') +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">Immediate Action Plan</h2>' +
            '<div class="table-wrap">' +
            '<table>' +
            '<thead><tr><th>Action</th><th>Why it matters</th><th>Target</th><th>Expected result</th></tr></thead>' +
            '<tbody>' + renderActionRows(report.actionPlan) + '</tbody>' +
            '</table>' +
            '</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">What To Stop Doing</h2>' +
            renderBulletCards(report.observations.whatToAvoid, 'bad', 'No avoid-list was generated.') +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">Score Driver Breakdown</h2>' +
            '<div class="driver-grid">' + renderDriverMeters(report.scoreDrivers) + '</div>' +
            '<div class="narrative" style="margin-top:14px;">Payment behavior, utilization, and recent account conduct are the areas that usually move the score fastest. Age and mix improve more slowly but add stability once the file is clean.</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">Accounts Requiring Maximum Attention</h2>' +
            '<div class="table-wrap">' +
            '<table>' +
            '<thead><tr><th>Lender</th><th>Type</th><th>Status</th><th>Balance</th><th>Overdue</th><th>Utilization</th><th>Observation</th></tr></thead>' +
            '<tbody>' + renderRiskAccounts(report.topRiskAccounts) + '</tbody>' +
            '</table>' +
            '</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">ASTROCRED Recommendations</h2>' +
            '<div class="table-wrap">' +
            '<table>' +
            '<thead><tr><th>Priority</th><th>Area</th><th>Action</th><th>Timeline / impact</th></tr></thead>' +
            '<tbody>' + renderRecommendationRows(report.analysis.recommendations) + '</tbody>' +
            '</table>' +
            '</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">Expected Improvement Window</h2>' +
            '<div class="roadmap-grid">' +
            '<div class="roadmap-card"><div class="roadmap-title">Potential score uplift</div><div class="roadmap-target">' + escapeHtml(report.improvementPotential.low + ' to ' + report.improvementPotential.high + ' points') + '</div><div class="muted">This is an estimated range based on visible overdue, utilization, and enquiry pressure.</div></div>' +
            '<div class="roadmap-card"><div class="roadmap-title">Target grade</div><div class="roadmap-target">' + escapeHtml(targetGrade) + '</div><div class="muted">Taken from the current improvement plan or derived roadmap.</div></div>' +
            '<div class="roadmap-card"><div class="roadmap-title">Current utilization</div><div class="roadmap-target">' + percent(report.summary.utilizationPercent) + '</div><div class="muted">Pay down about ' + money(report.summary.paydownToThirtyPercent) + ' to move closer to the 30% target.</div></div>' +
            '<div class="roadmap-card"><div class="roadmap-title">Recent enquiries in 6 months</div><div class="roadmap-target">' + escapeHtml(report.summary.recentEnquiries6m) + '</div><div class="muted">Allow enquiry pressure to cool before applying again.</div></div>' +
            '</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">Lender and Product Readiness</h2>' +
            '<div class="split">' +
            '<div>' +
            '<div class="roadmap-card">' +
            '<div class="roadmap-title">Eligible institutions</div>' +
            '<div class="roadmap-target">' + escapeHtml((report.analysis.riskDetails.eligibleInstitutions || []).length || 0) + '</div>' +
            '<div class="muted">Use this as a guide only. Final approval still depends on lender policy, income, and document quality.</div>' +
            '</div>' +
            '<div class="roadmap-card" style="margin-top:12px;">' +
            '<div class="roadmap-title">Summary judgment</div>' +
            '<div class="muted">' + escapeHtml(executiveSummary.recommendation || 'No final recommendation is available in the current risk report.') + '</div>' +
            '</div>' +
            '</div>' +
            '<div>' +
            '<div class="bank-grid">' + renderBankSuggestions(report.analysis.bankSuggestions) + '</div>' +
            '</div>' +
            '</div>' +
            '<div style="margin-top:16px;"><div class="bank-grid">' + renderProductMatches(report.productMatches) + '</div></div>' +
            '</div>' +

            '<div class="footer">ASTROCRED Expert Review. This document is an interpretive analysis based on the stored bureau data and the application&apos;s internal credit analytics. It should be read as a decision-support report, not as a lender guarantee.</div>' +
            '</div>' +
            '</body>' +
            '</html>';
    }

    module.exports = generateExpertReviewHTML;
})();
