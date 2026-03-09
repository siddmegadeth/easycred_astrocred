/**
 * Quick PDF Download Test Script
 * Tests all 3 PDF download endpoints
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:7001';

// Test with your PAN or mobile
const TEST_IDENTIFIERS = {
    pan: process.env.TEST_PAN || 'ELQPK6837L',
    mobile: process.env.TEST_MOBILE || '7764056669',
    email: process.env.TEST_EMAIL || null
};

async function testPDFDownload(endpoint, name, identifier) {
    try {
        console.log(`\n🧪 Testing ${name}...`);
        
        const params = {};
        if (identifier.pan) params.pan = identifier.pan;
        if (identifier.mobile) params.mobile = identifier.mobile;
        if (identifier.email) params.email = identifier.email;

        const response = await axios({
            method: 'GET',
            url: `${BASE_URL}${endpoint}`,
            params: params,
            responseType: 'stream',
            timeout: 30000 // 30 seconds timeout
        });

        // Save PDF to test directory
        const testDir = path.join(__dirname, 'test-pdfs');
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        const fileName = `${name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        const filePath = path.join(testDir, fileName);
        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`✅ ${name}: SUCCESS`);
                console.log(`   📄 Saved to: ${filePath}`);
                console.log(`   📊 Size: ${fs.statSync(filePath).size} bytes`);
                resolve({ success: true, filePath });
            });
            writer.on('error', (err) => {
                console.log(`❌ ${name}: FAILED - ${err.message}`);
                reject(err);
            });
        });

    } catch (error) {
        if (error.response) {
            // Server responded with error
            const errorData = error.response.data;
            if (typeof errorData === 'object') {
                console.log(`❌ ${name}: FAILED`);
                console.log(`   Error: ${errorData.error || errorData.message || 'Unknown error'}`);
                console.log(`   Status: ${error.response.status}`);
            } else {
                console.log(`❌ ${name}: FAILED - Status ${error.response.status}`);
            }
        } else if (error.request) {
            console.log(`❌ ${name}: FAILED - No response from server`);
            console.log(`   Make sure server is running on ${BASE_URL}`);
        } else {
            console.log(`❌ ${name}: FAILED - ${error.message}`);
        }
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   📄 PDF Download Functionality Test');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`\n🔗 Base URL: ${BASE_URL}`);
    console.log(`📋 Test Identifiers:`);
    console.log(`   PAN: ${TEST_IDENTIFIERS.pan || 'Not provided'}`);
    console.log(`   Mobile: ${TEST_IDENTIFIERS.mobile || 'Not provided'}`);
    console.log(`   Email: ${TEST_IDENTIFIERS.email || 'Not provided'}`);

    const results = [];

    // Test 1: CIBIL Report
    results.push(await testPDFDownload(
        '/get/api/cibil/generate-pdf',
        'CIBIL Report',
        TEST_IDENTIFIERS
    ));

    // Test 2: ASTROCRED Analysis
    results.push(await testPDFDownload(
        '/get/api/cibil/astrocred-report-pdf',
        'ASTROCRED Analysis',
        TEST_IDENTIFIERS
    ));

    // Test 3: Multi-Bureau Report
    results.push(await testPDFDownload(
        '/get/api/multi-bureau/generate-pdf',
        'Multi-Bureau Report',
        TEST_IDENTIFIERS
    ));

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   📊 Test Summary');
    console.log('═══════════════════════════════════════════════════════');
    
    const successCount = results.filter(r => r && r.success).length;
    const totalCount = results.length;
    
    console.log(`\n✅ Successful: ${successCount}/${totalCount}`);
    console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
    
    if (successCount === totalCount) {
        console.log('\n🎉 All PDF downloads working perfectly!');
    } else {
        console.log('\n⚠️  Some PDF downloads failed. Check errors above.');
        console.log('\n💡 Common Issues:');
        console.log('   1. CIBIL data not found in database');
        console.log('   2. User profile incomplete (missing PAN/mobile)');
        console.log('   3. Server not running');
        console.log('   4. Database connection issue');
    }

    console.log('\n📁 Test PDFs saved to: test-pdfs/');
    console.log('═══════════════════════════════════════════════════════\n');
}

// Run tests
runTests().catch(console.error);

