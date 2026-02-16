import { ONDC_CONFIG } from './src/config/ondc.js';
import { ondcSignatureService } from './src/services/ondcSignatureService.js';

async function testConfig() {
    console.log('--- ONDC Configuration Check ---');
    console.log(`Subscriber ID: ${ONDC_CONFIG.SUBSCRIBER_ID}`);
    console.log(`Subscriber URL: ${ONDC_CONFIG.SUBSCRIBER_URL}`);
    console.log(`Key ID: ${ONDC_CONFIG.KEY_ID}`);
    console.log(`Private Key Present: ${!!ONDC_CONFIG.PRIVATE_KEY}`);
    console.log(`Public Key Present: ${!!ONDC_CONFIG.PUBLIC_KEY}`);

    try {
        const header = await ondcSignatureService.createAuthorizationHeader({ test: 'data' });
        console.log('\n✅ Signature Generation Successful');
        console.log(`Header: ${header.substring(0, 50)}...`);
    } catch (error) {
        console.error('\n❌ Signature Generation Failed:', error.message);
    }
}

testConfig();
