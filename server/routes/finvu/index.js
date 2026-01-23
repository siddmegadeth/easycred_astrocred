(function () {
    'use strict';

    const FinVuService = require('./finvu-service');

    /**
     * FinVu Routes
     */

    // Initiate Consent
    app.post('/api/finvu/consent/initiate', async (req, res) => {
        try {
            const { mobile, handle } = req.body;
            if (!mobile) return res.status(400).json({ success: false, message: 'Mobile number is required' });

            const result = await FinVuService.initiateConsent(mobile, handle);

            // Update profile with consent search
            await ProfileModel.updateOne({ mobile: mobile }, {
                'finvu.consentId': result.consentId,
                'finvu.handle': handle || `${mobile}@finvu`
            });

            res.json({ success: true, data: result });
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
