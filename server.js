import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { authenticator } from "otplib";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- SETUP ---
const app = express();
app.use(express.json());

// Path to store decrypted seed
const SEED_PATH = path.join(__dirname, "data", "seed.txt");
const DATA_DIR = path.dirname(SEED_PATH); // Get the 'data' directory path

// Ensure the data directory exists (Improved Robustness)
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ✅ FIX: Global configuration for otplib authenticator (Security/Consistency)
// This replaces the incorrect calls to authenticator.configure()
authenticator.options = {
  step: 30, // The time step in seconds (standard for TOTP)
  digits: 6, // The number of digits in the generated code
  algorithm: "sha1", // The hashing algorithm
};

// ------------------------------------------------------
// Convert hex → base32 (Optimized)
// ------------------------------------------------------
function hexToBase32(hexString) {
  // Use otplib's built-in utility to convert hex secret to base32 secret
  return authenticator.decode(hexString);
}

// ------------------------------------------------------
// 1️⃣ POST /decrypt-seed
// ------------------------------------------------------
app.post("/decrypt-seed", (req, res) => {
  try {
    const { encrypted_seed } = req.body;

    if (!encrypted_seed) {
      return res.status(400).json({ error: "Missing encrypted_seed" });
    }

    // Read private key
    const privateKey = fs.readFileSync(
      path.join(__dirname, "student_private.pem"),
      "utf8"
    );

    // Base64 decode
    const encryptedBuffer = Buffer.from(encrypted_seed, "base64");

    // RSA Decrypt
    const decryptedBytes = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      encryptedBuffer
    );

    const decryptedHex = decryptedBytes.toString("utf8").trim();

    // Validate hex format (64 characters is 256 bits, standard for a key)
    if (!/^[0-9a-f]{64}$/i.test(decryptedHex)) {
      return res.status(500).json({ error: "Invalid decrypted seed format" });
    }

    // Save seed with restricted permissions (Improved Security)
    fs.writeFileSync(SEED_PATH, decryptedHex, {
      encoding: "utf8",
      mode: 0o600 // Only owner can read/write
    });

    return res.json({ status: "ok" });
  } catch (err) {
    console.error("Decrypt Error:", err);
    return res.status(500).json({ error: "Decryption failed" });
  }
});

// ------------------------------------------------------
// 2️⃣ GET /generate-2fa
// ------------------------------------------------------
app.get("/generate-2fa", (req, res) => {
  try {
    if (!fs.existsSync(SEED_PATH)) {
      return res.status(500).json({ error: "Seed not decrypted yet" });
    }

    const hexSeed = fs.readFileSync(SEED_PATH, "utf8").trim();
    const base32Seed = hexToBase32(hexSeed);

    // Using the global authenticator configuration set above
    const code = authenticator.generate(base32Seed);

    // Calculate time remaining for the current 30-second window
    const now = Math.floor(Date.now() / 1000);
    const valid_for = 30 - (now % 30); 

    return res.json({ code, valid_for });
  } catch (err) {
    console.error("Generation Error:", err);
    return res.status(500).json({ error: "Generation error" });
  }
});

// ------------------------------------------------------
// 3️⃣ POST /verify-2fa
// ------------------------------------------------------
app.post("/verify-2fa", (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Missing code" });
    }

    if (!fs.existsSync(SEED_PATH)) {
      return res.status(500).json({ error: "Seed not decrypted yet" });
    }

    const hexSeed = fs.readFileSync(SEED_PATH, "utf8").trim();
    const base32Seed = hexToBase32(hexSeed);

    // Using the global authenticator configuration set above
    const isValid = authenticator.check(code, base32Seed);

    return res.json({ valid: isValid });
  } catch (err) {
    console.error("Verify Error:", err);
    return res.status(500).json({ error: "Verification error" });
  }
});

// ------------------------------------------------------
// Start the server
// ------------------------------------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT , () => {
  console.log("Server running on http://localhost:${PORT}");
});
