(function () {
    'use strict';

    const FinVuService = require('./finvu-service');

    /**
     * FinVu Account Aggregator Routes
     * Handles consent management and financial data fetching
     */

    // Get FinVu service status
    app.get('/api/finvu/status', async (req, res) => {
        try {
            const status = FinVuService.getStatus();
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
            const result = await FinVuService.initiateConsent(mobile, handle);

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

            const result = await FinVuService.checkConsentStatus(consent_handle, cust_id);

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

            res.json({ success: true, ...result });
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

            // Call local Finvu service FI request endpoint
            const FinVuService = require('./finvu-service');
            const localUrl = FinVuService.localUrl || 'http://localhost:3000';
            const custId = `${mobile}@finvu`;

            // Get consent details to find the date range that was consented
            let consentDateFrom = dateTimeRangeFrom;
            let consentDateTo = dateTimeRangeTo;

            // If date range not provided, try to get from consent details
            if (!consentDateFrom || !consentDateTo) {
                try {
                    const profile = await ProfileModel.findOne({ mobile: mobile });
                    if (profile?.finvu?.consentDateRange) {
                        consentDateFrom = profile.finvu.consentDateRange.from;
                        consentDateTo = profile.finvu.consentDateRange.to;
                    } else {
                        // Default: last 12 months (matching typical consent)
                        consentDateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
                        consentDateTo = new Date().toISOString();
                    }
                } catch (e) {
                    // Fallback to default range
                    consentDateFrom = dateTimeRangeFrom || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
                    consentDateTo = dateTimeRangeTo || new Date().toISOString();
                }
            }

            log('Calling local Finvu FI request:', `${localUrl}/fi/request`, 'Date range:', consentDateFrom, 'to', consentDateTo);
            const axios = require('axios');
            const response = await axios.post(`${localUrl}/fi/request`, {
                custId: custId,
                consentId: consent_id,
                consentHandleId: consent_handle_id,
                dateTimeRangeFrom: consentDateFrom,
                dateTimeRangeTo: consentDateTo
            });

            if (response.data && response.data.success) {
                // Store sessionId in profile
                if (ProfileModel) {
                    await ProfileModel.updateOne(
                        { mobile: mobile },
                        {
                            $set: {
                                'finvu.sessionId': response.data.sessionId,
                                'finvu.fiRequestedAt': new Date()
                            }
                        }
                    );
                }

                res.json({ success: true, data: response.data });
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

            // Call local Finvu service FI status endpoint
            const FinVuService = require('./finvu-service');
            const localUrl = FinVuService.localUrl || 'http://localhost:3000';

            log('Calling local Finvu FI status:', `${localUrl}/fi/status`);
            const axios = require('axios');
            const response = await axios.get(`${localUrl}/fi/status`, {
                params: {
                    consentHandleId: consent_handle_id,
                    custId: cust_id,
                    consentId: consent_id,
                    sessionId: session_id
                }
            });

            res.json({ success: true, data: response.data });
        } catch (error) {
            log('FinVu FI status error:', error.response ? error.response.data : error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Fetch financial data
    app.post('/api/finvu/data/fetch', async (req, res) => {
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
                return res.json({
                    success: false,
                    message: 'Missing consentHandle or sessionId. Please complete consent flow first.'
                });
            }

            // Fetch data using local service
            log('Fetching Finvu data - consentHandle:', consent_handle, 'sessionId:', session_id);
            const result = await FinVuService.fetchData(consent_handle, session_id, user_mobile);

            log('Finvu fetch result:', {
                success: result.success,
                hasData: !!result.data,
                accountCount: result.data?.accounts?.length || 0,
                transactionCount: result.data?.transactions?.length || 0
            });

            // Store linked accounts if data available
            if (result.success && result.data && result.data.accounts) {
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
            }

            res.json({
                success: true,
                data: result.data,
                mode: result.mode
            });
        } catch (error) {
            log('FinVu data fetch error:', error);
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

            // MOCK DATA FALLBACK FOR DEMO
            if (accounts.length === 0 && (mobile === '7764056669' || req.query.demo === 'true')) {
                accounts = [
                    { bankName: 'HDFC Bank', accountType: 'SAVINGS', currentBalance: 45000, accountNumber: 'XXXXXX1234', lastUpdated: new Date() },
                    { bankName: 'SBI', accountType: 'SALARY', currentBalance: 12500, accountNumber: 'XXXXXX5678', lastUpdated: new Date() },
                    { bankName: 'Kotak Mahindra', accountType: 'SAVINGS', currentBalance: 8750, accountNumber: 'XXXXXX9012', lastUpdated: new Date() }
                ];
            }

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

    // Webhook for Consent Approval (Mocked for now)
    app.post('/api/finvu/webhook/consent', async (req, res) => {
        const { consentId, status } = req.body;
        log('FinVu Webhook Received:', consentId, status);

        if (status === 'ACTIVE') {
            try {
                // Find user by consentId
                const userProfile = await ProfileModel.findOne({ 'finvu.consentId': consentId });
                if (!userProfile) {
                    log('FinVu Webhook: Profile not found for consentId', consentId);
                    return res.sendStatus(404);
                }

                // Trigger data fetch
                const rawData = await FinVuService.fetchData(consentId);
                const analyzed = FinVuService.processFinVuData(rawData);
                const LinkedAccountModel = require('../../schema/financial-aggregator/linked-account-schema');

                // Save or Update Linked Accounts
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

                // Update Profile status
                await ProfileModel.updateOne({ _id: userProfile._id }, {
                    $set: {
                        'finvu.isLinked': true,
                        'finvu.lastSynced': new Date()
                    }
                });

                log('FinVu Data Synced for user:', userProfile.mobile);

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

})();
