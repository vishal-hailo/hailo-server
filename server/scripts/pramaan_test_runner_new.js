import axios from "axios";

const BASE_URL = "https://api.hailone.in/ondc";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runFlow() {

  try {

    console.log("\n📦 Running SEARCH");

    const search = await axios.post(`${BASE_URL}/search`, {});

    console.log("✅ Search request sent");

    console.log("⏳ Waiting for on_search callback...");

    await sleep(5000);


    console.log("\n📦 Running SELECT");

    const selectPayload = {
      order_id: "order123"
    };

    await axios.post(`${BASE_URL}/select`, selectPayload);

    console.log("✅ Select sent");

    console.log("⏳ Waiting for on_select...");

    await sleep(5000);


    console.log("\n📦 Running INIT");

    const initPayload = {
      order_id: "order123"
    };

    await axios.post(`${BASE_URL}/init`, initPayload);

    console.log("✅ Init sent");

    console.log("⏳ Waiting for on_init...");

    await sleep(5000);


    console.log("\n📦 Running CONFIRM");

    const confirmPayload = {
      order_id: "order123"
    };

    await axios.post(`${BASE_URL}/confirm`, confirmPayload);

    console.log("✅ Confirm sent");

    console.log("⏳ Waiting for on_confirm (driver assignment)...");

    await sleep(5000);


    console.log("\n📦 Running STATUS");

    const statusPayload = {
      order_id: "order123"
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