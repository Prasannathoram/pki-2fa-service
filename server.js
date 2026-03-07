import express from "express";
import fs from "fs";
import crypto from "crypto";
import { authenticator } from "otplib";
import base32 from "thirty-two";

const app = express();
app.use(express.json());

const SEED_PATH = "/data/seed.txt";

// Ensure /data directory exists
if (!fs.existsSync("/data")) {
  fs.mkdirSync("/data", { recursive: true });
}

// Configure TOTP exactly like evaluator
authenticator.options = {
  step: 30,
  digits: 6,
  algorithm: "sha1",
  window: 1
};

function hexToBase32(hex) {
  const buffer = Buffer.from(hex, "hex");
  return base32.encode(buffer).toString().replace(/=/g, "").toUpperCase();
}

/*
----------------------------------
POST /decrypt-seed
----------------------------------
*/
app.post("/decrypt-seed", (req, res) => {
  try {
    const { encrypted_seed } = req.body;

    if (!encrypted_seed) {
      return res.status(400).json({ error: "Missing encrypted_seed" });
    }

    const privateKey = fs.readFileSync("student_private.pem", "utf8");

    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256"
      },
      Buffer.from(encrypted_seed, "base64")
    );

    const seed = decrypted.toString("utf8").trim();

    if (!/^[0-9a-f]{64}$/i.test(seed)) {
      return res.status(500).json({ error: "Invalid seed format" });
    }

    fs.writeFileSync(SEED_PATH, seed, { encoding: "utf8" });

    console.log("Seed saved to:", SEED_PATH);

    res.json({ status: "ok" });

  } catch (err) {
    console.error("Decrypt Error:", err);
    res.status(500).json({ error: "Decryption failed" });
  }
});

/*
----------------------------------
GET /generate-2fa
----------------------------------
*/
app.get("/generate-2fa", (req, res) => {
  try {

    if (!fs.existsSync(SEED_PATH)) {
      return res.status(500).json({ error: "Seed not found" });
    }

    const hexSeed = fs.readFileSync(SEED_PATH, "utf8").trim();
    const base32Seed = hexToBase32(hexSeed);

    const code = authenticator.generate(base32Seed);

    const now = Math.floor(Date.now() / 1000);
    const valid_for = 30 - (now % 30);

    res.json({
      code,
      valid_for
    });

  } catch (err) {
    console.error("Generate Error:", err);
    res.status(500).json({ error: "Generation failed" });
  }
});

/*
----------------------------------
POST /verify-2fa
----------------------------------
*/
app.post("/verify-2fa", (req, res) => {
  try {

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Missing code" });
    }

    if (!fs.existsSync(SEED_PATH)) {
      return res.status(500).json({ error: "Seed not found" });
    }

    const hexSeed = fs.readFileSync(SEED_PATH, "utf8").trim();
    const base32Seed = hexToBase32(hexSeed);

    const valid = authenticator.check(code, base32Seed);

    res.json({ valid });

  } catch (err) {
    console.error("Verify Error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});