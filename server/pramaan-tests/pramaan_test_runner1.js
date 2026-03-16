import axios from "axios"
import fs from "fs"

const BPP_URL = "https://seller-preprod-url"

const run = async () => {

console.log("📦 Running SEARCH")

const search = JSON.parse(fs.readFileSync("./search.json"))

await axios.post(
    "https://preprod.gateway.ondc.org/search",
    search
)

console.log("Search sent")

await new Promise(r => setTimeout(r,5000))

// console.log("📦 Running SELECT")

// const select = JSON.parse(fs.readFileSync("./select.json"))

// await axios.post(
//     BPP_URL + "/select",
//     select
// )

// console.log("Select sent")

// await new Promise(r => setTimeout(r,5000))

// console.log("📦 Running INIT")

// const init = JSON.parse(fs.readFileSync("./init.json"))

// await axios.post(
//     BPP_URL + "/init",
//     init
// )

// console.log("Init sent")

// await new Promise(r => setTimeout(r,5000))

// console.log("📦 Running CONFIRM")

// const confirm = JSON.parse(fs.readFileSync("./confirm.json"))

// await axios.post(
//     BPP_URL + "/confirm",
//     confirm
// )

// console.log("Confirm sent")

}

run()