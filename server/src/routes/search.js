import express from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

import { CONFIG } from "../config/config.js";
import { createContext } from "../utils/context.js";

const router = express.Router();

router.post("/", async (req, res) => {

  const transaction_id = uuidv4();

  const payload = {

    context: createContext("search", transaction_id),

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
  };

  const response = await axios.post(CONFIG.GATEWAY_URL, payload);

  res.json(response.data);
});

export default router;