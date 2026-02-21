import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import _sodium from 'libsodium-wrappers';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function generateVerificationFile() {
    await _sodium.ready;
    const sodium = _sodium;

    const privateKeyBase64 = process.env.ONDC_PRIVATE_KEY;
    if (!privateKeyBase64) {
        console.error("❌ ONDC_PRIVATE_KEY missing in .env");
        return;
    }

    try {
        // 1. Generate a Unique Request ID
        const requestId = uuidv4();
        console.log(`Generated Unique Request ID: ${requestId}`);

        // 2. Load Private Key
        const privateKeyBuffer = Buffer.from(privateKeyBase64, 'base64');
        
        // Ensure private key length is 64 bytes for Ed25519
        if (privateKeyBuffer.length !== 64) {
            console.error(`❌ Invalid private key length. Expected 64 bytes, got ${privateKeyBuffer.length}`);
            return;
        }

        // 3. Sign the Request ID
        // Note: Some ONDC docs say sign the raw string, some say sign the hash. 
        // We will sign the raw string using Ed25519 detached signature as per standard Beckn auth.
        const messageBuffer = Buffer.from(requestId, 'utf-8');
        const signatureBuffer = sodium.crypto_sign_detached(messageBuffer, privateKeyBuffer);
        const signedUniqueReqId = Buffer.from(signatureBuffer).toString('base64');

        console.log(`\nGenerated SIGNED_UNIQUE_REQ_ID:\n${signedUniqueReqId}\n`);

        // 4. Create the HTML content
        const htmlContent = `<!--
    ONDC Site Verification File
    Generated automatically for api.hailone.in
-->
<html>
  <head>
    <meta name="ondc-site-verification" content="${signedUniqueReqId}" />
  </head>
  <body>
    ONDC Site Verification Successful
  </body>
</html>`;

        // 5. Save the file to public/ondc-site-verification.html (so Express can serve it)
        const publicDir = path.join(process.cwd(), 'public');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir);
        }
        const filePath = path.join(publicDir, 'ondc-site-verification.html');
        fs.writeFileSync(filePath, htmlContent);
        
        console.log(`✅ File saved successfully to: ${filePath}`);
        
    } catch (error) {
        console.error("❌ Failed to generate verification file:", error);
    }
}

generateVerificationFile();
