import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const UBER_AUTH_URL = 'https://login.uber.com/oauth/v2/token';
const SCOPES = 'estimates.price'; // Basic scope for aggregator

let cachedToken = null;
let tokenExpiry = null;

export const uberTokenService = {
    /**
     * Get a valid Server Token (Client Credentials)
     */
    async getServerToken() {
        // Check if we have a valid cached token
        if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
            return cachedToken;
        }

        // credentials
        const CLIENT_ID = process.env.UBER_CLIENT_ID;
        const CLIENT_SECRET = process.env.UBER_CLIENT_SECRET;

        if (!CLIENT_ID || !CLIENT_SECRET) {
            throw new Error('UBER_CLIENT_ID or UBER_CLIENT_SECRET not defined in .env');
        }

        try {
            const params = new URLSearchParams();
            params.append('client_id', CLIENT_ID);
            params.append('client_secret', CLIENT_SECRET);
            params.append('grant_type', 'client_credentials');
            params.append('scope', SCOPES);

            const response = await axios.post(UBER_AUTH_URL, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const { access_token, expires_in, scope } = response.data;

            // Cache the token
            cachedToken = access_token;
            // expires_in is in seconds. Subtract 5 mins buffer for safety.
            tokenExpiry = Date.now() + (expires_in * 1000) - (5 * 60 * 1000);

            console.log('✅ Acquired new Uber Server Token');
            return cachedToken;

        } catch (error) {
            console.error('Failed to get Uber Server Token:', error.response?.data || error.message);
            throw new Error('Could not authenticate with Uber API');
        }
    }
};
