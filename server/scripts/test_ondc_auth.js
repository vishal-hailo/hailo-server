import dotenv from 'dotenv';
import { becknAuthService } from '../src/services/becknAuth.js';
import { v4 as uuidv4 } from 'uuid';
import { ONDC_CONFIG } from '../src/config/ondc.js';

dotenv.config();

async function testAuth() {
    console.log('🔑 Testing ONDC Authorization Header Generation...');
    console.log('Subscriber ID:', ONDC_CONFIG.SUBSCRIBER_ID);
    console.log('Key ID:', ONDC_CONFIG.KEY_ID);
    console.log('Private Key Length:', ONDC_CONFIG.PRIVATE_KEY ? ONDC_CONFIG.PRIVATE_KEY.length : 'MISSING');

    const payload = {
        context: {
            domain: ONDC_CONFIG.DOMAIN,
            country: ONDC_CONFIG.COUNTRY_CODE,
            city: ONDC_CONFIG.CITY_CODE,
            action: 'search',
            core_version: '1.2.0',
            bap_id: ONDC_CONFIG.SUBSCRIBER_ID,
            bap_uri: ONDC_CONFIG.SUBSCRIBER_URL,
            transaction_id: uuidv4(),
            message_id: uuidv4(),
            timestamp: new Date().toISOString(),
            ttl: ONDC_CONFIG.TTL,
        },
        message: {
            intent: {
                fulfillment: {
                    start: {
                        location: {
                            gps: "19.0760,72.8777"
                        }
                    }
                }
            }
        }
    };

    try {
        const header = await becknAuthService.createAuthorizationHeader(payload);
        console.log('✅ Auth Header Generated Successfully:');
        console.log(header);

        // Attempt a curl request using the generated header to the gateway
        console.log('\n🚀 To verify with Gateway, run this curl command:');
        console.log(`curl -X POST ${ONDC_CONFIG.GATEWAY_URL} \\
-H "Authorization: ${header}" \\
-H "Content-Type: application/json" \\
-d '${JSON.stringify(payload)}'`);

    } catch (error) {
        console.error('❌ Failed to generate Auth Header:', error);
        console.error('Stack:', error.stack);
    }
}

testAuth();
