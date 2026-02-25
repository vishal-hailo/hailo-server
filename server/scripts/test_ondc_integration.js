import axios from 'axios';

async function testIntegration() {
    console.log('🚀 Starting ONDC Live Integration Test (via HailO Backend)...');
    console.log('---------------------------------------');

    const backendUrl = 'https://api.hailone.in/ondc/search';

    const payload = {
        latitude: 19.0760,
        longitude: 72.8777,
        destination: {
            latitude: 19.0544,
            longitude: 72.8406
        }
    };

    try {
        console.log(`📡 Sending Request to ${backendUrl}...`);
        const response = await axios.post(backendUrl, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log(`✅ SUCCESS! Received ${response.status}`);
        console.log('---------------------------------------');
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
        console.log('---------------------------------------');

        if (response.data.transactionId) {
            console.log(`🎉 BACKEND ACCEPTED SEARCH.`);
            console.log(`🆔 Transaction ID: ${response.data.transactionId}`);
            console.log('👉 Verify on the Pramaan Dashboard.');
            console.log('👉 Important: Wait 5 seconds for the mock seller to reply to the Render sever via webhook before running the select script.');
        }

    } catch (error) {
        console.error('❌ REQUEST FAILED');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testIntegration();
