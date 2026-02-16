import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Grievance from '../models/Grievance.js';
import { ONDC_CONFIG } from '../config/ondc.js';
import { becknAuthService } from './becknAuth.js';
import { ondcRegistryService } from './ondcRegistryService.js';

/**
 * Service to handle Issue & Grievance Management (IGM)
 * Reference: Beckn Protocol IGM (Issue & Grievance) Specification
 */
export const igmService = {

    /**
     * createIssue
     * Raised by Buyer App (HailO) to BPP (Provider)
     */
    async createIssue({ transactionId, category, subCategory, description, userId }) {
        const issueId = uuidv4();
        const messageId = uuidv4();

        // 1. Save to DB
        const grievance = new Grievance({
            issueId,
            transactionId,
            category,
            subCategory,
            description,
            complainant: { id: userId },
            status: 'OPEN'
        });
        await grievance.save();

        // 2. Construct ONDC /issue payload
        // We need BPP URI from transaction history ideally. 
        // For now, assuming we can get it or lookup. 
        // In a real app, 'Transaction' model would store this.
        // Mocking BPP URI lookup for now since we don't have a Transaction model yet.
        const bppUri = await this.getBppUriForTransaction(transactionId);

        const payload = {
            context: {
                domain: ONDC_CONFIG.DOMAIN,
                country: ONDC_CONFIG.COUNTRY_CODE,
                city: ONDC_CONFIG.CITY_CODE,
                action: 'issue',
                core_version: '1.0.0', // IGM often uses 1.0.0 distinct from 1.2.0 core
                bap_id: ONDC_CONFIG.SUBSCRIBER_ID,
                bap_uri: ONDC_CONFIG.SUBSCRIBER_URL,
                bpp_id: 'mock-bpp-id', // TODO: Get from transaction
                bpp_uri: bppUri,
                transaction_id: transactionId,
                message_id: messageId,
                timestamp: new Date().toISOString(),
                ttl: ONDC_CONFIG.TTL,
            },
            message: {
                issue: {
                    id: issueId,
                    category: category,
                    sub_category: subCategory,
                    complainant_info: {
                        person: { name: "Vishal Rao" }, // TODO: Fetch user details
                        contact: { phone: "9988776655", email: "vishal@example.com" }
                    },
                    order_details: {
                        id: transactionId, // Usually Order ID, but using TxnId for simplicity here
                        state: "Completed",
                        items: [{ id: "item-1", quantity: 1 }]
                    },
                    description: {
                        short_desc: description,
                        long_desc: description,
                        images: []
                    },
                    source: {
                        network_participant_id: ONDC_CONFIG.SUBSCRIBER_ID,
                        type: "CONSUMER"
                    },
                    expected_response_time: {
                        duration: "PT2H"
                    },
                    expected_resolution_time: {
                        duration: "P1D"
                    },
                    status: "OPEN",
                    issue_type: "ISSUE",
                    issue_actions: {
                        complainant_actions: [
                            {
                                complainant_action: "OPEN",
                                short_desc: "Complaint created",
                                updated_at: new Date().toISOString(),
                                updated_by: {
                                    org: { name: "HailO::BuyerApp" },
                                    contact: { phone: "1234567890", email: "support@hailo.app" },
                                    person: { name: "Support Bot" }
                                }
                            }
                        ]
                    }
                }
            }
        };

        // 3. Sign & Send
        const authHeader = await becknAuthService.createAuthorizationHeader(payload);

        try {
            if (process.env.ONDC_MOCK === 'true') {
                console.log(`🚧 ONDC_MOCK: Simulate /issue sent to ${bppUri}`);
                setTimeout(() => this.simulateOnIssue(issueId, transactionId), 2000);
            } else {
                await axios.post(`${bppUri}/issue`, payload, {
                    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
                });
            }
        } catch (error) {
            console.error('IGM Issue Failed:', error.message);
            // Don't fail the local save, just mark sync failed?
        }

        return grievance;
    },

    /**
     * onIssue
     * Callback from provider with status updates/resolution.
     */
    async onIssue(body) {
        const { context, message } = body;
        const issue = message?.issue;

        if (!issue) return;

        const { id: issueId, issue_actions, resolution } = issue;

        // Find and update
        const grievance = await Grievance.findOne({ issueId });
        if (!grievance) {
            console.warn(`Received on_issue for unknown issueId: ${issueId}`);
            return;
        }

        // Update status
        // Usually status is inside message.issue.status or inferred from actions
        if (issue.status) {
            grievance.status = issue.status; // OPEN, CLOSED, PROCESSING
        }

        // Check for resolution
        if (resolution) {
            grievance.resolution = {
                shortDesc: resolution.short_desc,
                longDesc: resolution.long_desc,
                actionTriggered: resolution.action_triggered,
                refundAmount: resolution.refund_amount
            };
        }

        // Add action log if needed (skipping for brevity)
        grievance.updated_at = new Date();
        await grievance.save();

        console.log(`Updated Grievance ${issueId} status to ${grievance.status}`);
    },

    // Helper to get Status
    async getStatus(issueId) {
        return await Grievance.findOne({ issueId });
    },

    // INTERNAL HELPER
    async getBppUriForTransaction(transactionId) {
        // TODO: In real implementation, query Transaction/Order model
        return 'https://mock-bpp.com';
    },

    /**
     * Simulation Helper
     */
    simulateOnIssue(issueId, transactionId) {
        const payload = {
            context: { transaction_id: transactionId, action: 'on_issue' },
            message: {
                issue: {
                    id: issueId,
                    status: "PROCESSING",
                    issue_actions: {
                        respondent_actions: [{
                            respondent_action: "PROCESSING",
                            short_desc: "We are looking into it",
                            updated_at: new Date().toISOString(),
                            updated_by: { org: { name: "MockProvider" } }
                        }]
                    }
                }
            }
        };
        console.log('🚧 Simulating on_issue callback...');
        this.onIssue(payload);

        // Resolve after 5 seconds
        setTimeout(() => {
            const resolvePayload = {
                context: { transaction_id: transactionId, action: 'on_issue' },
                message: {
                    issue: {
                        id: issueId,
                        status: "RESOLVED",
                        resolution: {
                            short_desc: "Refund Initiated",
                            long_desc: "Apologies for the delay. We have initiated a refund of ₹50.",
                            action_triggered: "REFUND",
                            refund_amount: "50"
                        }
                    }
                }
            };
            this.onIssue(resolvePayload);
        }, 5000);
    }
};
