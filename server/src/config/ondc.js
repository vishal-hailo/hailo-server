import dotenv from 'dotenv';
dotenv.config();

export const ONDC_CONFIG = {
    // Identity
    SUBSCRIBER_ID: process.env.ONDC_SUBSCRIBER_ID || 'api.hailone.in',
    SUBSCRIBER_URL: process.env.ONDC_SUBSCRIBER_URL || 'https://api.hailone.in/ondc',
    KEY_ID: process.env.ONDC_KEY_ID || 'hailo-key-1',

    // Keys (Base64 encoded)
    // PRIVATE_KEY is used to sign outgoing requests
    // PUBLIC_KEY is hosted for others to verify our signature
    PRIVATE_KEY: process.env.ONDC_PRIVATE_KEY,
    PUBLIC_KEY: process.env.ONDC_PUBLIC_KEY,

    // Registry & Gateway (Forced strictly to Preprod for Pramaan)
    REGISTRY_URL: 'https://preprod.registry.ondc.org/lookup',
    GATEWAY_URL: 'https://preprod.gateway.ondc.org/search',

    // Protocol specific
    TTL: 'PT30S', // 30 seconds validity
    CITY_CODE: 'std:080', // Bangalore
    COUNTRY_CODE: 'IND',
    DOMAIN: 'ONDC:TRV10', // Ride Hailing
};
