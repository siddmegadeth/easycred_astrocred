(function () {
    'use strict';

    /**
     * FinVu Account Aggregator Service
     * Handles Consent Management and Data Fetching
     * Supports both Sandbox and Production modes
     */

    const FINVU_CONFIG = {
        // Determine environment
        isSandbox: process.env.FINVU_ENV === 'sandbox' || process.env.NODE_ENV !== 'production',
        
        // Sandbox URLs
        SANDBOX_URL: process.env.FINVU_SANDBOX_URL || 'https://sandbox.finvu.in/api/v1',
        SANDBOX_CLIENT_ID: process.env.FINVU_SANDBOX_CLIENT_ID,
        SANDBOX_CLIENT_SECRET: process.env.FINVU_SANDBOX_CLIENT_SECRET,
        
        // Production URLs
        PROD_URL: process.env.FINVU_BASE_URL || 'https://api.finvu.in/api/v1',
        PROD_CLIENT_ID: process.env.FINVU_CLIENT_ID,
        PROD_CLIENT_SECRET: process.env.FINVU_CLIENT_SECRET,
        
        APP_ID: process.env.FINVU_APP_ID
    };

    class FinVuService {
        constructor() {
            this.isSandbox = FINVU_CONFIG.isSandbox;
            this.baseUrl = this.isSandbox ? FINVU_CONFIG.SANDBOX_URL : FINVU_CONFIG.PROD_URL;
            this.clientId = this.isSandbox ? FINVU_CONFIG.SANDBOX_CLIENT_ID : FINVU_CONFIG.PROD_CLIENT_ID;
            this.clientSecret = this.isSandbox ? FINVU_CONFIG.SANDBOX_CLIENT_SECRET : FINVU_CONFIG.PROD_CLIENT_SECRET;
            
            this.axiosConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': this.clientId,
                    'x-client-secret': this.clientSecret
                }
            };
            
            log('FinVu Service initialized in ' + (this.isSandbox ? 'SANDBOX' : 'PRODUCTION') + ' mode');
        }

        /**
         * Get service status
         */
        getStatus() {
            return {
                mode: this.isSandbox ? 'sandbox' : 'production',
                baseUrl: this.baseUrl,
                configured: !!(this.clientId && this.clientSecret)
            };
        }

        /**
         * Generate sandbox mock data
         */
        generateSandboxData(mobile) {
            return {
                consentId: 'SANDBOX_CONSENT_' + Date.now(),
                status: 'ACTIVE',
                accounts: [
                    {
                        masked_account_number: 'XXXX' + mobile.slice(-4) + '1234',
                        bank_name: 'HDFC Bank',
                        balance: Math.floor(Math.random() * 500000) + 50000,
                        type: 'SAVINGS',
                        ifsc: 'HDFC0001234'
                    },
                    {
                        masked_account_number: 'XXXX' + mobile.slice(-4) + '5678',
                        bank_name: 'ICICI Bank',
                        balance: Math.floor(Math.random() * 200000) + 20000,
                        type: 'SAVINGS',
                        ifsc: 'ICIC0001234'
                    }
                ],
                transactions: this.generateMockTransactions(30),
                summary: {
                    totalBalance: 0,
                    avgMonthlyIncome: Math.floor(Math.random() * 100000) + 30000,
                    avgMonthlyExpense: Math.floor(Math.random() * 50000) + 20000,
                    savingsRate: Math.floor(Math.random() * 30) + 10
                }
            };
        }

        /**
         * Generate mock transactions
         */
        generateMockTransactions(count) {
            const types = ['CREDIT', 'DEBIT'];
            const categories = ['SALARY', 'SHOPPING', 'FOOD', 'UTILITIES', 'TRANSFER', 'EMI', 'INVESTMENT'];
            const transactions = [];
            
            for (let i = 0; i < count; i++) {
                const isCredit = Math.random() > 0.4;
                transactions.push({
                    id: 'TXN_' + Date.now() + '_' + i,
                    type: isCredit ? 'CREDIT' : 'DEBIT',
                    amount: Math.floor(Math.random() * (isCredit ? 50000 : 10000)) + 100,
                    category: categories[Math.floor(Math.random() * categories.length)],
                    description: isCredit ? 'Salary Credit' : 'Purchase',
                    date: new Date(Date.now() - i * 86400000).toISOString(),
                    balance: Math.floor(Math.random() * 100000) + 10000
                });
            }
            
            return transactions;
        }

        /**
         * Initiate Consent Request
         */
        async initiateConsent(mobile, handle) {
            try {
                log('Initiating FinVu Consent for:', mobile, 'Mode:', this.isSandbox ? 'SANDBOX' : 'PRODUCTION');
                
                // In sandbox mode without credentials, return mock data
                if (this.isSandbox && (!this.clientId || !this.clientSecret)) {
                    log('Using sandbox mock consent');
                    const mockData = this.generateSandboxData(mobile);
                    return {
                        success: true,
                        consentId: mockData.consentId,
                        redirectUrl: null, // No redirect in sandbox
                        mode: 'sandbox'
                    };
                }

                const response = await axios.post(`${this.baseUrl}/consent-request`, {
                    customer: {
                        id: handle || `${mobile}@finvu`,
                        mobile: mobile
                    },
                    consent_info: {
                        type: 'ONETIME',
                        usage_duration: '1Y',
                        data_filter: {
                            type: 'TRANSACTIONS',
                            value: 'PAST_6_MONTHS'
                        },
                        fidata_types: ['DEPOSIT', 'TERM_DEPOSIT', 'RECURRING_DEPOSIT', 'MUTUAL_FUNDS']
                    }
                }, this.axiosConfig);

                return {
                    success: true,
                    consentId: response.data.consentId,
                    redirectUrl: response.data.redirectUrl,
                    mode: 'production'
                };
            } catch (error) {
                log('FinVu Initiate Consent Error:', error.response ? error.response.data : error.message);
                
                // Return sandbox mock on error
                if (this.isSandbox) {
                    const mockData = this.generateSandboxData(mobile);
                    return {
                        success: true,
                        consentId: mockData.consentId,
                        redirectUrl: null,
                        mode: 'sandbox_fallback'
                    };
                }
                
                throw error;
            }
        }

        /**
         * Check Consent Status
         */
        async checkConsentStatus(consentId) {
            try {
                // Sandbox mode
                if (this.isSandbox && consentId.startsWith('SANDBOX_')) {
                    return {
                        success: true,
                        status: 'ACTIVE',
                        consentId: consentId,
                        mode: 'sandbox'
                    };
                }

                const response = await axios.get(`${this.baseUrl}/consent-status/${consentId}`, this.axiosConfig);
                return {
                    success: true,
                    status: response.data.status,
                    consentId: consentId,
                    mode: 'production'
                };
            } catch (error) {
                log('FinVu Consent Status Error:', error.message);
                
                if (this.isSandbox) {
                    return { success: true, status: 'ACTIVE', mode: 'sandbox_fallback' };
                }
                throw error;
            }
        }

        /**
         * Fetch Financial Data after Consent is ACTIVE
         */
        async fetchData(consentId, mobile) {
            try {
                log('Fetching FinVu data for consent:', consentId);
                
                // Sandbox mode
                if (this.isSandbox && (consentId.startsWith('SANDBOX_') || !this.clientId)) {
                    const mockData = this.generateSandboxData(mobile || '9999999999');
                    mockData.summary.totalBalance = mockData.accounts.reduce((sum, acc) => sum + acc.balance, 0);
                    return {
                        success: true,
                        data: mockData,
                        mode: 'sandbox'
                    };
                }

                const response = await axios.post(`${this.baseUrl}/fetch-data`, {
                    consent_id: consentId
                }, this.axiosConfig);

                return {
                    success: true,
                    data: this.processFinVuData(response.data),
                    mode: 'production'
                };
            } catch (error) {
                log('FinVu Fetch Data Error:', error.message);
                
                if (this.isSandbox) {
                    const mockData = this.generateSandboxData(mobile || '9999999999');
                    mockData.summary.totalBalance = mockData.accounts.reduce((sum, acc) => sum + acc.balance, 0);
                    return {
                        success: true,
                        data: mockData,
                        mode: 'sandbox_fallback'
                    };
                }
                throw error;
            }
        }

        /**
         * Process and Analyze FinVu Data
         */
        processFinVuData(rawData) {
            let totalBalance = 0;
            let accounts = [];
            let transactions = [];

            if (rawData && rawData.accounts) {
                rawData.accounts.forEach(acc => {
                    totalBalance += acc.balance || 0;
                    accounts.push({
                        accountNumber: acc.masked_account_number,
                        bankName: acc.bank_name,
                        balance: acc.balance,
                        type: acc.type,
                        ifsc: acc.ifsc
                    });
                });
            }

            if (rawData && rawData.transactions) {
                transactions = rawData.transactions;
            }

            // Calculate financial metrics
            const income = transactions
                .filter(t => t.type === 'CREDIT')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const expenses = transactions
                .filter(t => t.type === 'DEBIT')
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                totalBalance,
                accounts,
                transactions,
                summary: {
                    totalBalance,
                    totalIncome: income,
                    totalExpenses: expenses,
                    savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
                    accountCount: accounts.length,
                    transactionCount: transactions.length
                },
                timestamp: new Date()
            };
        }

        /**
         * Analyze spending patterns
         */
        analyzeSpending(transactions) {
            const categories = {};
            
            transactions.forEach(txn => {
                if (txn.type === 'DEBIT') {
                    const cat = txn.category || 'OTHER';
                    categories[cat] = (categories[cat] || 0) + txn.amount;
                }
            });

            return Object.entries(categories)
                .map(([category, amount]) => ({ category, amount }))
                .sort((a, b) => b.amount - a.amount);
        }

        /**
         * Calculate debt-to-income ratio
         */
        calculateDTI(income, emiPayments) {
            if (!income || income === 0) return 0;
            return Math.round((emiPayments / income) * 100);
        }
    }

    module.exports = new FinVuService();

})();
