(function () {
    'use strict';

    /**
     * FinVu Account Aggregator Service
     * Handles Consent Management and Data Fetching
     * Supports both Sandbox and Production modes
     */

    const FINVU_CONFIG = {
        // Use local Finvu integration service (from finvu_integration/lambda)
        LOCAL_URL: process.env.FINVU_LOCAL_URL || 'http://localhost:3000',
        USE_LOCAL: process.env.FINVU_USE_LOCAL !== 'false', // Default to true for local development
        
        // Determine environment
        isSandbox: process.env.FINVU_ENV === 'sandbox' || process.env.NODE_ENV !== 'production',
        
        // Sandbox URLs (fallback)
        SANDBOX_URL: process.env.FINVU_SANDBOX_URL || 'https://sandbox.finvu.in/api/v1',
        SANDBOX_CLIENT_ID: process.env.FINVU_SANDBOX_CLIENT_ID,
        SANDBOX_CLIENT_SECRET: process.env.FINVU_SANDBOX_CLIENT_SECRET,
        
        // Production URLs (fallback)
        PROD_URL: process.env.FINVU_BASE_URL || 'https://api.finvu.in/api/v1',
        PROD_CLIENT_ID: process.env.FINVU_CLIENT_ID,
        PROD_CLIENT_SECRET: process.env.FINVU_CLIENT_SECRET,
        
        APP_ID: process.env.FINVU_APP_ID
    };

    class FinVuService {
        constructor() {
            this.useLocal = FINVU_CONFIG.USE_LOCAL;
            this.localUrl = FINVU_CONFIG.LOCAL_URL;
            this.isSandbox = FINVU_CONFIG.isSandbox;
            this.baseUrl = this.useLocal ? this.localUrl : (this.isSandbox ? FINVU_CONFIG.SANDBOX_URL : FINVU_CONFIG.PROD_URL);
            this.clientId = this.isSandbox ? FINVU_CONFIG.SANDBOX_CLIENT_ID : FINVU_CONFIG.PROD_CLIENT_ID;
            this.clientSecret = this.isSandbox ? FINVU_CONFIG.SANDBOX_CLIENT_SECRET : FINVU_CONFIG.PROD_CLIENT_SECRET;
            
            this.axiosConfig = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            // Only add auth headers if not using local service
            if (!this.useLocal && this.clientId && this.clientSecret) {
                this.axiosConfig.headers['x-client-id'] = this.clientId;
                this.axiosConfig.headers['x-client-secret'] = this.clientSecret;
            }
            
            log('FinVu Service initialized - Mode: ' + (this.useLocal ? 'LOCAL (' + this.localUrl + ')' : (this.isSandbox ? 'SANDBOX' : 'PRODUCTION')));
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
                log('Initiating FinVu Consent for:', mobile, 'Mode:', this.useLocal ? 'LOCAL' : (this.isSandbox ? 'SANDBOX' : 'PRODUCTION'));
                
                // Use local Finvu integration service
                if (this.useLocal) {
                    const custId = handle || `${mobile}@finvu`;
                    const redirectUrl = process.env.APP_URL || 'https://www.google.com/';
                    
                    log('Calling local Finvu service:', `${this.localUrl}/consent/request`);
                    const response = await axios.post(`${this.localUrl}/consent/request`, {
                        custId: custId,
                        redirectUrl: redirectUrl,
                        consentDescription: 'Account data for financial insights',
                        templateName: 'FINVUDEMO_TESTING',
                        userSessionId: 'sessionid' + Date.now()
                    }, this.axiosConfig);

                    if (response.data && response.data.success) {
                        return {
                            success: true,
                            consentHandle: response.data.consentHandle,
                            consentHandleId: response.data.consentHandleId,
                            redirectUrl: response.data.redirectUrlForUser || response.data.redirectUrl,
                            mode: 'local'
                        };
                    }
                    throw new Error('Local service returned error');
                }
                
                // Fallback to sandbox mock if no credentials
                if (this.isSandbox && (!this.clientId || !this.clientSecret)) {
                    log('Using sandbox mock consent');
                    const mockData = this.generateSandboxData(mobile);
                    return {
                        success: true,
                        consentId: mockData.consentId,
                        redirectUrl: null,
                        mode: 'sandbox'
                    };
                }

                // Original API call (fallback)
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
                if (this.isSandbox || this.useLocal) {
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
        async checkConsentStatus(consentHandle, custId) {
            try {
                // Use local Finvu integration service
                if (this.useLocal && consentHandle) {
                    const handle = consentHandle;
                    const customerId = custId || (handle.includes('@') ? handle : handle + '@finvu');
                    
                    log('Calling local Finvu service for consent status:', `${this.localUrl}/consent/status`);
                    const response = await axios.get(`${this.localUrl}/consent/status`, {
                        params: {
                            consentHandle: handle,
                            custId: customerId
                        },
                        ...this.axiosConfig
                    });

                    if (response.data && response.data.success) {
                        return {
                            success: true,
                            status: response.data.consentStatus,
                            consentId: response.data.consentId,
                            consentHandle: handle,
                            mode: 'local'
                        };
                    }
                }
                
                // Sandbox mode fallback
                if (this.isSandbox && consentHandle && consentHandle.startsWith('SANDBOX_')) {
                    return {
                        success: true,
                        status: 'ACTIVE',
                        consentId: consentHandle,
                        mode: 'sandbox'
                    };
                }

                // Original API call (fallback)
                const response = await axios.get(`${this.baseUrl}/consent-status/${consentHandle}`, this.axiosConfig);
                return {
                    success: true,
                    status: response.data.status,
                    consentId: consentHandle,
                    mode: 'production'
                };
            } catch (error) {
                log('FinVu Consent Status Error:', error.message);
                
                if (this.isSandbox || this.useLocal) {
                    return { success: true, status: 'ACTIVE', mode: 'sandbox_fallback' };
                }
                throw error;
            }
        }

        /**
         * Fetch Financial Data after Consent is ACTIVE
         * Requires: consentHandle (from consent/request) and sessionId (from fi/request)
         */
        async fetchData(consentHandle, sessionId, mobile) {
            try {
                log('Fetching FinVu data - consentHandle:', consentHandle, 'sessionId:', sessionId);
                
                // Use local Finvu integration service
                if (this.useLocal && consentHandle && sessionId) {
                    log('Calling local Finvu service for FI data:', `${this.localUrl}/fi/data`);
                    const response = await axios.get(`${this.localUrl}/fi/data`, {
                        params: {
                            consentHandle: consentHandle,
                            sessionId: sessionId
                        },
                        ...this.axiosConfig
                    });

                    if (response.data && response.data.success) {
                        // Extract data from response - Finvu returns { success: true, data: { header: {...}, body: {...} } }
                        const finvuData = response.data.data || response.data;
                        
                        // Log the structure for debugging
                        log('FinVu raw response structure:', {
                            hasHeader: !!finvuData.header,
                            hasBody: !!finvuData.body,
                            bodyKeys: finvuData.body ? Object.keys(finvuData.body) : [],
                            dataKeys: Object.keys(finvuData)
                        });
                        
                        // Process the FI data from Finvu (handle both direct data and body structure)
                        const dataToProcess = finvuData.body || finvuData;
                        const processedData = this.processFinVuData(dataToProcess);
                        
                        log('FinVu processed data:', {
                            accountCount: processedData.accounts.length,
                            transactionCount: processedData.transactions.length,
                            totalBalance: processedData.totalBalance
                        });
                        
                        return {
                            success: true,
                            data: processedData,
                            mode: 'local'
                        };
                    }
                }
                
                // Sandbox mode fallback
                if (this.isSandbox && (consentHandle && consentHandle.startsWith('SANDBOX_') || !this.clientId)) {
                    const mockData = this.generateSandboxData(mobile || '9999999999');
                    mockData.summary.totalBalance = mockData.accounts.reduce((sum, acc) => sum + acc.balance, 0);
                    return {
                        success: true,
                        data: mockData,
                        mode: 'sandbox'
                    };
                }

                // Original API call (fallback)
                const response = await axios.post(`${this.baseUrl}/fetch-data`, {
                    consent_id: consentHandle
                }, this.axiosConfig);

                return {
                    success: true,
                    data: this.processFinVuData(response.data),
                    mode: 'production'
                };
            } catch (error) {
                log('FinVu Fetch Data Error:', error.response ? error.response.data : error.message);
                
                // Fallback to mock data
                if (this.isSandbox || this.useLocal) {
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

            // Handle different response formats from Finvu
            if (rawData) {
                // Finvu FIDataFetch returns data in body.FIData or body structure
                // The response structure is: { header: {...}, body: {...} }
                // Accounts can be in body.FIData (array) or body.FIData.Accounts or body.Accounts
                
                let accountsData = [];
                let transactionsData = [];
                
                // Extract FIData from body if present
                const fiData = rawData.FIData || rawData.body?.FIData || rawData.body;
                
                // Try to find accounts in various locations
                if (fiData) {
                    if (Array.isArray(fiData)) {
                        // FIData is an array of account objects
                        accountsData = fiData;
                    } else if (fiData.Accounts && Array.isArray(fiData.Accounts)) {
                        accountsData = fiData.Accounts;
                    } else if (fiData.Account && !Array.isArray(fiData.Account)) {
                        // Single account object
                        accountsData = [fiData.Account];
                    } else if (fiData.Account && Array.isArray(fiData.Account)) {
                        accountsData = fiData.Account;
                    }
                }
                
                // Also check root level
                if (accountsData.length === 0) {
                    if (rawData.Accounts && Array.isArray(rawData.Accounts)) {
                        accountsData = rawData.Accounts;
                    } else if (rawData.Account && !Array.isArray(rawData.Account)) {
                        accountsData = [rawData.Account];
                    } else if (rawData.accounts && Array.isArray(rawData.accounts)) {
                        accountsData = rawData.accounts;
                    } else if (Array.isArray(rawData)) {
                        accountsData = rawData;
                    }
                }
                
                // Process accounts
                accountsData.forEach(acc => {
                    if (!acc) return;
                    
                    // Handle XML-like structure (from Working collection example)
                    // Account can be wrapped in <Account> tag or be direct object
                    const accountData = acc.Account || acc;
                    
                    // Extract account details - handle both XML structure and JSON structure
                    const summary = accountData.Summary || accountData.summary || accountData;
                    const profile = accountData.Profile || accountData.profile || {};
                    const accountTransactions = accountData.Transactions || accountData.transactions || {};
                    
                    // Extract balance - check multiple locations
                    const balance = parseFloat(
                        summary.currentBalance || 
                        summary.current_balance || 
                        accountData.currentBalance || 
                        accountData.current_balance ||
                        accountData.balance || 
                        0
                    );
                    totalBalance += balance;
                    
                    // Extract account number (masked) - check multiple formats
                    const maskedAccNum = summary.maskedAccNumber || 
                                        summary.masked_account_number ||
                                        accountData.masked_account_number || 
                                        accountData.maskedAccNumber ||
                                        accountData.mask_account_number ||
                                        accountData.accountNumber ||
                                        accountData.account_number ||
                                        'N/A';
                    
                    // Extract bank name - check multiple locations
                    const bankName = profile.member_name || 
                                   profile.memberName ||
                                   accountData.bank_name || 
                                   accountData.bankName || 
                                   accountData.member_name ||
                                   accountData.memberName ||
                                   accountData.lender_name ||
                                   'Unknown Bank';
                    
                    accounts.push({
                        accountNumber: maskedAccNum,
                        masked_account_number: maskedAccNum,
                        bankName: bankName,
                        bank_name: bankName,
                        balance: balance,
                        currentBalance: balance,
                        type: summary.type || accountData.type || accountData.account_type || accountData.accountType || 'SAVINGS',
                        accountType: summary.type || accountData.type || 'SAVINGS',
                        ifsc: summary.ifscCode || accountData.ifsc || accountData.IFSC || accountData.ifscCode || '',
                        ifscCode: summary.ifscCode || accountData.ifsc || '',
                        status: summary.status || accountData.status || 'ACTIVE',
                        currency: summary.currency || accountData.currency || 'INR'
                    });
                    
                    // Extract transactions from this account
                    const txnSource = accountTransactions.Transaction || accountTransactions.transaction || accountTransactions;
                    if (txnSource) {
                        const txnList = Array.isArray(txnSource) ? txnSource : [txnSource];
                        
                        txnList.forEach(txn => {
                            if (!txn) return;
                            
                            // Determine transaction type
                            let txnType = txn.type || 'DEBIT';
                            if (!txn.type && txn.amount) {
                                txnType = parseFloat(txn.amount) >= 0 ? 'CREDIT' : 'DEBIT';
                            }
                            
                            transactions.push({
                                id: txn.txnId || txn.transactionId || txn.id || Date.now() + Math.random(),
                                type: txnType,
                                transactionType: txnType,
                                amount: Math.abs(parseFloat(txn.amount || 0)),
                                category: txn.narration ? this.categorizeTransaction(txn.narration) : (txn.category || 'OTHER'),
                                description: txn.narration || txn.description || '',
                                narration: txn.narration || '',
                                date: txn.transactionTimestamp || txn.valueDate || txn.date || new Date().toISOString(),
                                transactionTimestamp: txn.transactionTimestamp,
                                valueDate: txn.valueDate,
                                balance: parseFloat(txn.currentBalance || txn.balance || 0),
                                mode: txn.mode || 'OTHERS'
                            });
                        });
                    }
                });
                
                // Also check for transactions at root level
                if (rawData.Transactions && Array.isArray(rawData.Transactions)) {
                    rawData.Transactions.forEach(txn => {
                        if (!txn) return;
                        transactions.push({
                            id: txn.txnId || txn.transactionId || txn.id || Date.now() + Math.random(),
                            type: txn.type || 'DEBIT',
                            transactionType: txn.type || 'DEBIT',
                            amount: Math.abs(parseFloat(txn.amount || 0)),
                            category: txn.narration ? this.categorizeTransaction(txn.narration) : 'OTHER',
                            description: txn.narration || txn.description || '',
                            narration: txn.narration || '',
                            date: txn.transactionTimestamp || txn.valueDate || txn.date || new Date().toISOString(),
                            balance: parseFloat(txn.currentBalance || txn.balance || 0)
                        });
                    });
                } else if (rawData.transactions && Array.isArray(rawData.transactions)) {
                    transactions = transactions.concat(rawData.transactions.map(txn => ({
                        id: txn.id || txn.txnId || Date.now() + Math.random(),
                        type: txn.type || 'DEBIT',
                        amount: parseFloat(txn.amount || 0),
                        category: txn.category || 'OTHER',
                        description: txn.description || txn.narration || '',
                        date: txn.date || new Date().toISOString(),
                        balance: parseFloat(txn.balance || 0)
                    })));
                }
            }

            // Calculate financial metrics
            const income = transactions
                .filter(t => t.type === 'CREDIT')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const expenses = transactions
                .filter(t => t.type === 'DEBIT')
                .reduce((sum, t) => sum + t.amount, 0);

            // Calculate monthly averages (last 3 months)
            const last3MonthsTransactions = transactions.filter(txn => {
                const txnDate = new Date(txn.date);
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                return txnDate >= threeMonthsAgo;
            });
            
            const monthlyIncome = last3MonthsTransactions
                .filter(t => t.type === 'CREDIT')
                .reduce((sum, t) => sum + t.amount, 0) / 3;
            
            const monthlyExpenses = last3MonthsTransactions
                .filter(t => t.type === 'DEBIT')
                .reduce((sum, t) => sum + t.amount, 0) / 3;

            return {
                totalBalance,
                accounts,
                transactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date)), // Sort by date, newest first
                summary: {
                    totalBalance,
                    avgMonthlyIncome: Math.round(monthlyIncome) || Math.round(income / 3),
                    avgMonthlyExpense: Math.round(monthlyExpenses) || Math.round(expenses / 3),
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
         * Categorize transaction based on narration
         */
        categorizeTransaction(narration) {
            if (!narration) return 'OTHER';
            const nar = narration.toUpperCase();
            
            if (nar.includes('SALARY') || nar.includes('SAL')) return 'SALARY';
            if (nar.includes('NEFT') || nar.includes('IMPS') || nar.includes('UPI')) return 'TRANSFER';
            if (nar.includes('SHOPPING') || nar.includes('AMAZON') || nar.includes('FLIPKART')) return 'SHOPPING';
            if (nar.includes('FOOD') || nar.includes('RESTAURANT') || nar.includes('SWIGGY') || nar.includes('ZOMATO')) return 'FOOD';
            if (nar.includes('UTILITY') || nar.includes('BILL') || nar.includes('ELECTRICITY') || nar.includes('WATER')) return 'UTILITIES';
            if (nar.includes('EMI') || nar.includes('LOAN')) return 'EMI';
            if (nar.includes('INVESTMENT') || nar.includes('MUTUAL') || nar.includes('FD')) return 'INVESTMENT';
            return 'OTHER';
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
