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
    // #region agent log
    globalThis.fetch&&globalThis.fetch('http://127.0.0.1:7660/ingest/c90b4339-613f-44e5-b034-2ec0c3e5f348',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'697449'},body:JSON.stringify({sessionId:'697449',runId:'run-pre-fix-2',hypothesisId:'H6',location:'server/scripts/pramaan_test_runner_new.js:run-start',message:'Pramaan runner started',data:{baseUrl:BASE_URL,searchTimeoutMs:SEARCH_TIMEOUT_MS,pollIntervalMs:POLL_INTERVAL_MS},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    console.log("\n📦 Running SEARCH");

    const search = await axios.post(`${BASE_URL}/search`, {
      latitude: Number(process.env.SEARCH_LAT || 12.9716),
      longitude: Number(process.env.SEARCH_LNG || 77.5946),
      destination: {
        latitude: Number(process.env.DEST_LAT || 12.2958),
        longitude: Number(process.env.DEST_LNG || 76.6394)
      }
    });
    const transactionId = search.data?.transactionId;
    // #region agent log
    globalThis.fetch&&globalThis.fetch('http://127.0.0.1:7660/ingest/c90b4339-613f-44e5-b034-2ec0c3e5f348',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'697449'},body:JSON.stringify({sessionId:'697449',runId:'run-pre-fix-2',hypothesisId:'H7',location:'server/scripts/pramaan_test_runner_new.js:search-response',message:'Search API responded',data:{hasTransactionId:!!transactionId,responseKeys:Object.keys(search.data||{})},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

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


    console.log("\n📦 Running TRACK");

    const trackPayload = {
      transactionId
    };

    await axios.post(`${BASE_URL}/track`, trackPayload);

    console.log("✅ Track sent");

    console.log("⏳ Waiting for on_track...");

    await sleep(5000);

    console.log("\n=======================================================");
    console.log("🎉 FLOW 1a SCRIPT EXECUTED!");
    console.log("=======================================================");
    console.log("⚠️  CRITICAL NEXT STEPS TO GET THE GREEN TICK:");
    console.log("1. Do NOT download the logs yet! Your HailO backend is now polling /status every 10 seconds.");
    console.log("2. Go back to your browser and look at the TOP of the Pramaan Dashboard.");
    console.log("3. Click the 'Participant Portal' link in the top menu bar.");
    console.log("4. Find this transaction and manually advance the ride to RIDE_ENDED (if not automatic).");
    console.log("5. Click 'Mark Payment Done'.");
    console.log("6. Only after doing this will the flow be marked as COMPLETED!");
    console.log("=======================================================\n");

  } catch (error) {
    // #region agent log
    globalThis.fetch&&globalThis.fetch('http://127.0.0.1:7660/ingest/c90b4339-613f-44e5-b034-2ec0c3e5f348',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'697449'},body:JSON.stringify({sessionId:'697449',runId:'run-pre-fix-2',hypothesisId:'H8',location:'server/scripts/pramaan_test_runner_new.js:run-error',message:'Pramaan runner failed',data:{errorMessage:error?.message||'unknown',httpStatus:error?.response?.status||null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    console.log("\n❌ FLOW FAILED");

    if (error.response) {
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }

  }
}

runFlow();