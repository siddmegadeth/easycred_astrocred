(function () {
    'use strict';

    /**
     * FinVu Account Aggregator Service
     * Handles Consent Management and Data Fetching
     */

    const FINVU_CONFIG = {
        BASE_URL: process.env.FINVU_BASE_URL || 'https://api.finvu.in/api/v1',
        CLIENT_ID: process.env.FINVU_CLIENT_ID,
        CLIENT_SECRET: process.env.FINVU_CLIENT_SECRET,
        APP_ID: process.env.FINVU_APP_ID
    };

    class FinVuService {
        constructor() {
            this.axiosConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': FINVU_CONFIG.CLIENT_ID,
                    'x-client-secret': FINVU_CONFIG.CLIENT_SECRET
                }
            };
        }

        /**
         * Initiate Consent Request
         */
        async initiateConsent(mobile, handle) {
            try {
                log('Initiating FinVu Consent for:', mobile);
                const response = await axios.post(`${FINVU_CONFIG.BASE_URL}/consent-request`, {
                    customer: {
                        id: handle || `${mobile}@finvu`,
                        mobile: mobile
                    },
                    consent_info: {
                        type: 'ONETIME', // or PERIODIC
                        usage_duration: '1Y',
                        data_filter: {
                            type: 'TRANSACTIONS',
                            value: 'PAST_6_MONTHS'
                        },
                        fidata_types: ['DEPOSIT', 'TERM_DEPOSIT', 'RECURRING_DEPOSIT']
                    }
                }, this.axiosConfig);

                return response.data; // Should return consentId
            } catch (error) {
                log('FinVu Initiate Consent Error:', error.response ? error.response.data : error.message);
                throw error;
            }
        }

        /**
         * Check Consent Status
         */
        async checkConsentStatus(consentId) {
            try {
                const response = await axios.get(`${FINVU_CONFIG.BASE_URL}/consent-status/${consentId}`, this.axiosConfig);
                return response.data;
            } catch (error) {
                log('FinVu Consent Status Error:', error.message);
                throw error;
            }
        }

        /**
         * Fetch Data after Consent is ACTIVE
         */
        async fetchData(consentId) {
            try {
                const response = await axios.post(`${FINVU_CONFIG.BASE_URL}/fetch-data`, {
                    consent_id: consentId
                }, this.axiosConfig);
                return response.data;
            } catch (error) {
                log('FinVu Fetch Data Error:', error.message);
                throw error;
            }
        }

        /**
         * Process and Analyze FinVu Data
         */
        processFinVuData(rawData) {
            // Simplified logic to extract balance and income
            let totalBalance = 0;
            let accounts = [];

            if (rawData && rawData.accounts) {
                rawData.accounts.forEach(acc => {
                    totalBalance += acc.balance || 0;
                    accounts.push({
                        accountNumber: acc.masked_account_number,
                        bankName: acc.bank_name,
                        balance: acc.balance,
                        type: acc.type
                    });
                });
            }

            return {
                totalBalance,
                accounts,
                timestamp: new Date()
            };
        }
    }

    module.exports = new FinVuService();

})();
