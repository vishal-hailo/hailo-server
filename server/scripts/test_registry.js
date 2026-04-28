import axios from 'axios';

const REGISTRY_URL = 'https://preprod.registry.ondc.org/ondc/lookup';

async function testLookup() {
    const payload = {
        subscriber_id: 'pramaan.ondc.org/beta/preprod/mock/seller',
        domain: 'ONDC:TRV10',
        country: 'IND',
        city: 'std:080'
    };

    console.log(`Sending lookup to ${REGISTRY_URL}...`);
    try {
        const response = await axios.post(REGISTRY_URL, payload, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/112.0',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
    }
}

testLookup();
