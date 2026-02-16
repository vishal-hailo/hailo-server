import axios from 'axios';
import { ONDC_CONFIG } from '../config/ondc.js';
import { ondcSignatureService } from './ondcSignatureService.js';

export const ondcRegistryService = {
    /**
     * lookup
     * Search not for specific BPPs, but usually for a Gateway (BG) that broadcasts to BPPs.
     * However, for direct integration or troubleshooting, we can lookup BPPs.
     * 
     * @param {Object} criteria - Search criteria (e.g., type: 'BPP', domain: 'ONDC:TRV10', city: 'std:022')
     */
    async lookup(criteria = {}) {
        try {
            const payload = {
                subscriber_id: ONDC_CONFIG.SUBSCRIBER_ID,
                type: criteria.type || 'BG', // Default to looking for a Gateway
                domain: ONDC_CONFIG.DOMAIN,
                country: ONDC_CONFIG.COUNTRY_CODE,
                city: ONDC_CONFIG.CITY_CODE
            };

            // Registry lookup is a simple POST request. 
            // Some registries might require signature authentication if configured as strictly private.
            // Verification logic often checks if the caller is a known subscriber.

            const response = await axios.post(ONDC_CONFIG.REGISTRY_URL, payload);

            if (response.data && Array.isArray(response.data)) {
                return response.data;
            }

            return [];
        } catch (error) {
            console.error('ONDC Registry Lookup Failed:', error.message);
            return [];
        }
    },

    /**
     * getGatewayUrl
     * Returns a valid Gateway URL to send search requests to.
     * If strictly configured in env, returns that. Otherwise looks up registry.
     */
    async getGatewayUrl() {
        if (ONDC_CONFIG.GATEWAY_URL) return ONDC_CONFIG.GATEWAY_URL;

        const gateways = await this.lookup({ type: 'BG' });
        if (gateways.length > 0) {
            return gateways[0].subscriber_url;
        }

        throw new Error('No ONDC Gateway found in registry');
    },

    /**
     * lookupPublicKey
     * Fetches the signing public key for a given subscriber_id and key_id from the registry.
     * 
     * @param {string} subscriberId 
     * @param {string} keyId 
     */
    async lookupPublicKey(subscriberId, keyId) {
        try {
            const payload = {
                subscriber_id: subscriberId,
                domain: ONDC_CONFIG.DOMAIN,
                country: ONDC_CONFIG.COUNTRY_CODE,
                city: ONDC_CONFIG.CITY_CODE
            };

            // In a real scenario, we might cache this result to avoid hitting registry on every request
            const response = await axios.post(ONDC_CONFIG.REGISTRY_URL, payload);

            if (response.data && Array.isArray(response.data)) {
                // Find the entry that matches the keyId
                const subscriberConfig = response.data.find(sub => sub.ukId === keyId || sub.unique_key_id === keyId);

                if (subscriberConfig) {
                    return subscriberConfig.signing_public_key;
                }
            }

            console.warn(`Public Key not found for ${subscriberId} | ${keyId}`);
            return null;
        } catch (error) {
            console.error('Registry Public Key Lookup Failed:', error.message);
            return null;
        }
    }
};
