/**
 * Standardized ONDC Error Utility
 * Generates NACK responses and error objects compliant with Beckn protocol.
 */
export const BecknError = {
    code: {
        CONTEXT_ERROR: '30000',
        AUTH_FAILED: '30001',
        INVALID_REQUEST: '30002',
        BUSINESS_RULE_ERROR: '30003',
        POLICY_ERROR: '30004',
    },

    create(type, message, path = null) {
        return {
            code: type,
            message: message,
            path: path
        };
    },

    getNack(error) {
        return {
            message: {
                ack: {
                    status: "NACK"
                }
            },
            error: error
        };
    }
};
