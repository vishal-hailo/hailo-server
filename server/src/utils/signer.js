import sodium from "libsodium-wrappers";
import { CONFIG } from "../config/config.js";

export async function signRequest(payload) {

  await sodium.ready;

  const privateKey = Buffer.from(CONFIG.PRIVATE_KEY, "base64");

  const signature = sodium.crypto_sign_detached(
    Buffer.from(payload),
    privateKey
  );

  return Buffer.from(signature).toString("base64");
}