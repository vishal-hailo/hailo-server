import axios from 'axios';

const API_URL = 'http://localhost:3001/api/v1';

async function verifyIGM() {
    console.log('🚀 Starting IGM Verification...\n');

    // 1. Raise an Issue
    console.log('--- Step 1: Raise Issue ---');
    try {
        const payload = {
            transactionId: 'txn_12345', // Mock Transaction ID
            category: 'FULFILLMENT',
            subCategory: 'FLM01',
            description: 'Driver denied duty',
            userId: 'user_001'
        };

        const res = await axios.post(`${API_URL}/igm/issue`, payload);
        console.log('✅ Issue Raised:', res.data);

        const issueId = res.data.grievance.issueId;

        // 2. Simulate ONDC Callback (Mocking Network Response)
        // In real flow, this comes from BPP. 
        // Our service simulates it if ONDC_MOCK=true, but let's wait and poll status.
        console.log(`\n⏳ Waiting for ONDC Mock Response for Issue ${issueId}...`);

        // Poll status every 2 seconds
        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            try {
                const statusRes = await axios.get(`${API_URL}/igm/issue/${issueId}`);
                const grievance = statusRes.data;
                console.log(`[Attempt ${attempts}] Status: ${grievance.status}`);

                if (grievance.status === 'RESOLVED') {
                    console.log('\n✅ Issue Resolved!');
                    console.log('Resolution:', grievance.resolution);
                    clearInterval(interval);
                    process.exit(0);
                }

                if (attempts > 10) {
                    console.error('❌ Timeout waiting for resolution');
                    clearInterval(interval);
                    process.exit(1);
                }
            } catch (err) {
                console.error('Error checking status:', err.message);
            }
        }, 2000);

    } catch (error) {
        console.error('❌ Verification Failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

verifyIGM();
