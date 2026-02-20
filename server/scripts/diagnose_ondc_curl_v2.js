import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

async function diagnose() {
    console.log('🕵️‍♂️ Starting ONDC Diagnostics (via Curl) - Attempt 4 (Correct URL)...');

    // Command to check Preprod Registry - Updated URL and added -L
    const preprodCmd = `curl -v -L -X POST https://preprod.registry.ondc.org/v2.0/lookup -H "Content-Type: application/json" -d '{"subscriber_id":"api.hailone.in","domain":"ONDC:TRV10","type":"BAP","country":"IND","city":"std:022"}' 2>&1`;

    // Command to check Staging Registry - Updated URL and added -L
    const stagingCmd = `curl -v -L -X POST https://staging.registry.ondc.org/v2.0/lookup -H "Content-Type: application/json" -d '{"subscriber_id":"api.hailone.in","domain":"ONDC:TRV10","type":"BAP","country":"IND","city":"std:022"}' 2>&1`;

    try {
        console.log('\n--- Checking PREPROD Registry ---');
        console.log("CMD:", preprodCmd);
        const { stdout: preprodOut } = await execPromise(preprodCmd);
        // Only print the actual JSON body if possible, or just the whole thing
        console.log("Response Full:\n", preprodOut);
    } catch (e) {
        console.log("Preprod Error:", e.message);
    }
}

diagnose();
