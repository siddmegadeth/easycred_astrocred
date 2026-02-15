/**
 * Thin Finvu HTTP client – calls external Finvu service (@easy/finvu_integration).
 * No embedded Finsense logic; all behavior lives in the Finvu app.
 * Set FINVU_SERVICE_URL (e.g. http://localhost:3000 or Lambda URL).
 */
(function () {
    'use strict';

    const axios = require('axios');

    const BASE_URL = process.env.FINVU_SERVICE_URL || process.env.FINVU_LOCAL_URL || 'https://6exmd8evhi.execute-api.ap-south-1.amazonaws.com/prod';
    const API_KEY = process.env.FINVU_API_KEY || '';

    function log(...args) {
        try {
            const L = require('../../init/log');
            if (L && L.log) L.log('[finvu-client]', ...args);
        } catch (e) {
            console.log('[finvu-client]', ...args);
        }
    }

    /**
     * Normalize FI data from Finvu service into { accounts, transactions, totalBalance }.
     * Handles real Finvu response: { header, body: [ { fipId, fipName, fiObjects: [ { Summary, Profile, Transactions, maskedAccNumber } ] } ] }
     */
    function processFinVuData(rawData) {
        let totalBalance = 0;
        const accounts = [];
        const transactions = [];
        if (!rawData) return { accounts, transactions, totalBalance };

        let list = [];
        if (Array.isArray(rawData)) list = rawData;
        else if (Array.isArray(rawData.body)) list = rawData.body;
        if (list.length === 0 && rawData) {
            const fiData = rawData.FIData || rawData.body?.FIData;
            if (Array.isArray(fiData)) list = fiData;
            else if (Array.isArray(rawData.Accounts)) list = rawData.Accounts;
            else if (Array.isArray(rawData.accounts)) list = rawData.accounts;
        }

        list.forEach(item => {
            const fiObjects = item.fiObjects || item.FIObjects || (item.Account ? [item.Account] : [item]);
            const bankName = item.fipName || item.fip_name || item.bankName || 'Unknown Bank';

            (Array.isArray(fiObjects) ? fiObjects : [fiObjects]).forEach(obj => {
                if (!obj) return;
                const summary = obj.Summary || obj.summary || obj;
                const balance = parseFloat(summary.currentBalance || summary.current_balance || obj.currentBalance || obj.balance || 0);
                totalBalance += balance;
                const maskedAccNum = obj.maskedAccNumber || summary.maskedAccNumber || obj.masked_account_number || obj.accountNumber || 'N/A';
                const type = (summary.type || obj.type || obj.account_type || 'SAVINGS').toUpperCase();
                const holder = obj.Profile?.Holders?.Holder || obj.Profile?.holders?.holder || {};
                accounts.push({
                    accountNumber: maskedAccNum,
                    bankName,
                    balance,
                    currentBalance: balance,
                    type,
                    accountType: type,
                    ifsc: summary.ifscCode || obj.ifscCode || obj.ifsc || '',
                    branch: summary.branch || obj.branch || '',
                    holderName: holder.name || holder.fullName || ''
                });

                const txnList = obj.Transactions?.Transaction || obj.Transactions?.transaction || obj.transactions || [];
                const arr = Array.isArray(txnList) ? txnList : [txnList];
                arr.forEach(t => {
                    if (!t || t.amount == null) return;
                    const amt = parseFloat(t.amount) || 0;
                    const isCredit = (t.type || '').toUpperCase() === 'CREDIT' || amt >= 0;
                    const dateStr = t.transactionTimestamp || t.valueDate || t.date;
                    const date = dateStr ? new Date(dateStr) : new Date();
                    transactions.push({
                        type: isCredit ? 'CREDIT' : 'DEBIT',
                        amount: Math.abs(amt),
                        date: date.toISOString(),
                        valueDate: t.valueDate || date.toISOString().slice(0, 10),
                        narration: t.narration || t.description || t.reference || 'Transaction',
                        mode: t.mode || 'OTHER',
                        currentBalance: parseFloat(t.currentBalance) || null,
                        txnId: t.txnId || t.reference || '',
                        accountRef: maskedAccNum
                    });
                });
            });
        });

        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        return { accounts, transactions, totalBalance };
    }

    async function request(method, path, opts = {}) {
        const url = `${BASE_URL.replace(/\/$/, '')}${path}`;
        const headers = { ...(opts.headers || {}) };
        if (API_KEY) headers['X-Api-Key'] = API_KEY;
        try {
            const res = await axios({ method, url, ...opts, headers, timeout: 30000 });
            return res.data;
        } catch (err) {
            log(path, 'error', err.response?.data || err.message);
            throw err;
        }
    }

    module.exports = {
        baseUrl: BASE_URL,

        getStatus() {
            return request('GET', '/health').then(data => ({
                mode: 'remote',
                baseUrl: BASE_URL,
                configured: true,
                ...data
            })).catch(() => ({ mode: 'remote', baseUrl: BASE_URL, configured: false }));
        },

        async initiateConsent(mobile, handle) {
            const custId = handle || `${mobile}@finvu`;
            const baseUrl = (process.env.FINVU_REDIRECT_URL || process.env.APP_URL || 'https://astrocred.easycred.co.in').replace(/\/$/, '');
            const redirectUrl = baseUrl + '/finvu-connect/return';
            const body = { custId, redirectUrl };
            const data = await request('POST', '/consent/request', { data: body });
            return {
                consentHandle: data.consentHandle,
                consentHandleId: data.consentHandleId || data.consentHandle,
                consentId: data.consentId || data.consentHandle,
                redirectUrl: data.redirectUrl || data.redirectUrlForUser
            };
        },

        async checkConsentStatus(consentHandle, custId) {
            const data = await request('GET', '/consent/status', {
                params: { consentHandle, custId: custId || consentHandle }
            });
            return {
                success: true,
                status: data.consentStatus || data.status,
                consentId: data.consentId,
                dateRange: data.dateRange
            };
        },

        async fiRequest(body) {
            return request('POST', '/fi/request', { data: body });
        },

        async fiStatus(params) {
            return request('GET', '/fi/status', { params });
        },

        async fetchData(consentHandle, sessionId) {
            const data = await request('GET', '/fi/data', {
                params: { consentHandle, sessionId }
            });
            const raw = data.data || data;
            const processed = processFinVuData(raw.body || raw);
            return { success: true, data: processed, mode: 'remote' };
        },

        processFinVuData
    };
})();
