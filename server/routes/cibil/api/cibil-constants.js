// file: cibil-constants.js
(function() {
    var CIBILConstants = {
        // CIBIL Score Ranges (Standardized from PDF and earlier code)
        SCORE_RANGES: {
            VERY_POOR: { min: 300, max: 549, description: 'Very Poor Credit History' },
            POOR: { min: 550, max: 649, description: 'Poor Credit History' },
            FAIR: { min: 650, max: 699, description: 'Fair Credit History' },
            GOOD: { min: 700, max: 749, description: 'Good Credit History' },
            VERY_GOOD: { min: 750, max: 799, description: 'Very Good Credit History' },
            EXCELLENT: { min: 800, max: 900, description: 'Excellent Credit History' }
        },

        // Account Type Codes (Standardized)
        ACCOUNT_TYPES: {
            HL: 'Home Loan',
            AL: 'Auto Loan',
            PL: 'Personal Loan',
            CC: 'Credit Card',
            GL: 'Gold Loan',
            BL: 'Business Loan',
            EL: 'Education Loan',
            CL: 'Consumer Loan',
            OD: 'Overdraft',
            TL: 'Two-wheeler Loan'
        },

        // Account Status Codes (Comprehensive from multiple sources)
        ACCOUNT_STATUS: {
            // Current/Active Statuses
            '000': 'Current Account/No Dues',
            '010': 'Current Account',
            
            // Closed/Settled Statuses
            '001': 'Account Paid',
            '002': 'Account Closed',
            '003': 'Account Settled',
            '006': 'Account Suit Filed',
            '007': 'Account Wilful Default',
            
            // NPA/Default Statuses
            '004': 'Account Written-off',
            '005': 'Account Restructured',
            '008': 'Account Substandard',
            '009': 'Account Doubtful',
            '010': 'Account Loss',
            '011': 'Account NPA',
            
            // SMA Statuses (Special Mention Accounts)
            '012': 'Account SMA-0',
            '013': 'Account SMA-1',
            '014': 'Account SMA-2',
            
            // Past Due Statuses
            '015': 'Account 30 days past due',
            '016': 'Account 60 days past due',
            '017': 'Account 90 days past due',
            '018': 'Account 120+ days past due'
        },

        // Payment History Codes (Standardized)
        PAYMENT_HISTORY_CODES: {
            '0': 'No payment due/Current',
            '1': '1-30 days past due',
            '2': '31-60 days past due',
            '3': '61-90 days past due',
            '4': '91-120 days past due',
            '5': '121+ days past due',
            '6': 'Payment not required',
            '7': 'Payment history not available',
            '8': 'Written off',
            '9': 'Collection/Charge-off',
            'C': 'Current',
            'D': 'Default',
            'L': 'Loan Closed',
            'S': 'Settled',
            'W': 'Written Off'
        },

        // Ownership Indicators
        OWNERSHIP_INDICATORS: {
            I: 'Individual',
            J: 'Joint',
            A: 'Authorized User',
            G: 'Guarantor',
            C: 'Co-applicant'
        },

        // Occupation Codes (Indian Context)
        OCCUPATION_CODES: {
            '01': 'Professional (Doctor, Engineer, CA)',
            '02': 'Salaried - Government',
            '03': 'Salaried - Private',
            '04': 'Self-employed',
            '05': 'Business',
            '06': 'Daily wage',
            '07': 'Unemployed',
            '08': 'Retired',
            '09': 'Student',
            '10': 'Homemaker'
        },

        // Enquiry Types
        ENQUIRY_TYPES: {
            '01': 'Auto Loan',
            '02': 'Consumer Loan',
            '03': 'Credit Card',
            '04': 'Home Loan',
            '05': 'Personal Loan',
            '06': 'Business Loan',
            '07': 'Education Loan',
            '08': 'Gold Loan',
            '09': 'Two-wheeler Loan',
            '10': 'Overdraft',
            '11': 'Credit Line',
            '12': 'Composite Enquiry'
        },

        // Risk Thresholds for Indian Market
        RISK_THRESHOLDS: {
            DEFAULT_PROBABILITY: {
                VERY_LOW: 15,
                LOW: 30,
                MEDIUM: 50,
                HIGH: 70,
                VERY_HIGH: 85
            },
            CREDIT_UTILIZATION: {
                OPTIMAL: 30,
                WARNING: 50,
                HIGH_RISK: 70,
                CRITICAL: 90
            },
            PAYMENT_HISTORY: {
                EXCELLENT: 0,
                GOOD: 5,
                FAIR: 10,
                POOR: 20,
                VERY_POOR: 30
            },
            DEBT_TO_INCOME: {
                IDEAL: 30,
                ACCEPTABLE: 40,
                RISKY: 50,
                CRITICAL: 60
            }
        },

        // Indian Bank Categories
        BANK_CATEGORIES: {
            PUBLIC_SECTOR: ['SBI', 'PNB', 'Bank of Baroda', 'Canara Bank', 'Union Bank'],
            PRIVATE_SECTOR: ['HDFC', 'ICICI', 'Axis', 'Kotak', 'Yes Bank', 'IndusInd'],
            NBFC: ['Bajaj Finance', 'HDB Financial', 'Aditya Birla Finance'],
            FINTECH: ['EarlySalary', 'MoneyTap', 'Lendingkart']
        }
    };

    // Export based on environment
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CIBILConstants;
    } else if (typeof window !== 'undefined') {
        window.CIBILConstants = CIBILConstants;
    }
})();