import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

async function diagnose() {
    console.log('🕵️‍♂️ Starting ONDC Diagnostics (via Curl)...');

    // Command to check Preprod Registry
    const preprodCmd = `curl -X POST https://preprod.registry.ondc.org/lookup -H "Content-Type: application/json" -d '{"subscriber_id": "api.hailone.in", "domain": "ONDC:TRV10", "type": "BAP"}'`;

    // Command to check Staging Registry
    const stagingCmd = `curl -X POST https://staging.registry.ondc.org/lookup -H "Content-Type: application/json" -d '{"subscriber_id": "api.hailone.in", "domain": "ONDC:TRV10", "type": "BAP"}'`;

    try {
        console.log('\n--- Checking PREPROD Registry ---');
        console.log("CMD:", preprodCmd);
        const { stdout: preprodOut } = await execPromise(preprodCmd);
        console.log("Response:", preprodOut);
    } catch (e) {
        console.log("Preprod Error:", e.message);
    }

    try {
        console.log('\n--- Checking STAGING Registry ---');
        console.log("CMD:", stagingCmd);
        const { stdout: stagingOut } = await execPromise(stagingCmd);
        console.log("Response:", stagingOut);
    } catch (e) {
        console.log("Staging Error:", e.message);
    }
}

diagnose();
