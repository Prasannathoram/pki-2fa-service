#!/usr/bin/env node

import fs from "fs";
import { authenticator } from "otplib";

// Your seed file in docker volume
const SEED_PATH = "/data/seed.txt";

// 1. Read hex seed
let hexSeed;
try {
  hexSeed = fs.readFileSync(SEED_PATH, "utf8").trim();
} catch (err) {
  console.log("[ERROR] seed.txt not found");
  process.exit(1);
}

// 2. Convert HEX → BASE32 using YOUR Gemini logic
function hexToBase32(hexString) {
  return authenticator.decode(hexString);  // This matches your server code
}

const base32Seed = hexToBase32(hexSeed);

// 3. Configure authenticator exactly like your server.js
authenticator.options = {
  step: 30,
  digits: 6,
  algorithm: "sha1",
};

// 4. Generate TOTP
const code = authenticator.generate(base32Seed);

// 5. Timestamp UTC
const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);

// 6. Output
console.log(`[${timestamp}] - 2FA Code: ${code}`);
