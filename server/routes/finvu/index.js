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

            // Update profile with consent info
            if (ProfileModel) {
                await ProfileModel.updateOne(
                    { mobile: mobile }, 
                    {
                        $set: {
                            'finvu.consentId': result.consentId,
                            'finvu.handle': handle || `${mobile}@finvu`,
                            'finvu.initiatedAt': new Date(),
                            'finvu.status': 'PENDING'
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
            const { consentId, mobile } = req.query;
            
            if (!consentId && !mobile) {
                return res.status(400).json({ success: false, message: 'consentId or mobile required' });
            }

            let consent_id = consentId;
            
            // If mobile provided, look up consentId from profile
            if (!consent_id && mobile) {
                const profile = await ProfileModel.findOne({ mobile: mobile });
                consent_id = profile?.finvu?.consentId;
            }

            if (!consent_id) {
                return res.json({ success: false, message: 'No consent found', status: 'NOT_INITIATED' });
            }

            const result = await FinVuService.checkConsentStatus(consent_id);
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Fetch financial data
    app.post('/api/finvu/data/fetch', async (req, res) => {
        try {
            const { consentId, mobile } = req.body;
            
            if (!consentId && !mobile) {
                return res.status(400).json({ success: false, message: 'consentId or mobile required' });
            }

            let consent_id = consentId;
            let user_mobile = mobile;

            // If mobile provided, look up consentId from profile
            if (!consent_id && mobile) {
                const profile = await ProfileModel.findOne({ mobile: mobile });
                consent_id = profile?.finvu?.consentId;
                user_mobile = mobile;
            }

            if (!consent_id) {
                return res.json({ success: false, message: 'No active consent found' });
            }

            // Check consent status first
            const consentStatus = await FinVuService.checkConsentStatus(consent_id);
            if (consentStatus.status !== 'ACTIVE') {
                return res.json({ 
                    success: false, 
                    message: 'Consent is not active', 
                    status: consentStatus.status 
                });
            }

            // Fetch data
            const result = await FinVuService.fetchData(consent_id, user_mobile);
            
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
                                consentId: consent_id,
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
            const accounts = await LinkedAccountModel.find({ mobile: mobile, status: 'ACTIVE' });

            const totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
            
            res.json({ 
                success: true, 
                summary: {
                    totalBalance,
                    accountCount: accounts.length,
                    banks: [...new Set(accounts.map(a => a.bankName))],
                    lastUpdated: accounts.length > 0 ? 
                        Math.max(...accounts.map(a => new Date(a.lastUpdated).getTime())) : null
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
