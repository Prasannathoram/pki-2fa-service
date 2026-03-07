import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { authenticator } from "otplib";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Express
const app = express();
app.use(express.json());

// Evaluator seed location
const SEED_PATH = "/data/seed.txt";

// Ensure /data exists
if (!fs.existsSync("/data")) {
  fs.mkdirSync("/data", { recursive: true });
}

// Configure TOTP
authenticator.options = {
  step: 30,
  digits: 6,
  algorithm: "sha1"
};

// ------------------------------------------------------
// POST /decrypt-seed
// ------------------------------------------------------
app.post("/decrypt-seed", (req, res) => {

  try {

    const { encrypted_seed } = req.body;

    if (!encrypted_seed) {
      return res.status(400).json({ error: "Missing encrypted_seed" });
    }

    const privateKey = fs.readFileSync(
      path.join(__dirname, "student_private.pem"),
      "utf8"
    );

    const encryptedBuffer = Buffer.from(encrypted_seed, "base64");

    const decryptedBytes = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256"
      },
      encryptedBuffer
    );

    const decryptedHex = decryptedBytes.toString("utf8").trim();

    if (!/^[0-9a-f]{64}$/i.test(decryptedHex)) {
      return res.status(500).json({ error: "Invalid decrypted seed format" });
    }

    fs.writeFileSync(SEED_PATH, decryptedHex, {
      encoding: "utf8",
      mode: 0o600
    });

    return res.json({ status: "ok" });

  } catch (err) {

    console.error("Decrypt Error:", err);

    return res.status(500).json({ error: "Decryption failed" });

  }

});

// ------------------------------------------------------
// GET /generate-2fa
// ------------------------------------------------------
app.get("/generate-2fa", (req, res) => {

  try {

    if (!fs.existsSync(SEED_PATH)) {
      return res.status(500).json({ error: "Seed not decrypted yet" });
    }

    const hexSeed = fs.readFileSync(SEED_PATH, "utf8").trim();

    // Generate TOTP directly from hex seed
    const code = authenticator.generate(hexSeed);

    const now = Math.floor(Date.now() / 1000);
    const valid_for = 30 - (now % 30);

    return res.json({
      code,
      valid_for
    });

  } catch (err) {

    console.error("Generation Error:", err);

    return res.status(500).json({ error: "Generation error" });

  }

});

// ------------------------------------------------------
// POST /verify-2fa
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

    const isValid = authenticator.check(code, hexSeed);

    return res.json({
      valid: isValid
    });

  } catch (err) {

    console.error("Verify Error:", err);

    return res.status(500).json({ error: "Verification error" });

  }

});

// ------------------------------------------------------
// Start Server
// ------------------------------------------------------
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {

  console.log(`Server running on http://localhost:${PORT}`);

});