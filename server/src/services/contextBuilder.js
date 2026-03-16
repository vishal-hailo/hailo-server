import { v4 as uuidv4 } from "uuid"
import { ONDC_CONFIG } from "../config/ondcConfig.js"

export const buildContext = (action, transaction_id) => {

  return {

    domain: ONDC_CONFIG.domain,

    city: ONDC_CONFIG.city,

    country: ONDC_CONFIG.country,

    action,

    core_version: ONDC_CONFIG.core_version,

    bap_id: ONDC_CONFIG.bap_id,

    bap_uri: ONDC_CONFIG.bap_uri,

    transaction_id,

    message_id: uuidv4(),

    timestamp: new Date().toISOString()

  }

}