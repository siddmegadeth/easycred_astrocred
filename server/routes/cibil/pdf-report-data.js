(function () {
    'use strict';

    var ENQUIRY_PURPOSE_MAP = {
        '01': 'Auto loan',
        '02': 'Housing loan',
        '03': 'Loan against property',
        '04': 'Business / commercial loan',
        '05': 'Personal loan',
        '06': 'Consumer durable / device loan',
        '07': 'Two-wheeler loan',
        '08': 'Education loan',
        '09': 'Gold / secured small ticket loan',
        '10': 'Credit card',
        '11': 'Overdraft / line of credit',
        '12': 'Microfinance loan',
        '13': 'Business / MSME loan',
        '14': 'Used vehicle loan',
        '15': 'Agriculture loan'
    };

    var ACCOUNT_TYPE_MAP = {
        'credit card': 'Credit card / revolving credit',
        'consumer loan': 'Consumer / BNPL loan',
        'personal loan': 'Personal loan',
        'education loan': 'Education loan',
        'gold loan': 'Gold-backed loan',
        'home loan': 'Home loan',
        'auto loan': 'Auto loan',
        'business loan': 'Business loan',
        'overdraft': 'Overdraft / credit line'
    };

    var OCCUPATION_MAP = {
        '01': 'Professional',
        '02': 'Government employee',
        '03': 'Private salaried',
        '04': 'Self-employed',
        '05': 'Business owner',
        '06': 'Daily wage / informal',
        '07': 'Unemployed',
        '08': 'Retired',
        '09': 'Student',
        '10': 'Homemaker'
    };

    function toArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function toNumber(value) {
        if (typeof value === 'number' && !isNaN(value)) return value;
        var parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }

    function toText(value, fallback) {
        if (value === undefined || value === null || value === '') return fallback || '';
        return String(value);
    }

    function parseDateValue(value) {
        if (!value) return null;
        if (value instanceof Date && !isNaN(value.getTime())) return value;
        if (typeof value === 'object' && value.$date) {
            var objectDate = new Date(value.$date);
            return isNaN(objectDate.getTime()) ? null : objectDate;
        }

        var text = String(value).trim();
        if (!text) return null;

        if (/^\d{8}$/.test(text)) {
            var year = parseInt(text.slice(0, 4), 10);
            var month = parseInt(text.slice(4, 6), 10) - 1;
            var day = parseInt(text.slice(6, 8), 10);
            var compactDate = new Date(year, month, day);
            return isNaN(compactDate.getTime()) ? null : compactDate;
        }

        var parsed = new Date(text);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    function formatDate(value) {
        var parsed = parseDateValue(value);
        if (!parsed) return 'N/A';

        var day = String(parsed.getDate()).padStart(2, '0');
        var month = String(parsed.getMonth() + 1).padStart(2, '0');
        var year = parsed.getFullYear();
        return day + '/' + month + '/' + year;
    }

    function getMonthsBetween(start, end) {
        var a = parseDateValue(start);
        var b = parseDateValue(end || new Date());
        if (!a || !b) return 0;

        var months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
        if (b.getDate() < a.getDate()) months -= 1;
        return Math.max(0, months);
    }

    function formatMonths(months) {
        if (!months) return 'N/A';
        var years = Math.floor(months / 12);
        var remainingMonths = months % 12;
        var parts = [];
        if (years) parts.push(years + 'y');
        if (remainingMonths) parts.push(remainingMonths + 'm');
        return parts.length ? parts.join(' ') : '0m';
    }

    function scoreBand(score) {
        var numeric = toNumber(score);
        if (numeric >= 800) return 'Excellent';
        if (numeric >= 750) return 'Very Good';
        if (numeric >= 700) return 'Good';
        if (numeric >= 650) return 'Fair';
        if (numeric >= 600) return 'Needs Improvement';
        return 'High Risk';
    }

    function safeValue(value, fallback) {
        return (value === undefined || value === null || value === '') ? fallback : value;
    }

    function titleCase(text) {
        return toText(text, '')
            .toLowerCase()
            .split(/[\s_]+/)
            .filter(Boolean)
            .map(function (part) {
                return part.charAt(0).toUpperCase() + part.slice(1);
            })
            .join(' ');
    }

    function friendlyAccountType(rawType) {
        var text = toText(rawType, 'Other');
        var key = text.toLowerCase();
        return ACCOUNT_TYPE_MAP[key] || titleCase(text);
    }

    function friendlyPurpose(rawPurpose) {
        var text = toText(rawPurpose, 'Unknown');
        var key = text.padStart(2, '0');
        return ENQUIRY_PURPOSE_MAP[key] || titleCase(text);
    }

    function describeReasonCode(code, description, rank, scoreLabel, summary) {
        if (description && description !== 'No description available') return description;

        if (!code || code === 'N/A') {
            if (rank === 1) return 'The bureau is indicating the top score driver is not fully described in the raw payload. In most files this is usually payment behavior or utilization.';
            if (rank === 2) return 'A secondary score driver is missing from the bureau payload. Long credit history, lower utilization, and cleaner repayment behavior usually help here.';
            return 'This bureau reason was not fully described in the payload. Treat it as a score-driver placeholder and review repayment, utilization, enquiries, and credit age.';
        }

        return 'Bureau reason ' + code + ' was received without description. Review ' + scoreLabel + ' alongside utilization (' + summary.utilizationPercent + '%), recent enquiries (' + summary.recentEnquiries6m + ' in 6 months), and repayment hygiene.';
    }

    function riskBucket(status, overdue, paymentSummary) {
        var statusText = toText(status, '').toUpperCase();
        var missedRate = paymentSummary.totalMonths > 0 ? (paymentSummary.missedPayments / paymentSummary.totalMonths) : 0;
        if (overdue > 0) return 'High';
        if (statusText.indexOf('DEFAULT') >= 0 || statusText.indexOf('SETTLED') >= 0 || statusText.indexOf('WRITE') >= 0) return 'High';
        if (paymentSummary.missedPayments >= 5 || (paymentSummary.missedPayments >= 2 && missedRate >= 0.20)) return 'High';
        if (paymentSummary.missedPayments > 0) return 'Medium';
        if (paymentSummary.delayedPayments > 0) return 'Medium';
        return 'Low';
    }

    function ownershipLabel(account) {
        return toText(
            account.ownershipType ||
            account.ownership_type ||
            account.accountOwnershipType ||
            account.account_holder_type,
            'N/A'
        );
    }

    function accountTypeLabel(account) {
        return toText(
            account.accountType ||
            account.account_type ||
            account.type ||
            account.loanType,
            'Other'
        );
    }

    function lenderLabel(account) {
        return toText(
            account.memberShortName ||
            account.member_name ||
            account.bankName ||
            account.bank ||
            account.lender_name,
            'Unknown'
        );
    }

    function deriveAccountStatus(account, overdue) {
        var status = toText(
            account.accountStatus ||
            account.account_status ||
            account.status ||
            account.creditFacilityStatus,
            ''
        );

        if (!status && overdue > 0) return 'Overdue';
        return status || 'Active';
    }

    function parsePaymentHistory(account) {
        var payments = toArray(account.monthlyPayStatus || account.monthly_pay_status);
        var historyString = toText(account.paymentHistory || account.payment_history, '');
        var summary = {
            totalMonths: 0,
            onTimePayments: 0,
            delayedPayments: 0,
            missedPayments: 0,
            remarks: 'No detailed payment history available'
        };

        if (payments.length) {
            payments.forEach(function (payment) {
                var status = toText(payment.status, '').toUpperCase();
                summary.totalMonths += 1;
                if (['0', '00', '000', 'C', 'CUR', 'STD'].indexOf(status) >= 0) {
                    summary.onTimePayments += 1;
                } else if (['1', '01', '001', '2', '02', '002'].indexOf(status) >= 0) {
                    summary.delayedPayments += 1;
                } else {
                    summary.missedPayments += 1;
                }
            });
        } else if (historyString) {
            historyString.split('').slice(0, 36).forEach(function (code) {
                var normalized = toText(code, '').toUpperCase();
                summary.totalMonths += 1;
                if (['0', 'C'].indexOf(normalized) >= 0) {
                    summary.onTimePayments += 1;
                } else if (['1', '2'].indexOf(normalized) >= 0) {
                    summary.delayedPayments += 1;
                } else if (normalized !== 'X') {
                    summary.missedPayments += 1;
                }
            });
        }

        if (summary.totalMonths > 0) {
            summary.remarks =
                'On-time ' + summary.onTimePayments +
                ', delayed ' + summary.delayedPayments +
                ', missed ' + summary.missedPayments +
                ' over ' + summary.totalMonths + ' reported months';
        }

        return summary;
    }

    function healthStatusForAccount(account, paymentSummary, overdue, utilizationPercent) {
        var status = toText(account.accountStatus || account.account_status || account.status, '').toUpperCase();
        var missedRate = paymentSummary.totalMonths > 0 ? (paymentSummary.missedPayments / paymentSummary.totalMonths) : 0;
        if (overdue > 0 || status.indexOf('DEFAULT') >= 0 || status.indexOf('SETTLED') >= 0 || status.indexOf('WRITE') >= 0 || paymentSummary.missedPayments >= 5 || (paymentSummary.missedPayments >= 2 && missedRate >= 0.20)) {
            return {
                label: 'Requires Maximum Attention',
                color: 'red',
                reason: 'Missed payments, lender-reported stress, or overdue balance is hurting the file.'
            };
        }

        if (utilizationPercent > 60 || paymentSummary.delayedPayments > 0 || paymentSummary.missedPayments > 0) {
            return {
                label: 'Watch Closely',
                color: 'amber',
                reason: 'The account is not yet critical, but high usage or delays can pull the score down.'
            };
        }

        return {
            label: 'Healthy',
            color: 'green',
            reason: 'No visible overdue pressure and payment reporting looks stable.'
        };
    }

    function isSecuredType(type) {
        var text = toText(type, '').toLowerCase();
        return (
            text.indexOf('home') >= 0 ||
            text.indexOf('mortgage') >= 0 ||
            text.indexOf('gold') >= 0 ||
            text.indexOf('vehicle') >= 0 ||
            text.indexOf('auto') >= 0 ||
            text.indexOf('secured') >= 0 ||
            text.indexOf('loan against') >= 0
        );
    }

    function normalizeAccounts(accounts) {
        return toArray(accounts).map(function (account) {
            var currentBalance = toNumber(account.currentBalance || account.current_balance || account.balance);
            var overdue = Math.max(0, toNumber(account.amountOverdue || account.overdue_amount || account.overdue));
            var highCredit = toNumber(
                account.highCreditAmount ||
                account.high_credit_amount ||
                account.credit_limit ||
                account.sanctionedAmount ||
                account.sanctioned_amount
            );
            var openedOn = account.dateOpened || account.date_opened || account.openDate;
            var closedOn = account.dateClosed || account.date_closed || account.closedDate;
            var paymentSummary = parsePaymentHistory(account);
            var status = deriveAccountStatus(account, overdue);
            var type = accountTypeLabel(account);
            var friendlyType = friendlyAccountType(type);
            var utilizationPercent = highCredit > 0 ? Math.round((currentBalance / highCredit) * 100) : 0;
            var health = healthStatusForAccount(account, paymentSummary, overdue, utilizationPercent);

            return {
                accountNumber: toText(account.accountNumber || account.account_number || account.mask_account_number || account.maskedAccountNumber, 'N/A'),
                lender: lenderLabel(account),
                type: type,
                friendlyType: friendlyType,
                ownership: ownershipLabel(account),
                status: status,
                riskBucket: riskBucket(status, overdue, paymentSummary),
                openedOn: openedOn,
                openedOnLabel: formatDate(openedOn),
                closedOn: closedOn,
                closedOnLabel: formatDate(closedOn),
                ageMonths: getMonthsBetween(openedOn, closedOn || new Date()),
                ageLabel: formatMonths(getMonthsBetween(openedOn, closedOn || new Date())),
                currentBalance: currentBalance,
                overdue: overdue,
                highCredit: highCredit,
                sanctionAmount: toNumber(account.sanctionedAmount || account.sanctioned_amount),
                installmentAmount: toNumber(account.emiAmount || account.emi_amount || account.installmentAmount),
                paymentFrequency: toText(account.paymentFrequency || account.payment_frequency, 'N/A'),
                lastPaymentDate: account.lastPaymentDate || account.last_payment_date,
                lastPaymentDateLabel: formatDate(account.lastPaymentDate || account.last_payment_date),
                paymentSummary: paymentSummary,
                suitFiled: toText(account.suitFiled || account.suit_filed, 'N/A'),
                writtenOffStatus: toText(account.writtenOffStatus || account.written_off_status, 'N/A'),
                collateralType: toText(account.collateralType || account.collateral_type, 'N/A'),
                utilizationPercent: utilizationPercent,
                healthStatus: health.label,
                healthColor: health.color,
                healthReason: health.reason,
                isSecured: isSecuredType(type)
            };
        });
    }

    function normalizeEnquiries(enquiries) {
        return toArray(enquiries).map(function (enquiry) {
            var rawPurpose = toText(enquiry.enquiryPurpose || enquiry.enquiry_purpose || enquiry.purpose, 'Unknown');
            var enquiryDate = enquiry.enquiryDate || enquiry.enquiry_date || enquiry.date;
            return {
                date: enquiryDate,
                dateLabel: formatDate(enquiryDate),
                institution: toText(enquiry.memberShortName || enquiry.member_name || enquiry.institution, 'N/A'),
                purpose: rawPurpose,
                purposeLabel: friendlyPurpose(rawPurpose),
                amount: toNumber(enquiry.enquiryAmount || enquiry.enquiry_amount || enquiry.amount)
            };
        }).sort(function (a, b) {
            var first = parseDateValue(a.date);
            var second = parseDateValue(b.date);
            if (!first && !second) return 0;
            if (!first) return 1;
            if (!second) return -1;
            return second.getTime() - first.getTime();
        });
    }

    function normalizeReasonCodes(reasonCodes) {
        return toArray(reasonCodes).map(function (code, index) {
            if (typeof code === 'string') {
                return { code: code, description: code, rank: index + 1 };
            }

            return {
                code: toText(code.code || code.reasonCode || code.reason_code, 'N/A'),
                description: toText(code.description || code.reason || code.message, 'No description available'),
                rank: toText(code.rank || code.priority || index + 1, index + 1)
            };
        });
    }

    function normalizeAddresses(addresses) {
        return toArray(addresses).map(function (address) {
            return {
                category: toText(address.addressCategory || address.type, 'Address'),
                full: [
                    toText(address.line1 || address.line_1, ''),
                    toText(address.line2 || address.line_2, ''),
                    toText(address.city, ''),
                    toText(address.stateCode || address.state, ''),
                    toText(address.pinCode || address.pin || address.zip, '')
                ].filter(Boolean).join(', '),
                dateReported: formatDate(address.dateReported || address.date_reported)
            };
        });
    }

    function normalizePhones(phones) {
        return toArray(phones).map(function (phone) {
            return {
                number: toText(phone.telephoneNumber || phone.number, 'N/A'),
                type: toText(phone.telephoneType || phone.type, 'Phone')
            };
        });
    }

    function normalizeEmails(emails) {
        return toArray(emails).map(function (email) {
            return toText(email.emailID || email.email, 'N/A');
        });
    }

    function normalizeIds(ids) {
        return toArray(ids).map(function (id) {
            return {
                type: toText(id.idType || id.type, 'ID'),
                value: toText(id.idNumber || id.value, 'N/A')
            };
        });
    }

    function normalizeEmployment(employment) {
        return toArray(employment).map(function (item) {
            return {
                occupationCode: toText(item.occupationCode, 'N/A'),
                occupationLabel: OCCUPATION_MAP[toText(item.occupationCode, '')] || 'Occupation details not mapped',
                organization: toText(item.organizationName || item.organization, 'Employment source not available'),
                reportedOn: formatDate(item.dateReported || item.date_reported)
            };
        });
    }

    function computeSummary(accounts, enquiries, report, cibilData) {
        var totalBalance = 0;
        var totalOverdue = 0;
        var totalHighCredit = 0;
        var activeAccounts = 0;
        var closedAccounts = 0;
        var overdueAccounts = 0;
        var defaultAccounts = 0;
        var securedAccounts = 0;
        var unsecuredAccounts = 0;
        var ageMonthsTotal = 0;
        var ageMonthsCount = 0;
        var oldestAccountAgeMonths = 0;

        accounts.forEach(function (account) {
            totalBalance += account.currentBalance;
            totalOverdue += account.overdue;
            totalHighCredit += account.highCredit;
            ageMonthsTotal += account.ageMonths;
            if (account.ageMonths > 0) ageMonthsCount += 1;
            if (account.ageMonths > oldestAccountAgeMonths) oldestAccountAgeMonths = account.ageMonths;

            if (toText(account.status, '').toLowerCase().indexOf('close') >= 0) closedAccounts += 1;
            else activeAccounts += 1;

            if (account.overdue > 0) overdueAccounts += 1;
            if (account.riskBucket === 'High') defaultAccounts += 1;
            if (account.isSecured) securedAccounts += 1;
            else unsecuredAccounts += 1;
        });

        var now = new Date();
        var recentEnquiries3m = enquiries.filter(function (enquiry) {
            var date = parseDateValue(enquiry.date);
            return date && getMonthsBetween(date, now) <= 3;
        }).length;
        var recentEnquiries6m = enquiries.filter(function (enquiry) {
            var date = parseDateValue(enquiry.date);
            return date && getMonthsBetween(date, now) <= 6;
        }).length;

        var bureauScore = toArray(report.scores)[0] || {};
        var consumerSummary = report.response && report.response.consumerSummaryresp ? report.response.consumerSummaryresp : {};
        var targetBalanceForThirtyPercent = totalHighCredit > 0 ? Math.round(totalHighCredit * 0.30) : 0;
        var paydownToThirtyPercent = totalHighCredit > 0 ? Math.max(0, Math.round(totalBalance - targetBalanceForThirtyPercent)) : 0;
        var unsecuredSharePercent = accounts.length > 0 ? Math.round((unsecuredAccounts / accounts.length) * 100) : 0;

        return {
            totalAccounts: accounts.length,
            activeAccounts: activeAccounts,
            closedAccounts: closedAccounts,
            overdueAccounts: overdueAccounts,
            defaultAccounts: defaultAccounts,
            totalBalance: totalBalance,
            totalOverdue: Math.max(0, totalOverdue),
            totalHighCredit: totalHighCredit,
            utilizationPercent: totalHighCredit > 0 ? Math.round((totalBalance / totalHighCredit) * 100) : 0,
            targetBalanceForThirtyPercent: targetBalanceForThirtyPercent,
            paydownToThirtyPercent: paydownToThirtyPercent,
            securedAccounts: securedAccounts,
            unsecuredAccounts: unsecuredAccounts,
            unsecuredSharePercent: unsecuredSharePercent,
            averageAccountAgeMonths: ageMonthsCount ? Math.round(ageMonthsTotal / ageMonthsCount) : 0,
            averageAccountAgeLabel: formatMonths(ageMonthsCount ? Math.round(ageMonthsTotal / ageMonthsCount) : 0),
            oldestAccountAgeMonths: oldestAccountAgeMonths,
            oldestAccountAgeLabel: formatMonths(oldestAccountAgeMonths),
            recentEnquiries3m: recentEnquiries3m,
            recentEnquiries6m: recentEnquiries6m,
            scoreName: toText(bureauScore.scoreName || bureauScore.name, 'Bureau Score'),
            scoreValue: toText(bureauScore.score || cibilData.credit_score, 'N/A'),
            consumerSummary: consumerSummary
        };
    }

    function estimateImprovementPotential(summary, recommendations) {
        var low = 0;
        var high = 0;

        if (summary.defaultAccounts > 0 || summary.totalOverdue > 0) {
            low += 40;
            high += 90;
        }
        if (summary.utilizationPercent > 30) {
            low += 20;
            high += 45;
        }
        if (summary.recentEnquiries6m > 4) {
            low += 10;
            high += 20;
        }
        if (recommendations.length > 0) {
            low += 10;
            high += 20;
        }

        if (low === 0 && high === 0) {
            low = 5;
            high = 15;
        }

        return { low: low, high: high };
    }

    function impactLabel(score, inverse) {
        var numeric = toNumber(score);
        if (!inverse) {
            if (numeric >= 80) return 'Helping';
            if (numeric >= 60) return 'Neutral';
            return 'Hurting';
        }
        if (numeric <= 30) return 'Helping';
        if (numeric <= 60) return 'Neutral';
        return 'Hurting';
    }

    function buildSyntheticReasonCodes(summary, drivers, paymentAnalysis) {
        var synthetic = [];

        if (summary.recentEnquiries6m > 4) {
            synthetic.push({
                code: 'ASTRO-ENQ',
                rank: synthetic.length + 1,
                description: 'Recent hard enquiries are elevated at ' + summary.recentEnquiries6m + ' in 6 months, which can weaken lender confidence temporarily.'
            });
        }

        if (summary.utilizationPercent > 30) {
            synthetic.push({
                code: 'ASTRO-UTIL',
                rank: synthetic.length + 1,
                description: 'Utilization is at ' + summary.utilizationPercent + '%. Bringing it below 30% should help the file look more stable.'
            });
        }

        if (summary.unsecuredAccounts >= 10) {
            synthetic.push({
                code: 'ASTRO-MIX',
                rank: synthetic.length + 1,
                description: 'The profile has ' + summary.unsecuredAccounts + ' unsecured accounts and no secured diversification, which can look risk-heavy to lenders.'
            });
        }

        if (paymentAnalysis && paymentAnalysis.missed > 0) {
            synthetic.push({
                code: 'ASTRO-PAY',
                rank: synthetic.length + 1,
                description: 'The payment history shows ' + paymentAnalysis.missed + ' missed payments, so repayment behavior is still a visible bureau issue.'
            });
        }

        if (summary.oldestAccountAgeMonths >= 36) {
            synthetic.push({
                code: 'ASTRO-AGE',
                rank: synthetic.length + 1,
                description: 'The oldest account age of ' + summary.oldestAccountAgeLabel + ' is a strength and supports score stability when newer behavior stays clean.'
            });
        }

        if (!synthetic.length) {
            synthetic = (drivers || []).slice(0, 5).map(function (driver, index) {
                return {
                    code: 'ASTRO-' + (index + 1),
                    rank: index + 1,
                    description: driver.label + ': ' + driver.detail
                };
            });
        }

        return synthetic.slice(0, 5);
    }

    function buildScoreDrivers(score, summary, analysis) {
        var componentScores = analysis && analysis.componentScores ? analysis.componentScores : {};
        var utilizationHealthScore = Math.max(0, 100 - toNumber(summary.utilizationPercent));
        var ageHealthScore = summary.oldestAccountAgeMonths >= 84 ? 90 : summary.oldestAccountAgeMonths >= 36 ? 72 : summary.oldestAccountAgeMonths >= 12 ? 55 : 35;
        var mixHealthScore = summary.securedAccounts > 0 && summary.unsecuredAccounts > 0 ? 78 : 48;
        var paymentRate = analysis && analysis.paymentAnalysis ? toNumber(analysis.paymentAnalysis.onTimePercentage) : 0;
        var recentEnquiryCount = toNumber(summary.recentEnquiries6m);
        var enquiryHealthScore = 90;

        if (recentEnquiryCount <= 2) enquiryHealthScore = 90;
        else if (recentEnquiryCount <= 4) enquiryHealthScore = 72;
        else if (recentEnquiryCount <= 6) enquiryHealthScore = 55;
        else if (recentEnquiryCount <= 9) enquiryHealthScore = 35;
        else if (recentEnquiryCount <= 12) enquiryHealthScore = 22;
        else enquiryHealthScore = 12;

        return [
            {
                label: 'Payment history',
                score: Math.round(componentScores.paymentHistory || paymentRate || 0),
                impact: impactLabel(componentScores.paymentHistory || paymentRate || 0),
                detail: 'The strongest driver. Missed and overdue payments hurt most.'
            },
            {
                label: 'Utilization',
                score: Math.round(componentScores.creditUtilization || utilizationHealthScore),
                impact: impactLabel(componentScores.creditUtilization || utilizationHealthScore),
                detail: 'Best when revolving balances stay below 30% of total limit.'
            },
            {
                label: 'Credit age',
                score: Math.round(componentScores.creditAge || ageHealthScore),
                impact: impactLabel(componentScores.creditAge || ageHealthScore),
                detail: 'Older, well-managed accounts build trust.'
            },
            {
                label: 'Credit mix',
                score: Math.round(componentScores.creditMix || mixHealthScore),
                impact: impactLabel(componentScores.creditMix || mixHealthScore),
                detail: 'A mix of secured and unsecured credit is usually healthier.'
            },
            {
                label: 'Recent enquiries',
                score: Math.round(componentScores.recentInquiries || enquiryHealthScore),
                impact: impactLabel(componentScores.recentInquiries || enquiryHealthScore),
                detail: recentEnquiryCount + ' hard enquiries were seen in the last 6 months. More enquiries generally make the file look more credit-hungry to lenders.'
            }
        ];
    }

    function buildActionPlan(summary, score, improvementPotential) {
        var actions = [];

        if (summary.paydownToThirtyPercent > 0) {
            actions.push({
                title: 'Bring card and revolving balances below 30%',
                why: 'High utilization is directly weakening score stability and lender comfort.',
                target: 'Pay down about Rs ' + summary.paydownToThirtyPercent.toLocaleString('en-IN') + ' to reach roughly Rs ' + summary.targetBalanceForThirtyPercent.toLocaleString('en-IN') + ' outstanding.',
                impact: 'Expected score benefit: about 20 to 45 points if reported cleanly.'
            });
        }

        if (summary.totalOverdue > 0 || summary.defaultAccounts > 0) {
            actions.push({
                title: 'Clear overdue and stressed accounts first',
                why: 'Overdue, defaulted, or settled-looking accounts are the biggest negative bureau signals.',
                target: 'Resolve overdue balances and get lender status updates reflected in the bureau.',
                impact: 'Expected score benefit: about 40 to 90 points depending on what gets corrected.'
            });
        }

        if (summary.recentEnquiries6m > 4) {
            actions.push({
                title: 'Stop fresh applications for 60 to 90 days',
                why: 'Too many recent hard enquiries can make the profile look desperate for credit.',
                target: 'Hold applications and let enquiry pressure cool down.',
                impact: 'Expected score benefit: about 10 to 20 points plus stronger lender confidence.'
            });
        }

        if (!actions.length) {
            actions.push({
                title: 'Maintain the current healthy file',
                why: 'There is no major bureau stress signal visible in the current normalized view.',
                target: 'Keep all EMIs on time and monitor bureau updates monthly.',
                impact: 'Expected score benefit: about ' + improvementPotential.low + ' to ' + improvementPotential.high + ' points over time.'
            });
        }

        return actions;
    }

    function buildProductMatches(summary, score, riskLevel) {
        var base = score >= 750 ? 82 : score >= 700 ? 68 : score >= 650 ? 52 : score >= 600 ? 38 : 24;
        var enquiryPenalty = summary.recentEnquiries6m > 8 ? 12 : summary.recentEnquiries6m > 4 ? 6 : 0;
        var overduePenalty = summary.defaultAccounts > 0 ? 18 : 0;
        var utilizationPenalty = summary.utilizationPercent > 50 ? 12 : summary.utilizationPercent > 30 ? 6 : 0;
        var unsecuredPenalty = summary.unsecuredAccounts > 20 ? 8 : summary.unsecuredAccounts > 10 ? 4 : 0;
        var conservative = base - enquiryPenalty - overduePenalty - utilizationPenalty - unsecuredPenalty;

        function match(label, offset, note) {
            var scoreValue = Math.max(5, Math.min(95, conservative + offset));
            return {
                product: label,
                matchScore: scoreValue,
                verdict: scoreValue >= 75 ? 'Strong match' : scoreValue >= 55 ? 'Possible with scrutiny' : scoreValue >= 35 ? 'Weak match' : 'Unlikely right now',
                note: note
            };
        }

        return [
            match('Personal Loan', 0, 'Sensitive to enquiries, utilization, and unsecured loan stacking.'),
            match('Credit Card', summary.utilizationPercent <= 30 ? 6 : -8, 'Usually easier when card utilization is low and recent applications are limited.'),
            match('MSME / Business Loan', -4, 'Requires stronger document quality and stable repayment behavior.'),
            match('Secured Loan', 10, 'Secured borrowing can be more achievable than unsecured borrowing in a stressed profile.'),
            match('Education Loan', 4, 'Often depends on purpose, co-applicant strength, and documentation as much as score.')
        ].map(function (item) {
            item.riskLevel = riskLevel;
            return item;
        });
    }

    function normalizeBankSuggestions(banks, productMatches) {
        var defaultMatchScore = productMatches && productMatches[0] ? productMatches[0].matchScore : 50;
        return toArray(banks).map(function (bank) {
            var probability = bank.probability || bank.approvalChance || bank.matchScore || defaultMatchScore;
            bank.matchScore = probability;
            return bank;
        });
    }

    function buildVerdict(summary, score, riskLevel) {
        if (summary.defaultAccounts > 0 && score < 750) {
            return {
                headline: 'High scrutiny profile',
                summary: 'The score is workable, but overdue signals, high enquiry intensity, or portfolio stress can still trigger lender caution.'
            };
        }

        if (score >= 750 && summary.recentEnquiries6m <= 3 && summary.utilizationPercent <= 30) {
            return {
                headline: 'Lender-ready profile',
                summary: 'The profile looks stable. The score, utilization, and application behavior should support stronger lender confidence.'
            };
        }

        return {
            headline: 'Recoverable but under pressure',
            summary: 'The profile can improve meaningfully, but lenders will still notice recent application behavior, unsecured concentration, or payment stress.'
        };
    }

    function buildObservations(payload) {
        var summary = payload.summary;
        var score = toNumber(payload.score.creditScore);
        var verdict = payload.verdict || {};
        var positives = [];
        var concerns = [];
        var immediateActions = [];
        var shortTermActions = [];
        var whatToAvoid = [];
        var whatIsHappening = [];

        if (score >= 750) positives.push('Your score is in a strong lending band and should support better pricing with many lenders.');
        else if (score >= 700) positives.push('Your score is serviceable, but lenders will still check utilization, enquiries, and overdue history closely.');
        else concerns.push('Your score is below the ideal lending band, so approval probability and pricing may be under pressure.');

        if (summary.utilizationPercent <= 30 && summary.totalHighCredit > 0) {
            positives.push('Credit utilization is within a healthy range, which supports score stability.');
        } else if (summary.utilizationPercent > 30) {
            concerns.push('Credit utilization is elevated at ' + summary.utilizationPercent + '%, which is likely suppressing the score.');
            immediateActions.push('Reduce revolving balances by about Rs ' + summary.paydownToThirtyPercent.toLocaleString('en-IN') + ' so total revolving outstanding moves closer to the 30% threshold.');
            whatIsHappening.push('High utilization signals repayment stress or heavy dependence on revolving credit.');
        }

        if (summary.defaultAccounts > 0 || summary.totalOverdue > 0) {
            concerns.push('There are overdue or high-risk accounts in the file, which materially damage the score and lender confidence.');
            immediateActions.push('Clear overdue amounts and obtain closure or settlement updates from lenders as fast as possible.');
            whatIsHappening.push('The bureau is likely treating missed or overdue repayments as the strongest negative signal in the profile.');
        } else {
            positives.push('No major overdue footprint is visible in the current normalized account summary.');
        }

        if (summary.recentEnquiries3m >= 3) {
            concerns.push('Recent hard enquiries are high at ' + summary.recentEnquiries6m + ' in the last 6 months, which can indicate aggressive credit seeking.');
            shortTermActions.push('Pause fresh loan or card applications for the next 60 to 90 days unless absolutely necessary.');
            whatToAvoid.push('Do not submit multiple applications across lenders in a short period.');
            whatIsHappening.push('Repeated recent enquiries can make the profile look credit-hungry even if no loan was disbursed.');
        } else {
            positives.push('Recent enquiry activity is controlled and is not the main pressure point right now.');
        }

        if (summary.oldestAccountAgeMonths >= 36) {
            positives.push('Credit history length is a strength; older accounts improve bureau confidence when kept clean.');
        } else if (summary.oldestAccountAgeMonths > 0 && summary.oldestAccountAgeMonths < 12) {
            concerns.push('Credit history is still relatively young, so the file needs more time and disciplined repayment behavior.');
        }

        if (summary.securedAccounts > 0 && summary.unsecuredAccounts > 0) {
            positives.push('The profile shows a mix of secured and unsecured borrowing, which is generally healthier than a single-product file.');
        } else if (summary.totalAccounts > 0 && (summary.securedAccounts === 0 || summary.unsecuredAccounts === 0)) {
            shortTermActions.push('Improve credit mix gradually over time; avoid opening unnecessary products only for score reasons.');
        }

        if (summary.unsecuredAccounts >= 10) {
            concerns.push('The file has ' + summary.unsecuredAccounts + ' unsecured accounts. To lenders, that can look like a high-risk and credit-hungry borrowing pattern.');
            whatIsHappening.push('Heavy unsecured concentration raises underwriting caution because repayment stress can rise quickly without collateral support.');
        }

        if (verdict.summary) {
            whatIsHappening.unshift(verdict.summary);
        }

        if (!immediateActions.length) {
            immediateActions.push('Maintain perfect repayment discipline across all active accounts.');
        }
        if (!shortTermActions.length) {
            shortTermActions.push('Review bureau updates every month and track whether balances, statuses, and closures are reporting correctly.');
        }

        whatToAvoid.push('Do not miss even a single EMI or card due date while rebuilding the score.');
        whatToAvoid.push('Do not close old healthy accounts blindly if they support age and available limit.');

        return {
            positives: positives,
            concerns: concerns,
            immediateActions: immediateActions,
            shortTermActions: shortTermActions,
            whatToAvoid: whatToAvoid,
            whatIsHappening: whatIsHappening
        };
    }

    function buildProfile(report, cibilData) {
        var names = toArray(report.names);
        var ids = normalizeIds(report.ids);
        var phones = normalizePhones(report.telephones);
        var emails = normalizeEmails(report.emails);
        var employment = normalizeEmployment(report.employment);
        var addresses = normalizeAddresses(report.addresses);

        var pan = toText(cibilData.pan, '');
        ids.forEach(function (id) {
            if (!pan && toText(id.type, '').toLowerCase() === 'taxid') {
                pan = id.value;
            }
        });

        return {
            name: toText((names[0] && names[0].name) || cibilData.name, 'N/A'),
            mobile: toText((phones[0] && phones[0].number) || cibilData.mobile, 'N/A'),
            email: toText((emails[0]) || cibilData.email, 'N/A'),
            pan: toText(pan, 'N/A'),
            gender: toText((names[0] && names[0].gender) || cibilData.gender, 'N/A'),
            dateOfBirth: toText((names[0] && formatDate(names[0].birthDate)) || formatDate(cibilData.date_of_birth), 'N/A'),
            controlNumber: toText(report.control_number || cibilData.client_id, 'N/A'),
            addresses: addresses,
            phones: phones,
            emails: emails,
            ids: ids,
            employment: employment
        };
    }

    function buildScoreSection(cibilData, analysis) {
        var creditScore = toNumber(cibilData.credit_score);
        var grade = toText(analysis && analysis.overallGrade, scoreBand(creditScore));
        return {
            creditScore: creditScore,
            creditScoreLabel: creditScore ? String(creditScore) : 'N/A',
            grade: grade,
            band: scoreBand(creditScore),
            componentScores: analysis && analysis.componentScores ? analysis.componentScores : {},
            paymentAnalysis: analysis && analysis.paymentAnalysis ? analysis.paymentAnalysis : {},
            creditUtilization: toNumber(analysis && analysis.creditUtilization),
            creditAgeMonths: toNumber(analysis && analysis.creditAge),
            creditAgeLabel: formatMonths(toNumber(analysis && analysis.creditAge))
        };
    }

    function topRiskAccounts(accounts) {
        return accounts.slice().sort(function (a, b) {
            if (b.healthColor !== a.healthColor) {
                var order = { red: 3, amber: 2, green: 1 };
                return (order[b.healthColor] || 0) - (order[a.healthColor] || 0);
            }
            if (b.overdue !== a.overdue) return b.overdue - a.overdue;
            if (b.paymentSummary.missedPayments !== a.paymentSummary.missedPayments) {
                return b.paymentSummary.missedPayments - a.paymentSummary.missedPayments;
            }
            return b.currentBalance - a.currentBalance;
        }).slice(0, 8);
    }

    function buildReportData(cibilData, analysis) {
        var report = (cibilData.credit_report && cibilData.credit_report[0]) ? cibilData.credit_report[0] : {};
        var accounts = normalizeAccounts(report.accounts);
        var enquiries = normalizeEnquiries(report.enquiries);
        var profile = buildProfile(report, cibilData);
        var summary = computeSummary(accounts, enquiries, report, cibilData);
        var score = buildScoreSection(cibilData, analysis || {});
        var recommendations = toArray(analysis && analysis.recommendations);
        var defaulters = toArray(analysis && analysis.defaulters);
        var riskReport = analysis && analysis.riskReport ? analysis.riskReport : {};
        var riskDetails = analysis && analysis.riskDetails ? analysis.riskDetails : {};
        var riskLevel = toText(
            riskDetails.defaultProbability && riskDetails.defaultProbability.riskLevel ||
            riskReport.riskAnalysis && riskReport.riskAnalysis.overallRiskLevel,
            'Moderate'
        );
        var verdict = buildVerdict(summary, score.creditScore, riskLevel);
        var observations = buildObservations({
            summary: summary,
            score: score,
            verdict: verdict
        });
        var scoreDrivers = buildScoreDrivers(score.creditScore, summary, analysis || {});
        var actionPlan = buildActionPlan(summary, score.creditScore, estimateImprovementPotential(summary, recommendations));
        var productMatches = buildProductMatches(summary, score.creditScore, riskLevel);
        var normalizedBankSuggestions = normalizeBankSuggestions(toArray(analysis && analysis.bankSuggestions), productMatches);
        var normalizedReasonCodes = normalizeReasonCodes(toArray(toArray(report.scores)[0] && toArray(report.scores)[0].reasonCodes)).map(function (reason) {
            reason.description = describeReasonCode(reason.code, reason.description, reason.rank, score.band, summary);
            return reason;
        });
        if (!normalizedReasonCodes.length || normalizedReasonCodes.every(function (reason) { return reason.code === 'N/A'; })) {
            normalizedReasonCodes = buildSyntheticReasonCodes(summary, scoreDrivers, score.paymentAnalysis);
        }
        var improvementPotential = estimateImprovementPotential(summary, recommendations);

        return {
            generatedAt: new Date().toISOString(),
            generatedAtLabel: formatDate(new Date()),
            reportId: toText(cibilData.client_id || profile.controlNumber || profile.pan, 'N/A'),
            profile: profile,
            score: score,
            summary: summary,
            verdict: verdict,
            analysis: {
                overallGrade: toText(analysis && analysis.overallGrade, 'N/A'),
                recommendations: recommendations,
                defaulters: defaulters,
                riskReport: riskReport,
                improvementPlan: analysis && analysis.improvementPlan ? analysis.improvementPlan : {},
                bankSuggestions: normalizedBankSuggestions,
                riskDetails: riskDetails,
                comprehensiveReport: analysis && analysis.comprehensiveReport ? analysis.comprehensiveReport : {},
                enhancedRiskAssessment: analysis && analysis.enhancedRiskAssessment ? analysis.enhancedRiskAssessment : {},
                componentScores: score.componentScores,
                paymentAnalysis: score.paymentAnalysis
            },
            bureau: {
                names: toArray(report.names),
                ids: profile.ids,
                phones: profile.phones,
                emails: profile.emails,
                addresses: profile.addresses,
                employment: profile.employment,
                consumerSummary: summary.consumerSummary,
                reasonCodes: normalizedReasonCodes
            },
            accounts: accounts,
            enquiries: enquiries,
            topRiskAccounts: topRiskAccounts(accounts),
            observations: observations,
            scoreDrivers: scoreDrivers,
            actionPlan: actionPlan,
            productMatches: productMatches,
            improvementPotential: improvementPotential
        };
    }

    module.exports = {
        buildReportData: buildReportData,
        formatDate: formatDate,
        formatMonths: formatMonths
    };
})();
