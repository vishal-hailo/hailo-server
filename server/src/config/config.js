// import dotenv from 'dotenv';
// dotenv.config();

// export const ONDC_CONFIG = {
//     // Identity
//     SUBSCRIBER_ID: process.env.ONDC_SUBSCRIBER_ID || 'api.hailone.in',
//     SUBSCRIBER_URL: process.env.ONDC_SUBSCRIBER_URL || 'https://api.hailone.in/ondc',
//     KEY_ID: process.env.ONDC_KEY_ID || 'hailo-key-1',

//     // Keys (Base64 encoded)
//     // PRIVATE_KEY is used to sign outgoing requests
//     // PUBLIC_KEY is hosted for others to verify our signature
//     PRIVATE_KEY: process.env.ONDC_PRIVATE_KEY || '0hzaH+B8a30pFY/yHi0ACjaM2e/VUYNms2GglxMhJGYahxQoyN19BrX0HbW42dOxlFYlkk46Exhs/cyYGT9Pdg==' ,
//     PUBLIC_KEY: process.env.ONDC_PUBLIC_KEY || 'GocUKMjdfQa19B21uNnTsZRWJZJOOhMYbP3MmBk/T3Y=',

//     // Registry & Gateway (Forced strictly to Preprod for Pramaan)
//     REGISTRY_URL: 'https://preprod.registry.ondc.org/lookup',
//     GATEWAY_URL: 'https://preprod.gateway.ondc.org/search',

//     // Protocol specific
//     TTL: 'PT30S', // 30 seconds validity
//     CITY_CODE: 'std:080', // Bangalore
//     COUNTRY_CODE: 'IND',
//     DOMAIN: 'ONDC:TRV10', // Ride Hailing
// };


import dotenv from "dotenv";

dotenv.config();

export const ONDC_CONFIG = {

  /* ---------------- Identity ---------------- */

    SUBSCRIBER_ID: process.env.ONDC_SUBSCRIBER_ID || 'api.hailone.in',
    SUBSCRIBER_URL: process.env.ONDC_SUBSCRIBER_URL || 'https://api.hailone.in/ondc',
    KEY_ID: process.env.ONDC_KEY_ID || 'f149bf19-910b-444a-8a82-02784199dc30',

  /* ---------------- Keys ---------------- */

      // Keys (Base64 encoded)
    // PRIVATE_KEY is used to sign outgoing requests
    // PUBLIC_KEY is hosted for others to verify our signature
    PRIVATE_KEY: process.env.ONDC_PRIVATE_KEY || '0hzaH+B8a30pFY/yHi0ACjaM2e/VUYNms2GglxMhJGYahxQoyN19BrX0HbW42dOxlFYlkk46Exhs/cyYGT9Pdg==' ,
    PUBLIC_KEY: process.env.ONDC_PUBLIC_KEY || 'GocUKMjdfQa19B21uNnTsZRWJZJOOhMYbP3MmBk/T3Y=',

  /* ---------------- Network ---------------- */

  REGISTRY_URL: process.env.ONDC_REGISTRY_URL || "https://preprod.registry.ondc.org/lookup",
  GATEWAY_URL: process.env.ONDC_GATEWAY_URL || "https://preprod.gateway.ondc.org/search",

  /* ---------------- Protocol ---------------- */

  CORE_VERSION: process.env.ONDC_CORE_VERSION || "1.2.0",
  VERSION: process.env.ONDC_VERSION || "2.1.0",
  DOMAIN: "ONDC:TRV10",

  COUNTRY_CODE: "IND",
  CITY_CODE: "std:080",

  TTL: "PT30S",

  /* ---------------- Buyer App ---------------- */

  BAP_ID: process.env.ONDC_SUBSCRIBER_ID || 'api.hailone.in',
  BAP_URI: process.env.ONDC_SUBSCRIBER_URL || 'https://api.hailone.in/ondc'
};