import nacl from "tweetnacl"
import fs from "fs"

const privateKey = fs.readFileSync(process.env.PRIVATE_KEY)

export const signMessage = (message) => {

    const messageBytes = new TextEncoder().encode(message)

    const signature = nacl.sign.detached(

        messageBytes,
        privateKey

    )

    return Buffer.from(signature).toString("base64")
}