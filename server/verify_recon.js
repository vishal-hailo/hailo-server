import axios from 'axios';
import mongoose from 'mongoose';
import Settlement from './src/models/Settlement.js';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:3001/ondc';

// Mock Recon Payload (from RSP/Settlement Agency)
const reconPayload = {
    context: {
        domain: "ONDC:TRV10",
        country: "IND",
        city: "std:080",
        action: "on_receiver_recon",
        core_version: "1.0.0",
        bap_id: "api.hailone.in",
        bap_uri: "https://api.hailone.in/ondc",
        bpp_id: "rsf-mock-service",
        bpp_uri: "https://rsf-mock.ondc.org",
        transaction_id: "recon-tx-12345", // Bulk recon ID, not order txn ID
        message_id: "msg-recon-001",
        timestamp: new Date().toISOString(),
        ttl: "P2D"
    },
    message: {
        orderbook: {
            orders: [
                {
                    id: "ORDER_12345_MOCK", // Matches an order ID we might have or new
                    invoice_no: "INV-001",
                    collector_app_id: "api.hailone.in",
                    receiver_app_id: "ref-app-seller-id-2024",
                    order_recon_status: "02",
                    transaction_id: "tx-order-1",
                    settlement_id: "SETTLE-001",
                    settlement_reference_no: "REF-123",
                    counterparty_recon_status: "01",
                    counterparty_diff_amount: {
                        currency: "INR",
                        value: "0"
                    },
                    message: {
                        name: "Settlement for Order 12345",
                        code: ""
                    },
                    payment: {
                        uri: "https://razorpay.com",
                        tl_method: "http/get",
                        params: {
                            currency: "INR",
                            amount: "150.00",
                            status: "PAID"
                        },
                        type: "ON-ORDER",
                        status: "PAID",
                        urn: "UTR-BANK-1234567890" // The important part
                    }
                }
            ]
        }
    }
};

const verifyRecon = async () => {
    try {
        console.log('🚀 Sending on_receiver_recon...');

        // 1. Send Callback (Assuming Auth Middleware allows it or we mock it)
        // In real flow, we need a valid signature. 
        // For local verify, if we run with ONDC_MOCK=true, maybe we skip signature or use our own key?
        // verifyingOndcSignature checks signature.
        // Let's generate a valid header using our own key (acting as sender)

        // For local verify with ONDC_MOCK=true, we can skip auth header
        // const { becknAuthService } = await import('./src/services/becknAuth.js');
        // const authHeader = await becknAuthService.createAuthorizationHeader(reconPayload);

        await axios.post(`${BASE_URL}/on_receiver_recon`, reconPayload, {
            // headers: { Authorization: authHeader }
        });

        console.log('✅ on_receiver_recon sent successfully');

        // 2. Verify DB
        console.log('📊 Verifying Database...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hailo');

        // Wait a bit for async write
        setTimeout(async () => {
            const settlement = await Settlement.findOne({ orderId: "ORDER_12345_MOCK" });
            if (settlement) {
                console.log(`✅ Settlement Found!`);
                console.log(`- Amount: ${settlement.amount}`);
                console.log(`- URN: ${settlement.urn}`);
                console.log(`- Status: ${settlement.status}`);
                process.exit(0);
            } else {
                console.error('❌ Settlement NOT found in DB');
                process.exit(1);
            }
        }, 2000);

    } catch (error) {
        console.error('❌ Recon Verification Failed:', error.message);
        if (error.response) console.error(error.response.data);
        process.exit(1);
    }
};

verifyRecon();
