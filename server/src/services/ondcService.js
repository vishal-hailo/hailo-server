import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ONDC_CONFIG } from '../config/config.js';
import { becknAuthService } from './becknAuth.js';
import { ondcRegistryService } from './ondcRegistryService.js';
import { getEstimate as getUberEstimate } from './uberService.js';
import { auditService } from './auditService.js';
import { geminiService } from './geminiService.js';
import Transaction from '../models/Transaction.js';
import RideHistory from '../models/RideHistory.js';

// In-memory store REMOVED (Replaced by MongoDB)
// const activeRequests = new Map();
let io; // Socket.io instance
const activeStatusPollers = new Map(); // Track periodic status polls

async function isDuplicateCallbackEvent(context = {}) {
    const transactionId = context.transaction_id;
    const messageId = context.message_id;
    const action = context.action;

    if (!transactionId || !messageId || !action) {
        return false;
    }

    const callbackEventKey = `${action}:${messageId}`;
    const updated = await Transaction.findOneAndUpdate(
        {
            transactionId,
            processedCallbackEvents: { $ne: callbackEventKey }
        },
        { $addToSet: { processedCallbackEvents: callbackEventKey } },
        { new: true }
    );

    return !updated;
}


export const ondcService = {

    setSocketIo(socketIo) {
        io = socketIo;
    },

    /**
     * search
     * Initiates a search request to the ONDC Gateway.
     * @param {Object} location - { latitude, longitude }
     */
    async search(location) {
        const transactionId = uuidv4();
        const messageId = uuidv4();
        // #region agent log
        globalThis.fetch&&globalThis.fetch('http://127.0.0.1:7660/ingest/c90b4339-613f-44e5-b034-2ec0c3e5f348',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'697449'},body:JSON.stringify({sessionId:'697449',runId:'run-pre-fix',hypothesisId:'H2',location:'server/src/services/ondcService.js:search-entry',message:'ondcService.search started',data:{transactionId,ondcVersion:ONDC_CONFIG.VERSION,ondcMock:process.env.ONDC_MOCK==='true'},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        const payload = {
            context: {
                domain: ONDC_CONFIG.DOMAIN,
                action: 'search',
                bap_id: ONDC_CONFIG.SUBSCRIBER_ID,
                bap_uri: ONDC_CONFIG.SUBSCRIBER_URL,
                location: {
                    city: { code: ONDC_CONFIG.CITY_CODE },
                    country: { code: ONDC_CONFIG.COUNTRY_CODE }
                },
                transaction_id: transactionId,
                message_id: messageId,
                timestamp: new Date().toISOString(),
                ttl: ONDC_CONFIG.TTL,
                version: ONDC_CONFIG.VERSION
            },
            message: {
                intent: {
                    fulfillment: {
                        stops: [
                            { location: { gps: `${location.latitude},${location.longitude}` }, type: "START" },
                            { location: { gps: `${location.destination?.latitude || location.latitude + 0.01},${location.destination?.longitude || location.longitude + 0.01}` }, type: "END" }
                        ]
                    },
                    payment: {
                        collected_by: "BPP",
                        tags: [
                            {
                                descriptor: { code: "BUYER_FINDER_FEES" },
                                display: false,
                                list: [{ descriptor: { code: "BUYER_FINDER_FEES_PERCENTAGE" }, value: "1" }]
                            },
                            {
                                descriptor: { code: "SETTLEMENT_TERMS" },
                                display: false,
                                list: [
                                    { descriptor: { code: "DELAY_INTEREST" }, value: "5" },
                                    { descriptor: { code: "STATIC_TERMS" }, value: "https://api.hailone.in/terms.txt" }
                                ]
                            }
                        ]
                    }
                }
            }
        };

        // Trigger background Uber fetch for comparison
        let uberEstimate = null;
        try {
            uberEstimate = await getUberEstimate(
                { latitude: location.latitude, longitude: location.longitude },
                location.destination || { latitude: location.latitude + 0.01, longitude: location.longitude + 0.01 }
            );
        } catch (err) {
            console.error('Uber estimate failed:', err.message);
        }

        // Get gateway URL
        const gatewayUrl = await ondcRegistryService.getGatewayUrl();
        // #region agent log
        globalThis.fetch&&globalThis.fetch('http://127.0.0.1:7660/ingest/c90b4339-613f-44e5-b034-2ec0c3e5f348',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'697449'},body:JSON.stringify({sessionId:'697449',runId:'run-pre-fix',hypothesisId:'H3',location:'server/src/services/ondcService.js:search-gateway-url',message:'Gateway URL resolved',data:{gatewayUrl,contextVersion:payload?.context?.version},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        // Create Auth Header
        const authHeader = await becknAuthService.createAuthorizationHeader(payload);

        try {
            // Log Outbound Request
            auditService.log({
                transactionId, messageId, action: 'search', direction: 'OUTBOUND',
                destination: 'GATEWAY', payload, headers: { Authorization: authHeader }
            });

            // Create Transaction in DB BEFORE calling Gateway to prevent race conditions with fast BPP callbacks
            await Transaction.create({
                transactionId,
                status: 'SEARCH_INITIATED',
                location,
                uberEstimate
            });

            if (process.env.ONDC_MOCK === 'true') {
                console.log('🚧 ONDC_MOCK: Skipping Gateway Call');
                // #region agent log
                globalThis.fetch&&globalThis.fetch('http://127.0.0.1:7660/ingest/c90b4339-613f-44e5-b034-2ec0c3e5f348',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'697449'},body:JSON.stringify({sessionId:'697449',runId:'run-pre-fix',hypothesisId:'H4',location:'server/src/services/ondcService.js:search-mock-skip',message:'Gateway call skipped due to ONDC_MOCK',data:{transactionId},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
            } else {
                const response = await axios.post(gatewayUrl, payload, {
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json'
                    }
                });
                // #region agent log
                globalThis.fetch&&globalThis.fetch('http://127.0.0.1:7660/ingest/c90b4339-613f-44e5-b034-2ec0c3e5f348',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'697449'},body:JSON.stringify({sessionId:'697449',runId:'run-pre-fix',hypothesisId:'H5',location:'server/src/services/ondcService.js:search-gateway-response',message:'Gateway response received',data:{ackStatus:response?.data?.message?.ack?.status||'none',hasError:!!response?.data?.error},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
                
                if (response.data?.message?.ack?.status === 'NACK') {
                    console.error('⛔ Gateway NACK:', JSON.stringify(response.data.error));
                    throw new Error(`Gateway Rejected Search: ${response.data.error?.message || 'NACK'}`);
                }
            }

            return { transactionId };

        } catch (error) {
            // #region agent log
            globalThis.fetch&&globalThis.fetch('http://127.0.0.1:7660/ingest/c90b4339-613f-44e5-b034-2ec0c3e5f348',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'697449'},body:JSON.stringify({sessionId:'697449',runId:'run-pre-fix',hypothesisId:'H5',location:'server/src/services/ondcService.js:search-error',message:'Search flow failed before ACK',data:{errorMessage:error?.message||'unknown',httpStatus:error?.response?.status||null},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            console.error('ONDC Search Failed:', error.response?.data || error.message);
            throw new Error('Failed to initiate ONDC search');
        }
    },

    /**
     * onSearch
     * Callback received from BPPs with search results (Catalog).
     */
    async onSearch(body) {
        const { context, message } = body;
        const { transaction_id } = context;
        if (await isDuplicateCallbackEvent(context)) {
            console.warn(`Duplicate callback ignored: ${context.action}:${context.message_id}`);
            return;
        }

        const transaction = await Transaction.findOne({ transactionId: transaction_id });
        if (!transaction) {
            console.warn('Received on_search for unknown transaction:', transaction_id);
            return;
        }
        const providers = message?.catalog?.providers || message?.catalog?.['bpp/providers'];

        if (providers && providers.length > 0) {
            // Normalize results
            const newResults = providers.flatMap(provider =>
                provider.items.map(item => ({
                    id: item.id,
                    providerId: provider.id,
                    providerName: provider.descriptor?.name,
                    bppId: context.bpp_id,
                    bppUri: context.bpp_uri,
                    price: parseInt(item.price?.value),
                    currency: item.price?.currency,
                    name: item.descriptor?.name,
                    fulfillmentId: item.fulfillment_ids?.[0] || item.fulfillment_id,
                    eta: Math.floor(Math.random() * 15) + 5 // Mock ETA if missing
                }))
            );

            // Process through HailO Brain
            const processedResults = await this.brainProcess(transaction, newResults);

            // Update Transaction in DB
            const updatedTransaction = await Transaction.findOneAndUpdate(
                { transactionId: transaction_id },
                { $push: { results: { $each: processedResults } } },
                { new: true }
            );

            // Real-time Update
            if (io) {
                io.emit(`search_update_${transaction_id}`, processedResults);
                console.log(`📡 Emitted ${processedResults.length} updates for ${transaction_id}`);
            }
        }
    },

    /**
     * brainProcess
     * The Intelligence Layer: Ingests data and generates AI insights
     */
    async brainProcess(transaction, newQuotes) {
        // 1. Ingest Data (Async - don't block response)
        this.ingestQuotes(transaction, newQuotes);

        // 2. Fetch Historical Context (Last 3 hours, nearby)
        // For MVP speed, we might skip this query or keep it shallow
        // let history = await RideHistory.find(...); 

        // 3. Generate Insights via Gemini
        // We'll process quotes in parallel but limit to top 3 to save tokens/time
        const enrichedQuotes = await Promise.all(newQuotes.map(async (quote, index) => {
            let tags = [];
            let insight = null;

            // Basic Heuristics (Uber comp)
            if (transaction.uberEstimate) {
                const uberPrice = (transaction.uberEstimate.priceMin + transaction.uberEstimate.priceMax) / 2;
                if (quote.price < uberPrice) {
                    const save = uberPrice - quote.price;
                    tags.push({ label: `Save ₹${Math.round(save)}`, color: 'green' });
                }
                if (quote.eta < transaction.uberEstimate.etaMinutes) {
                    tags.push({ label: 'Faster', color: 'blue' });
                }
            }

            // AI Insight (Only for top results to be fast)
            if (index < 3) {
                // Mock history for now since we just started ingesting
                const mockHistory = [
                    { price: quote.price * 1.1, timestamp: new Date(Date.now() - 3600000) },
                    { price: quote.price * 0.9, timestamp: new Date(Date.now() - 7200000) }
                ];

                insight = await geminiService.generateInsight(quote, mockHistory);
                if (insight) {
                    tags.push({ label: "✨ " + insight, color: 'purple' }); // Special AI tag
                }
            }

            return {
                ...quote,
                tags: tags,
                source: 'ONDC'
            };
        }));

        return enrichedQuotes;
    },

    /**
     * ingestQuotes
     * Save quotes to Time-Series DB
     */
    async ingestQuotes(transaction, quotes) {
        try {
            const records = quotes.map(q => ({
                timestamp: new Date(),
                location: { type: 'Point', coordinates: [transaction.location.longitude, transaction.location.latitude] },
                providerId: q.providerId,
                providerName: q.providerName,
                price: q.price,
                currency: q.currency,
                vehicleType: q.name, // Assuming name contains vehicle info often
                transactionId: transaction.transactionId
            }));

            if (records.length > 0) {
                await RideHistory.insertMany(records);
                console.log(`🧠 Brain: Ingested ${records.length} quotes.`);
            }
        } catch (err) {
            console.error('Brain Ingestion Failed:', err.message);
        }
    },

    /**
     * getResults
     * Polling method for frontend to get aggregated results for a transaction.
     */
    async getResults(transactionId) {
        const transaction = await Transaction.findOne({ transactionId });
        return transaction?.results || [];
    },

    /**
     * select
     * Selects a ride option and asks for a detailed quote.
     */
    async select(transactionId, providerId, itemId) {
        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction) throw new Error('Transaction not found');

        const item = transaction.results.find(res => res.id === itemId && res.providerId === providerId);
        if (!item) throw new Error('Item not found in search results');

        const targetBppUri = item.bppUri || 'https://pramaan.ondc.org/beta/preprod/mock';

        const messageId = uuidv4();
        const payload = {
            context: {
                domain: ONDC_CONFIG.DOMAIN,
                action: 'select',
                bap_id: ONDC_CONFIG.SUBSCRIBER_ID,
                bap_uri: ONDC_CONFIG.SUBSCRIBER_URL,
                bpp_id: item.bppId,
                bpp_uri: targetBppUri,
                location: {
                    city: { code: ONDC_CONFIG.CITY_CODE },
                    country: { code: ONDC_CONFIG.COUNTRY_CODE }
                },
                message_id: messageId,
                timestamp: new Date().toISOString(),
                transaction_id: transactionId,
                ttl: 'PT120S',
                version: ONDC_CONFIG.VERSION
            },
            message: {
                order: {
                    provider: {
                        id: providerId,
                    },
                    items: [
                        {
                            id: itemId
                        }
                    ]
                }
            }
        };

        const authHeader = await becknAuthService.createAuthorizationHeader(payload);

        try {
            // Log Outbound Request
            auditService.log({
                transactionId, messageId, action: 'select', direction: 'OUTBOUND',
                destination: item.bppId, payload, headers: { Authorization: authHeader }
            });

            // Update Transaction in DB BEFORE calling BPP
            await Transaction.updateOne(
                { transactionId },
                {
                    status: 'SELECT_INITIATED',
                    selectedItem: item
                }
            );

            if (process.env.ONDC_MOCK === 'true') {
                console.log('🚧 ONDC_MOCK: Skipping Select Call to BPP');
                setTimeout(() => this.simulateOnSelect(transactionId, item), 1000);
            } else {
                const response = await axios.post(`${targetBppUri}/select`, payload, {
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.data?.message?.ack?.status === 'NACK') {
                    console.error('⛔ BPP NACK:', JSON.stringify(response.data.error));
                    throw new Error(`BPP Rejected Select: ${response.data.error?.message || 'NACK'}`);
                }
            }

            return { messageId };

        } catch (error) {
            console.error('\n❌ ONDC Select Failed:');
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.error('Message:', error.message);
            }
            throw new Error('Failed to initiate ONDC select');
        }
    },

    /**
     * onSelect
     * Callback received from BPP with detailed quote.
     */
    async onSelect(body) {
        const { context, message } = body;
        const { transaction_id } = context;
        if (await isDuplicateCallbackEvent(context)) {
            console.warn(`Duplicate callback ignored: ${context.action}:${context.message_id}`);
            return;
        }

        if (message.order && message.order.quote) {
            const quote = message.order.quote;

            await Transaction.updateOne(
                { transactionId: transaction_id },
                {
                    status: 'QUOTE_RECEIVED',
                    quote: quote
                }
            );

            if (io) {
                io.emit(`select_update_${transaction_id}`, quote);
                console.log(`📡 Emitted Quote update for ${transaction_id}`);
            }
        } else if (message.order && message.order.error) {
            console.error('ONDC Provider returned error:', message.order.error);
            await Transaction.updateOne({ transactionId: transaction_id }, { status: 'SELECT_ERROR' });
            if (io) io.emit(`select_error_${transaction_id}`, message.order.error);
        }
    },

    /**
     * init
     * Initialize the order (Billing/Fulfillment).
     */
    async init(transactionId, passengerName, passengerPhone) {
        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction || !transaction.selectedItem) throw new Error('Transaction or Selected Item not found');

        // Save passenger details to transaction (with defaults)
        transaction.passengerName = passengerName || transaction.passengerName || 'HailO User';
        transaction.passengerPhone = passengerPhone || transaction.passengerPhone || '9999999999';
        await transaction.save();

        const { selectedItem } = transaction;
        const messageId = uuidv4();

        const payload = {
            context: {
                domain: ONDC_CONFIG.DOMAIN,
                action: 'init',
                bap_id: ONDC_CONFIG.SUBSCRIBER_ID,
                bap_uri: ONDC_CONFIG.SUBSCRIBER_URL,
                bpp_id: selectedItem.bppId,
                bpp_uri: selectedItem.bppUri,
                location: {
                    city: { code: ONDC_CONFIG.CITY_CODE },
                    country: { code: ONDC_CONFIG.COUNTRY_CODE }
                },
                message_id: messageId,
                timestamp: new Date().toISOString(),
                transaction_id: transactionId,
                ttl: ONDC_CONFIG.TTL, // P15M in some v2 specs, but TTL is fine for now
                version: ONDC_CONFIG.VERSION
            },
            message: {
                order: {
                    provider: { id: selectedItem.providerId },
                    items: [{ 
                        id: selectedItem.id
                    }],
                    // TRV10 spec: billing requires only `name`
                    billing: {
                        name: transaction.passengerName || "HailO User"
                    },
                    // TRV10 spec: fulfillments is an ARRAY with stops (not fulfillment.start/end)
                    fulfillments: [
                        {
                            id: selectedItem.fulfillmentId || "F1",
                            customer: {
                                contact: { phone: transaction.passengerPhone || "9999999999" },
                                person: { name: transaction.passengerName || "HailO User" }
                            },
                            stops: [
                                {
                                    type: "START",
                                    location: { gps: `${transaction.location.latitude},${transaction.location.longitude}` }
                                },
                                ...(transaction.location.destination ? [{
                                    type: "END",
                                    location: { gps: `${transaction.location.destination.latitude},${transaction.location.destination.longitude}` }
                                }] : [])
                            ]
                        }
                    ],
                    // TRV10 spec: payments is an ARRAY; collected_by BPP (for seller-collected), status NOT-PAID at init
                    payments: [
                        {
                            collected_by: "BPP",
                            status: "NOT-PAID",
                            type: "ON-FULFILLMENT",
                            tags: [
                                {
                                    descriptor: { code: "BUYER_FINDER_FEES" },
                                    display: false,
                                    list: [
                                        { descriptor: { code: "BUYER_FINDER_FEES_PERCENTAGE" }, value: "1" }
                                    ]
                                },
                                {
                                    descriptor: { code: "SETTLEMENT_TERMS" },
                                    display: false,
                                    list: [
                                        { descriptor: { code: "SETTLEMENT_WINDOW" }, value: "PT60M" },
                                        { descriptor: { code: "SETTLEMENT_BASIS" }, value: "DELIVERY" },
                                        { descriptor: { code: "SETTLEMENT_TYPE" }, value: "UPI" },
                                        { descriptor: { code: "MANDATORY_ARBITRATION" }, value: "true" },
                                        { descriptor: { code: "COURT_JURISDICTION" }, value: "New Delhi" },
                                        { descriptor: { code: "DELAY_INTEREST" }, value: "5" },
                                        { descriptor: { code: "STATIC_TERMS" }, value: "https://hailone.in/static-terms" }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        };

        const authHeader = await becknAuthService.createAuthorizationHeader(payload);

        try {
            // Log Outbound Request
            auditService.log({
                transactionId, messageId, action: 'init', direction: 'OUTBOUND',
                destination: selectedItem.bppId, payload, headers: { Authorization: authHeader }
            });

            if (process.env.ONDC_MOCK === 'true') {
                console.log('🚧 ONDC_MOCK: Skipping Init Call to BPP');
                setTimeout(() => this.simulateOnInit(transactionId, selectedItem), 1000);
            } else {
                await axios.post(`${selectedItem.bppUri}/init`, payload, {
                    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
                });
            }

            await Transaction.updateOne({ transactionId }, { status: 'INIT_INITIATED' });
            return { messageId };

        } catch (error) {
            console.error('ONDC Init Failed:', error.response?.data || error.message);
            throw new Error('Failed to initiate ONDC init');
        }
    },

    /**
     * onInit
     */
    async onInit(body) {
        const { context, message } = body;
        const { transaction_id } = context;
        if (await isDuplicateCallbackEvent(context)) {
            console.warn(`Duplicate callback ignored: ${context.action}:${context.message_id}`);
            return;
        }

        if (message.order) {
            await Transaction.updateOne(
                { transactionId: transaction_id },
                {
                    status: 'INIT_COMPLETED',
                    initOrder: message.order
                }
            );

            if (io) {
                io.emit(`init_update_${transaction_id}`, message.order);
                console.log(`📡 Emitted Init update for ${transaction_id}`);
            }
        }
    },

    /**
     * confirm
     * Confirm the booking.
     */
    async confirm(transactionId) {
        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction || !transaction.initOrder) throw new Error('Transaction or Init Order not found');

        const messageId = uuidv4();
        const { initOrder, selectedItem } = transaction;

        const payload = {
            context: {
                domain: ONDC_CONFIG.DOMAIN,
                action: 'confirm',
                bap_id: ONDC_CONFIG.SUBSCRIBER_ID,
                bap_uri: ONDC_CONFIG.SUBSCRIBER_URL,
                bpp_id: selectedItem.bppId,
                bpp_uri: selectedItem.bppUri,
                location: {
                    city: { code: ONDC_CONFIG.CITY_CODE },
                    country: { code: ONDC_CONFIG.COUNTRY_CODE }
                },
                message_id: messageId,
                timestamp: new Date().toISOString(),
                transaction_id: transactionId,
                ttl: ONDC_CONFIG.TTL,
                version: ONDC_CONFIG.VERSION
            },
            message: {
                order: {
                    provider: { id: selectedItem.providerId },
                    items: transaction.initOrder?.items?.map(item => ({
                        id: item.id
                    })) || [{ 
                        id: selectedItem.id
                    }],
                    billing: initOrder.billing,
                    // TRV10 spec: BPP strictly rejects 'tags', 'state', or 'agent' in the BAP's confirm request fulfillments.
                    fulfillments: (initOrder.fulfillments || initOrder.fulfillment)
                        ? (initOrder.fulfillments || initOrder.fulfillment).map(f => {
                            const { tags, state, agent, ...allowedFields } = f;
                            return allowedFields;
                        })
                        : [
                            {
                                id: selectedItem.fulfillmentId || "F1",
                                customer: {
                                    contact: { phone: transaction.passengerPhone || "9999999999" },
                                    person: { name: transaction.passengerName || "HailO User" }
                                },
                                stops: [
                                    {
                                        type: "START",
                                        location: { gps: `${transaction.location.latitude},${transaction.location.longitude}` }
                                    },
                                    ...(transaction.location.destination ? [{
                                        type: "END",
                                        location: { gps: `${transaction.location.destination.latitude},${transaction.location.destination.longitude}` }
                                    }] : [])
                                ]
                            }
                        ],
                    // TRV10 spec: confirm must strictly exclude cancellation_terms if the validator rejects it.
                    // TRV10 spec: confirm uses status=NOT-PAID for on-fulfillment (collected by driver)
                    payments: [
                        {
                            collected_by: "BPP",
                            id: initOrder.payments?.[0]?.id || "PA1",
                            params: Object.fromEntries(
                                Object.entries({
                                    ...(initOrder.payments?.[0]?.params || {})
                                }).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
                            ),
                            status: "NOT-PAID",
                            type: "ON-FULFILLMENT",
                            // Mirror the settlement terms exactly as provided by the BPP in on_init
                            tags: (() => {
                                const bppPayment = initOrder.payments?.[0];
                                if (!bppPayment?.tags) return [];
                                
                                // Standard ONDC mirroring: return tags as received.
                                // We ensure the BAP doesn't override critical BPP terms like DELAY_INTEREST or STATIC_TERMS.
                                return bppPayment.tags;
                            })()
                        }
                    ]
                }
            }
        };

        const authHeader = await becknAuthService.createAuthorizationHeader(payload);

        try {
            // Log Outbound Request
            auditService.log({
                transactionId, messageId, action: 'confirm', direction: 'OUTBOUND',
                destination: selectedItem.bppId, payload, headers: { Authorization: authHeader }
            });

            if (process.env.ONDC_MOCK === 'true') {
                console.log('🚧 ONDC_MOCK: Skipping Confirm Call to BPP');
                setTimeout(() => this.simulateOnConfirm(transactionId), 1000);
            } else {
                await axios.post(`${selectedItem.bppUri}/confirm`, payload, {
                    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
                });
            }

            await Transaction.updateOne({ transactionId }, { status: 'CONFIRM_INITIATED' });
            return { messageId };

        } catch (error) {
            console.error('ONDC Confirm Failed:', error.response?.data || error.message);
            throw new Error('Failed to initiate ONDC confirm');
        }
    },

    /**
     * onConfirm
     */
    async onConfirm(body) {
        const { context, message } = body;
        const { transaction_id } = context;
        if (await isDuplicateCallbackEvent(context)) {
            console.warn(`Duplicate callback ignored: ${context.action}:${context.message_id}`);
            return;
        }

        if (message.order) {
            await Transaction.updateOne(
                { transactionId: transaction_id },
                {
                    status: 'CONFIRMED',
                    confirmedOrder: message.order
                }
            );

            if (io) {
                io.emit(`confirm_update_${transaction_id}`, message.order);
                console.log(`📡 Emitted Confirm update (BOOKING SUCCESS) for ${transaction_id}`);
            }

            // Start periodic status polling for ONDC Pramaan Certification
            if (ONDC_CONFIG.SUBSCRIBER_ID.includes('api.hailone.in')) {
                this.startStatusPolling(transaction_id);
            }
        }
    },

    /**
     * startStatusPolling
     * Helper to poll status periodically until terminal state.
     */
    async startStatusPolling(transactionId) {
        if (activeStatusPollers.has(transactionId)) return;

        console.log(`🔄 Starting periodic status polling for ${transactionId}...`);
        const intervalId = setInterval(async () => {
            try {
                const transaction = await Transaction.findOne({ transactionId });
                if (!transaction || ['COMPLETED', 'CANCELLED'].includes(transaction.status)) {
                    console.log(`⏹️ Stopping periodic status polling for ${transactionId} (Status: ${transaction?.status || 'NOT_FOUND'})`);
                    clearInterval(intervalId);
                    activeStatusPollers.delete(transactionId);
                    return;
                }

                await this.status(transactionId);
                console.log(`📡 Periodic status poll sent for ${transactionId}`);
            } catch (err) {
                console.error(`❌ Periodic status poll failed for ${transactionId}:`, err.message);
            }
        }, 10000); // 10 seconds

        activeStatusPollers.set(transactionId, intervalId);
    },

    /**
     * status
     * Poll for the latest status of the order.
     */
    async status(transactionId) {
        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction || !transaction.confirmedOrder) throw new Error('Transaction or Confirmed Order not found');

        const { selectedItem, confirmedOrder } = transaction;
        const messageId = uuidv4();

        const payload = {
            context: {
                domain: ONDC_CONFIG.DOMAIN,
                action: 'status',
                bap_id: ONDC_CONFIG.SUBSCRIBER_ID,
                bap_uri: ONDC_CONFIG.SUBSCRIBER_URL,
                bpp_id: selectedItem.bppId,
                bpp_uri: selectedItem.bppUri,
                location: {
                    city: { code: ONDC_CONFIG.CITY_CODE },
                    country: { code: ONDC_CONFIG.COUNTRY_CODE }
                },
                message_id: messageId,
                timestamp: new Date().toISOString(),
                transaction_id: transactionId,
                ttl: ONDC_CONFIG.TTL,
                version: ONDC_CONFIG.VERSION
            },
            message: {
                order_id: confirmedOrder.id
            }
        };

        const authHeader = await becknAuthService.createAuthorizationHeader(payload);

        try {
            // Log Outbound Request
            auditService.log({
                transactionId, messageId, action: 'status', direction: 'OUTBOUND',
                destination: selectedItem.bppId, payload, headers: { Authorization: authHeader }
            });

            if (process.env.ONDC_MOCK === 'true') {
                console.log('🚧 ONDC_MOCK: Skipping Status Call to BPP');
                // Trigger a mock status update logic
                this.simulateOnStatus(transaction);
            } else {
                await axios.post(`${selectedItem.bppUri}/status`, payload, {
                    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
                });
            }

            return { messageId };

        } catch (error) {
            console.error('ONDC Status Failed:', error.response?.data || error.message);
            throw new Error('Failed to initiate ONDC status check');
        }
    },

    /**
     * onStatus
     * Callback with status updates.
     */
    async onStatus(body) {
        const { context, message } = body;
        const { transaction_id } = context;
        if (await isDuplicateCallbackEvent(context)) {
            console.warn(`Duplicate callback ignored: ${context.action}:${context.message_id}`);
            return;
        }

        const transaction = await Transaction.findOne({ transactionId: transaction_id });
        if (!transaction) {
            console.error(`❌ Transaction ${transaction_id} not found in onStatus callback`);
            return;
        }

        if (message.order) {
            const order = message.order;
            // TRV10 spec: state is inside fulfillments[0].state.descriptor.code
            const fulfillment = order.fulfillments?.[0];
            const stateCode = fulfillment?.state?.descriptor?.code || 'UNKNOWN';

            // TRV10 spec: agent details inside fulfillments[0].agent
            const agent = fulfillment?.agent;

            // TRV10 spec: driver location is tracked via on_track (GPS), but on_status
            // may include agent's current location in stops or via the tracking URL.
            // Emit the full fulfillment state + agent info to the frontend.
            const updateData = {
                fulfillmentStatus: stateCode,
                agent: agent ? {
                    name: agent.person?.name,
                    phone: agent.contact?.phone
                } : null,
                vehicle: fulfillment?.vehicle || null,
                order
            };

            const isCancelled = stateCode === 'RIDE_CANCELLED' || stateCode === 'CANCELLED';
            // ⚠️ BUG FIX: RIDE_ENDED is NOT the same as COMPLETED.
            // COMPLETED is a distinct state the BPP sends AFTER the Pramaan portal's
            // "Mark Payment Done" action triggers an on_update + final status poll.
            // If we treat RIDE_ENDED as COMPLETED here, the background poller stops
            // and we never catch the real COMPLETED on_status. Keep polling until COMPLETED.
            const isCompleted = stateCode === 'COMPLETED';
            const isRideEnded = stateCode === 'RIDE_ENDED';

            // Only stop the poller when BPP actually confirms COMPLETED state.
            // RIDE_ENDED leaves the poller running so it picks up the final COMPLETED.
            let finalStatus;
            if (isCancelled) {
                finalStatus = 'CANCELLED';
            } else if (isCompleted) {
                finalStatus = 'COMPLETED';
            } else if (isRideEnded) {
                // Pre-completion: ride ended but payment not yet marked done.
                // Keep a distinct DB status so the poller keeps running.
                finalStatus = 'RIDE_ENDED';
            } else {
                finalStatus = order.status || 'CONFIRMED';
            }

            await Transaction.updateOne(
                { transactionId: transaction_id },
                {
                    status: finalStatus,
                    fulfillmentStatus: stateCode,
                    confirmedOrder: {
                        ...order,
                        status: finalStatus // Ensure we store the synced status
                    }
                }
            );

            if (io) {
                io.emit(`status_update_${transaction_id}`, {
                    ...updateData,
                    status: finalStatus
                });
                console.log(`📡 Emitted Status update for ${transaction_id}: ${stateCode} (Status: ${finalStatus})`);
            }

            // ─── OTP Claim: RIDE_ARRIVED_PICKUP → trigger RIDE_STARTED ───────────
            // The Mock BPP will NOT advance past RIDE_ARRIVED_PICKUP until the BAP
            // sends an /update with the OTP authorization status set to CLAIMED.
            if (stateCode === 'RIDE_ARRIVED_PICKUP' && transaction.fulfillmentStatus !== 'RIDE_ARRIVED_PICKUP') {
                const otpToken = fulfillment?.stops?.find(s => s.type === 'START')?.authorization?.token;
                const fulfillmentId = fulfillment?.id;
                if (otpToken && fulfillmentId) {
                    console.log(`🔑 RIDE_ARRIVED_PICKUP detected for ${transaction_id}. Sending OTP claim UPDATE in 2s (token: ${otpToken})...`);
                    setTimeout(async () => {
                        try {
                            const otpUpdateDetails = {
                                fulfillments: [{
                                    id: fulfillmentId,
                                    stops: [{
                                        type: 'START',
                                        authorization: {
                                            type: 'OTP',
                                            token: otpToken,
                                            status: 'CLAIMED'
                                        }
                                    }]
                                }]
                            };
                            await ondcService.update(transaction_id, otpUpdateDetails);
                            console.log(`✅ OTP claim UPDATE sent for ${transaction_id}`);
                        } catch (err) {
                            console.error(`❌ OTP claim UPDATE failed for ${transaction_id}:`, err.message);
                        }
                    }, 2000);
                } else {
                    console.warn(`⚠️ RIDE_ARRIVED_PICKUP but no OTP token found in fulfillment stops for ${transaction_id}`);
                }
            }

            if (isRideEnded) {
                // RIDE_ENDED state: the background poller is still running (because DB status is 'RIDE_ENDED',
                // not 'COMPLETED'). The Pramaan portal's "Mark Payment Done" button will trigger:
                //   BPP → on_update (unsolicited, with recomputed charges)
                //   BAP sends /status
                //   BPP → on_status with COMPLETED
                // Our onUpdate handler will send the /status call. Nothing extra needed here.
                console.log(`⏳ [${transaction_id}] RIDE_ENDED – waiting for portal "Mark Payment Done" → on_update → COMPLETED`);
            }

            if (isCompleted) {
                // Ride is truly done. Stop the interval poller.
                const pollerInterval = activeStatusPollers.get(transaction_id);
                if (pollerInterval) {
                    clearInterval(pollerInterval);
                    activeStatusPollers.delete(transaction_id);
                    console.log(`⏹️ [${transaction_id}] COMPLETED – stopped background status poller.`);
                }
            }
        }
    },

    /**
     * update
     * Triggered by BAP to update order attributes (e.g. for Flow 6 soft cancellation)
     */
    async update(transactionId, updateDetails = {}) {
        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction) throw new Error('Transaction not found');

        const messageId = uuidv4();
        const selectedItem = transaction.selectedItem;

        const payload = {
            context: {
                domain: ONDC_CONFIG.DOMAIN,
                action: 'update',
                bap_id: ONDC_CONFIG.SUBSCRIBER_ID,
                bap_uri: ONDC_CONFIG.SUBSCRIBER_URL,
                bpp_id: selectedItem.bppId,
                bpp_uri: selectedItem.bppUri,
                location: {
                    city: { code: ONDC_CONFIG.CITY_CODE },
                    country: { code: ONDC_CONFIG.COUNTRY_CODE }
                },
                message_id: messageId,
                timestamp: new Date().toISOString(),
                transaction_id: transactionId,
                ttl: ONDC_CONFIG.TTL,
                version: ONDC_CONFIG.VERSION
            },
            message: {
                update_target: "order",
                order: {
                    id: transaction.confirmedOrder?.id,
                    ...updateDetails
                }
            }
        };

        const authHeader = await becknAuthService.createAuthorizationHeader(payload);
        const targetBppUri = selectedItem.bppUri;

        try {
            auditService.log({
                transactionId, messageId, action: 'update', direction: 'OUTBOUND',
                payload, headers: { Authorization: authHeader }
            });

            await Transaction.updateOne({ transactionId }, { status: 'UPDATE_INITIATED' });

            const response = await axios.post(`${targetBppUri}/update`, payload, {
                headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
            });

            return { messageId, ack: response.data?.message?.ack };
        } catch (error) {
            console.error('Update Request Failed:', error.message);
            throw error;
        }
    },

    /**
     * onUpdate
     * Callback for /update
     */
    async onUpdate(body) {
        const { context, message } = body;
        const { transaction_id } = context;
        if (await isDuplicateCallbackEvent(context)) {
            console.warn(`Duplicate callback ignored: ${context.action}:${context.message_id}`);
            return;
        }

        if (message.order) {
            const order = message.order;
            const stateCode = order.fulfillments?.[0]?.state?.descriptor?.code;
            const paymentStatus = order.payments?.[0]?.status;

            // Sync status if it indicates terminal cancellation
            const isCancelled = stateCode === 'CANCELLED' || stateCode === 'RIDE_CANCELLED';
            const finalStatus = isCancelled ? 'CANCELLED' : 'UPDATE_COMPLETED';

            await Transaction.updateOne(
                { transactionId: transaction_id },
                {
                    status: finalStatus,
                    confirmedOrder: order,
                    fulfillmentStatus: stateCode || 'UPDATED'
                }
            );

            if (io) io.emit(`update_callback_${transaction_id}`, order);

            // ⚠️ BUG FIX: After receiving BPP's unsolicited on_update (triggered by
            // "Mark Payment Done" on the Pramaan portal), we MUST send a /status call.
            // The spec flow is: on_update (BPP→BAP) → status (BAP→BPP) → on_status COMPLETED
            // Without this /status call, the BPP never sends the final COMPLETED on_status.
            if (!isCancelled) {
                console.log(`📬 [${transaction_id}] Received on_update (state: ${stateCode}, payment: ${paymentStatus}). Sending /status to get final COMPLETED...`);
                setTimeout(async () => {
                    try {
                        await ondcService.status(transaction_id);
                        console.log(`✅ [${transaction_id}] /status sent after on_update`);
                    } catch (err) {
                        console.error(`❌ [${transaction_id}] /status after on_update failed:`, err.message);
                    }
                }, 2000); // 2s delay to let BPP settle
            }
        }
    },

    /**
     * rating
     * User submits a rating for the trip
     */
    async rating(transactionId, ratingValue) {
        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction) throw new Error('Transaction not found');

        const messageId = uuidv4();
        const selectedItem = transaction.selectedItem;

        const payload = {
            context: {
                domain: ONDC_CONFIG.DOMAIN,
                action: 'rating',
                bap_id: ONDC_CONFIG.SUBSCRIBER_ID,
                bap_uri: ONDC_CONFIG.SUBSCRIBER_URL,
                bpp_id: selectedItem.bppId,
                bpp_uri: selectedItem.bppUri,
                location: {
                    city: { code: ONDC_CONFIG.CITY_CODE },
                    country: { code: ONDC_CONFIG.COUNTRY_CODE }
                },
                message_id: messageId,
                timestamp: new Date().toISOString(),
                transaction_id: transactionId,
                ttl: ONDC_CONFIG.TTL,
                version: ONDC_CONFIG.VERSION
            },
            message: {
                rating: {
                    id: transaction.confirmedOrder?.id || transactionId,
                    value: ratingValue.toString(),
                    category: 'FULFILLMENT'
                }
            }
        };

        const authHeader = await becknAuthService.createAuthorizationHeader(payload);
        const targetBppUri = selectedItem.bppUri;

        try {
            auditService.log({
                transactionId, messageId, action: 'rating', direction: 'OUTBOUND',
                payload, headers: { Authorization: authHeader }
            });

            const response = await axios.post(`${targetBppUri}/rating`, payload, {
                headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
            });

            await Transaction.updateOne({ transactionId }, { status: 'RATED' });

            return { messageId, ack: response.data?.message?.ack };
        } catch (error) {
            console.error('Rating Submission Failed:', error.message);
            throw error;
        }
    },

    /**
     * onRating
     */
    async onRating(body) {
        const { context, message } = body;
        if (await isDuplicateCallbackEvent(context)) {
            console.warn(`Duplicate callback ignored: ${context.action}:${context.message_id}`);
            return;
        }
        console.log(`⭐ Rating ACK received for ${context.transaction_id}`);
        if (io) io.emit(`rating_ack_${context.transaction_id}`, message);
    },

    /**
     * track
     * Request live GPS tracking for a confirmed ride.
     */
    async track(transactionId) {
        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction || !transaction.confirmedOrder) throw new Error('Transaction or Confirmed Order not found');

        const { selectedItem, confirmedOrder } = transaction;
        const messageId = uuidv4();

        const payload = {
            context: {
                domain: ONDC_CONFIG.DOMAIN,
                action: 'track',
                bap_id: ONDC_CONFIG.SUBSCRIBER_ID,
                bap_uri: ONDC_CONFIG.SUBSCRIBER_URL,
                bpp_id: selectedItem.bppId,
                bpp_uri: selectedItem.bppUri,
                location: {
                    city: { code: ONDC_CONFIG.CITY_CODE },
                    country: { code: ONDC_CONFIG.COUNTRY_CODE }
                },
                message_id: messageId,
                timestamp: new Date().toISOString(),
                transaction_id: transactionId,
                ttl: ONDC_CONFIG.TTL,
                version: ONDC_CONFIG.VERSION
            },
            message: {
                // TRV10 spec: track only needs the order_id
                order_id: confirmedOrder.id
            }
        };

        const authHeader = await becknAuthService.createAuthorizationHeader(payload);

        try {
            auditService.log({
                transactionId, messageId, action: 'track', direction: 'OUTBOUND',
                destination: selectedItem.bppId, payload, headers: { Authorization: authHeader }
            });

            if (process.env.ONDC_MOCK === 'true') {
                console.log('🚧 ONDC_MOCK: Skipping Track Call to BPP');
            } else {
                const response = await axios.post(`${selectedItem.bppUri}/track`, payload, {
                    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
                });
                if (response.data?.message?.ack?.status === 'NACK') {
                    throw new Error(`BPP Rejected Track: ${response.data.error?.message || 'NACK'}`);
                }
            }

            return { messageId };
        } catch (error) {
            console.error('ONDC Track Failed:', error.response?.data || error.message);
            throw new Error('Failed to request ONDC tracking');
        }
    },

    /**
     * onTrack
     * Callback from BPP with live GPS tracking info.
     */
    async onTrack(body) {
        const { context, message } = body;
        const { transaction_id } = context;
        if (await isDuplicateCallbackEvent(context)) {
            console.warn(`Duplicate callback ignored: ${context.action}:${context.message_id}`);
            return;
        }

        // TRV10 spec: message.tracking.location.gps = "lat, lng"
        const tracking = message?.tracking;
        if (tracking) {
            const gps = tracking.location?.gps;
            if (gps) {
                const [lat, lng] = gps.split(',').map(s => parseFloat(s.trim()));
                await Transaction.updateOne(
                    { transactionId: transaction_id },
                    { driverLocation: { latitude: lat, longitude: lng, updatedAt: new Date() } }
                );
            }

            if (io) {
                io.emit(`track_update_${transaction_id}`, {
                    status: tracking.status, // 'active' or 'inactive'
                    location: tracking.location,
                    url: tracking.url // some BPPs may provide a tracking URL instead
                });
                console.log(`📡 Emitted Track update for ${transaction_id}`);
            }
        }
    },

    /**
     * cancel
     * Cancel the ride.
     * @param {String} transactionId
     * @param {String} reasonCode - e.g., "001"
     */
    async cancel(transactionId, reasonCode = "001") {
        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction || !transaction.confirmedOrder) throw new Error('Transaction or Confirmed Order not found');

        const { selectedItem, confirmedOrder } = transaction;
        const messageId = uuidv4();

        const payload = {
            context: {
                domain: ONDC_CONFIG.DOMAIN,
                action: 'cancel',
                bap_id: ONDC_CONFIG.SUBSCRIBER_ID,
                bap_uri: ONDC_CONFIG.SUBSCRIBER_URL,
                bpp_id: selectedItem.bppId,
                bpp_uri: selectedItem.bppUri,
                location: {
                    city: { code: ONDC_CONFIG.CITY_CODE },
                    country: { code: ONDC_CONFIG.COUNTRY_CODE }
                },
                message_id: messageId,
                timestamp: new Date().toISOString(),
                transaction_id: transactionId,
                ttl: ONDC_CONFIG.TTL,
                version: ONDC_CONFIG.VERSION
            },
            message: {
                order_id: confirmedOrder.id,
                cancellation_reason_id: reasonCode
            }
        };

        const authHeader = await becknAuthService.createAuthorizationHeader(payload);

        try {
            auditService.log({
                transactionId, messageId, action: 'cancel', direction: 'OUTBOUND',
                destination: selectedItem.bppId, payload, headers: { Authorization: authHeader }
            });

            if (process.env.ONDC_MOCK === 'true') {
                console.log('🚧 ONDC_MOCK: Skipping Cancel Call');
                this.simulateOnCancel(transactionId);
            } else {
                await axios.post(`${selectedItem.bppUri}/cancel`, payload, {
                    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
                });
            }

            return { messageId };

        } catch (error) {
            console.error('ONDC Cancel Failed:', error.message);
            throw new Error('Failed to initiate cancellation');
        }
    },

    /**
     * onCancel
     * Callback with cancellation confirmation.
     */
    async onCancel(body) {
        const { context, message } = body;
        const { transaction_id } = context;
        if (await isDuplicateCallbackEvent(context)) {
            console.warn(`Duplicate callback ignored: ${context.action}:${context.message_id}`);
            return;
        }

        if (message.order) {
            const order = message.order;
            const fulfillment = order.fulfillments?.[0];
            const stateCode = fulfillment?.state?.descriptor?.code || 'CANCELLED';

            await Transaction.updateOne(
                { transactionId: transaction_id },
                {
                    status: 'CANCELLED',
                    fulfillmentStatus: stateCode,
                    confirmedOrder: {
                        ...order,
                        status: 'CANCELLED'
                    }
                }
            );

            if (io) {
                io.emit(`status_update_${transaction_id}`, {
                    state: 'CANCELLED',
                    order: message.order
                });
                console.log(`📡 Emitted Cancel update for ${transaction_id}`);
            }
        }
    },


    // Helper to simulate on_select in mock mode
    // Helper to simulate on_select in mock mode
    async simulateOnSelect(transactionId, item) {
        const quote = {
            price: { value: item.price, currency: item.currency },
            breakup: [
                { title: 'Base Fare', price: { value: (item.price * 0.8).toFixed(2), currency: item.currency } },
                { title: 'Taxes', price: { value: (item.price * 0.2).toFixed(2), currency: item.currency } }
            ],
            ttl: "PT15M"
        };

        await Transaction.updateOne(
            { transactionId },
            {
                status: 'QUOTE_RECEIVED',
                quote: quote
            }
        );

        if (io) {
            io.emit(`select_update_${transactionId}`, quote);
            console.log(`🚧 MOCK: Emitted Quote update for ${transactionId}`);
        }
    },

    async simulateOnInit(transactionId, item) {
        const mockOrder = {
            provider: { id: item.providerId },
            items: [{ id: item.id }],
            quote: { price: { value: item.price, currency: item.currency } },
            payment: { url: "https://mock-payment.com", status: "NOT-PAID" },
            billing: {
                name: "Vishal Rao",
                phone: "9988776655",
                email: "vishal@example.com",
                address: {
                    door: "123",
                    name: "Home",
                    building: "Apartments",
                    street: "Main St",
                    city: "Mumbai",
                    state: "Maharashtra",
                    country: "IND",
                    area_code: "400001"
                }
            },
            fulfillment: {
                type: "RIDE",
                start: { location: { gps: "19.0760,72.8777" } },
                end: { location: { gps: "19.2183,72.9781" } }
            }
        };

        await Transaction.updateOne(
            { transactionId },
            {
                status: 'INIT_COMPLETED',
                initOrder: mockOrder
            }
        );

        if (io) {
            io.emit(`init_update_${transactionId}`, mockOrder);
            console.log(`🚧 MOCK: Emitted Init update for ${transactionId}`);
        }
    },

    async simulateOnConfirm(transactionId) {
        const mockOrder = {
            id: `ORDER_${Math.floor(Math.random() * 10000)}`,
            state: "Confirmed",
            fulfillment: {
                state: { descriptor: { code: "AGENT-ASSIGNED" } },
                tracking: true,
                start: { authorization: { token: "1234" } }, // Ride OTP
                driver: { name: "Ramesh Kumar", phone: "9876543210", vehicle: "MH01AB1234" }
            }
        };

        await Transaction.updateOne(
            { transactionId },
            {
                status: 'CONFIRMED',
                confirmedOrder: mockOrder,
                fulfillmentStatus: 'AGENT-ASSIGNED'
            }
        );

        if (io) {
            io.emit(`confirm_update_${transactionId}`, mockOrder);
            console.log(`🚧 MOCK: Emitted Confirm update for ${transactionId}`);
        }
    },

    // Simulate driver movement
    async simulateOnStatus(transaction) {
        // Logic: Move driver closer to pickup or dropoff based on state
        const { location, driverLocation, fulfillmentStatus } = transaction; // Add fulfillmentStatus to destructure if needed, or query from DB

        // Simple distinct logic for demo:
        // 1. If 'AGENT-ASSIGNED', move to 'RIDE-STARTED'
        // 2. If 'RIDE-STARTED', move towards destination.
        // 3. If close, 'COMPLETED'.

        let currentStatus = fulfillmentStatus || 'AGENT-ASSIGNED';
        let nextStatus = currentStatus;

        let currentLat = driverLocation?.latitude || location.latitude - 0.01;
        let currentLng = driverLocation?.longitude || location.longitude - 0.01;
        let newLat = currentLat;
        let newLng = currentLng;

        // Randomly progress status for demo speed
        if (currentStatus === 'AGENT-ASSIGNED' || currentStatus === 'PENDING') {
            nextStatus = 'RIDE-STARTED';
        } else if (currentStatus === 'RIDE-STARTED') {
            // Move
            newLat = currentLat + (Math.random() * 0.005);
            newLng = currentLng + (Math.random() * 0.005);

            // Random chance to complete
            if (Math.random() > 0.7) {
                nextStatus = 'COMPLETED';
            }
        }

        const mockStatusBody = {
            context: { transaction_id: transaction.transactionId },
            message: {
                order: {
                    state: nextStatus === 'COMPLETED' ? 'Completed' : 'In-Progress',
                    fulfillment: {
                        state: { descriptor: { code: nextStatus } },
                        start: {
                            location: {
                                gps: `${newLat.toFixed(6)},${newLng.toFixed(6)}`
                            }
                        }
                    }
                }
            }
        };

        // Call our own handler
        await this.onStatus(mockStatusBody);
        console.log(`🚧 MOCK: Simulated driver update to ${nextStatus} at ${newLat}, ${newLng}`);
    },

    async simulateOnCancel(transactionId) {
        const transaction = await Transaction.findOne({ transactionId });
        if (!transaction) return;

        const mockCancelBody = {
            context: { transaction_id: transactionId, action: 'on_cancel' },
            message: {
                order: {
                    ...transaction.confirmedOrder,
                    state: "Cancelled",
                    fulfillment: {
                        ...transaction.confirmedOrder.fulfillment,
                        state: { descriptor: { code: "CANCELLED" } }
                    }
                }
            }
        };

        // Simulate network delay
        setTimeout(() => {
            this.onCancel(mockCancelBody);
            console.log(`🚧 MOCK: Simulated cancellation for ${transactionId}`);
        }, 1000);
    }
};
