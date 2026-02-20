import axios from 'axios';

// Target the live production server since that's what Pramaan talks to
const BASE_URL = process.env.API_URL || 'https://api.hailone.in/ondc';

const SLEEP = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runPramaanTest() {
    console.log('🤖 Starting automated Pramaan Test Runner...');
    console.log(`📡 Target API: ${BASE_URL}\n`);

    console.log('⏳ Waiting 20 seconds. Please go to the Pramaan Dashboard and click "Start" NOW...');
    for (let i = 20; i > 0; i--) {
        process.stdout.write(`\r⏱️  ${i} seconds remaining...`);
        await SLEEP(1000);
    }
    console.log('\n🚀 Initiating Search...');

    let transactionId = null;

    // 1. Trigger Search
    try {
        const searchRes = await axios.post(`${BASE_URL}/search`, {
            latitude: 19.0760,
            longitude: 72.8777,
            destination: { latitude: 19.0544, longitude: 72.8406 }
        });

        transactionId = searchRes.data.transactionId;
        console.log(`\n✅ SEARCH INITIATED`);
        console.log(`====================================================`);
        console.log(`🆔 TRANSACTION ID: ${transactionId}`);
        console.log(`====================================================`);
        console.log(`Check your Pramaan dashboard. The "search" bubble should turn green soon.\n`);

    } catch (err) {
        console.error('❌ Search Failed:', err.response ? err.response.data : err.message);
        return;
    }

    // 2. Poll for Results
    console.log('⏳ Polling for /on_search results coming back from Gateway...');
    let results = [];
    let attempts = 0;
    while (attempts < 15) { // 15 attempts * 2 seconds = 30 seconds max wait
        await SLEEP(2000);
        attempts++;
        try {
            const resultsRes = await axios.get(`${BASE_URL}/results/${transactionId}`);
            if (resultsRes.data.results && resultsRes.data.results.length > 0) {
                results = resultsRes.data.results;
                console.log(`\n🎉 Received ${results.length} quote(s) from ONDC Network!`);
                break;
            }
            process.stdout.write('.');
        } catch (err) {
            console.error('\n⚠️ Polling Error:', err.message);
        }
    }

    if (results.length === 0) {
        console.error('\n❌ Timed out waiting for results. The network did not return any rides (on_search didn\'t fire or had no drivers).');
        return;
    }

    // 3. Trigger Select automatically
    const firstOption = results[0];
    console.log(`\n🚘 Selected Option: ${firstOption.providerName} - ${firstOption.name} (₹${firstOption.price})`);
    console.log(`🚀 Initiating Select for item: ${firstOption.id}`);

    try {
        const selectRes = await axios.post(`${BASE_URL}/select`, {
            transactionId: transactionId,
            providerId: firstOption.providerId,
            itemId: firstOption.id
        });
        console.log(`✅ SELECT INITIATED (Message ID: ${selectRes.data.messageId})`);
        console.log(`Check your Pramaan dashboard. The "select" bubble should turn green soon.\n`);

        console.log(`🏁 Test Runner script visually complete. You should see "select" and "on_select" go green.`);
        console.log(`To continue the flow (Init -> Confirm), use the app or run the next API endpoints manually.`);

    } catch (err) {
        console.error('❌ Select Failed:', err.response ? err.response.data : err.message);
    }
}

runPramaanTest();
