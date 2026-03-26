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

    function riskClass(risk) {
        var text = String(risk || '').toLowerCase();
        if (text === 'high') return 'tag-red';
        if (text === 'medium') return 'tag-amber';
        return 'tag-green';
    }

    function scoreColor(score) {
        var numeric = Number(score || 0);
        if (numeric >= 750) return '#0f766e';
        if (numeric >= 700) return '#2563eb';
        if (numeric >= 650) return '#d97706';
        return '#dc2626';
    }

    function renderList(items, emptyText) {
        if (!items || !items.length) return '<p class="muted">' + escapeHtml(emptyText || 'No data available') + '</p>';
        return '<ul class="bullet-list">' + items.map(function (item) {
            return '<li>' + escapeHtml(item) + '</li>';
        }).join('') + '</ul>';
    }

    function renderInfoCard(label, value) {
        var safe = (value === undefined || value === null || value === '') ? 'N/A' : value;
        return '' +
            '<div class="info-card">' +
            '<div class="info-label">' + escapeHtml(label) + '</div>' +
            '<div class="info-value">' + escapeHtml(safe) + '</div>' +
            '</div>';
    }

    function renderDriverCards(drivers) {
        return (drivers || []).map(function (driver) {
            var tone = driver.impact === 'Helping' ? '#16a34a' : driver.impact === 'Neutral' ? '#d97706' : '#dc2626';
            return '' +
                '<div class="driver-card">' +
                '<div class="driver-head"><span>' + escapeHtml(driver.label) + '</span><strong style="color:' + tone + ';">' + escapeHtml(driver.impact) + '</strong></div>' +
                '<div class="driver-bar"><span style="width:' + Math.max(6, Math.min(100, driver.score)) + '%;background:' + tone + ';"></span></div>' +
                '<div class="driver-meta">Score ' + escapeHtml(Math.round(driver.score || 0)) + ' / 100</div>' +
                '<div class="muted small" style="margin-top:6px;">' + escapeHtml(driver.detail) + '</div>' +
                '</div>';
        }).join('');
    }

    function renderAccountTableRows(accounts) {
        return accounts.map(function (account) {
            return '' +
                '<tr>' +
                '<td>' + escapeHtml(account.lender) + '</td>' +
                '<td>' + escapeHtml(account.friendlyType || account.type) + '</td>' +
                '<td>' + escapeHtml(account.accountNumber) + '</td>' +
                '<td>' + escapeHtml(account.ownership) + '</td>' +
                '<td>' + escapeHtml(account.status) + '</td>' +
                '<td>' + escapeHtml(account.healthStatus) + '</td>' +
                '<td>' + escapeHtml(account.openedOnLabel) + '</td>' +
                '<td>' + escapeHtml(account.ageLabel) + '</td>' +
                '<td>' + money(account.highCredit) + '</td>' +
                '<td>' + money(account.currentBalance) + '</td>' +
                '<td>' + money(account.overdue) + '</td>' +
                '<td>' + escapeHtml(account.lastPaymentDateLabel) + '</td>' +
                '<td>' + escapeHtml(account.paymentSummary.remarks) + '</td>' +
                '</tr>';
        }).join('');
    }

    function renderEnquiryRows(enquiries) {
        return enquiries.map(function (enquiry) {
            return '' +
                '<tr>' +
                '<td>' + escapeHtml(enquiry.dateLabel) + '</td>' +
                '<td>' + escapeHtml(enquiry.institution) + '</td>' +
                '<td>' + escapeHtml(enquiry.purposeLabel) + '<div class="muted small">Raw code: ' + escapeHtml(enquiry.purpose) + '</div></td>' +
                '<td>' + money(enquiry.amount) + '</td>' +
                '</tr>';
        }).join('');
    }

    function renderAddresses(addresses) {
        if (!addresses || !addresses.length) return '<p class="muted">No address history available.</p>';
        return addresses.map(function (address) {
            return '' +
                '<div class="stack-card">' +
                '<div class="stack-title">' + escapeHtml(address.category) + '</div>' +
                '<div>' + escapeHtml(address.full || 'N/A') + '</div>' +
                '<div class="muted small">Reported on ' + escapeHtml(address.dateReported) + '</div>' +
                '</div>';
        }).join('');
    }

    function renderEmployment(items) {
        if (!items || !items.length) return '<p class="muted">No employment information available.</p>';
        return items.map(function (item) {
            return '' +
                '<div class="stack-card">' +
                '<div class="stack-title">' + escapeHtml(item.organization) + '</div>' +
                '<div>Occupation: ' + escapeHtml(item.occupationLabel) + '</div>' +
                '<div class="muted small">Occupation code: ' + escapeHtml(item.occupationCode) + '</div>' +
                '<div class="muted small">Reported on ' + escapeHtml(item.reportedOn) + '</div>' +
                '</div>';
        }).join('');
    }

    function renderReasonCodes(items) {
        if (!items || !items.length) return '<p class="muted">No bureau reason codes available in the current record.</p>';
        return items.map(function (item) {
            return '' +
                '<div class="reason-card">' +
                '<div class="reason-rank">Reason ' + escapeHtml(item.rank) + '</div>' +
                '<div class="reason-code">' + escapeHtml(item.code) + '</div>' +
                '<div>' + escapeHtml(item.description) + '</div>' +
                '</div>';
        }).join('');
    }

    function generateDetailedCibilHTML(report) {
        var scoreAccent = scoreColor(report.score.creditScore);
        var consumerSummary = report.bureau.consumerSummary || {};
        var accountSummary = consumerSummary.accountSummary || {};
        var inquirySummary = consumerSummary.inquirySummary || {};

        return '' +
            '<!DOCTYPE html>' +
            '<html>' +
            '<head>' +
            '<meta charset="UTF-8" />' +
            '<title>CIBIL Detailed Report</title>' +
            '<style>' +
            '*{box-sizing:border-box;} body{margin:0;font-family:Arial,sans-serif;color:#172033;background:#eef3f8;} .page{padding:28px 30px;} .hero{background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#fff;border-radius:20px;padding:26px 28px;margin-bottom:18px;} .hero-top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;} .brand{font-size:28px;font-weight:700;letter-spacing:0.08em;} .subtitle{margin-top:6px;color:#cbd5e1;font-size:13px;} .report-meta{text-align:right;font-size:12px;color:#dbeafe;} .score-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:14px;margin-top:18px;} .metric{background:#fff;border-radius:16px;padding:16px;color:#0f172a;min-height:100px;} .metric-score{font-size:44px;font-weight:700;color:' + scoreAccent + ';line-height:1;} .metric-label{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-top:8px;} .section{background:#fff;border-radius:18px;padding:20px 22px;margin-bottom:16px;box-shadow:0 8px 24px rgba(15,23,42,.06);} .section-title{font-size:20px;font-weight:700;margin:0 0 16px;color:#0f172a;} .info-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;} .info-card{background:#f8fafc;border:1px solid #dbe4ef;border-radius:14px;padding:12px 14px;} .info-label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:6px;} .info-value{font-size:14px;font-weight:700;color:#0f172a;word-break:break-word;} .two-col{display:grid;grid-template-columns:1.2fr .8fr;gap:16px;} .stack-card{background:#f8fafc;border:1px solid #dbe4ef;border-radius:14px;padding:12px 14px;margin-bottom:10px;} .stack-title{font-weight:700;margin-bottom:4px;} .muted{color:#64748b;} .small{font-size:12px;} .bullet-list{margin:0;padding-left:18px;} .bullet-list li{margin-bottom:8px;} table{width:100%;border-collapse:collapse;} th{background:#e2e8f0;color:#0f172a;font-size:11px;text-transform:uppercase;letter-spacing:.08em;padding:10px 8px;text-align:left;vertical-align:top;} td{padding:10px 8px;border-bottom:1px solid #e2e8f0;font-size:12px;vertical-align:top;} tr:nth-child(even) td{background:#f8fafc;} .table-wrap{overflow:hidden;border-radius:16px;border:1px solid #dbe4ef;} .reason-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;} .reason-card{background:#f8fafc;border:1px solid #dbe4ef;border-radius:14px;padding:14px;} .reason-rank{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:6px;} .reason-code{font-size:22px;font-weight:700;color:#0f172a;margin-bottom:8px;} .driver-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;} .driver-card{background:#f8fafc;border:1px solid #dbe4ef;border-radius:14px;padding:14px;} .driver-head{display:flex;justify-content:space-between;gap:10px;font-weight:700;} .driver-bar{height:10px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-top:10px;} .driver-bar span{display:block;height:100%;border-radius:999px;} .driver-meta{margin-top:8px;font-size:12px;color:#475569;} .tag{display:inline-block;padding:5px 10px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;} .tag-green{background:#dcfce7;color:#166534;} .tag-amber{background:#fef3c7;color:#92400e;} .tag-red{background:#fee2e2;color:#991b1b;} .footer{padding:18px 6px 4px;color:#64748b;font-size:11px;text-align:center;} @media print{body{background:#fff;} .section{box-shadow:none;border:1px solid #dbe4ef;} .page{padding:18px;}}' +
            '</style>' +
            '</head>' +
            '<body>' +
            '<div class="page">' +
            '<div class="hero">' +
            '<div class="hero-top">' +
            '<div>' +
            '<div class="brand">ASTROCRED</div>' +
            '<div class="subtitle">Detailed CIBIL report built from the stored bureau record and normalized account data</div>' +
            '</div>' +
            '<div class="report-meta">' +
            '<div>Report ID: ' + escapeHtml(report.reportId) + '</div>' +
            '<div>Generated: ' + escapeHtml(report.generatedAtLabel) + '</div>' +
            '<div>Profile: ' + escapeHtml(report.profile.name) + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="score-grid">' +
            '<div class="metric"><div class="metric-score">' + escapeHtml(report.score.creditScoreLabel) + '</div><div class="metric-label">Credit Score</div></div>' +
            '<div class="metric"><div class="metric-score" style="font-size:34px;">' + escapeHtml(report.score.grade) + '</div><div class="metric-label">Overall Grade</div></div>' +
            '<div class="metric"><div class="metric-score" style="font-size:30px;">' + percent(report.summary.utilizationPercent) + '</div><div class="metric-label">Utilization</div></div>' +
            '<div class="metric"><div class="metric-score" style="font-size:30px;">' + escapeHtml(report.summary.totalAccounts) + '</div><div class="metric-label">Total Accounts</div></div>' +
            '</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">What These Numbers Mean</h2>' +
            '<div class="two-col">' +
            '<div>' + renderList(report.observations.concerns, 'No major stress signal was extracted from the current bureau snapshot.') + '</div>' +
            '<div>' + renderList(report.observations.positives, 'No major strength was extracted from the current bureau snapshot.') + '</div>' +
            '</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">Consumer Identity and Profile</h2>' +
            '<div class="info-grid">' +
            renderInfoCard('Full name', report.profile.name) +
            renderInfoCard('PAN', report.profile.pan) +
            renderInfoCard('Mobile', report.profile.mobile) +
            renderInfoCard('Email', report.profile.email) +
            renderInfoCard('Date of birth', report.profile.dateOfBirth) +
            renderInfoCard('Gender', report.profile.gender) +
            renderInfoCard('Control number', report.profile.controlNumber) +
            renderInfoCard('Score band', report.score.band) +
            '</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">Portfolio Summary</h2>' +
            '<div class="info-grid">' +
            renderInfoCard('Active accounts', report.summary.activeAccounts) +
            renderInfoCard('Closed accounts', report.summary.closedAccounts) +
            renderInfoCard('Overdue accounts', report.summary.overdueAccounts) +
            renderInfoCard('High-risk accounts', report.summary.defaultAccounts) +
            renderInfoCard('Total high credit', money(report.summary.totalHighCredit)) +
            renderInfoCard('Total current balance', money(report.summary.totalBalance)) +
            renderInfoCard('Total overdue', money(report.summary.totalOverdue)) +
            renderInfoCard('Oldest account age', report.summary.oldestAccountAgeLabel) +
            renderInfoCard('Average account age', report.summary.averageAccountAgeLabel) +
            renderInfoCard('Secured accounts', report.summary.securedAccounts) +
            renderInfoCard('Unsecured accounts', report.summary.unsecuredAccounts) +
            renderInfoCard('Recent enquiries 6m', report.summary.recentEnquiries6m) +
            renderInfoCard('Unsecured share', percent(report.summary.unsecuredSharePercent)) +
            renderInfoCard('Paydown to reach 30%', money(report.summary.paydownToThirtyPercent)) +
            '</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">Score Drivers and Bureau Reasons</h2>' +
            '<div class="two-col">' +
            '<div>' +
            '<div class="driver-grid">' + renderDriverCards(report.scoreDrivers) + '</div>' +
            '<div class="stack-card" style="margin-top:12px;">' +
            '<div class="stack-title">Payment analysis</div>' +
            '<div>On-time payments: ' + escapeHtml(report.analysis.paymentAnalysis.onTime || 0) + '</div>' +
            '<div>Delayed payments: ' + escapeHtml(report.analysis.paymentAnalysis.delayed || 0) + '</div>' +
            '<div>Missed payments: ' + escapeHtml(report.analysis.paymentAnalysis.missed || 0) + '</div>' +
            '<div>On-time rate: ' + percent(report.analysis.paymentAnalysis.onTimePercentage || 0) + '</div>' +
            '</div>' +
            '</div>' +
            '<div>' +
            '<div class="reason-grid">' + renderReasonCodes(report.bureau.reasonCodes) + '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">Address, ID and Employment Trail</h2>' +
            '<div class="two-col">' +
            '<div>' +
            '<div class="stack-title" style="margin-bottom:8px;">Address history</div>' +
            renderAddresses(report.profile.addresses) +
            '</div>' +
            '<div>' +
            '<div class="stack-title" style="margin-bottom:8px;">Employment</div>' +
            renderEmployment(report.profile.employment) +
            '<div class="stack-title" style="margin:16px 0 8px;">Identifiers</div>' +
            renderList((report.profile.ids || []).map(function (item) { return item.type + ': ' + item.value; }), 'No additional IDs available') +
            '<div class="stack-title" style="margin:16px 0 8px;">Phones and emails</div>' +
            renderList((report.profile.phones || []).map(function (item) { return item.type + ': ' + item.number; }).concat(report.profile.emails || []), 'No contact trail available') +
            '</div>' +
            '</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">Consumer Summary Snapshot</h2>' +
            '<div class="info-grid">' +
            renderInfoCard('Bureau score name', report.summary.scoreName) +
            renderInfoCard('Account summary total', accountSummary.total || accountSummary.totalAccounts || report.summary.totalAccounts) +
            renderInfoCard('Open accounts', accountSummary.open || accountSummary.openAccounts || report.summary.activeAccounts) +
            renderInfoCard('Delinquent accounts', accountSummary.delinquent || accountSummary.delinquentAccounts || report.summary.defaultAccounts) +
            renderInfoCard('Recent enquiries', inquirySummary.recent || inquirySummary.last30Days || report.summary.recentEnquiries3m) +
            renderInfoCard('Total enquiries', inquirySummary.total || report.enquiries.length) +
            renderInfoCard('Credit history age', report.score.creditAgeLabel) +
            renderInfoCard('Risk posture', report.summary.defaultAccounts > 0 ? 'Under pressure' : 'Stable') +
            '</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">Normalized Credit Account Register</h2>' +
            '<div class="table-wrap">' +
            '<table>' +
            '<thead>' +
            '<tr>' +
            '<th>Lender</th><th>Type</th><th>Account</th><th>Ownership</th><th>Status</th><th>Health</th><th>Opened</th><th>Age</th><th>High credit</th><th>Balance</th><th>Overdue</th><th>Last payment</th><th>Payment summary</th>' +
            '</tr>' +
            '</thead>' +
            '<tbody>' + renderAccountTableRows(report.accounts) + '</tbody>' +
            '</table>' +
            '</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">Top Risk Accounts</h2>' +
            '<div class="table-wrap">' +
            '<table>' +
            '<thead>' +
            '<tr><th>Lender</th><th>Type</th><th>Status</th><th>Risk</th><th>Balance</th><th>Overdue</th><th>Utilization</th><th>Observation</th></tr>' +
            '</thead>' +
            '<tbody>' +
            (report.topRiskAccounts || []).map(function (account) {
                return '<tr>' +
                    '<td>' + escapeHtml(account.lender) + '</td>' +
                    '<td>' + escapeHtml(account.friendlyType || account.type) + '</td>' +
                    '<td>' + escapeHtml(account.status) + '</td>' +
                    '<td><span class="tag ' + riskClass(account.riskBucket) + '">' + escapeHtml(account.riskBucket) + '</span></td>' +
                    '<td>' + money(account.currentBalance) + '</td>' +
                    '<td>' + money(account.overdue) + '</td>' +
                    '<td>' + percent(account.utilizationPercent) + '</td>' +
                    '<td>' + escapeHtml(account.healthReason) + '</td>' +
                    '</tr>';
            }).join('') +
            '</tbody>' +
            '</table>' +
            '</div>' +
            '</div>' +

            '<div class="section">' +
            '<h2 class="section-title">Credit Enquiry Register</h2>' +
            '<div class="table-wrap">' +
            '<table>' +
            '<thead><tr><th>Date</th><th>Institution</th><th>Purpose</th><th>Amount</th></tr></thead>' +
            '<tbody>' + renderEnquiryRows(report.enquiries) + '</tbody>' +
            '</table>' +
            '</div>' +
            '</div>' +

            '<div class="footer">This is the detailed factual CIBIL document generated from stored ASTROCRED bureau data. Figures should be read together with the lender-reported status and bureau updates.</div>' +
            '</div>' +
            '</body>' +
            '</html>';
    }

    module.exports = generateDetailedCibilHTML;
})();
