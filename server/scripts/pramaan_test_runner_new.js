import axios from "axios";

const BASE_URL = process.env.API_URL || "https://api.hailone.in/ondc";
const SEARCH_TIMEOUT_MS = Number(process.env.SEARCH_TIMEOUT_MS || 120000);
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 3000);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForResults(transactionId) {
  const deadline = Date.now() + SEARCH_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const res = await axios.get(`${BASE_URL}/results/${transactionId}`);
    const results = res.data?.results || [];
    if (results.length > 0) return results;
    process.stdout.write(".");
    await sleep(POLL_INTERVAL_MS);
  }

  return [];
}

async function runFlow() {

  try {

    console.log("\n📦 Running SEARCH");

    const search = await axios.post(`${BASE_URL}/search`, {
      latitude: Number(process.env.SEARCH_LAT || 19.0760),
      longitude: Number(process.env.SEARCH_LNG || 72.8777),
      destination: {
        latitude: Number(process.env.DEST_LAT || 19.0544),
        longitude: Number(process.env.DEST_LNG || 72.8406)
      }
    });
    const transactionId = search.data?.transactionId;

    if (!transactionId) {
      throw new Error("Search did not return transactionId");
    }

    console.log(`✅ Search request sent (txn: ${transactionId})`);

    console.log("⏳ Waiting for on_search callback...");
    const results = await waitForResults(transactionId);
    console.log("");

    if (!results.length) {
      throw new Error("Timed out waiting for on_search results");
    }

    const selected = results[0];
    console.log(`✅ Received ${results.length} result(s), selecting ${selected.providerName || selected.providerId}`);


    console.log("\n📦 Running SELECT");

    const selectPayload = {
      transactionId,
      providerId: selected.providerId,
      itemId: selected.id
    };

    await axios.post(`${BASE_URL}/select`, selectPayload);

    console.log("✅ Select sent");

    console.log("⏳ Waiting for on_select...");

    await sleep(5000);


    console.log("\n📦 Running INIT");

    const initPayload = {
      transactionId
    };

    await axios.post(`${BASE_URL}/init`, initPayload);

    console.log("✅ Init sent");

    console.log("⏳ Waiting for on_init...");

    await sleep(5000);


    console.log("\n📦 Running CONFIRM");

    const confirmPayload = {
      transactionId
    };

    await axios.post(`${BASE_URL}/confirm`, confirmPayload);

    console.log("✅ Confirm sent");

    console.log("⏳ Waiting for on_confirm (driver assignment)...");

    await sleep(5000);


    console.log("\n📦 Running STATUS");

    const statusPayload = {
      transactionId
    };

    await axios.post(`${BASE_URL}/status`, statusPayload);

    console.log("✅ Status sent");

    console.log("\n🎉 FLOW 1a COMPLETED\n");

  } catch (error) {

    console.log("\n❌ FLOW FAILED");

    if (error.response) {
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }

  }
}

runFlow();