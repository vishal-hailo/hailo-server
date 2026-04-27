import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.API_URL || "https://api.hailone.in/ondc";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForResults(transactionId) {
  console.log(`⏳ Waiting for results...`);
  let attempts = 0;
  while (attempts < 40) {
    await sleep(2000);
    attempts++;
    try {
      const res = await axios.get(`${BASE_URL}/results/${transactionId}`);
      const results = res.data?.results || [];
      if (results.length) {
        console.log(`\n✅ results received (${results.length})`);
        return results;
      }
      process.stdout.write(".");
    } catch (err) {
      console.log("Polling error:", err.message);
    }
  }
  throw new Error(`results not received in time`);
}

async function runFlow() {

  console.log("🚀 Starting ONDC FULL FLOW");

  console.log("⏳ Wait 20 seconds and click START in Pramaan...");

  for (let i = 20; i > 0; i--) {
    process.stdout.write(`\r⏱ ${i}s`);
    await sleep(1000);
  }

  let transactionId;

  // ---------------- SEARCH ----------------

  console.log("\n\n🔎 Running SEARCH");

  const searchRes = await axios.post(`${BASE_URL}/search`, {
    latitude: 19.076,
    longitude: 72.8777,
    destination: {
      latitude: 19.0544,
      longitude: 72.8406
    }
  });

  transactionId = searchRes.data.transactionId;

  console.log("Transaction ID:", transactionId);

  // ---------------- WAIT FOR on_search ----------------

  const searchResults = await waitForResults(transactionId);

  const quote = searchResults[0];

  console.log("\n🚘 Selected Quote:");
  console.log(JSON.stringify(quote, null, 2));

  // ---------------- SELECT ----------------

  console.log("\n📦 Running SELECT");

  await axios.post(`${BASE_URL}/select`, {
    transactionId,
    providerId: quote.providerId,
    itemId: quote.id
  });

  console.log("Select request sent");

//   await waitForField(transactionId, "on_select");
  console.log("⏳ Waiting for select processing...");
   await sleep(6000);

  // ---------------- INIT ----------------

  console.log("\n📦 Running INIT");

  await axios.post(`${BASE_URL}/init`, {
    transactionId,
    providerId: quote.providerId,
    itemId: quote.id
  });

  console.log("Init request sent");

  console.log("⏳ Waiting for init processing...");
  await sleep(6000);

  // ---------------- CONFIRM ----------------

  console.log("\n📦 Running CONFIRM");

  await axios.post(`${BASE_URL}/confirm`, {
    transactionId,
    providerId: quote.providerId,
    itemId: quote.id
  });

  console.log("Confirm request sent");

  console.log("⏳ Waiting for confirm processing...");
  await sleep(6000);

  console.log("\n🎉 FULL FLOW COMPLETED SUCCESSFULLY");
  console.log("Check Pramaan dashboard for green bubbles.");
}

runFlow().catch((err) => {

  console.error("\n❌ FLOW FAILED");
  console.error(err.response?.data || err.message);

});