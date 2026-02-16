import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3001';
const OUTPUT_DIR = path.join(__dirname, '../ondc_logs');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runHappyPath() {
    console.log('\n🚀 Starting HAPPY PATH Simulation...');

    // 1. Search
    console.log('1. Searching...');
    const searchRes = await axios.post(`${BASE_URL}/ondc/search`, {
        latitude: 19.0760,
        longitude: 72.8777,
        destination: { latitude: 19.0596, longitude: 72.8295 }
    });
    const txnId = searchRes.data.transactionId;
    console.log(`   Transaction ID: ${txnId}`);
    await sleep(500);

    // 2. On_Search (Mock BPP response)
    console.log('2. on_search (Mock BPP)...');
    await axios.post(`${BASE_URL}/ondc/on_search`, {
        context: {
            domain: "ONDC:TRV10",
            country: "IND",
            city: "std:022",
            action: "on_search",
            core_version: "1.2.0",
            bap_id: "api.hailone.in",
            bap_uri: "https://api.hailone.in/ondc",
            bpp_id: "mock-travel-bpp",
            bpp_uri: "https://mock-bpp.com",
            transaction_id: txnId,
            message_id: "msg-search-res",
            timestamp: new Date().toISOString()
        },
        message: {
            catalog: {
                "bpp/descriptor": { "name": "Mock Rides" },
                "bpp/providers": [{
                    "id": "provider-1",
                    "descriptor": { "name": "FastCab" },
                    "items": [{
                        "id": "item-sedan-1",
                        "descriptor": { "name": "Sedan" },
                        "price": { "currency": "INR", "value": "250" },
                        "fulfillment_id": "fulfillment-1"
                    }]
                }]
            }
        }
    });

    // 3. Select
    console.log('3. Selecting...');
    await axios.post(`${BASE_URL}/ondc/select`, {
        transactionId: txnId,
        providerId: "provider-1",
        itemId: "item-sedan-1"
    });

    // 4. On_Select
    console.log('4. on_select (Mock BPP)...');
    await axios.post(`${BASE_URL}/ondc/on_select`, {
        context: { transaction_id: txnId, action: "on_select", bpp_id: "mock-travel-bpp" },
        message: { order: { quote: { price: { value: "250", currency: "INR" }, breakup: [] } } }
    });

    // 5. Init
    console.log('5. Initializing...');
    await axios.post(`${BASE_URL}/ondc/init`, { transactionId: txnId });

    // 6. On_Init
    console.log('6. on_init (Mock BPP)...');
    await axios.post(`${BASE_URL}/ondc/on_init`, {
        context: { transaction_id: txnId, action: "on_init", bpp_id: "mock-travel-bpp" },
        message: { order: { payment: { status: "NOT-PAID" } } }
    });

    // 7. Confirm
    console.log('7. Confirming...');
    await axios.post(`${BASE_URL}/ondc/confirm`, { transactionId: txnId });

    // 8. On_Confirm
    console.log('8. on_confirm (Mock BPP)...');
    await axios.post(`${BASE_URL}/ondc/on_confirm`, {
        context: { transaction_id: txnId, action: "on_confirm", bpp_id: "mock-travel-bpp" },
        message: { order: { id: `order-${txnId.substring(0, 8)}`, state: "Created" } }
    });

    // 9. Status -> Started
    console.log('9. Status (Ride Started)...');
    await axios.post(`${BASE_URL}/ondc/on_status`, {
        context: { transaction_id: txnId, action: "on_status", bpp_id: "mock-travel-bpp" },
        message: { order: { id: `order-${txnId.substring(0, 8)}`, state: "In-Progress", fulfillment: { state: { descriptor: { code: "RIDE_STARTED" } }, start: { location: { gps: "19.0760,72.8777" } } } } }
    });

    // 10. Status -> Completed
    console.log('10. Status (Ride Completed)...');
    await axios.post(`${BASE_URL}/ondc/on_status`, {
        context: { transaction_id: txnId, action: "on_status", bpp_id: "mock-travel-bpp" },
        message: { order: { id: `order-${txnId.substring(0, 8)}`, state: "Completed", fulfillment: { state: { descriptor: { code: "COMPLETED" } }, start: { location: { gps: "19.0596,72.8295" } } } } }
    });

    // Export Logs
    await sleep(2000); // Wait for logs to flush
    console.log('📥 Exporting Happy Path Logs...');
    const logRes = await axios.get(`${BASE_URL}/api/dev/export-logs?txnId=${txnId}`);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'hailo_happy_path_mumbai.json'), JSON.stringify(logRes.data, null, 2));
    console.log('✅ Generated hailo_happy_path_mumbai.json');
    return txnId;
}


