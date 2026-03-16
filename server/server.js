import express from "express"
import bodyParser from "body-parser"

import buyerRoutes from "./src/routes/buyerRoutes.js"
import callbackController from "./src/callbacks/callbackController.js"

const app = express()

app.use(bodyParser.json())

app.use("/buyer", buyerRoutes)

app.post("/on_search", callbackController.onSearch)
app.post("/on_select", callbackController.onSelect)
app.post("/on_init", callbackController.onInit)
app.post("/on_confirm", callbackController.onConfirm)
app.post("/on_status", callbackController.onStatus)

app.listen(3000, () => {
    console.log("Buyer NP running on port 3000")
})