import { v4 as uuidv4 } from "uuid";
import { CONFIG } from "../config/config.js";

export function createContext(action, transaction_id) {

  return {
    domain: CONFIG.DOMAIN,
    action: action,
    country: CONFIG.COUNTRY,
    city: CONFIG.CITY,
    core_version: CONFIG.CORE_VERSION,

    bap_id: CONFIG.SUBSCRIBER_ID,
    bap_uri: CONFIG.SUBSCRIBER_URL,

    transaction_id: transaction_id,
    message_id: uuidv4(),

    timestamp: new Date().toISOString(),
    ttl: CONFIG.TTL
  };
}