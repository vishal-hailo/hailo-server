import { io } from 'socket.io-client';
import axios from 'axios';

const PORT = 3001;
const URL = `http://127.0.0.1:${PORT}`;

async function verifySelectFlow() {
    console.log('🚀 Starting Select Flow Verification...');

    // 1. Initiate Search
    console.log('\n📡 Step 1: Initiating Search...');
    let transactionId;
    try {
        const searchRes = await axios.post(`${URL}/ondc/search`, {
            latitude: 19.0760,
            longitude: 72.8777
        });
        transactionId = searchRes.data.transactionId;
        console.log(`✅ Search Initiated! Transaction ID: ${transactionId}`);
    } catch (error) {
        console.error('❌ Search Failed:', error.response?.data || error.message);
        process.exit(1);
    }

    // 2. Connect to Socket
    console.log('\n🔌 Step 2: Connecting to WebSocket...');
    const socket = io(URL);

    socket.on('connect', async () => {
        console.log('✅ Connected to Socket.io');

        // Listen for search results to pick an item
        socket.on(`search_update_${transactionId}`, async (data) => {
            console.log(`\n📦 Received ${data.length} search results`);
            if (data.length > 0) {
                const item = data[0];
                console.log(`👉 Selecting item: ${item.name} (${item.id}) from ${item.providerName}`);

                // 3. Trigger Select
                try {
                    const selectRes = await axios.post(`${URL}/ondc/select`, {
                        transactionId,
                        providerId: item.providerId,
                        itemId: item.id
                    });
                    console.log(`✅ Select Initiated! Message ID: ${selectRes.data.messageId}`);
                } catch (error) {
                    console.error('❌ Select Failed:', error.response?.data || error.message);
                    process.exit(1);
                }
            }
        });

        // Listen for Select Quote Update
        socket.on(`select_update_${transactionId}`, (quote) => {
            console.log('\n🎉 RECEIVED SELECT QUOTE UPDATE!');
            console.log('💰 Quote:', JSON.stringify(quote, null, 2));

            if (quote.price && quote.breakup) {
                console.log('\n✅ VERIFICATION SUCCESSFUL: Received detailed quote!');
                socket.disconnect();
                process.exit(0);
            } else {
                console.error('❌ Received invalid quote format.');
                process.exit(1);
            }
        });

        // Simulate ONDC Search Callback (needed to populate results first)
        // We reuse the logic from verify_discovery.js roughly, or just rely on ONDC_MOCK if it mocks search too?
        // Wait, ondcService.js logic for search only mocks the *Gateway Call*.
        // It does NOT auto-generate results in `onSearch` loop unless I implement `simulateOnSearch`.
        // The previous `verify_discovery.js` manually posted to `/on_search`.
        // So I must do that here too.

        setTimeout(async () => {
            console.log('\n📨 Step 1.5: Simulating ONDC Search Callback...');
            try {
                await axios.post(`${URL}/ondc/on_search`, {
                    context: {
                        transaction_id: transactionId,
                        bpp_id: 'mock-bpp',
                        bpp_uri: 'https://mock-bpp.com'
                    },
                    message: {
                        catalog: {
                            'bpp/providers': [
                                {
                                    id: 'provider-1',
                                    descriptor: { name: 'Mock Provider' },
                                    items: [
                                        {
                                            id: 'item-1',
                                            descriptor: { name: 'Auto Rickshaw' },
                                            price: { value: '150', currency: 'INR' },
                                            fulfillment_id: 'fulfillment-1'
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                });
                console.log('✅ Search Callback Sent!');
            } catch (error) {
                console.error('❌ Search Callback Failed:', error.response?.data || error.message);
            }
        }, 1000);

    });
}

verifySelectFlow();
