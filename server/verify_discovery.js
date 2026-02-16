import { io } from 'socket.io-client';
import axios from 'axios';

const PORT = 3001;
const URL = `http://127.0.0.1:${PORT}`;

async function verifyDiscoveryFlow() {
    console.log('🚀 Starting Discovery Flow Verification...');

    // 1. Initiate Search
    console.log('\n📡 Step 1: Initiating Search...');
    let transactionId;
    try {
        const searchRes = await axios.post(`${URL}/ondc/search`, {
            latitude: 19.0760,
            longitude: 72.8777,
            destination: { latitude: 19.2183, longitude: 72.9781 } // Mumbai to Thane
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

    socket.on('connect', () => {
        console.log('✅ Connected to Socket.io');

        // Listen for updates
        console.log(`👂 Listening for "search_update_${transactionId}"...`);
        socket.on(`search_update_${transactionId}`, (data) => {
            console.log('\n🎉 RECEIVED REAL-TIME UPDATE!');
            console.log('📦 Payload:', JSON.stringify(data, null, 2));

            if (data.length > 0 && data[0].source === 'ONDC') {
                console.log('\n✅ VERIFICATION SUCCESSFUL: Received ONDC quote via WebSocket!');
                socket.disconnect();
                process.exit(0);
            } else {
                console.error('❌ Received data but format incorrect or empty.');
                process.exit(1);
            }
        });

        // 3. Simulate ONDC Callback (after a delay to ensure listener is active)
        setTimeout(async () => {
            console.log('\n📨 Step 3: Simulating ONDC Callback (on_search)...');
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
                console.log('✅ Callback Sent!');
            } catch (error) {
                console.error('❌ Callback Failed:', error.response?.data || error.message);
            }
        }, 1000);
    });

    socket.on('connect_error', (err) => {
        console.error('❌ Socket Connection Error:', err.message);
        process.exit(1);
    });
}

verifyDiscoveryFlow();