async function runCancellationPath() {
    console.log('\n🛑 Starting CANCELLATION Simulation...');

    // 1. Search
    const searchRes = await axios.post(`${BASE_URL}/ondc/search`, {
        latitude: 19.0760,
        longitude: 72.8777,
        destination: { latitude: 19.0596, longitude: 72.8295 }
    });
    const txnId = searchRes.data.transactionId;
    console.log(`   Transaction ID: ${txnId}`);
    await sleep(500);

    // 2. Fast forward to Confirm
    await axios.post(`${BASE_URL}/ondc/on_search`, {
        context: { transaction_id: txnId, action: "on_search", bpp_id: "mock-travel-bpp" },
        message: { catalog: { "bpp/providers": [{ id: "p1", items: [{ id: "i1", price: { value: "100" } }] }] } }
    });

    await axios.post(`${BASE_URL}/ondc/select`, { transactionId: txnId, providerId: "p1", itemId: "i1" });
    await axios.post(`${BASE_URL}/ondc/on_select`, {
        context: { transaction_id: txnId, action: "on_select", bpp_id: "mock-travel-bpp" },
        message: { order: { quote: { price: { value: "100" } } } }
    });

    await axios.post(`${BASE_URL}/ondc/init`, { transactionId: txnId });
    await axios.post(`${BASE_URL}/ondc/on_init`, {
        context: { transaction_id: txnId, action: "on_init", bpp_id: "mock-travel-bpp" },
        message: { order: { payment: { status: "NOT-PAID" } } }
    });

    await axios.post(`${BASE_URL}/ondc/confirm`, { transactionId: txnId });
    await axios.post(`${BASE_URL}/ondc/on_confirm`, {
        context: { transaction_id: txnId, action: "on_confirm", bpp_id: "mock-travel-bpp" },
        message: { order: { id: `order-${txnId.substring(0, 8)}`, state: "Created" } }
    });

    console.log('   (Ride Confirmed)');

    // 3. Cancel
    console.log('❌ Cancelling Ride...');
    await axios.post(`${BASE_URL}/ondc/cancel`, {
        transactionId: txnId,
        reasonCode: "001"
    });

    // 4. On_Cancel
    console.log('🔙 on_cancel (Mock BPP)...');
    await axios.post(`${BASE_URL}/ondc/on_cancel`, {
        context: { transaction_id: txnId, action: "on_cancel", bpp_id: "mock-travel-bpp" },
        message: { order: { id: `order-${txnId.substring(0, 8)}`, state: "Cancelled" } }
    });

    // Export
    await sleep(2000);
    console.log('📥 Exporting Cancellation Logs...');
    const logRes = await axios.get(`${BASE_URL}/api/dev/export-logs?txnId=${txnId}`);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'hailo_cancellation_mumbai.json'), JSON.stringify(logRes.data, null, 2));
    console.log('✅ Generated hailo_cancellation_mumbai.json');
}

async function runIGMPath(completedTxnId) {
    if (!completedTxnId) {
        console.log('\n⚠️ Skipping IGM (No completed Transaction ID available).');
        return;
    }

    console.log('\n📢 Starting IGM (Grievance) Simulation...');
    console.log(`   Using Completed Transaction ID: ${completedTxnId}`);

    // 1. Create Issue (Client -> Server)
    console.log('1. User Raising Issue...');
    try {
        await axios.post(`${BASE_URL}/api/v1/igm/issue`, {
            transactionId: completedTxnId,
            category: "FULFILLMENT",
            subCategory: "FLM01",
            description: "Driver was rude and drove rashly.",
            userId: "user-123"
        });

        // Wait for the async ONDC /issue call
        await sleep(1000);

        // 2. On_Issue (BPP responding with ACK or Processing)
        console.log('2. on_issue (Mock BPP response)...');
        await axios.post(`${BASE_URL}/ondc/on_issue`, {
            context: {
                domain: "ONDC:TRV10",
                country: "IND",
                city: "std:022",
                action: "on_issue",
                core_version: "1.0.0",
                bap_id: "api.hailone.in",
                bap_uri: "https://api.hailone.in/ondc",
                bpp_id: "mock-travel-bpp",
                bpp_uri: "https://mock-bpp.com",
                transaction_id: completedTxnId,
                message_id: "msg-issue-res",
                timestamp: new Date().toISOString()
            },
            message: {
                issue: {
                    id: "issue-123", // Should ideally match what we sent, but mocking response
                    status: "PROCESSING",
                    issue_actions: {
                        respondent_actions: [{
                            respondent_action: "PROCESSING",
                            short_desc: "We are investigating.",
                            updated_at: new Date().toISOString(),
                            updated_by: { org: { name: "MockProvider" } }
                        }]
                    }
                }
            }
        });

        // Export Logs
        await sleep(2000);
        console.log('📥 Exporting IGM Logs...');
        const logRes = await axios.get(`${BASE_URL}/api/dev/export-logs?txnId=${completedTxnId}`);
        fs.writeFileSync(path.join(OUTPUT_DIR, 'hailo_igm_grievance.json'), JSON.stringify(logRes.data, null, 2));
        console.log('✅ Generated hailo_igm_grievance.json');

    } catch (error) {
        console.log('⚠️ Failed to raise issue:', error.message);
    }
}

(async () => {
    try {
        const happyTxnId = await runHappyPath();
        await runCancellationPath();
        await runIGMPath(happyTxnId);
        console.log('\n✨ All simulations complete. Check "ondc_logs" folder in server root.');
    } catch (e) {
        console.error('Simulation Failed:', e.message);
        if (e.response) {
            console.error('Data:', JSON.stringify(e.response.data, null, 2));
            console.error('Status:', e.response.status);
        } else if (e.request) {
            console.error('No response received (Server down?)');
        } else {
            console.error('Error config:', e.config);
        }
    }
})();
