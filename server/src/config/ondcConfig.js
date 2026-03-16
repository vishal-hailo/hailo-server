import dotenv from "dotenv"

dotenv.config()

export const ONDC_CONFIG = {

  bap_id: process.env.BAP_ID,
  bap_uri: process.env.BAP_URI,

  city: process.env.CITY,
  country: process.env.COUNTRY,

  domain: process.env.DOMAIN,
  core_version: process.env.CORE_VERSION,

  key_id: process.env.KEY_ID,

  gateway_url: process.env.GATEWAY_URL

}