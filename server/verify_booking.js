import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3001';
const socket = io(API_URL);

async function runBookingFlow() {
    console.log('🚀 Starting ONDC Booking Flow Verification...');

    try {
        // 1. Search
        console.log('\n--- Step 1: Search ---');
        const searchRes = await axios.post(`${API_URL}/ondc/search`, {
            latitude: 19.0760,
            longitude: 72.8777,
            destination: {
                latitude: 19.2183,
                longitude: 72.9781
            }
        });
        const { transactionId } = searchRes.data;
        console.log(`✅ Search Initiated. Transaction ID: ${transactionId}`);

        // Simulate ONDC Search Callback
        setTimeout(async () => {
            console.log('\n📨 Simulating ONDC Search Callback...');
            try {
                await axios.post(`${API_URL}/ondc/on_search`, {
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
        }, 2000);

        // Listen for Search Updates
        socket.on(`search_update_${transactionId}`, async (results) => {
            console.log(`\n📩 Received ${results.length} Search Results`);

            if (results.length > 0) {
                const item = results[0];
                console.log(`👉 Selecting first item: ${item.name} (${item.providerName}) - ₹${item.price}`);

                // 2. Select
                console.log('\n--- Step 2: Select ---');
                await axios.post(`${API_URL}/ondc/select`, {
                    transactionId,
                    providerId: item.providerId,
                    itemId: item.id
                });
                console.log('✅ Select Initiated');
            }
        });

        // Listen for Select Updates (Quote)
        socket.on(`select_update_${transactionId}`, async (quote) => {
            console.log('\n📩 Received Detailed Quote:', JSON.stringify(quote, null, 2));

            // 3. Init
            console.log('\n--- Step 3: Init ---');
            await axios.post(`${API_URL}/ondc/init`, { transactionId });
            console.log('✅ Init Initiated');
        });

        // Listen for Init Updates
        socket.on(`init_update_${transactionId}`, async (order) => {
            console.log('\n📩 Received Init Order:', JSON.stringify(order, null, 2));

            // 4. Confirm
            console.log('\n--- Step 4: Confirm ---');
            await axios.post(`${API_URL}/ondc/confirm`, { transactionId });
            console.log('✅ Confirm Initiated');
        });

        // Listen for Confirm Updates
        socket.on(`confirm_update_${transactionId}`, (order) => {
            console.log('\n🎉 BOOKING CONFIRMED!');
            console.log('Order Details:', JSON.stringify(order, null, 2));
            console.log('\n✅ Flow Verification Complete!');
            process.exit(0);
        });

        socket.on(`select_error_${transactionId}`, (err) => {
            console.error('❌ Select Error:', err);
            process.exit(1);
        });

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

socket.on('connect', () => {
    console.log('🔌 Connected to WebSocket');
    runBookingFlow();
});
