import axios from "axios";
import { CONFIG } from "../config/config.js";

export async function lookupBPP(subscriber_id) {

  const payload = {
    subscriber_id: subscriber_id
  };

  const res = await axios.post(CONFIG.REGISTRY_URL, payload);

  return res.data;
}