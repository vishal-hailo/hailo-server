import express from "express"
import buyerController from "../controllers/buyerController.js"

const router = express.Router()

router.post("/search", buyerController.search)
router.post("/select", buyerController.select)
router.post("/init", buyerController.init)
router.post("/confirm", buyerController.confirm)
router.post("/status", buyerController.status)

export default router