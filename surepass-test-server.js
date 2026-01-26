/**
 * SurePass Sandbox Test Server
 * Standalone server to test SurePass API responses
 * Run on: http://localhost:8084
 */

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 8084;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for testing
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// SurePass Configuration
const SUREPASS_CONFIG = {
    SANDBOX_URL: process.env.SUREPASS_SANDBOX_URL || 'https://sandbox.surepass.io',
    SANDBOX_TOKEN: process.env.SUREPASS_SANDBOX_TOKEN || process.env.SUREPASS_TOKEN_DEVELOPMENT,
    PRODUCTION_URL: process.env.SUREPASS_URL_PRODUCTION || 'https://kyc-api.surepass.io',
    PRODUCTION_TOKEN: process.env.SUREPASS_TOKEN_PRODUCTION
};

console.log('\n===========================================');
console.log('   SUREPASS TEST SERVER');
console.log('===========================================');
console.log('Port:', PORT);
console.log('Sandbox URL:', SUREPASS_CONFIG.SANDBOX_URL);
console.log('Sandbox Token:', SUREPASS_CONFIG.SANDBOX_TOKEN ? '****' + SUREPASS_CONFIG.SANDBOX_TOKEN.slice(-8) : 'NOT SET');
console.log('===========================================\n');

// HTML Test Interface
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SurePass Sandbox Tester - Port 8084</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            text-align: center;
        }
        .header h1 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .header p {
            color: #666;
        }
        .test-section {
            background: white;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .test-section h2 {
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 600;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: transform 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
        }
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .response {
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            display: none;
        }
        .response.show {
            display: block;
        }
        .response.error {
            border-left-color: #dc3545;
            background: #fff5f5;
        }
        .response.success {
            border-left-color: #28a745;
            background: #f0fff4;
        }
        pre {
            background: #2d3748;
            color: #68d391;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            max-height: 500px;
            overflow-y: auto;
            font-size: 12px;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .status-success {
            background: #d4edda;
            color: #155724;
        }
        .status-error {
            background: #f8d7da;
            color: #721c24;
        }
        .loader {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
            display: none;
        }
        .loader.show {
            display: block;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 SurePass Sandbox API Tester</h1>
            <p>Port 8084 • Test SurePass API responses in real-time</p>
        </div>

        <!-- Test 1: Mobile to PAN -->
        <div class="test-section">
            <h2>1️⃣ Mobile to PAN Lookup</h2>
            <div class="form-group">
                <label>Full Name:</label>
                <input type="text" id="pan-fullname" placeholder="e.g., SHIV KUMAR" value="SHIV KUMAR">
            </div>
            <div class="form-group">
                <label>Mobile Number (10 digits):</label>
                <input type="text" id="pan-mobile" placeholder="e.g., 9708016996" value="9708016996">
            </div>
            <button onclick="testMobileToPAN()">Test Mobile to PAN</button>
            <div class="loader" id="loader-1"></div>
            <div class="response" id="response-1"></div>
        </div>

        <!-- Test 2: PAN Comprehensive -->
        <div class="test-section">
            <h2>2️⃣ PAN Comprehensive Details</h2>
            <div class="form-group">
                <label>PAN Number:</label>
                <input type="text" id="pan-number" placeholder="e.g., IVZPK2103N" value="IVZPK2103N">
            </div>
            <button onclick="testPANComprehensive()">Test PAN Details</button>
            <div class="loader" id="loader-2"></div>
            <div class="response" id="response-2"></div>
        </div>

        <!-- Test 3: CIBIL Report -->
        <div class="test-section">
            <h2>3️⃣ CIBIL Credit Report</h2>
            <div class="form-group">
                <label>Full Name:</label>
                <input type="text" id="cibil-fullname" placeholder="e.g., SHIV KUMAR" value="SHIV KUMAR">
            </div>
            <div class="form-group">
                <label>Mobile Number:</label>
                <input type="text" id="cibil-mobile" placeholder="e.g., 9708016996" value="9708016996">
            </div>
            <div class="form-group">
                <label>PAN Number:</label>
                <input type="text" id="cibil-pan" placeholder="e.g., IVZPK2103N" value="IVZPK2103N">
            </div>
            <div class="form-group">
                <label>Gender:</label>
                <select id="cibil-gender" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px;">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <button onclick="testCIBIL()">Test CIBIL Report</button>
            <div class="loader" id="loader-3"></div>
            <div class="response" id="response-3"></div>
        </div>

        <!-- Test 4: Complete Flow -->
        <div class="test-section">
            <h2>4️⃣ Complete Flow Test (Mobile → PAN → CIBIL)</h2>
            <div class="form-group">
                <label>Your Full Name:</label>
                <input type="text" id="flow-fullname" placeholder="Enter your full name">
            </div>
            <div class="form-group">
                <label>Your Mobile Number:</label>
                <input type="text" id="flow-mobile" placeholder="Enter your 10-digit mobile">
            </div>
            <button onclick="testCompleteFlow()">Run Complete Flow</button>
            <div class="loader" id="loader-4"></div>
            <div class="response" id="response-4"></div>
        </div>
    </div>

    <script>
        async function testMobileToPAN() {
            const fullname = document.getElementById('pan-fullname').value;
            const mobile = document.getElementById('pan-mobile').value;
            const loader = document.getElementById('loader-1');
            const response = document.getElementById('response-1');

            loader.classList.add('show');
            response.classList.remove('show');

            try {
                const res = await fetch(\`/api/mobile-to-pan?fullname=\${fullname}&mobile=\${mobile}\`);
                const data = await res.json();
                
                loader.classList.remove('show');
                response.classList.add('show', data.success ? 'success' : 'error');
                response.innerHTML = \`
                    <div class="status-badge status-\${data.success ? 'success' : 'error'}">
                        \${data.success ? '✅ Success' : '❌ Failed'}
                    </div>
                    <h4>Response:</h4>
                    <pre>\${JSON.stringify(data, null, 2)}</pre>
                \`;
            } catch (error) {
                loader.classList.remove('show');
                response.classList.add('show', 'error');
                response.innerHTML = \`<div class="status-badge status-error">❌ Error</div><p>\${error.message}</p>\`;
            }
        }

        async function testPANComprehensive() {
            const pan = document.getElementById('pan-number').value;
            const loader = document.getElementById('loader-2');
            const response = document.getElementById('response-2');

            loader.classList.add('show');
            response.classList.remove('show');

            try {
                const res = await fetch(\`/api/pan-comprehensive?pan=\${pan}\`);
                const data = await res.json();
                
                loader.classList.remove('show');
                response.classList.add('show', data.success ? 'success' : 'error');
                response.innerHTML = \`
                    <div class="status-badge status-\${data.success ? 'success' : 'error'}">
                        \${data.success ? '✅ Success' : '❌ Failed'}
                    </div>
                    <h4>Response:</h4>
                    <pre>\${JSON.stringify(data, null, 2)}</pre>
                \`;
            } catch (error) {
                loader.classList.remove('show');
                response.classList.add('show', 'error');
                response.innerHTML = \`<div class="status-badge status-error">❌ Error</div><p>\${error.message}</p>\`;
            }
        }

        async function testCIBIL() {
            const fullname = document.getElementById('cibil-fullname').value;
            const mobile = document.getElementById('cibil-mobile').value;
            const pan = document.getElementById('cibil-pan').value;
            const gender = document.getElementById('cibil-gender').value;
            const loader = document.getElementById('loader-3');
            const response = document.getElementById('response-3');

            loader.classList.add('show');
            response.classList.remove('show');

            try {
                const res = await fetch(\`/api/cibil?fullname=\${fullname}&mobile=\${mobile}&pan=\${pan}&gender=\${gender}\`);
                const data = await res.json();
                
                loader.classList.remove('show');
                response.classList.add('show', data.success ? 'success' : 'error');
                response.innerHTML = \`
                    <div class="status-badge status-\${data.success ? 'success' : 'error'}">
                        \${data.success ? '✅ Success' : '❌ Failed'}
                    </div>
                    <h4>Response:</h4>
                    <pre>\${JSON.stringify(data, null, 2)}</pre>
                \`;
            } catch (error) {
                loader.classList.remove('show');
                response.classList.add('show', 'error');
                response.innerHTML = \`<div class="status-badge status-error">❌ Error</div><p>\${error.message}</p>\`;
            }
        }

        async function testCompleteFlow() {
            const fullname = document.getElementById('flow-fullname').value;
            const mobile = document.getElementById('flow-mobile').value;
            const loader = document.getElementById('loader-4');
            const response = document.getElementById('response-4');

            loader.classList.add('show');
            response.classList.remove('show');

            try {
                const res = await fetch(\`/api/complete-flow?fullname=\${fullname}&mobile=\${mobile}\`);
                const data = await res.json();
                
                loader.classList.remove('show');
                response.classList.add('show', data.success ? 'success' : 'error');
                response.innerHTML = \`
                    <div class="status-badge status-\${data.success ? 'success' : 'error'}">
                        \${data.success ? '✅ Complete Flow Success' : '❌ Flow Failed'}
                    </div>
                    <h4>Complete Flow Response:</h4>
                    <pre>\${JSON.stringify(data, null, 2)}</pre>
                \`;
            } catch (error) {
                loader.classList.remove('show');
                response.classList.add('show', 'error');
                response.innerHTML = \`<div class="status-badge status-error">❌ Error</div><p>\${error.message}</p>\`;
            }
        }
    </script>
</body>
</html>
    `);
});

// API Endpoints

// 1. Mobile to PAN
app.get('/api/mobile-to-pan', async (req, res) => {
    const { fullname, mobile } = req.query;
    
    console.log(`\n[Mobile to PAN] Request: ${fullname} - ${mobile}`);
    
    try {
        const response = await axios({
            method: 'POST',
            url: `${SUREPASS_CONFIG.SANDBOX_URL}/api/v1/pan/mobile-to-pan`,
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${SUREPASS_CONFIG.SANDBOX_TOKEN}`,
                'content-type': 'application/json'
            },
            data: {
                name: fullname,
                mobile_no: mobile
            }
        });
        
        console.log(`[Mobile to PAN] Success:`, response.data);
        res.json(response.data);
    } catch (error) {
        console.error(`[Mobile to PAN] Error:`, error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

// 2. PAN Comprehensive
app.get('/api/pan-comprehensive', async (req, res) => {
    const { pan } = req.query;
    
    console.log(`\n[PAN Comprehensive] Request: ${pan}`);
    
    try {
        const response = await axios({
            method: 'POST',
            url: `${SUREPASS_CONFIG.SANDBOX_URL}/api/v1/pan/pan-comprehensive-plus`,
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${SUREPASS_CONFIG.SANDBOX_TOKEN}`,
                'content-type': 'application/json'
            },
            data: {
                id_number: pan
            }
        });
        
        console.log(`[PAN Comprehensive] Success:`, response.data);
        res.json(response.data);
    } catch (error) {
        console.error(`[PAN Comprehensive] Error:`, error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

// 3. CIBIL Report
app.get('/api/cibil', async (req, res) => {
    const { fullname, mobile, pan, gender } = req.query;
    
    console.log(`\n[CIBIL Report] Request: ${fullname} - ${mobile} - ${pan} - ${gender}`);
    
    try {
        const response = await axios({
            method: 'POST',
            url: `${SUREPASS_CONFIG.SANDBOX_URL}/api/v1/credit-report-cibil/fetch-report`,
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${SUREPASS_CONFIG.SANDBOX_TOKEN}`,
                'content-type': 'application/json'
            },
            data: {
                mobile: mobile,
                pan: pan,
                name: fullname,
                gender: gender,
                consent: "Y"
            }
        });
        
        console.log(`[CIBIL Report] Success:`, response.data);
        res.json(response.data);
    } catch (error) {
        console.error(`[CIBIL Report] Error:`, error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

// 4. Complete Flow
app.get('/api/complete-flow', async (req, res) => {
    const { fullname, mobile } = req.query;
    
    console.log(`\n[Complete Flow] Starting for: ${fullname} - ${mobile}`);
    
    const results = {
        success: true,
        steps: {}
    };
    
    try {
        // Step 1: Mobile to PAN
        console.log('[Step 1] Mobile to PAN...');
        const panResponse = await axios({
            method: 'POST',
            url: `${SUREPASS_CONFIG.SANDBOX_URL}/api/v1/pan/mobile-to-pan`,
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${SUREPASS_CONFIG.SANDBOX_TOKEN}`,
                'content-type': 'application/json'
            },
            data: {
                name: fullname,
                mobile_no: mobile
            }
        });
        
        results.steps.mobileToPAN = {
            success: panResponse.data.success,
            pan: panResponse.data.data?.pan_number,
            data: panResponse.data
        };
        
        if (!panResponse.data.success) {
            results.success = false;
            return res.json(results);
        }
        
        const panNumber = panResponse.data.data.pan_number;
        console.log(`[Step 1] Got PAN: ${panNumber}`);
        
        // Step 2: PAN Comprehensive
        console.log('[Step 2] PAN Comprehensive...');
        const panCompResponse = await axios({
            method: 'POST',
            url: `${SUREPASS_CONFIG.SANDBOX_URL}/api/v1/pan/pan-comprehensive-plus`,
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${SUREPASS_CONFIG.SANDBOX_TOKEN}`,
                'content-type': 'application/json'
            },
            data: {
                id_number: panNumber
            }
        });
        
        results.steps.panComprehensive = {
            success: panCompResponse.data.success,
            data: panCompResponse.data
        };
        
        if (!panCompResponse.data.success) {
            results.success = false;
            return res.json(results);
        }
        
        const gender = panCompResponse.data.data?.pan_details?.gender === 'M' ? 'male' : 'female';
        console.log(`[Step 2] Got Gender: ${gender}`);
        
        // Step 3: CIBIL Report
        console.log('[Step 3] CIBIL Report...');
        const cibilResponse = await axios({
            method: 'POST',
            url: `${SUREPASS_CONFIG.SANDBOX_URL}/api/v1/credit-report-cibil/fetch-report`,
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${SUREPASS_CONFIG.SANDBOX_TOKEN}`,
                'content-type': 'application/json'
            },
            data: {
                mobile: mobile,
                pan: panNumber,
                name: fullname,
                gender: gender,
                consent: "Y"
            }
        });
        
        results.steps.cibilReport = {
            success: cibilResponse.data.success,
            credit_score: cibilResponse.data.data?.credit_score,
            data: cibilResponse.data
        };
        
        console.log(`[Complete Flow] ✅ Success! Credit Score: ${cibilResponse.data.data?.credit_score}`);
        
        res.json(results);
    } catch (error) {
        console.error(`[Complete Flow] ❌ Error:`, error.response?.data || error.message);
        results.success = false;
        results.error = error.response?.data || error.message;
        res.status(500).json(results);
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║   🧪 SurePass Test Server Running                 ║
║                                                    ║
║   URL: http://localhost:${PORT}                    ║
║   Mode: SANDBOX (FREE - NO CHARGES)               ║
║                                                    ║
║   Open your browser and start testing!            ║
╚════════════════════════════════════════════════════╝
    `);
});

