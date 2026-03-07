import fs from "fs";
import crypto from "crypto";

// Load encrypted seed
const encryptedBase64 = fs.readFileSync("encrypted_seed.txt", "utf8").trim();

// Load private key
const privateKeyPem = fs.readFileSync("student_private.pem", "utf8");

// Convert Base64 → Buffer
const encryptedBuffer = Buffer.from(encryptedBase64, "base64");

try {

    const decryptedBuffer = crypto.privateDecrypt(
        {
            key: privateKeyPem,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
        },
        encryptedBuffer
    );

    const decryptedSeed = decryptedBuffer.toString("utf8").trim();

    console.log("Decrypted seed:", decryptedSeed);

    // Validate seed format
    const regex = /^[0-9a-f]{64}$/;

    if (!regex.test(decryptedSeed)) {
        console.error("Invalid seed! Must be 64 hex characters.");
        process.exit(1);
    }

    // Ensure /data directory exists
    if (!fs.existsSync("/data")) {
        fs.mkdirSync("/data", { recursive: true });
    }

    // Save seed where evaluator expects it
    fs.writeFileSync("/data/seed.txt", decryptedSeed, {
        encoding: "utf8",
        mode: 0o600
    });

    console.log("Seed saved to /data/seed.txt");

} catch (err) {

    console.error("Decryption failed:", err.message);

}