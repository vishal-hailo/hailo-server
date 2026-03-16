import crypto from "crypto"
import fs from "fs"

const PRIVATE_KEY = fs.readFileSync("../keys/private_key.pem")

export const createAuthHeader = (body) => {

    const created = Math.floor(Date.now() / 1000)

    const expires = created + 300

    const digest = crypto
        .createHash("sha256")
        .update(JSON.stringify(body))
        .digest("base64")

    const signingString =
`(created): ${created}
(expires): ${expires}
digest: BLAKE-512=${digest}`

    const signature = crypto.sign(
        null,
        Buffer.from(signingString),
        PRIVATE_KEY
    )

    const signatureBase64 = signature.toString("base64")

    return `Signature keyId="api.hailone.in|hailo-key-1|ed25519",algorithm="ed25519",headers="(created) (expires) digest",signature="${signatureBase64}",created="${created}",expires="${expires}"`
}