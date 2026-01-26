/**
 * Mock CIBIL Data for Development
 * Use when SurePass token is expired or unavailable
 */

const MOCK_DATA = {
    // Sample User 1
    '7764056669': {
        mobile: '7764056669',
        pan: 'ELQPK6837L',
        fullname: 'RAUSHAN KUMAR',
        gender: 'male',
        dob: '1990-01-15',
        credit_score: 720,
        pan_details: {
            pan_number: 'ELQPK6837L',
            full_name: 'RAUSHAN KUMAR',
            gender: 'M',
            dob: '15/01/1990',
            masked_aadhaar: '****-****-3456',
            aadhaar_linked: 'Y',
            father_name: 'FATHER NAME',
            category: 'Person'
        },
        cibil_report: {
            client_id: 'credit_report_cibil_' + Date.now(),
            credit_score: '720',
            accounts: [
                {
                    member_name: 'HDFC BANK',
                    mask_account_number: '0000000012345678',
                    account_type: 'Credit Card',
                    current_balance: 45000,
                    overdue_amount: 0,
                    account_status: 'Active',
                    last_payment_date: new Date().toISOString().split('T')[0]
                },
                {
                    member_name: 'ICICI BANK',
                    mask_account_number: '0000000087654321',
                    account_type: 'Personal Loan',
                    current_balance: 185000,
                    overdue_amount: 0,
                    account_status: 'Active',
                    last_payment_date: new Date().toISOString().split('T')[0]
                }
            ]
        }
    },
    
    // Sample User 2 (from sandbox)
    '9708016996': {
        mobile: '9708016996',
        pan: 'IVZPK2103N',
        fullname: 'SHIV KUMAR',
        gender: 'male',
        dob: '1987-05-17',
        credit_score: 670,
        pan_details: {
            pan_number: 'IVZPK2103N',
            full_name: 'SHIV KUMAR',
            gender: 'M',
            dob: '17/05/1987',
            masked_aadhaar: '****-****-9861',
            aadhaar_linked: 'Y',
            father_name: 'FATHER NAME',
            category: 'Person'
        },
        cibil_report: {
            client_id: 'credit_report_cibil_jIifktiYhrHTbZcMdlsU',
            credit_score: '670',
            accounts: [
                {
                    member_name: 'ICICI BANK',
                    mask_account_number: '0000000028669955',
                    account_type: 'Credit Card',
                    current_balance: 64522,
                    overdue_amount: 27760,
                    account_status: 'Default',
                    last_payment_date: '2025-04-06'
                },
                {
                    member_name: 'RBL BANK',
                    mask_account_number: '0007478830007967886',
                    account_type: 'Credit Card',
                    current_balance: 73959,
                    overdue_amount: 15029,
                    account_status: 'Default',
                    last_payment_date: '2025-08-02'
                }
            ]
        }
    }
};

/**
 * Get mock PAN from mobile
 */
function getMockPANFromMobile(mobile, fullname) {
    const userData = MOCK_DATA[mobile];
    
    if (userData) {
        return {
            success: true,
            status_code: 200,
            message_code: 'success',
            message: 'Success (MOCK DATA)',
            data: {
                pan_number: userData.pan
            },
            data_advance: {
                pan_details: userData.pan_details
            }
        };
    }
    
    // Generate mock PAN if not found
    const mockPAN = 'MOCK' + mobile.slice(-5) + 'X';
    return {
        success: true,
        status_code: 200,
        message_code: 'success',
        message: 'Success (GENERATED MOCK DATA)',
        data: {
            pan_number: mockPAN
        },
        data_advance: {
            pan_details: {
                pan_number: mockPAN,
                full_name: fullname || 'MOCK USER',
                gender: 'M',
                dob: '01/01/1990',
                masked_aadhaar: '****-****-0000',
                aadhaar_linked: 'Y',
                father_name: 'FATHER NAME',
                category: 'Person'
            }
        }
    };
}

/**
 * Get mock PAN comprehensive details
 */
function getMockPANComprehensive(pan) {
    // Find user by PAN
    const user = Object.values(MOCK_DATA).find(u => u.pan === pan);
    
    if (user) {
        return {
            success: true,
            status_code: 200,
            message_code: 'success',
            message: 'Success (MOCK DATA)',
            data: {
                pan_number: user.pan,
                pan_details: user.pan_details
            }
        };
    }
    
    return {
        success: true,
        status_code: 200,
        message_code: 'success',
        message: 'Success (GENERATED MOCK DATA)',
        data: {
            pan_number: pan,
            pan_details: {
                pan_number: pan,
                full_name: 'MOCK USER',
                gender: 'M',
                dob: '01/01/1990',
                masked_aadhaar: '****-****-0000',
                aadhaar_linked: 'Y',
                father_name: 'FATHER NAME',
                category: 'Person'
            }
        }
    };
}

/**
 * Get mock CIBIL report
 */
function getMockCIBILReport(mobile, pan, name, gender) {
    const userData = MOCK_DATA[mobile];
    
    if (userData) {
        return {
            success: true,
            status_code: 200,
            message_code: 'success',
            message: 'Success (MOCK DATA)',
            data: {
                ...userData.cibil_report,
                mobile: mobile,
                pan: pan,
                name: name || userData.fullname,
                gender: gender || userData.gender
            }
        };
    }
    
    // Generate mock CIBIL data
    return {
        success: true,
        status_code: 200,
        message_code: 'success',
        message: 'Success (GENERATED MOCK DATA)',
        data: {
            client_id: 'credit_report_cibil_mock_' + Date.now(),
            mobile: mobile,
            pan: pan,
            name: name,
            gender: gender,
            credit_score: '720',
            accounts: [
                {
                    member_name: 'MOCK BANK',
                    mask_account_number: '0000000000000000',
                    account_type: 'Credit Card',
                    current_balance: 50000,
                    overdue_amount: 0,
                    account_status: 'Active',
                    last_payment_date: new Date().toISOString().split('T')[0]
                }
            ]
        }
    };
}

/**
 * Check if mock mode should be enabled
 */
function shouldUseMockData() {
    // Use mock data if:
    // 1. Environment variable is set
    // 2. OR in development mode
    return process.env.USE_MOCK_CIBIL === 'true' || 
           process.env.SUREPASS_USE_MOCK === 'true' ||
           (!process.env.SUREPASS_SANDBOX_TOKEN && process.env.NODE_ENV !== 'production');
}

module.exports = {
    getMockPANFromMobile,
    getMockPANComprehensive,
    getMockCIBILReport,
    shouldUseMockData,
    MOCK_DATA
};

