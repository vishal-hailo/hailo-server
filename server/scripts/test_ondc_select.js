import axios from 'axios';

async function runSelectTest() {
    console.log('🚀 Starting ONDC Select Test...');

    // Allow passing transaction ID as an argument
    const transactionId = process.argv[2];
    if (!transactionId) {
        console.error('❌ Please provide a transactionId as an argument.');
        console.log('Usage: node scripts/test_ondc_select.js <transactionId>');
        process.exit(1);
    }

    const backendUrl = 'https://api.hailone.in/ondc';

    try {
        console.log(`🔍 Fetching results for Transaction ID: ${transactionId} from Live Backend...`);

        // Fetch results from the backend API, decoupling from direct MongoDB connections
        const resultsResponse = await axios.get(`${backendUrl}/results/${transactionId}`);
        const results = resultsResponse.data.results;

        if (!results || results.length === 0) {
            console.error('❌ No quotes found for this transaction. Wait a few more seconds for the mock BPP to reply, then try again.');
            process.exit(1);
        }

        console.log(`📊 Found ${results.length} quotes.`);

        // Pick the first quote
        const selectedQuote = results[0];
        console.log(`\n👉 Selecting Quote:`);
        console.log(`   Provider ID: ${selectedQuote.providerId}`);
        console.log(`   Item ID: ${selectedQuote.id}`);
        console.log(`   Fulfillment ID: ${selectedQuote.fulfillmentId}`);
        console.log(`   Price: ${selectedQuote.currency} ${selectedQuote.price}`);

        console.log('\n🚀 Initiating Select Request to Live Render Backend...');

        const payload = {
            transactionId: transactionId,
            providerId: selectedQuote.providerId,
            itemId: selectedQuote.id
        };

        const response = await axios.post(`${backendUrl}/select`, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('\n✅ Backend /select endpoint responded with: 200 OK');
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
        console.log('\n👉 Check the Pramaan dashboard. If successful, the `select` step should turn green!');
        console.log('---------------------------------------');

    } catch (error) {
        console.error('\n❌ SELECT TEST FAILED');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

runSelectTest();
