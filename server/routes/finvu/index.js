(function () {
    'use strict';

    const finvuClient = require('./finvu-client');

    function computeSummaryFromTransactions(transactions, totalBalance) {
        const summary = {
            totalBalance: totalBalance || 0,
            avgMonthlyIncome: 0,
            avgMonthlyExpense: 0,
            savingsRate: 0,
            transactionCount: (transactions && transactions.length) || 0
        };
        if (!Array.isArray(transactions) || transactions.length === 0) return summary;
        const byMonth = {};
        transactions.forEach(t => {
            const d = t.date ? new Date(t.date) : new Date();
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0 };
            const amt = parseFloat(t.amount) || 0;
            if ((t.type || '').toUpperCase() === 'CREDIT') byMonth[key].income += amt;
            else byMonth[key].expense += amt;
        });
        const months = Object.keys(byMonth);
        if (months.length === 0) return summary;
        let totalIncome = 0, totalExpense = 0;
        months.forEach(k => { totalIncome += byMonth[k].income; totalExpense += byMonth[k].expense; });
        summary.avgMonthlyIncome = Math.round((totalIncome / months.length) * 100) / 100;
        summary.avgMonthlyExpense = Math.round((totalExpense / months.length) * 100) / 100;
        if (summary.avgMonthlyIncome > 0) {
            summary.savingsRate = Math.round(((summary.avgMonthlyIncome - summary.avgMonthlyExpense) / summary.avgMonthlyIncome) * 10000) / 100;
        }
        return summary;
    }

    /**
     * FinVu routes – thin proxy to @easy/finvu_integration.
     * Profile and linked-account updates stay here.
     */

    // Callback URL after user completes consent on FinVu portal – redirect to SPA so something happens
    app.get('/finvu-connect/return', function (req, res) {
        const baseUrl = process.env.APP_URL || (req.protocol + '://' + req.get('host'));
        const redirectTo = baseUrl.replace(/\/$/, '') + '/#/finvu-connect?return=1';
        res.redirect(302, redirectTo);
    });

    // Get FinVu service status (proxies to external service /health)
    app.get('/api/finvu/status', async (req, res) => {
        try {
            const status = await finvuClient.getStatus();
            res.json({ success: true, ...status });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Initiate Consent
    app.post('/api/finvu/consent/initiate', async (req, res) => {
        try {
            const { mobile, handle } = req.body;
            if (!mobile) return res.status(400).json({ success: false, message: 'Mobile number is required' });

            log('Initiating FinVu consent for:', mobile);
            const result = await finvuClient.initiateConsent(mobile, handle);

            // Update profile with consent info (store consentHandle for local service)
            if (ProfileModel) {
                await ProfileModel.updateOne(
                    { mobile: mobile },
                    {
                        $set: {
                            'finvu.consentHandle': result.consentHandle || result.consentId,
                            'finvu.consentHandleId': result.consentHandleId || result.consentHandle || result.consentId,
                            'finvu.consentId': result.consentId || result.consentHandle,
                            'finvu.handle': handle || `${mobile}@finvu`,
                            'finvu.initiatedAt': new Date(),
                            'finvu.status': 'PENDING',
                            'finvu.redirectUrl': result.redirectUrl
                        }
                    },
                    { upsert: false }
                );
            }

            res.json({ success: true, data: result });
        } catch (error) {
            log('FinVu consent initiation error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Check consent status
    app.get('/api/finvu/consent/status', async (req, res) => {
        try {
            const { consentHandle, consentId, mobile } = req.query;

            if (!consentHandle && !consentId && !mobile) {
                return res.status(400).json({ success: false, message: 'consentHandle, consentId, or mobile required' });
            }

            let consent_handle = consentHandle;
            let cust_id = null;

            // If mobile provided, look up consentHandle from profile
            if (!consent_handle && mobile) {
                const profile = await ProfileModel.findOne({ mobile: mobile });
                // Use consentHandleId first, then consentHandle, NOT consentId (consentId is different)
                consent_handle = profile?.finvu?.consentHandleId || profile?.finvu?.consentHandle;
                cust_id = profile?.finvu?.handle || `${mobile}@finvu`;
            } else if (consent_handle && mobile) {
                cust_id = `${mobile}@finvu`;
            } else if (consentId && !consent_handle) {
                // If only consentId provided, try to find consentHandleId from profile
                if (mobile) {
                    const profile = await ProfileModel.findOne({ mobile: mobile });
                    consent_handle = profile?.finvu?.consentHandleId || profile?.finvu?.consentHandle;
                }
                // Don't use consentId as consentHandle - they're different!
            }

            if (!consent_handle) {
                return res.json({ success: false, message: 'No consent found', status: 'NOT_INITIATED' });
            }

            const result = await finvuClient.checkConsentStatus(consent_handle, cust_id);

            // Update profile with consent status and date range if available
            if (result.success && mobile && ProfileModel) {
                const updateData = {
                    'finvu.status': result.status
                };

                // Store consentId if available
                if (result.consentId) {
                    updateData['finvu.consentId'] = result.consentId;
                }

                // Store consentHandleId (the handle used for API calls)
                if (consent_handle) {
                    updateData['finvu.consentHandleId'] = consent_handle;
                    updateData['finvu.consentHandle'] = consent_handle; // Also store as consentHandle for backward compatibility
                }

                // Store consent date range if available in response
                if (result.dateRange) {
                    updateData['finvu.consentDateRange'] = {
                        from: result.dateRange.from,
                        to: result.dateRange.to
                    };
                } else {
                    // Default: last 12 months (typical consent range)
                    updateData['finvu.consentDateRange'] = {
                        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
                        to: new Date().toISOString()
                    };
                }

                await ProfileModel.updateOne(
                    { mobile: mobile },
                    { $set: updateData }
                );
            }

            res.json({
                success: true,
                ...result,
                consentHandleId: consent_handle,
                consentHandle: consent_handle
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Trigger FI Request (needed before fetching data in local flow)
    app.post('/api/finvu/fi/request', async (req, res) => {
        try {
            const { mobile, consentId, consentHandleId, dateTimeRangeFrom, dateTimeRangeTo } = req.body;

            if (!mobile) {
                return res.status(400).json({ success: false, message: 'mobile required' });
            }

            let consent_id = consentId;
            let consent_handle_id = consentHandleId;
            let user_mobile = mobile;

            // Look up from profile if not provided
            if (!consent_id || !consent_handle_id) {
                const profile = await ProfileModel.findOne({ mobile: mobile });
                consent_id = consent_id || profile?.finvu?.consentId;
                consent_handle_id = consent_handle_id || profile?.finvu?.consentHandleId || profile?.finvu?.consentHandle;
            }

            if (!consent_id || !consent_handle_id) {
                return res.json({ success: false, message: 'Consent not found. Please initiate consent first.' });
            }

            const custId = `${mobile}@finvu`;
            let consentDateFrom = dateTimeRangeFrom;
            let consentDateTo = dateTimeRangeTo;
            if (!consentDateFrom || !consentDateTo) {
                try {
                    const profile = await ProfileModel.findOne({ mobile: mobile });
                    if (profile?.finvu?.consentDateRange) {
                        consentDateFrom = profile.finvu.consentDateRange.from;
                        consentDateTo = profile.finvu.consentDateRange.to;
                    } else {
                        consentDateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
                        consentDateTo = new Date().toISOString();
                    }
                } catch (e) {
                    consentDateFrom = dateTimeRangeFrom || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
                    consentDateTo = dateTimeRangeTo || new Date().toISOString();
                }
            }

            const response = await finvuClient.fiRequest({
                custId,
                consentId: consent_id,
                consentHandleId: consent_handle_id,
                dateTimeRangeFrom: consentDateFrom,
                dateTimeRangeTo: consentDateTo
            });

            if (response && response.success) {
                if (ProfileModel) {
                    await ProfileModel.updateOne(
                        { mobile: mobile },
                        {
                            $set: {
                                'finvu.sessionId': response.sessionId,
                                'finvu.fiRequestedAt': new Date()
                            }
                        }
                    );
                }
                res.json({ success: true, data: response });
            } else {
                res.json({ success: false, message: 'FI request failed' });
            }
        } catch (error) {
            log('FinVu FI request error:', error.response ? error.response.data : error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Check FI Status
    app.get('/api/finvu/fi/status', async (req, res) => {
        try {
            const { mobile, consentHandleId, consentId, sessionId } = req.query;

            if (!mobile) {
                return res.status(400).json({ success: false, message: 'mobile required' });
            }

            let consent_handle_id = consentHandleId;
            let consent_id = consentId;
            let session_id = sessionId;
            const cust_id = `${mobile}@finvu`;

            // Look up from profile if not provided
            if (!consent_handle_id || !consent_id || !session_id) {
                const profile = await ProfileModel.findOne({ mobile: mobile });
                consent_handle_id = consent_handle_id || profile?.finvu?.consentHandleId || profile?.finvu?.consentHandle;
                consent_id = consent_id || profile?.finvu?.consentId;
                session_id = session_id || profile?.finvu?.sessionId;
            }

            if (!consent_handle_id || !consent_id || !session_id) {
                return res.json({ success: false, message: 'Missing required parameters. Please trigger FI request first.' });
            }

            const response = await finvuClient.fiStatus({
                consentHandleId: consent_handle_id,
                custId: cust_id,
                consentId: consent_id,
                sessionId: session_id
            });
            res.json({ success: true, data: response });
        } catch (error) {
            log('FinVu FI status error:', error.response ? error.response.data : error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Fetch financial data
    app.post('/api/finvu/data/fetch', async (req, res) => {
        const FinvuDashboardCacheModel = require('../../schema/financial-aggregator/finvu-dashboard-cache-schema');
        try {
            const { consentHandle, sessionId, mobile } = req.body;

            if (!mobile) {
                return res.status(400).json({ success: false, message: 'mobile required' });
            }

            let consent_handle = consentHandle;
            let session_id = sessionId;
            let user_mobile = mobile;

            // If mobile provided, look up from profile
            if (!consent_handle || !session_id) {
                const profile = await ProfileModel.findOne({ mobile: mobile });
                consent_handle = consent_handle || profile?.finvu?.consentHandle || profile?.finvu?.consentHandleId;
                session_id = session_id || profile?.finvu?.sessionId;
            }

            if (!consent_handle || !session_id) {
                log('FinVu data/fetch rejected: missing consent or session for mobile', user_mobile, 'hasConsent:', !!consent_handle, 'hasSession:', !!session_id);
                var msg = !consent_handle
                    ? 'Missing consentHandle or sessionId. Please complete consent flow first.'
                    : 'Session expired or not started. Click Refresh to load data.';
                return res.json({
                    success: false,
                    code: 'MISSING_SESSION',
                    message: msg
                });
            }

            log('Fetching Finvu data - consentHandle:', consent_handle, 'sessionId:', session_id);
            const result = await finvuClient.fetchData(consent_handle, session_id);

            log('Finvu fetch result:', {
                success: result.success,
                hasData: !!result.data,
                accountCount: result.data?.accounts?.length || 0,
                transactionCount: result.data?.transactions?.length || 0
            });

            // Normalize in case API returns stringified JSON
            if (result.success && result.data) {
                if (typeof result.data.transactions === 'string') {
                    try { result.data.transactions = JSON.parse(result.data.transactions); } catch (e) { result.data.transactions = []; }
                }
                if (!Array.isArray(result.data.transactions)) result.data.transactions = result.data.transactions ? [result.data.transactions] : [];
                if (typeof result.data.accounts === 'string') {
                    try { result.data.accounts = JSON.parse(result.data.accounts); } catch (e) { result.data.accounts = []; }
                }
                if (!Array.isArray(result.data.accounts)) result.data.accounts = result.data.accounts ? [result.data.accounts] : [];
            }

            // Store linked accounts if data available
            if (result.success && result.data && result.data.accounts && result.data.accounts.length > 0) {
                const LinkedAccountModel = require('../../schema/financial-aggregator/linked-account-schema');

                for (const acc of result.data.accounts) {
                    await LinkedAccountModel.findOneAndUpdate(
                        {
                            mobile: user_mobile,
                            accountNumber: acc.accountNumber,
                            provider: 'FINVU'
                        },
                        {
                            $set: {
                                accountType: acc.type || 'SAVINGS',
                                bankName: acc.bankName || acc.bank_name,
                                currentBalance: acc.balance,
                                ifsc: acc.ifsc,
                                consentId: consent_handle,
                                lastUpdated: new Date(),
                                status: 'ACTIVE'
                            }
                        },
                        { upsert: true, new: true }
                    );
                }

                // Update profile
                await ProfileModel.updateOne(
                    { mobile: user_mobile },
                    {
                        $set: {
                            'finvu.isLinked': true,
                            'finvu.lastSynced': new Date(),
                            'finvu.status': 'ACTIVE',
                            'finvu.accountCount': result.data.accounts.length
                        }
                    }
                );

                // Cache dashboard data for GET /api/finvu/dashboard
                const summary = computeSummaryFromTransactions(result.data.transactions, result.data.totalBalance);
                const txns = (result.data.transactions || []).map(t => (typeof t === 'object' && t !== null ? {
                    type: t.type,
                    amount: t.amount,
                    date: t.date,
                    valueDate: t.valueDate,
                    narration: t.narration,
                    mode: t.mode,
                    currentBalance: t.currentBalance,
                    txnId: t.txnId,
                    accountRef: t.accountRef
                } : null)).filter(Boolean);
                try {
                    await FinvuDashboardCacheModel.findOneAndUpdate(
                        { mobile: user_mobile },
                        {
                            $set: {
                                accounts: result.data.accounts,
                                transactions: txns,
                                summary,
                                fetchedAt: new Date()
                            }
                        },
                        { upsert: true, new: true }
                    );
                } catch (cacheErr) {
                    if (cacheErr.name === 'CastError' && cacheErr.path && String(cacheErr.path).indexOf('transactions') !== -1) {
                        await FinvuDashboardCacheModel.deleteOne({ mobile: user_mobile });
                        await FinvuDashboardCacheModel.findOneAndUpdate(
                            { mobile: user_mobile },
                            { $set: { accounts: result.data.accounts, transactions: txns, summary, fetchedAt: new Date() } },
                            { upsert: true, new: true }
                        );
                    } else {
                        throw cacheErr;
                    }
                }
            }

            const responseData = { ...result.data };
            if (result.success && result.data) {
                const cache = await FinvuDashboardCacheModel.findOne({ mobile: user_mobile }).lean();
                if (cache && cache.fetchedAt) responseData.fetchedAt = cache.fetchedAt;
                else responseData.fetchedAt = new Date();
            }
            res.json({
                success: true,
                data: responseData,
                mode: result.mode
            });
        } catch (error) {
            log('FinVu data fetch error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get dashboard (cached accounts + transactions + summary) for connected user
    app.get('/api/finvu/dashboard', async (req, res) => {
        try {
            const mobile = req.session?.mobile || req.query.mobile;
            if (!mobile) return res.status(401).json({ success: false, message: 'Unauthorized' });
            const FinvuDashboardCacheModel = require('../../schema/financial-aggregator/finvu-dashboard-cache-schema');
            const cache = await FinvuDashboardCacheModel.findOne({ mobile });
            if (!cache) {
                return res.json({ success: true, data: null, message: 'No dashboard data. Connect bank and refresh data.' });
            }
            res.json({
                success: true,
                data: {
                    accounts: cache.accounts || [],
                    transactions: cache.transactions || [],
                    summary: cache.summary || {},
                    fetchedAt: cache.fetchedAt
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get financial summary
    app.get('/api/finvu/summary', async (req, res) => {
        try {
            const mobile = req.session?.mobile || req.query.mobile;
            if (!mobile) return res.status(401).json({ success: false, message: 'Unauthorized' });

            const LinkedAccountModel = require('../../schema/financial-aggregator/linked-account-schema');
            let accounts = await LinkedAccountModel.find({ mobile: mobile, status: 'ACTIVE' });

            const totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);

            res.json({
                success: true,
                summary: {
                    totalBalance,
                    accountCount: accounts.length,
                    banks: [...new Set(accounts.map(a => a.bankName))],
                    lastUpdated: accounts.length > 0 ?
                        Math.max(...accounts.map(a => new Date(a.lastUpdated).getTime())) : Date.now()
                },
                accounts: accounts.map(a => ({
                    bank: a.bankName,
                    type: a.accountType,
                    balance: a.currentBalance,
                    masked: a.accountNumber
                }))
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Webhook for consent approval – proxy from finvu_integration; update profile and optionally fetch data
    app.post('/api/finvu/webhook/consent', async (req, res) => {
        const { consentId, status } = req.body;
        log('FinVu Webhook Received:', consentId, status);

        if (status === 'ACTIVE') {
            try {
                const userProfile = await ProfileModel.findOne({ 'finvu.consentId': consentId });
                if (!userProfile) {
                    log('FinVu Webhook: Profile not found for consentId', consentId);
                    return res.sendStatus(404);
                }

                const consentHandle = userProfile.finvu?.consentHandleId || userProfile.finvu?.consentHandle || consentId;
                const sessionId = userProfile.finvu?.sessionId;
                if (consentHandle && sessionId) {
                    const result = await finvuClient.fetchData(consentHandle, sessionId);
                    const analyzed = result.data || {};
                    const LinkedAccountModel = require('../../schema/financial-aggregator/linked-account-schema');
                    if (analyzed.accounts && analyzed.accounts.length > 0) {
                        for (const acc of analyzed.accounts) {
                            await LinkedAccountModel.findOneAndUpdate(
                                {
                                    mobile: userProfile.mobile,
                                    accountNumber: acc.accountNumber,
                                    provider: 'FINVU'
                                },
                                {
                                    $set: {
                                        profile: userProfile.profile || userProfile.mobile,
                                        accountType: acc.type || 'SAVINGS',
                                        bankName: acc.bankName || 'Unknown Bank',
                                        currentBalance: acc.balance,
                                        consentId: consentId,
                                        lastUpdated: new Date(),
                                        status: 'ACTIVE',
                                        raw_data: acc
                                    }
                                },
                                { upsert: true, new: true }
                            );
                        }
                    }
                }

                await ProfileModel.updateOne({ _id: userProfile._id }, {
                    $set: {
                        'finvu.isLinked': true,
                        'finvu.lastSynced': new Date()
                    }
                });
                log('FinVu Webhook processed for user:', userProfile.mobile);
            } catch (err) {
                console.error('FinVu Webhook Processing Error:', err);
                return res.sendStatus(500);
            }
        }
        res.sendStatus(200);
    });

    // Get Linked Accounts
    app.get('/api/finvu/accounts', async (req, res) => {
        try {
            const mobile = req.session.mobile || req.query.mobile;
            if (!mobile) return res.status(401).json({ success: false, message: 'Unauthorized' });

            const LinkedAccountModel = require('../../schema/financial-aggregator/linked-account-schema');
            const accounts = await LinkedAccountModel.find({ mobile: mobile });

            res.json({ success: true, accounts: accounts });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Disconnect FinVu: clear profile.finvu, dashboard cache, and mark linked accounts inactive (start fresh)
    app.post('/api/finvu/disconnect', async (req, res) => {
        try {
            const mobile = req.body.mobile || req.session?.mobile || req.query.mobile;
            if (!mobile) return res.status(400).json({ success: false, message: 'mobile required' });

            const FinvuDashboardCacheModel = require('../../schema/financial-aggregator/finvu-dashboard-cache-schema');
            const LinkedAccountModel = require('../../schema/financial-aggregator/linked-account-schema');

            await FinvuDashboardCacheModel.deleteOne({ mobile });
            await LinkedAccountModel.updateMany(
                { mobile, provider: 'FINVU' },
                { $set: { status: 'REVOKED', lastUpdated: new Date() } }
            );
            if (ProfileModel) {
                await ProfileModel.updateOne(
                    { mobile },
                    {
                        $set: {
                            'finvu.isLinked': false,
                            'finvu.status': 'DISCONNECTED',
                            'finvu.disconnectedAt': new Date()
                        },
                        $unset: {
                            'finvu.consentHandle': 1,
                            'finvu.consentHandleId': 1,
                            'finvu.consentId': 1,
                            'finvu.sessionId': 1,
                            'finvu.lastSynced': 1,
                            'finvu.accountCount': 1,
                            'finvu.handle': 1,
                            'finvu.consentDateRange': 1,
                            'finvu.fiRequestedAt': 1,
                            'finvu.redirectUrl': 1,
                            'finvu.initiatedAt': 1
                        }
                    }
                );
            }

            log('FinVu disconnected for mobile:', mobile);
            res.json({ success: true, message: 'FinVu disconnected. You can connect again from scratch.' });
        } catch (error) {
            log('FinVu disconnect error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

})();
