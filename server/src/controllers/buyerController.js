import axios from "axios"
import { v4 as uuidv4 } from "uuid"

import { buildContext } from "../services/contextBuilder.js"
import { saveTransaction } from "../services/transactionStore.js"

import { ONDC_CONFIG } from "../config/ondcConfig.js"
import { createAuthHeader } from "../services/ondcAuthNew.js"
const buyerController = {}

buyerController.search = async (req,res) => {

  const txn = uuidv4()

  const payload = {

    context: buildContext("search", txn),

    message: {

      intent: {

        fulfillment: {

          start: {

            location: {

              gps: "12.9716,77.5946"

            }

          },

          end: {

            location: {

              gps: "12.2958,76.6394"

            }

          }

        }

      }

    }

  }

  saveTransaction(txn,payload)

await axios.post(
  "https://preprod.gateway.ondc.org/search",
  payload,
  {
    headers: {
      "Content-Type": "application/json",
      "Authorization": createAuthHeader
    }
  }
)

  res.json({

    transaction_id: txn

  })

}

export default buyerController