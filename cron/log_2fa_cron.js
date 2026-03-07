#!/usr/bin/env node

import fs from "fs";
import { authenticator } from "otplib";
import base32 from "thirty-two";

const SEED_PATH = "/data/seed.txt";

// Configure TOTP
authenticator.options = {
  step: 30,
  digits: 6,
  algorithm: "sha1",
};

function hexToBase32(hex) {
  const buffer = Buffer.from(hex, "hex");
  return base32.encode(buffer).toString().replace(/=/g, "").toUpperCase();
}

try {

  if (!fs.existsSync(SEED_PATH)) {
    console.log("Seed not found");
    process.exit(0);
  }

  const hexSeed = fs.readFileSync(SEED_PATH, "utf8").trim();
  const base32Seed = hexToBase32(hexSeed);

  const code = authenticator.generate(base32Seed);

  const now = new Date();
  const timestamp = now.toISOString().replace("T", " ").slice(0, 19);

  console.log(`${timestamp} - 2FA Code: ${code}`);

} catch (err) {

  console.error("Cron error:", err.message);

}