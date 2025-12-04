import fs from "fs";
import crypto from "crypto";

// 1. Load encrypted seed from file
const encryptedBase64 = fs.readFileSync("encrypted_seed.txt", "utf8").trim();

// 2. Load private key
const privateKeyPem = fs.readFileSync("student_private.pem", "utf8");

// 3. Decode Base64 → Buffer
const encryptedBuffer = Buffer.from(encryptedBase64, "base64");

try {
    // 4. RSA-OAEP decryption with SHA-256
    const decryptedBuffer = crypto.privateDecrypt(
        {
            key: privateKeyPem,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
        },
        encryptedBuffer
    );

    // 5. Convert bytes → UTF-8 string
    const decryptedSeed = decryptedBuffer.toString("utf8");

    console.log("Decrypted seed:", decryptedSeed);

    // 6. Validate hex format
    const regex = /^[0-9a-f]{64}$/;
    if (!regex.test(decryptedSeed)) {
        console.error("❌ Invalid seed! Must be 64 hex characters.");
        process.exit(1);
    }

    // 7. Save decrypted seed
    fs.writeFileSync("decrypted_seed.txt", decryptedSeed);
    console.log("✅ decrypted_seed.txt saved!");

} catch (err) {
    console.error("❌ Decryption failed:", err.message);
}
