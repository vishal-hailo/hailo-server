import _sodium from 'libsodium-wrappers';

(async () => {
    await _sodium.ready;
    const sodium = _sodium;

    const keypair = sodium.crypto_sign_keypair();

    console.log("ONDC_PUBLIC_KEY=" + sodium.to_base64(keypair.publicKey, sodium.base64_variants.ORIGINAL));
    console.log("ONDC_PRIVATE_KEY=" + sodium.to_base64(keypair.privateKey, sodium.base64_variants.ORIGINAL));
})();
