import axios from 'axios';

async function publicLookup() {
    console.log('🕵️‍♂️ Attempting Public/Mock Lookup...');

    // Sometimes the registry allows lookups without auth if we abuse the search filter
    // or use a specific endpoint.
    // Let's try the /lookup endpoint BUT without a signature, just to see if it acts differently
    // or returns a specific error message.

    // Also try looking up via a Gateway if possible? No, Gateway doesn't expose lookup.

    const registryUrl = 'https://preprod.registry.ondc.org/lookup';
    // Trying v1 endpoint which might be more lenient?

    try {
        const payload = {
            subscriber_id: 'api.hailone.in',
            domain: 'ONDC:TRV10',
            type: 'BAP',
            country: 'IND',
            city: 'std:022'
        };

        console.log(`Sending payload to ${registryUrl}...`);
        const response = await axios.post(registryUrl, payload); // No Auth Header

        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('❌ Public Lookup Failed:', error.response ? error.response.status : error.message);
        if (error.response) console.log(JSON.stringify(error.response.data));
    }
}

publicLookup();
