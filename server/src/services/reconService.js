import Settlement from '../models/Settlement.js';

export const reconService = {

    /**
     * onReceiverRecon
     * Handles POST /ondc/on_receiver_recon
     * Updates settlement status for orders.
     */
    async onReceiverRecon(body) {
        const { context, message } = body;
        const settlementOrders = message?.orderbook?.orders || [];

        console.log(`💰 Received Reconciliation for ${settlementOrders.length} orders`);

        const results = [];

        for (const order of settlementOrders) {
            try {
                // Upsert settlement record
                const settlement = await Settlement.findOneAndUpdate(
                    { orderId: order.id },
                    {
                        transactionId: context.transaction_id, // Might not match original order transactionId in bulk recon
                        orderId: order.id,
                        settlementId: order.settlement_id,
                        amount: parseFloat(order.payment?.params?.amount || 0),
                        currency: order.payment?.params?.currency || 'INR',
                        status: 'SETTLED',
                        settlementType: order.payment?.type,
                        urn: order.payment?.urn, // UTR
                        timestamp: new Date(),
                        details: order
                    },
                    { upsert: true, new: true }
                );
                results.push(settlement);
                console.log(`✅ Settled Order: ${order.id} | UTR: ${order.payment?.urn}`);
            } catch (err) {
                console.error(`❌ Failed to process settlement for order ${order.id}:`, err.message);
            }
        }
        return results;
    }
};
