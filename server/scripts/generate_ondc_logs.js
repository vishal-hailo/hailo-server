import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3001';
const OUTPUT_DIR = path.join(__dirname, '../ondc_logs');
const DOMAIN = process.env.ONDC_DOMAIN || 'ONDC:TRV10';
const CITY = process.env.ONDC_CITY || 'std:080';
const COUNTRY = process.env.ONDC_COUNTRY || 'IND';
const CORE_VERSION = process.env.ONDC_CORE_VERSION || '1.2.0';
const BAP_ID = process.env.ONDC_SUBSCRIBER_ID || 'api.hailone.in';
const BAP_URI = process.env.ONDC_SUBSCRIBER_URL || 'https://api.hailone.in/ondc';
const BPP_ID = process.env.MOCK_BPP_ID || 'mock-travel-bpp';
const BPP_URI = process.env.MOCK_BPP_URI || 'https://mock-bpp.com';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function callbackContext(txnId, action) {
    return {
        domain: DOMAIN,
        country: COUNTRY,
        city: CITY,
        action,
        core_version: CORE_VERSION,
        bap_id: BAP_ID,
        bap_uri: BAP_URI,
        bpp_id: BPP_ID,
        bpp_uri: BPP_URI,
        transaction_id: txnId,
        message_id: `${action}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString()
    };
}

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
        context: callbackContext(txnId, "on_search"),
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
        context: callbackContext(txnId, "on_select"),
        message: { order: { quote: { price: { value: "250", currency: "INR" }, breakup: [] } } }
    });

    // 5. Init
    console.log('5. Initializing...');
    await axios.post(`${BASE_URL}/ondc/init`, { transactionId: txnId });

    // 6. On_Init
    console.log('6. on_init (Mock BPP)...');
    await axios.post(`${BASE_URL}/ondc/on_init`, {
        context: callbackContext(txnId, "on_init"),
        message: {
            order: {
                id: `order-${txnId.substring(0, 8)}`,
                payments: [{ id: "pay-1", status: "NOT-PAID", collected_by: "BPP", type: "ON-FULFILLMENT", tags: [] }],
                billing: { name: "Test User" },
                fulfillments: [{ id: "fulfillment-1", stops: [{ type: "START", location: { gps: "19.0760,72.8777" } }, { type: "END", location: { gps: "19.0596,72.8295" } }] }]
            }
        }
    });

    // 7. Confirm
    console.log('7. Confirming...');
    await axios.post(`${BASE_URL}/ondc/confirm`, { transactionId: txnId });

    // 8. On_Confirm
    console.log('8. on_confirm (Mock BPP)...');
    await axios.post(`${BASE_URL}/ondc/on_confirm`, {
        context: callbackContext(txnId, "on_confirm"),
        message: {
            order: {
                id: `order-${txnId.substring(0, 8)}`,
                state: "Created",
                fulfillments: [{ id: "fulfillment-1", state: { descriptor: { code: "AGENT-ASSIGNED" } } }]
            }
        }
    });

    // 9. Status -> Started
    console.log('9. Status (Ride Started)...');
    await axios.post(`${BASE_URL}/ondc/on_status`, {
        context: callbackContext(txnId, "on_status"),
        message: {
            order: {
                id: `order-${txnId.substring(0, 8)}`,
                state: "In-Progress",
                fulfillments: [{ state: { descriptor: { code: "RIDE_STARTED" } }, stops: [{ type: "START", location: { gps: "19.0760,72.8777" } }] }]
            }
        }
    });

    // 10. Status -> Completed
    console.log('10. Status (Ride Completed)...');
    await axios.post(`${BASE_URL}/ondc/on_status`, {
        context: callbackContext(txnId, "on_status"),
        message: {
            order: {
                id: `order-${txnId.substring(0, 8)}`,
                state: "Completed",
                fulfillments: [{ state: { descriptor: { code: "COMPLETED" } }, stops: [{ type: "END", location: { gps: "19.0596,72.8295" } }] }]
            }
        }
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
        context: callbackContext(txnId, "on_search"),
        message: { catalog: { "bpp/providers": [{ id: "p1", items: [{ id: "i1", price: { value: "100" } }] }] } }
    });

    await axios.post(`${BASE_URL}/ondc/select`, { transactionId: txnId, providerId: "p1", itemId: "i1" });
    await axios.post(`${BASE_URL}/ondc/on_select`, {
        context: callbackContext(txnId, "on_select"),
        message: { order: { quote: { price: { value: "100" } } } }
    });

    await axios.post(`${BASE_URL}/ondc/init`, { transactionId: txnId });
    await axios.post(`${BASE_URL}/ondc/on_init`, {
        context: callbackContext(txnId, "on_init"),
        message: {
            order: {
                id: `order-${txnId.substring(0, 8)}`,
                payments: [{ id: "pay-1", status: "NOT-PAID", collected_by: "BPP", type: "ON-FULFILLMENT", tags: [] }],
                billing: { name: "Test User" },
                fulfillments: [{ id: "F1", stops: [{ type: "START", location: { gps: "19.0760,72.8777" } }, { type: "END", location: { gps: "19.0596,72.8295" } }] }]
            }
        }
    });

    await axios.post(`${BASE_URL}/ondc/confirm`, { transactionId: txnId });
    await axios.post(`${BASE_URL}/ondc/on_confirm`, {
        context: callbackContext(txnId, "on_confirm"),
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
        context: callbackContext(txnId, "on_cancel"),
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

        // 2. on_issue (BPP responding with PROCESSING)
        console.log('2. on_issue (PROCESSING)...');
        await axios.post(`${BASE_URL}/ondc/on_issue`, {
            context: callbackContext(completedTxnId, "on_issue"),
            message: {
                issue: {
                    id: "issue-123",
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

        await sleep(1000);

        // 3. on_issue (BPP responding with RESOLVED)
        console.log('3. on_issue (RESOLVED)...');
        await axios.post(`${BASE_URL}/ondc/on_issue`, {
            context: callbackContext(completedTxnId, "on_issue"),
            message: {
                issue: {
                    id: "issue-123",
                    status: "RESOLVED",
                    resolution: {
                        short_desc: "Refund Initiated",
                        long_desc: "We have initiated a partial refund.",
                        action_triggered: "REFUND",
                        refund_amount: "50"
                    },
                    issue_actions: {
                        respondent_actions: [{
                            respondent_action: "RESOLVED",
                            short_desc: "Resolved with refund",
                            updated_at: new Date().toISOString(),
                            updated_by: { org: { name: "MockProvider" } }
                        }]
                    }
                }
            }
        });

        // The igmService.js will auto-send 'RESOLUTION_ACCEPTED' and 'CLOSED' in mock mode.
        await sleep(2000);

        // Export Logs
        console.log('📥 Exporting IGM Logs...');
        const logRes = await axios.get(`${BASE_URL}/api/dev/export-logs?txnId=${completedTxnId}`);
        fs.writeFileSync(path.join(OUTPUT_DIR, 'hailo_igm_grievance.json'), JSON.stringify(logRes.data, null, 2));
        console.log('✅ Generated hailo_igm_grievance.json');

    } catch (error) {
        console.log('⚠️ Failed to raise issue:', error.message);
    }
}

async function runDriverCancellationPath() {
    console.log('\n🚕 Starting DRIVER CANCELLATION Simulation...');

    // 1. Search to Confirm
    const searchRes = await axios.post(`${BASE_URL}/ondc/search`, { latitude: 19.0760, longitude: 72.8777 });
    const txnId = searchRes.data.transactionId;
    await sleep(200);
    await axios.post(`${BASE_URL}/ondc/on_search`, { context: callbackContext(txnId, "on_search"), message: { catalog: { "bpp/providers": [{ id: "p1", items: [{ id: "i1", price: { value: "150" } }] }] } } });
    await axios.post(`${BASE_URL}/ondc/select`, { transactionId: txnId, providerId: "p1", itemId: "i1" });
    await axios.post(`${BASE_URL}/ondc/on_select`, { context: callbackContext(txnId, "on_select"), message: { order: { quote: { price: { value: "150" } } } } });
    await axios.post(`${BASE_URL}/ondc/init`, { transactionId: txnId });
    await axios.post(`${BASE_URL}/ondc/on_init`, { context: callbackContext(txnId, "on_init"), message: { order: { payments: [{ status: "NOT-PAID", id: "pay-1", collected_by: "BPP", type: "ON-FULFILLMENT", tags: [] }], billing: { name: "Test User" }, fulfillments: [{ id: "F1", stops: [{ type: "START", location: { gps: "19.0760,72.8777" } }] }] } } });
    await axios.post(`${BASE_URL}/ondc/confirm`, { transactionId: txnId });
    await axios.post(`${BASE_URL}/ondc/on_confirm`, { context: callbackContext(txnId, "on_confirm"), message: { order: { id: `order-dr-${txnId.substring(0,4)}`, state: "Created", fulfillments: [{ id: "F1", state: { descriptor: { code: "AGENT-ASSIGNED" } } }] } } });

    console.log('   (Ride Confirmed)');

    // 2. Driver cancels (Incoming on_status with CANCELLED state)
    console.log('🔙 Simulating DRIVER CANCELLATION (Incoming on_status)...');
    await axios.post(`${BASE_URL}/ondc/on_status`, {
        context: callbackContext(txnId, "on_status"),
        message: { 
            order: { 
                id: `order-dr-${txnId.substring(0,4)}`, 
                state: "Cancelled", 
                fulfillments: [{ state: { descriptor: { code: "CANCELLED" } }, cancellation: { cancelled_by: "BPP", reason: { descriptor: { name: "Driver unavailable" } } } }] 
            } 
        }
    });

    // Export
    await sleep(2000);
    console.log('📥 Exporting Driver Cancellation Logs...');
    const logRes = await axios.get(`${BASE_URL}/api/dev/export-logs?txnId=${txnId}`);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'hailo_driver_cancellation.json'), JSON.stringify(logRes.data, null, 2));
    console.log('✅ Generated hailo_driver_cancellation.json');
}

async function runPriceUpdatePath() {
    console.log('\n💰 Starting PRICE UPDATE Simulation...');

    // 1. Search to Confirm
    const searchRes = await axios.post(`${BASE_URL}/ondc/search`, { latitude: 19.0760, longitude: 72.8777 });
    const txnId = searchRes.data.transactionId;
    await sleep(200);
    await axios.post(`${BASE_URL}/ondc/on_search`, { context: callbackContext(txnId, "on_search"), message: { catalog: { "bpp/providers": [{ id: "p1", items: [{ id: "i1", price: { value: "300" } }] }] } } });
    await axios.post(`${BASE_URL}/ondc/select`, { transactionId: txnId, providerId: "p1", itemId: "i1" });
    await axios.post(`${BASE_URL}/ondc/on_select`, { context: callbackContext(txnId, "on_select"), message: { order: { quote: { price: { value: "300" } } } } });
    await axios.post(`${BASE_URL}/ondc/init`, { transactionId: txnId });
    await axios.post(`${BASE_URL}/ondc/on_init`, { context: callbackContext(txnId, "on_init"), message: { order: { payments: [{ status: "NOT-PAID", id: "pay-1", collected_by: "BPP", type: "ON-FULFILLMENT", tags: [] }], billing: { name: "Test User" }, fulfillments: [{ id: "F1", stops: [{ type: "START", location: { gps: "19.0760,72.8777" } }] }] } } });
    await axios.post(`${BASE_URL}/ondc/confirm`, { transactionId: txnId });
    await axios.post(`${BASE_URL}/ondc/on_confirm`, { context: callbackContext(txnId, "on_confirm"), message: { order: { id: `order-up-${txnId.substring(0,4)}`, state: "Created", fulfillments: [{ id: "F1", state: { descriptor: { code: "AGENT-ASSIGNED" } } }] } } });

    // 2. Ride Completes
    await axios.post(`${BASE_URL}/ondc/on_status`, {
        context: callbackContext(txnId, "on_status"),
        message: { order: { id: `order-up-${txnId.substring(0,4)}`, state: "Completed", fulfillments: [{ state: { descriptor: { code: "COMPLETED" } } }] } }
    });

    // 3. Price Update (Incoming on_update)
    console.log('📈 Simulating PRICE UPDATE (Incoming on_update)...');
    await axios.post(`${BASE_URL}/ondc/on_update`, {
        context: callbackContext(txnId, "on_update"),
        message: { 
            order: { 
                id: `order-up-${txnId.substring(0,4)}`, 
                quote: { price: { value: "350", currency: "INR" }, breakup: [{ title: "Extra Distance", price: { value: "50", currency: "INR" } }] } 
            } 
        }
    });

    // Export
    await sleep(2000);
    console.log('📥 Exporting Price Update Logs...');
    const logRes = await axios.get(`${BASE_URL}/api/dev/export-logs?txnId=${txnId}`);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'hailo_price_update.json'), JSON.stringify(logRes.data, null, 2));
    console.log('✅ Generated hailo_price_update.json');
}

(async () => {
    try {
        const happyTxnId = await runHappyPath();
        await runCancellationPath();
        await runDriverCancellationPath();
        await runPriceUpdatePath();
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
